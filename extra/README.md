# CyberLawAssist extras

## Skeleton loaders

`loading.js` and `loading.css` provide the workspace bootstrap and Reports loading placeholders. They follow the green/blue interface, have responsive layouts and an accessible loading message, and disable animation for reduced-motion preferences. Placeholders disappear when real content or an error is rendered; no artificial delay is added.

## Public file cache

`cache.js` registers the root `sw.js`, which imports `cache-worker.js`. The root worker is required for scope across `/CyberLawAssist/`. The worker checks the network first and falls back to cached copies of an explicit list of CSS/JS, public policy pages, and the offline notice. It never stores API responses, session/login pages, signed-in HTML, private chats/support, downloaded documents, or third-party CDN content.

The public Privacy page has a Clear cached files button. Clearing it does not delete SQL records or Guest history. The cache is partitioned by project URL. The worker only registers where the browser supports service workers in a secure context: localhost or HTTPS. Ordinary LAN HTTP continues working without the worker. No pending messages or mutations are queued offline. Apache must be reachable for account and chatbot operations; the local Python service must also run for chatbot replies.

## Policies

The canonical pages are `pages/terms.html` and `pages/privacy.html`; `legal.css` supplies their responsive layout. New User registration requires Terms acceptance and Privacy acknowledgement on both the form and server. `users.policy_version` and `users.policy_accepted_at` record the version/time; existing accounts are not assigned a fabricated acceptance. Admin creation preserves the existing session and does not impersonate acceptance by the new staff member.

The version is `2026-10-18`, also defined by `CLA_POLICY_VERSION` in bootstrap.php. When changing policies, update both pages, the signup hidden field, and the server constant together. Office-specific retention and recordkeeping rules need to be confirmed by the office before the policy is adopted publicly. The current notice states that no automatic deletion schedule is configured rather than inventing one.

## 404 and permanent redirects

Root `.htaccess` sends missing paths to `extra/404.html` with HTTP 404. The PHP workspace gate explicitly renders that same page for unknown role tabs. It does not redirect missing pages to Home or return a successful status for them.

Permanent 301 mappings are in root `.htaccess`:

| Old URL | Canonical URL |
| --- | --- |
| `home`, `home.html`, `home.php`, `index.php` | `index.html` |
| `login`, `signin` and HTML/PHP variants | `pages/login.html` |
| `signup`, `register`, `registration` and variants | `pages/signup.html` |
| `admin-login` and variants | `pages/admin-login.html` |
| root `guest`, `user`, `admin` and variants | matching `pages/*.html` workspace |
| `terms`, `terms-of-service`, `terms-and-conditions` and variants | `pages/terms.html` |
| `privacy`, `privacy-policy`, `privacy-notice` and variants | `pages/privacy.html` |
| old `pages/register`, `pages/registration`, `pages/setup` variants | `pages/signup.html` |
| extensionless/PHP role tabs and account/policy aliases | matching canonical HTML page |

Canonical HTML URLs are not permanently redirected. Authentication/role redirects remain temporary and use the current database session. There is no forced HTTPS/host redirect on localhost.

If the project folder is renamed, update RewriteBase and ErrorDocument in root `.htaccess` and the absolute project paths in `404.html` / `offline.html` before deployment.
