# T.J. Bostic — community technology services

A responsive, dependency-free HTML/CSS/JavaScript site for small businesses and churches in the Winston-Salem area.

## Pages and behavior

- `index.html`: launch service areas, community biography, certification ribbon, project demonstration, provider boundaries, and inquiry form.
- `css/services.css`: homepage layout and responsive/reduced-motion styles.
- `css/styles.css`: shared design and retained technical portfolio styles.
- `js/main.js`: fictional attendance views, CSV export, navigation, credential controls, and email draft preparation.
- `offensive.html`: retained educational methodology, explicitly separated from commercial services.

Open `index.html` in a browser or serve this directory with any static web server. There are no packages, build step, backend, analytics, or third-party scripts.

## Contact behavior

The inquiry form prepares a `mailto:` draft addressed to the existing public contact, tab17b@acu.edu. It does not deliver messages itself, store form contents, or claim successful delivery. A configured email application is required; the direct email link is also available. Do not add a fake form-success message. A server-side form provider would require a separately configured endpoint and a privacy review appropriate to the collected data.

## Content integrity

- Military units, decade of service, school-to-church career progression, and Winston-Salem community context were supplied by T.J. for this revision.
- GCIH, GSEC, GFACT, and Security+ were recorded in the prior LinkedIn profile review. GPEN was in progress and is not presented as earned. Ribbon links explain the certification; they are not personal credential-verification links.
- The attendance project is grounded in the public `Bostic-Timothy/church-attendance-analytics` README. The demo uses its fictional Sunday counts, never real member records. Excel reporting remains planned.
- The security range is ongoing lab work. No commercial security engagements, customer testimonials, partnerships, or guarantees are asserted.
- Microsoft 365, Planning Center, and Huntress are examples of established externally operated services, not existing reseller agreements or subscriptions included in an offering. Their official product pages are linked in the site.
- Launch service scope must stay consistent with the owner's actual capabilities and agreements. The separate cyber-startup discussion was not available in the recent task list during the initial revision.

## Validation

Checked in Chromium at 375, 390, 768, 1024, and 1440 pixels: no page-level horizontal overflow; working navigation; attendance views and CSV download; empty inquiry validation and honest email-draft status; ribbon pause and reduced-motion behavior; no JavaScript errors. Checked static attendance values and mobile navigation with JavaScript disabled. Local fragment targets resolve. Browser screenshots were reviewed at desktop and mobile sizes.

## Publishing

This is a static site. Keep all relative assets together. A feature branch and pull request allow content review before changing the live site. Hosting configuration and live deployment are not established by these source edits.
