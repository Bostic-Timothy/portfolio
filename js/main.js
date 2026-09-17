'use strict';

// Fictional Sunday counts from the public attendance project's example data.
const attendance = [
  { date: 'Jan 04', adults: 82, youth: 24, children: 31, visitors: 6 },
  { date: 'Jan 11', adults: 78, youth: 23, children: 29, visitors: 5 },
  { date: 'Jan 18', adults: 88, youth: 27, children: 34, visitors: 7 },
  { date: 'Jan 25', adults: 91, youth: 26, children: 33, visitors: 8 }
];
let activeView = 'all';
const viewLabels = { all: 'All attendees', adults: 'Adults', young: 'Youth and children' };
function countFor(row, view) {
  if (view === 'adults') return row.adults;
  if (view === 'young') return row.youth + row.children;
  return row.adults + row.youth + row.children + row.visitors;
}
function renderAttendance(view) {
  activeView = view;
  const counts = attendance.map(row => countFor(row, view));
  document.querySelector('#demo-average').textContent = Math.round(counts.reduce((sum, value) => sum + value, 0) / counts.length);
  const change = Math.round((counts[counts.length - 1] - counts[0]) / counts[0] * 100);
  document.querySelector('#demo-change').textContent = `${change >= 0 ? '+' : ''}${change}% first to last Sunday`;
  document.querySelector('#demo-rows').replaceChildren(...attendance.map((row, index) => {
    const tr = document.createElement('tr');
    const date = document.createElement('th');
    date.scope = 'row';
    date.textContent = row.date;
    const count = document.createElement('td');
    count.textContent = counts[index];
    tr.append(date, count);
    return tr;
  }));
  document.querySelector('.demo-table thead th:last-child').textContent = viewLabels[view];
  document.querySelectorAll('.demo-bars span').forEach((bar, index) => bar.style.setProperty('--bar', `${counts[index] / Math.max(...counts) * 100}%`));
  document.querySelectorAll('[data-view]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.view === view)));
}
document.querySelectorAll('[data-view]').forEach(button => button.addEventListener('click', () => renderAttendance(button.dataset.view)));
renderAttendance(activeView);
document.querySelector('#download-demo').addEventListener('click', () => {
  const csv = ['Fictional sample data - not real church records', `Date,${viewLabels[activeView]}`, ...attendance.map(row => `${row.date} 2026,${countFor(row, activeView)}`)].join('\r\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = `fictional-attendance-${activeView}.csv`;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});

const menu = document.querySelector('.service-menu');
menu.querySelectorAll('a').forEach(link => link.addEventListener('click', () => { menu.open = false; }));
menu.addEventListener('keydown', event => {
  if (event.key === 'Escape') { menu.open = false; menu.querySelector('summary').focus(); }
});
document.querySelectorAll('[data-service]').forEach(link => link.addEventListener('click', () => {
  document.querySelector('#service').value = link.dataset.service;
}));
document.querySelector('#inquiry-form').addEventListener('submit', event => {
  event.preventDefault();
  const organization = document.querySelector('#organization').value.trim();
  const service = document.querySelector('#service').value;
  const message = document.querySelector('#message').value.trim();
  if (!message) {
    document.querySelector('#message').setCustomValidity('Please describe what you would like help with.');
    document.querySelector('#message').reportValidity();
    return;
  }
  const body = `Hello T.J.,\n\nI would like to discuss: ${service}\nOrganization: ${organization || 'Not specified'}\n\n${message}\n`;
  const emailUrl = `mailto:tab17b@acu.edu?subject=${encodeURIComponent(`Project inquiry: ${service}`)}&body=${encodeURIComponent(body)}`;
  document.querySelector('#inquiry-status').textContent = 'Your email app has been requested. Review and send the draft there. If it does not open, email tab17b@acu.edu directly. Nothing has been sent by this site.';
  window.location.href = emailUrl;
});
document.querySelector('#message').addEventListener('input', event => event.target.setCustomValidity(''));

// Duplicate only visual content; screen readers and keyboard users see each credential once.
const credentialTrack = document.querySelector('.credential-track');
Array.from(credentialTrack.children).forEach(item => {
  const duplicate = item.cloneNode(true);
  duplicate.setAttribute('aria-hidden', 'true');
  const anchor = duplicate.querySelector('a');
  const visual = document.createElement('span');
  visual.className = 'credential-copy';
  visual.append(...anchor.childNodes);
  anchor.replaceWith(visual);
  credentialTrack.append(duplicate);
});
document.querySelector('#credential-pause').addEventListener('click', event => {
  const paused = document.querySelector('.credentials').classList.toggle('paused');
  event.currentTarget.setAttribute('aria-pressed', String(paused));
  event.currentTarget.textContent = paused ? 'Resume scrolling' : 'Pause scrolling';
});
document.querySelector('.credentials').classList.add('enhanced');
