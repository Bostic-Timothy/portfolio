import { QUESTIONS, FUNCTIONS, CHOICES, VERSION, buildReport } from './model.mjs';
import { API_BASE, TURNSTILE_SITE_KEY } from './config.mjs';
const $ = selector => document.querySelector(selector);
function element(tag, text, className) { const node = document.createElement(tag); if (text) node.textContent = text; if (className) node.className = className; return node; }
let report, snapshot, session, captchaToken, widget, revision = 0;
const emailEnabled = /^https:\/\/[^/]+$/.test(API_BASE) && Boolean(TURNSTILE_SITE_KEY);
for (const fn of FUNCTIONS) {
  const group = element('fieldset'); group.append(element('legend', fn));
  for (const q of QUESTIONS.filter(q => q.fn === fn)) {
    const row = element('div', null, 'question');
    const title = element('p', q.text); title.id = `question-${q.id}`;
    title.append(element('span', `CSF 2.0 · ${q.ref}`, 'mapping'));
    const choices = element('div', null, 'choices'); choices.setAttribute('role', 'radiogroup'); choices.setAttribute('aria-labelledby', title.id);
    for (const [value, text] of Object.entries(CHOICES)) {
      const label = element('label'); const input = element('input'); input.type = 'radio'; input.name = q.id; input.value = value; input.required = true;
      label.append(input, document.createTextNode(text)); choices.append(label);
    }
    row.append(title, choices); group.append(row);
  }
  $('#questions').append(group);
}
function resetEmail() {
  session = null; captchaToken = null;
  $('#email-form').reset(); $('#verify-form').reset(); $('#verify-form').hidden = true; $('#email-form').hidden = true;
  $('#email-status').textContent = '';
  if (widget !== undefined && window.turnstile) { window.turnstile.remove(widget); widget = undefined; }
}
function invalidate() {
  revision++; report = null; snapshot = null; $('#results').hidden = true; resetEmail();
  $('#progress').textContent = `${Array.from(new FormData($('#posture-form')).keys()).length} of 12 answered`;
}
$('#posture-form').addEventListener('change', invalidate);
$('#clear').addEventListener('click', () => { $('#posture-form').reset(); invalidate(); $('#form-error').textContent = ''; });
$('#posture-form').addEventListener('submit', event => {
  event.preventDefault();
  revision++;
  resetEmail();
  try { snapshot = Object.fromEntries(new FormData(event.currentTarget)); report = buildReport(snapshot); } catch (error) { $('#form-error').textContent = error.message; return; }
  $('#form-error').textContent = ''; $('#report-notice').textContent = '';
  const c = report.counts; $('#report-summary').textContent = `In place: ${c.yes}/12 · Partial: ${c.partial} · Not in place: ${c.no} · Not sure: ${c.unknown}`;
  $('#report-date').textContent = `Generated ${new Date().toISOString().slice(0, 10)} · Questionnaire v${VERSION}`;
  $('#function-results').replaceChildren(); $('#actions').replaceChildren();
  for (const s of report.sections) {
    const card = element('article', null, 'function-card'); card.append(element('h3', `${s.fn}: ${s.inPlace}/2 in place`));
    for (const q of s.rows) card.append(element('p', `${q.text} ${CHOICES[q.answer]} (${q.ref})`));
    $('#function-results').append(card);
  }
  for (const q of report.actions) $('#actions').append(element('li', `${q.answer === 'unknown' ? 'Verify first' : 'Plan improvement'}: ${q.action} (${q.ref}; ${CHOICES[q.answer]})`));
  if (!report.actions.length) $('#actions').append(element('li', 'Validate your answers with evidence and review the wider CSF with a qualified adviser. Maintain these practices.'));
  $('#results').hidden = false; $('#report-title').focus();
  if (emailEnabled) enableEmail();
});
$('#download').addEventListener('click', () => {
  if (!report) return;
  const url = URL.createObjectURL(new Blob([report.text], { type: 'text/plain;charset=utf-8' }));
  const link = element('a'); link.href = url; link.download = 'cyber-posture-report.txt'; document.body.append(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  $('#report-notice').textContent = 'Report download requested. Keep it in a private location.';
});
$('#print').addEventListener('click', () => window.print());
let turnstileReady;
function loadTurnstile() {
  if (!turnstileReady) turnstileReady = new Promise((resolve, reject) => {
    const script = element('script'); script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    script.onload = resolve; script.onerror = () => { turnstileReady = null; reject(new Error('Verification could not load. Download your report instead.')); }; document.head.append(script);
  });
  return turnstileReady;
}
async function enableEmail() {
  const current = revision;
  $('#email-availability').textContent = 'Email verification uses Cloudflare Turnstile. You can also download your report without using email.';
  try {
    await loadTurnstile(); if (current !== revision || !report) return;
    resetEmail(); $('#email-form').hidden = false;
    widget = window.turnstile.render('#captcha', { sitekey: TURNSTILE_SITE_KEY, action: 'posture_report', callback: token => { captchaToken = token; }, 'expired-callback': () => { captchaToken = null; }, 'error-callback': () => { captchaToken = null; $('#email-status').textContent = 'Verification failed. Retry the challenge or download your report.'; } });
  } catch (error) { $('#email-status').textContent = error.message; }
}
async function api(path, body, token) {
  const response = await fetch(`${API_BASE}${path}`, { method: 'POST', credentials: 'omit', headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'PostureAssessment', ...(token ? { 'X-Assessment-Token': token } : {}) }, body: JSON.stringify(body), signal: AbortSignal.timeout(15000) });
  const result = await response.json(); if (!response.ok) throw new Error(result.error || 'Delivery service is unavailable. Try again later.'); return result;
}
$('#email-form').addEventListener('submit', async event => {
  event.preventDefault(); if (!report || !captchaToken || !$('#consent').checked) { $('#email-status').textContent = 'Complete the verification challenge and consent checkbox.'; return; }
  const current = revision; const button = $('#email-submit'); button.disabled = true;
  try {
    const result = await api('/api/start', { email: $('#report-email').value, answers: snapshot, consent: true, captcha: captchaToken });
    if (current !== revision) return;
    session = result.token; $('#email-form').hidden = true; $('#verify-form').hidden = false;
    $('#email-status').textContent = 'Verification email accepted by the delivery provider. Check your inbox and spam folder; enter the code within 15 minutes.'; $('#verification').focus();
  } catch (error) { if (current === revision) $('#email-status').textContent = error instanceof TypeError ? 'Cannot reach email delivery. Download your report or try again later.' : error.message; }
  finally { button.disabled = false; captchaToken = null; if (widget !== undefined && window.turnstile) window.turnstile.reset(widget); }
});
$('#verify-form').addEventListener('submit', async event => {
  event.preventDefault(); if (!session) return;
  const current = revision; const button = event.currentTarget.querySelector('button'); button.disabled = true;
  try {
    await api('/api/verify', { code: $('#verification').value }, session);
    if (current !== revision) return;
    $('#email-status').textContent = 'Your report was accepted by the email provider for delivery. Check your inbox and spam folder. This does not confirm arrival.';
    $('#verify-form').hidden = true; session = null;
  } catch (error) { if (current === revision) $('#email-status').textContent = error.message; }
  finally { button.disabled = false; }
});
$('#posture-form').hidden = false;

