import { createServer } from 'node:http';
import { randomBytes, randomInt, createHash, timingSafeEqual } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { buildReport, validateAnswers } from '../assessment/model.mjs';
const MAX_BODY = 8192, TTL = 15 * 60 * 1000;
const hash = value => createHash('sha256').update(value).digest('hex');
const fail = (status, message) => Object.assign(new Error(message), { status });
const exactKeys = (value, keys) => value && typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length === keys.length && keys.every(key => Object.hasOwn(value, key));
export function validateEmail(value) {
  if (typeof value !== 'string' || value.length > 254 || !/^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?)+$/.test(value)) throw fail(400, 'Enter a valid email address.');
  const [local, domain] = value.split('@');
  if (local.length > 64 || local.startsWith('.') || local.endsWith('.') || local.includes('..') || domain.split('.').some(part => part.length > 63)) throw fail(400, 'Enter a valid email address.');
  return local + '@' + domain.toLowerCase();
}
async function readJson(req) {
  if ((req.headers['content-type'] || '').split(';')[0].trim() !== 'application/json') throw fail(415, 'JSON required.');
  if (req.headers['content-encoding']) throw fail(415, 'Encoded bodies are not supported.');
  const size = Number(req.headers['content-length']); if (size > MAX_BODY) throw fail(413, 'Request too large.');
  let bytes = 0; const chunks = [];
  for await (const chunk of req) { bytes += chunk.length; if (bytes > MAX_BODY) throw fail(413, 'Request too large.'); chunks.push(chunk); }
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch { throw fail(400, 'Invalid JSON.'); }
}
export function createApp({ origin, sendEmail, verifyCaptcha, now = Date.now, makeCode = () => String(randomInt(100000, 1000000)) }) {
  if (!/^https:\/\/[^/]+$/.test(origin)) throw new Error('A single HTTPS frontend origin is required.');
  const sessions = new Map(), limits = new Map();
  function cleanup() { const time = now(); for (const [key, value] of sessions) if (value.expires <= time) sessions.delete(key); for (const [key, value] of limits) if (value.expires <= time) limits.delete(key); }
  const sweep = setInterval(cleanup, 60000); sweep.unref();
  function limit(key, max) {
    let entry = limits.get(key);
    if (!entry) { if (limits.size >= 20000) throw fail(503, 'Service busy. Try later.'); entry = { count: 0, expires: now() + 3600000 }; limits.set(key, entry); }
    if (++entry.count > max) throw fail(429, 'Too many requests. Try again in an hour.');
  }
  async function handler(req, res) {
    res.setHeader('Cache-Control', 'no-store'); res.setHeader('X-Content-Type-Options', 'nosniff'); res.setHeader('Referrer-Policy', 'no-referrer'); res.setHeader('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'");
    res.setHeader('Content-Type', 'application/json; charset=utf-8'); res.setHeader('Vary', 'Origin');
    const reply = (status, value) => { res.writeHead(status); res.end(JSON.stringify(value)); };
    try {
      cleanup();
      // No cookies or ambient authentication. Exact Origin + non-simple headers block browser CSRF.
      if (req.headers.origin !== origin) throw fail(403, 'Origin not allowed.');
      res.setHeader('Access-Control-Allow-Origin', origin);
      if (!['/api/start', '/api/verify'].includes(req.url)) throw fail(404, 'Not found.');
      if (req.method === 'OPTIONS') { res.setHeader('Access-Control-Allow-Methods', 'POST'); res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Requested-With, X-Assessment-Token'); res.writeHead(204); res.end(); return; }
      if (req.method !== 'POST') throw fail(405, 'POST required.');
      if (req.headers['x-requested-with'] !== 'PostureAssessment') throw fail(403, 'Request header required.');
      // Deliberately ignore forwarded headers; configure a single trusted ingress and edge limits.
      const ip = hash(req.socket.remoteAddress || 'unknown'); limit('request:' + ip, 60);
      const body = await readJson(req);
      if (req.url === '/api/start') {
        if (!exactKeys(body, ['email', 'answers', 'consent', 'captcha']) || body.consent !== true || typeof body.captcha !== 'string' || !body.captcha || body.captcha.length > 2048) throw fail(400, 'Invalid request or missing consent.');
        const email = validateEmail(body.email); let answers;
        try { answers = validateAnswers(body.answers); } catch { throw fail(400, 'Invalid assessment answers.'); }
        limit('start:' + ip, 5); limit('email:' + hash(email.toLowerCase()), 3); limit('all-mail', 100);
        if (sessions.size >= 1000) throw fail(503, 'Service busy. Try later.');
        if (!await verifyCaptcha(body.captcha)) throw fail(400, 'Verification challenge failed. Try again.');
        const token = randomBytes(32).toString('hex'); const code = makeCode();
        const data = { email, answers, codeHash: hash(code), expires: now() + TTL, attempts: 0, state: 'pending', deliveryId: randomBytes(16).toString('hex') };
        // Reservation occurs before asynchronous delivery; never expose answers in verification mail.
        sessions.set(hash(token), data);
        try { await sendEmail({ to: email, subject: 'Verify your cyber posture report request', text: `Your verification code is ${code}. It expires in 15 minutes.\n\nEnter it only on the T.J. Bostic assessment you just used. If you did not request this, ignore this email. No report is sent unless the code is verified.`, id: 'verify-' + data.deliveryId }); }
        catch { sessions.delete(hash(token)); throw fail(502, 'Verification email could not be queued. Try again later.'); }
        reply(202, { token }); return;
      }
      if (!exactKeys(body, ['code']) || typeof body.code !== 'string' || !/^[0-9]{6}$/.test(body.code)) throw fail(400, 'Enter a six-digit code.');
      const token = req.headers['x-assessment-token'];
      if (typeof token !== 'string' || !/^[a-f0-9]{64}$/.test(token)) throw fail(403, 'Invalid verification session.');
      const key = hash(token); const data = sessions.get(key);
      if (!data) throw fail(410, 'Session expired. Generate your report again to restart email delivery.');
      if (++data.attempts > 5) { sessions.delete(key); throw fail(429, 'Too many code attempts. Restart email delivery.'); }
      if (!timingSafeEqual(Buffer.from(hash(body.code), 'hex'), Buffer.from(data.codeHash, 'hex'))) throw fail(400, 'Incorrect code.');
      if (data.state === 'sent') { reply(202, { status: 'accepted' }); return; }
      if (data.state === 'sending') throw fail(409, 'Delivery is in progress. Wait before retrying.');
      data.state = 'sending';
      try {
        // Recompute exclusively from validated answers; never accept client HTML or report text.
        await sendEmail({ to: data.email, subject: 'Your basic cyber posture report', text: buildReport(data.answers, new Date(now())).text, id: 'report-' + data.deliveryId });
        data.state = 'sent'; delete data.email; delete data.answers;
      } catch { data.state = 'pending'; throw fail(502, 'Report delivery could not be confirmed. Retry with the same code.'); }
      reply(202, { status: 'accepted' });
    } catch (error) { reply(error.status || 503, { error: error.status ? error.message : 'Service unavailable. Try later.' }); }
  }
  return { handler, close: () => clearInterval(sweep) };
}
export function productionApp(env = process.env) {
  for (const key of ['ALLOWED_ORIGIN', 'RESEND_API_KEY', 'REPORT_FROM', 'TURNSTILE_SECRET', 'TURNSTILE_HOSTNAME']) if (!env[key]) throw new Error(`Missing ${key}`);
  validateEmail(env.REPORT_FROM);
  return createApp({ origin: env.ALLOWED_ORIGIN,
    async sendEmail({ to, subject, text, id }) {
      const response = await fetch('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json', 'Idempotency-Key': id }, body: JSON.stringify({ from: env.REPORT_FROM, to: [to], subject, text }), signal: AbortSignal.timeout(10000) });
      if (!response.ok) throw new Error('Provider failure');
    },
    async verifyCaptcha(token) {
      const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ secret: env.TURNSTILE_SECRET, response: token }), signal: AbortSignal.timeout(10000) });
      if (!response.ok) return false;
      const result = await response.json(); return result.success === true && result.hostname === env.TURNSTILE_HOSTNAME && result.action === 'posture_report';
    }
  });
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const app = productionApp(); const server = createServer(app.handler);
  server.requestTimeout = 20000; server.headersTimeout = 10000; server.timeout = 25000; server.maxHeadersCount = 30;
  server.listen(Number(process.env.PORT || 3000), '127.0.0.1');
}
