# Portfolio Development Instructions

## Project Purpose

This repository is a professional cybersecurity portfolio.

The site should demonstrate:
- cybersecurity methodology
- offensive-security knowledge
- technical documentation
- engineering discipline
- professional communication
- practical project development

The portfolio is intended for recruiters, hiring managers, penetration testers,
security engineers, and other cybersecurity professionals.

## Technology Stack

Use:
- HTML5
- CSS3
- vanilla JavaScript

Do not introduce:
- React
- Vue
- Angular
- Tailwind
- Bootstrap
- npm dependencies
- external UI frameworks
- build systems

unless explicitly requested.

Prefer simple, maintainable solutions over unnecessary abstraction.

## Design Direction

Maintain a modern, restrained, professional cybersecurity aesthetic.

Prefer:
- dark backgrounds
- blue/cyan accents
- strong typography
- clear visual hierarchy
- subtle borders
- generous spacing
- responsive layouts
- professional technical diagrams and process visuals

Avoid stereotypical hacker aesthetics, including:
- Matrix rain
- skulls
- excessive neon green
- fake terminal effects
- excessive animation
- gratuitous glitch effects
- overly futuristic interfaces

The website should look credible to a cybersecurity hiring manager.

## Responsive Design

Pages must work well on:
- large desktop displays
- laptops
- tablets
- mobile devices down to approximately 375px wide

Avoid horizontal overflow.

Use responsive CSS layouts such as:
- CSS Grid
- Flexbox
- media queries
- clamp() where appropriate

## Accessibility

Use semantic HTML.

Maintain:
- logical heading hierarchy
- visible keyboard focus states
- sufficient color contrast
- meaningful link text
- appropriate ARIA attributes only when needed

All interactive elements should be keyboard accessible.

## Content Integrity

Never invent:
- professional experience
- completed penetration tests
- certifications
- clients
- security findings
- project results
- technical accomplishments

If a project is unfinished, label it clearly as:
- Coming Soon
- In Progress
- Planned

Do not imply that training exercises are professional client engagements.

## Security and Privacy

Never publish:
- passwords
- API keys
- access tokens
- credentials
- personally identifiable client information
- confidential information
- proprietary course content
- challenge flags
- answer keys
- sensitive screenshots
- real customer data

Do not expose unnecessary internal infrastructure details.

Sanitize all portfolio artifacts before publication.

## Offensive Security Content

Represent penetration testing as a professional methodology rather than
a collection of tools.

Use this general lifecycle:

1. Planning & Pre-Engagement
2. Reconnaissance & OSINT
3. Scanning & Enumeration
4. Vulnerability Analysis
5. Exploitation
6. Post-Exploitation
7. Reporting & Remediation

Projects should emphasize:
- objective
- scope
- methodology
- evidence
- findings
- business impact
- remediation
- lessons learned

Tools should support the methodology rather than define the project.

## Code Quality

Prefer:
- semantic HTML
- reusable CSS classes
- clear naming conventions
- readable formatting
- small focused JavaScript functions

Avoid:
- unnecessary duplication
- overly large functions
- inline styles unless justified
- unnecessary JavaScript
- large unexplained code blocks
- modification of unrelated files

Preserve existing functionality when adding features.

## Change Scope

When completing a task:
1. inspect the existing implementation first
2. identify the smallest appropriate set of files to change
3. avoid unrelated refactors
4. preserve the established design language
5. validate the result after making changes

Do not redesign unrelated portions of the site unless explicitly requested.

## Validation

Before considering a task complete:
- review the changed files
- check for broken links
- check responsive behavior
- check for horizontal overflow
- verify navigation
- verify accessibility basics
- confirm no sensitive data was introduced

If testing tools are available, run appropriate checks.

## Git Workflow

Work should be compatible with a feature-branch workflow.

Prefer focused commits corresponding to one meaningful change.

Do not modify repository history.

Do not commit secrets or sensitive data.

When summarizing work, identify:
- files changed
- major implementation decisions
- validation performed
- known limitations or follow-up work