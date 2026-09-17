import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { QUESTIONS, buildReport, validateAnswers } from '../assessment/model.mjs';
import { createApp, validateEmail, productionApp } from '../server/report-server.mjs';
const origin = 'https://bostic-timothy.github.io';
const answers = Object.fromEntries(QUESTIONS.map(q => [q.id, 'yes']));
async function fixture(t, options = {}) {
  const mail = []; let time = Date.now();
  const app = createApp({ origin, now: () => time, makeCode: () => '123456', verifyCaptcha: async token => token === 'valid', sendEmail: async value => { mail.push(value); }, ...options });
  const server = createServer(app.handler); await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(async () => { app.close(); server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); });
  const request = async (path, body, extra = {}) => {
    const result = await fetch(`http://127.0.0.1:${server.address().port}${path}`, { method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/json', 'X-Requested-With': 'PostureAssessment', ...extra }, body: JSON.stringify(body) });
    return { status: result.status, body: await result.json(), headers: result.headers };
  };
  const start = (extra = {}) => request('/api/start', { email: 'person@example.org', answers, consent: true, captcha: 'valid', ...extra });
  return { mail, request, start, advance: ms => { time += ms; } };
}
test('model: six functions, counts, unknowns, and fixed enum validation', () => {
  assert.equal(buildReport(answers).counts.yes, 12); assert.equal(buildReport(answers).sections.length, 6);
  const unknown = buildReport({ ...answers, owner: 'unknown', mfa: 'no' }); assert.equal(unknown.actions[0].id, 'owner'); assert.equal(unknown.counts.unknown, 1);
  for (const bad of ['<img src=x onerror=alert(1)>', '$(whoami)', ['yes'], {}, null, '__proto__']) assert.throws(() => validateAnswers({ ...answers, owner: bad }));
  assert.throws(() => validateAnswers({ ...answers, unexpected: 'yes' })); assert.throws(() => validateAnswers({}));
});
test('reject email header, HTML, multiple-recipient injection and missing production secrets', () => {
  for (const bad of ['a@b.org\r\nBcc: attacker@b.org', '<script>@example.org', 'a@b.org,c@d.org', 'a..b@example.org']) assert.throws(() => validateEmail(bad));
  assert.throws(() => productionApp({}));
});
test('verified report delivery, server recomputation, idempotent retry, no report before verification', async t => {
  const f = await fixture(t); const first = await f.start(); assert.equal(first.status, 202); assert.equal(f.mail.length, 1); assert(!f.mail[0].text.includes('GOVERN')); assert.match(f.mail[0].text, /123456/);
  const headers = { 'X-Assessment-Token': first.body.token };
  assert.equal((await f.request('/api/verify', { code: '123456' }, headers)).status, 202);
  assert.equal(f.mail.length, 2); assert(f.mail[1].text.includes('In place: 12/12')); assert(!Object.hasOwn(f.mail[1], 'html'));
  assert.equal((await f.request('/api/verify', { code: '123456' }, headers)).status, 202); assert.equal(f.mail.length, 2);
});
test('blocks CSRF, form content, missing consent, invalid CAPTCHA, forged HTML and oversized requests', async t => {
  const f = await fixture(t);
  assert.equal((await f.request('/api/start', {}, { Origin: 'https://evil.example' })).status, 403);
  assert.equal((await f.request('/api/start', {}, { 'X-Requested-With': '' })).status, 403);
  assert.equal((await f.request('/api/start', {}, { 'Content-Type': 'text/plain' })).status, 415);
  assert.equal((await f.start({ consent: false })).status, 400);
  assert.equal((await f.start({ captcha: 'invalid' })).status, 400);
  assert.equal((await f.start({ html: '<script>alert(1)</script>' })).status, 400);
  assert.equal((await f.start({ answers: { ...answers, mfa: '$(touch /tmp/pwn)' } })).status, 400);
  assert.equal((await f.request('/api/start', { data: 'x'.repeat(9000) })).status, 413); assert.equal(f.mail.length, 0);
});
test('code guessing limit and expiry', async t => {
  const f = await fixture(t); const a = await f.start(); const headers = { 'X-Assessment-Token': a.body.token };
  for (let i=0;i<5;i++) assert.equal((await f.request('/api/verify', { code: '000000' }, headers)).status, 400);
  assert.equal((await f.request('/api/verify', { code: '123456' }, headers)).status, 429);
  const b = await f.start(); f.advance(16*60000);
  assert.equal((await f.request('/api/verify', { code: '123456' }, { 'X-Assessment-Token': b.body.token })).status, 410);
  assert.equal(f.mail.length, 2);
});
test('per-recipient send limit', async t => {
  const f=await fixture(t); for(let i=0;i<3;i++) assert.equal((await f.start()).status,202);
  assert.equal((await f.start()).status,429); assert.equal(f.mail.length,3);
});
test('concurrent verification only sends one report', async t => {
  let release; const gate=new Promise(resolve=>{release=resolve;}); let sends=0;
  const f=await fixture(t,{sendEmail:async ({id})=>{if(id.startsWith('report-')){sends++;await gate;}}});
  const start=await f.start(); const headers={'X-Assessment-Token':start.body.token};
  const pending=f.request('/api/verify',{code:'123456'},headers);
  while(!sends) await new Promise(resolve=>setTimeout(resolve,5));
  assert.equal((await f.request('/api/verify',{code:'123456'},headers)).status,409); release(); assert.equal((await pending).status,202); assert.equal(sends,1);
});
test('provider failures do not claim success; report retry uses the same idempotency key', async t => {
  let attempts=0; const ids=[];
  const f=await fixture(t,{sendEmail:async ({id})=>{if(id.startsWith('report-')){ids.push(id);if(++attempts===1)throw Error('upstream');}}});
  const start=await f.start(); const headers={'X-Assessment-Token':start.body.token};
  assert.equal((await f.request('/api/verify',{code:'123456'},headers)).status,502);
  assert.equal((await f.request('/api/verify',{code:'123456'},headers)).status,202);assert.equal(ids[0],ids[1]);
});
