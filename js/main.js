const projects = [
	{ number: '01', type: 'offensive', label: 'Offensive Security', title: 'Authorized attack-path study', description: 'Planned case study for documenting reconnaissance, enumeration, validation, sanitized evidence, and lessons learned in an authorized lab environment.', tags: ['Planned', 'Recon', 'Web'], year: 'In progress', url: 'offensive.html' },
	{ number: '02', type: 'cyber-range', label: 'Cyber Range / Security Engineering', title: 'A repeatable environment for practice', description: 'Planned build focused on creating a small, documented environment for practicing security concepts and recording reproducible observations.', tags: ['Planned', 'Lab design'], year: 'Planned' },
	{ number: '03', type: 'detection', label: 'Detection / Incident Response', title: 'From event to investigation', description: 'Planned project for exploring detection logic, investigation notes, response decisions, and opportunities to improve signal quality.', tags: ['Planned', 'Detection', 'IR'], year: 'Planned' },
	{ number: '04', type: 'automation', label: 'Automation', title: 'Small scripts, repeatable work', description: 'Planned collection of focused automation experiments for evidence handling, security workflows, and technical documentation.', tags: ['Planned', 'Python', 'Workflow'], year: 'Planned' }
];

const projectGrid = document.querySelector('#project-grid');
const filterButtons = document.querySelectorAll('.filter-button');

function renderProjects(filter = 'all') {
	projectGrid.innerHTML = projects.filter((project) => filter === 'all' || project.type === filter).map((project) => `<article class="project-card"><div><div class="project-meta"><span>${project.number} / ${project.label}</span><span>${project.year}</span></div><h3>${project.title}</h3><p>${project.description}</p></div><div class="project-bottom"><div class="project-tags">${project.tags.map((tag) => `<span>${tag}</span>`).join('')}</div>${project.url ? `<a class="project-arrow" href="${project.url}" aria-label="Open ${project.label} page">&#8599;</a>` : '<span class="project-arrow" aria-hidden="true">&#8599;</span>'}</div></article>`).join('');
}

renderProjects();
filterButtons.forEach((button) => button.addEventListener('click', () => {
	filterButtons.forEach((item) => item.classList.remove('active'));
	button.classList.add('active');
	renderProjects(button.dataset.filter);
}));

const menuToggle = document.querySelector('.menu-toggle');
const mobileNav = document.querySelector('.mobile-nav');
menuToggle.addEventListener('click', () => {
	const isOpen = mobileNav.classList.toggle('open');
	menuToggle.setAttribute('aria-expanded', isOpen);
	mobileNav.setAttribute('aria-hidden', !isOpen);
});
mobileNav.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => {
	mobileNav.classList.remove('open');
	menuToggle.setAttribute('aria-expanded', 'false');
	mobileNav.setAttribute('aria-hidden', 'true');
}));

const revealObserver = new IntersectionObserver((entries) => {
	entries.forEach((entry) => {
		if (entry.isIntersecting) {
			entry.target.classList.add('visible');
			revealObserver.unobserve(entry.target);
		}
	});
}, { threshold: 0.12 });
document.querySelectorAll('.reveal').forEach((element) => revealObserver.observe(element));
