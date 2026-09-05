const projects = [
	{ number: '01', type: 'offensive', label: 'Offensive / Web', title: 'A clearer view of the attack surface', description: 'Mapped an overlooked external footprint, chained low-severity findings, and gave a product team a prioritized route to remediation.', tags: ['Recon', 'Web apps'], year: '2025', url: 'offensive.html' },
	{ number: '02', type: 'defensive', label: 'Defensive / Detection', title: 'Making the signal impossible to miss', description: 'Reworked noisy identity alerts into an investigation flow that helped analysts spend less time triaging and more time responding.', tags: ['SIEM', 'Identity'], year: '2025' },
	{ number: '03', type: 'offensive', label: 'Offensive / Cloud', title: 'Trust boundaries, made visible', description: 'Tested cloud permissions and service paths to expose where convenience had quietly become excessive access.', tags: ['AWS', 'IAM'], year: '2024', url: 'offensive.html' },
	{ number: '04', type: 'defensive', label: 'Defensive / Response', title: 'A response plan people can actually use', description: 'Translated incident lessons into concise runbooks, clear owners, and a tabletop exercise built for real operational pressure.', tags: ['IR', 'Operations'], year: '2024' }
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
