# Report delivery setup and security boundaries

The assessment and local reports work on GitHub Pages. Automatic email is **not live** until this service is deployed and configured. Do not claim delivery is working from mock tests.

## Accounts and infrastructure needed

1. A Resend account with a verified sender domain you control. This normally requires a domain and DNS access; a GitHub Pages address does not grant control of github.io email records. Configure SPF/DKIM and appropriate DMARC. Do not use the academic contact address as a sender unless its domain administrator explicitly authorizes it.
2. A Cloudflare Turnstile site restricted to the actual frontend hostname (for example `bostic-timothy.github.io`). The widget uses action `posture_report`.
3. A server supporting maintained Node.js (22+), outbound HTTPS, private environment secrets, and an HTTPS reverse proxy. The supplied service binds to loopback. No npm dependencies or build system are required.

Set server environment variables through the host's secret manager:

- `ALLOWED_ORIGIN`: exact frontend origin, e.g. `https://bostic-timothy.github.io` (no path or trailing slash).
- `RESEND_API_KEY`: scoped send-only credential.
- `REPORT_FROM`: verified bare sender email address.
- `TURNSTILE_SECRET`: widget's private secret.
- `TURNSTILE_HOSTNAME`: actual frontend hostname.
- `PORT`: optional local port, default 3000.

Run `node server/report-server.mjs`. Missing settings cause startup to fail. Do not commit secrets, .env files, real reports, or email addresses.

In `assessment/config.mjs`, set the public HTTPS API origin and public Turnstile site key. In `assessment.html`, append that **exact API origin** to the CSP `connect-src` directive (do not use wildcards). Keep `form-action 'none'`: the feature uses fetch, never native form submission.

## Deployment requirements

- Run exactly one persistent service process. Session state and rate limits are in memory. A restart expires pending requests; scaling to multiple replicas requires a shared transactional store and shared limits before release.
- Put HTTPS and request/connection limits at the ingress. Enforce an 8 KB body limit, timeouts, and per-client limits there. Set HSTS at the HTTPS proxy. Do not log request bodies, verification codes, email addresses, or authorization headers. Disable payload capture in error monitoring.
- The app deliberately ignores X-Forwarded-For and similar spoofable headers. Behind a proxy, the app's IP quota becomes a conservative shared quota; apply real-client limits at the trusted ingress. It allows 5 starts/hour per socket IP, 3/hour per recipient hash, and 100 starts/hour globally, plus 60 requests/hour per socket IP. Tune only after abuse review.
- Turnstile verification fails closed and validates success, hostname, and action. Do not use testing keys in production.
- Use a dedicated origin for the API. Serve only the API, not this repository or its server/test directories. Restrict frame embedding at the frontend host when supported; GitHub Pages cannot set all custom response headers.
- Apply provider quotas and budget alerts. Origin checks are a browser CSRF boundary, not authentication for arbitrary HTTP clients; CAPTCHA and quotas remain necessary.
- Publish your actual operator/privacy contact and the email provider's current privacy/retention terms before enabling delivery. Do not add marketing consent to this report-only workflow.

## What happens to information

The browser stores answers only in memory. It uses no cookies, localStorage, or analytics. Reports contain only fixed questions, validated enum answers, and fixed recommendations; no organization name or free-text vulnerabilities are collected.

For email, the visitor explicitly consents and completes Turnstile. The server temporarily holds answers and the email address, generates a random code, and stores only its SHA-256 hash. Verification mail contains no posture answers. The browser receives a separate cryptographically random session token; it is never placed in a URL or cookie. Both the code and token are required to send the report. Five incorrect/verification attempts exhaust the session. Sessions expire after 15 minutes and are swept at most one minute later; successful delivery discards answers and email immediately. Rate-limit hashes expire after an hour. The email provider and recipient mailbox have separate retention policies.

After verification, the server reconstructs the report from the shared trusted model and sends a plain-text email. The provider receives the recipient, code mail, and eventual report. A 202 response means the provider accepted the message, not that it reached the inbox. Failed/ambiguous report delivery can be retried with the same provider idempotency key. A process restart invalidates pending sessions.

## Input protections

- XSS: fixed enums, strict JSON shape/type/length validation, no HTML output or innerHTML from inputs, textContent DOM rendering, plain-text email, and a restrictive assessment CSP.
- Command injection: no shell, subprocess, dynamic evaluation, or user-defined commands; provider payloads are JSON sent to fixed HTTPS URLs.
- CSRF (interpreting the request's “XSF”): no cookies/ambient authorization; exact Origin validation, JSON-only POST, mandatory non-simple request header, narrow CORS, and an unguessable verification-session token.
- Abuse/replay: server-side CAPTCHA validation, bounded stores, byte limits, quotas, short expiry, capped code attempts, a sending lock, and provider idempotency keys. No report is sent merely because an email address was typed.

These are implemented protections, not a guarantee of complete security. TLS/ingress configuration, credentials, provider settings, monitoring, and deployment verification remain required.

## Verification

Run `node --test tests/posture.test.mjs` for model and API regression tests. All email/CAPTCHA functions are mocked in these tests; no actual messages are sent. Before enabling the UI, test the live deployment with an inbox you own: valid delivery, spam-folder behavior, expired/incorrect code, replay, CAPTCHA denial, wrong Origin, oversized requests, rate limiting, provider failure, and privacy of logs. Verify receipt before describing email as operational.
