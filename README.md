# CyberLawAssist

## Start the local project

Double-click **start-project.bat**. It starts the installed XAMPP Apache/MySQL and the local Python AI if they are stopped. Open **http://localhost/CyberLawAssist/**.

The database and restricted application credentials have been installed on this computer. Configuration lives in `xampp/cyberlawassist-private/config.php`, outside `htdocs`. The website's PHP account does not have schema administration permissions.

### Register and log in

Open **http://localhost/CyberLawAssist/pages/signup.html** to create a User account. Public registration always creates Users. To create an administrator, sign in with an existing admin account, open **Users -> Create administrator**, and enter the new administrator's details. Existing administrator accounts are retained; there are no default accounts or passwords. Creating another admin keeps the current administrator signed in. Each administrator needs a unique admin number. Open **Admin log in** from the login page or homepage footer and sign in with that number and password. Existing administrators receive numbers during migration; find yours in your profile or the Administrators list. Email login remains available for existing accounts.

Login opens only the workspace assigned to the database account role. Direct links to another workspace, including Guest pages, redirect to your assigned workspace. Logged-out visitors must log in to open User or Admin pages. Log out before signing into or registering another account. These rules apply to desktop and mobile. Administrators manage registered accounts in **Users -> Manage account**, including disabling access and resetting a user's password after verifying their identity. Users can change their own password under Settings. Under **Users -> Manage account**, admins can change a user password or permanently delete a user account after entering their administrator password and typing DELETE. Deletion removes that user's saved chats, checklist, support conversation, notifications, and read markers. Accounts linked as creators of office records must be disabled instead.

## Connected features

- PHP sessions, CSRF protection, password hashing, sign-in limits, role and ownership checks.
- Profiles, language/privacy preferences, password changes, and account session invalidation.
- User/Admin AI history in SQL, including rename/pin/delete and retry without duplicating a question or reply.
- Guest AI history stays in the browser. PHP forwards AI requests to the local Python service.
- Personal checklists, formatted Word (.docx) export, and checklist-only printing.
- Registered-user live support and the admin inbox, with polling and targeted notifications.
- Public notices, personal read markers, and User/Admin alerts.
- Physical intake, case records, searching/pagination, editing/status changes, and concurrent-edit detection.
- Reports calculated from SQL: Monday-Sunday weeks, actual calendar months, twelve-month years, and formatted Word (.docx) export.
- Published multilingual law content and office contact details read from SQL.

The current database contains content copied from the existing project datasets and the project-supplied office details. It does not seed fake visitors, user conversations, or default accounts. The offline AI still reads the 3,069 Q&A pairs in `phyton ai/data`; see [AI instructions](<phyton ai/README.md>).

## Install on another XAMPP computer

1. Copy the project into XAMPP's `htdocs` folder. Install Python 3.10+ or uv if needed.
2. Start XAMPP MySQL. From this folder run `C:\path\to\xampp\php\php.exe database\setup.php`.
3. If local database administration uses a password, set `CLA_DB_SETUP_USER` / `CLA_DB_SETUP_PASSWORD` in that command's environment. The installer creates a separate app account and stores only that app's credentials outside the public directory.
4. Run `phyton ai/setup-ai.ps1` if no local Python environment exists, then start the project.
5. Public Create account registers Users only. Restore an existing office administrator account from your database backup to create further administrators through **Users -> Create administrator**.

`database/schema.sql` is for a fresh database. `database/migrate.php` applies the additive changes needed by this implementation to an existing installation. Run it from PHP CLI after taking a database backup. Setup and migration scripts reject HTTP access.

## Exported documents

Checklist and weekly/monthly/annual report exports download Word `.docx` documents with office letterhead, green/blue headings, A4 pages, formatted tables, generation date, and page numbers. Checklists use the signed-in account's saved items; reports use the selected period and database totals. Documents are generated locally with PHP's installed PharData support. Temporary copies are removed after generation. Printing still prints only the checklist.

## Check live support on localhost

1. Start the project and sign into a User account in a normal browser window.
2. Open an incognito/private window or another browser and sign into an Admin account. Two ordinary tabs in the same browser share one login.
3. Send a message under **User -> Live support**.
4. Under **Admin -> Live support**, select that User conversation and reply. Keep both pages visible; messages refresh automatically about every five seconds. Guests cannot use live support.

## Existing browser and JSON data

The installer imports genuine accounts from `assets/php/private/users.json` if that file exists, preserving password hashes and IDs, and keeps the source/backup. Conflicting account IDs/emails stop the import instead of silently replacing an account.

Older browser data was stored by role rather than authenticated account. It remains untouched and is **not automatically uploaded or assigned to the next person who logs in**. New signed-in activity is stored under the actual account ID. Guest local history continues to work.

## Local operation and handover

Phone/tablet users on the same network open the website using this computer's LAN IP. PHP calls Python on the server, so phones do not need direct access to port 8001. Allow Apache on the intended private network. Keep MySQL and Python bound locally. Back up the database through XAMPP/phpMyAdmin and retain the private configuration separately from public project files.

Notifications are delivered in the application; no external email/SMS service is configured. The existing Lucide CDN supplies icons when internet is available. Browser layouts and group content/accuracy reviews follow the group's accepted frontend process. Backend syntax/readiness checks do not constitute a full multi-device acceptance test.

## Loading, caching, policies, and old links

Supporting files live in `extra/`; see [extra implementation notes](extra/README.md). Workspace bootstrap and report requests use skeleton loaders. Public static files and policy pages have a network-first browser cache with an offline notice. Private API/account data is excluded; account actions still require the local server. Localhost supports the service worker, while ordinary LAN HTTP falls back to normal network loading.

Terms and Privacy are linked from registration, login, the homepage, and workspace footers. New User registration records acknowledgement version/time. Existing accounts and passwords are retained. The office should confirm the policy wording and applicable retention rules before adopting it publicly.

Old public URL names redirect permanently (301) to canonical HTML routes. Missing paths return the custom 404 screen. Session and role redirects remain temporary. No localhost-to-HTTPS redirect is imposed.
