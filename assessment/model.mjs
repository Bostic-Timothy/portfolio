// Original, limited self-assessment mapped to selected NIST CSF 2.0 outcomes.
// This is not NIST's questionnaire, a complete Profile, or a compliance score.
export const VERSION = '1.0';
export const SOURCE = 'https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.1300.pdf';
export const CORE = 'https://nvlpubs.nist.gov/nistpubs/CSWP/NIST.CSWP.29.pdf';
export const FUNCTIONS = ['Govern', 'Identify', 'Protect', 'Detect', 'Respond', 'Recover'];
export const CHOICES = { yes: 'In place', partial: 'Partly in place', no: 'Not in place', unknown: 'Not sure' };
export const QUESTIONS = [
  { id: 'owner', fn: 'Govern', ref: 'GV.RR-02', text: 'Is someone accountable for cybersecurity decisions?', action: 'Name an owner and agree on decision authority.' },
  { id: 'policy', fn: 'Govern', ref: 'GV.PO-01', text: 'Are security expectations documented and shared?', action: 'Write and review a practical security policy.' },
  { id: 'inventory', fn: 'Identify', ref: 'ID.AM-01, ID.AM-02, ID.AM-04', text: 'Do you maintain a device, software, and service inventory?', action: 'Record critical assets and their owners.' },
  { id: 'data', fn: 'Identify', ref: 'ID.AM-07', text: 'Do you know where sensitive information is kept?', action: 'Map sensitive records and their locations.' },
  { id: 'mfa', fn: 'Protect', ref: 'PR.AA-03', text: 'Is multifactor authentication enabled on supported important accounts?', action: 'Prioritize MFA on email and administrator accounts.' },
  { id: 'training', fn: 'Protect', ref: 'PR.AT-01', text: 'Are staff and volunteers trained to recognize and report suspicious requests?', action: 'Practice recognizing and reporting a fictional phishing message.' },
  { id: 'devices', fn: 'Detect', ref: 'DE.CM-09', text: 'Are devices monitored for suspicious activity?', action: 'Confirm endpoint monitoring coverage with your IT provider.' },
  { id: 'alerts', fn: 'Detect', ref: 'DE.AE-06', text: 'Do security alerts reach someone responsible for reviewing them?', action: 'Assign an alert reviewer and an escalation path.' },
  { id: 'response', fn: 'Respond', ref: 'RS.MA-01', text: 'Do you have a practiced incident-response plan?', action: 'Walk through a fictional account compromise with your team.' },
  { id: 'contacts', fn: 'Respond', ref: 'RS.CO-02', text: 'Are incident notification responsibilities and contacts documented?', action: 'Review contact and notification responsibilities with qualified advisers.' },
  { id: 'restore', fn: 'Recover', ref: 'RC.RP-03', text: 'Is backup integrity checked before restoration?', action: 'Arrange a controlled restoration check with your backup provider.' },
  { id: 'priorities', fn: 'Recover', ref: 'RC.RP-02', text: 'Is the order for restoring important operations agreed?', action: 'Document which operations must recover first.' }
];
export function validateAnswers(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).length !== QUESTIONS.length) throw new Error('Answer every question.');
  const clean = {};
  for (const q of QUESTIONS) {
    if (!Object.hasOwn(value, q.id) || typeof value[q.id] !== 'string' || !Object.hasOwn(CHOICES, value[q.id])) throw new Error('Select a valid answer for each question.');
    clean[q.id] = value[q.id];
  }
  return clean;
}
export function buildReport(value, date = new Date()) {
  const answers = validateAnswers(value);
  const counts = { yes: 0, partial: 0, no: 0, unknown: 0 };
  const sections = FUNCTIONS.map(fn => {
    const rows = QUESTIONS.filter(q => q.fn === fn).map(q => { counts[answers[q.id]]++; return { ...q, answer: answers[q.id] }; });
    return { fn, rows, inPlace: rows.filter(q => q.answer === 'yes').length };
  });
  // Editorial triage order, not a NIST severity rating. Unknowns require verification.
  const actions = ['unknown', 'no', 'partial'].flatMap(answer => QUESTIONS.filter(q => answers[q.id] === answer).map(q => ({ ...q, answer })));
  const lines = [
    'BASIC CYBER POSTURE SELF-ASSESSMENT', `Date: ${date.toISOString().slice(0, 10)} | Questionnaire v${VERSION}`,
    'Based on selected NIST CSF 2.0 outcomes for small organizations.',
    'Self-reported only. No systems scanned or controls verified. Not a certification, audit, complete CSF Profile, or NIST score.',
    '', `In place: ${counts.yes}/12 | Partial: ${counts.partial} | Not in place: ${counts.no} | Not sure: ${counts.unknown}`,
    'Counts are unweighted answers, not a probability of safety. Even 12 in place does not establish that an organization is secure.', ''
  ];
  for (const section of sections) {
    lines.push(`${section.fn.toUpperCase()} (${section.inPlace}/2 reported in place)`);
    for (const q of section.rows) lines.push(`[${q.ref}] ${q.text} — ${CHOICES[q.answer]}`);
    lines.push('');
  }
  lines.push('SUGGESTED FOLLOW-UP');
  if (!actions.length) lines.push('Validate your answers with evidence, maintain these practices, and review the wider CSF with a qualified adviser.');
  for (const q of actions) lines.push(`${q.answer === 'unknown' ? 'Verify first' : 'Plan improvement'} [${q.ref}]: ${q.action}`);
  lines.push('', 'Start by confirming unknowns, then discuss missing and partial practices. Assign an owner and a target date for each action; prioritize using your actual business risks.', '', `NIST small-business guide: ${SOURCE}`, `NIST CSF 2.0: ${CORE}`, 'Independent educational tool by T.J. Bostic; not endorsed by NIST.');
  return { counts, sections, actions, text: lines.join('\n') };
}

