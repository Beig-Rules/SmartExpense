# Security — SmartExpense

## Data location

- All expense data is stored in the browser **localStorage** of the current origin.
- Nothing is sent to a server by this application.
- Clearing site data / using another browser / private mode without persistence will remove or isolate data.

## PIN lock

- Optional PIN is hashed with **Web Crypto API (SHA-256)** before storage.
- The plaintext PIN is never written to localStorage.
- PIN hash is **not** included in JSON backups.
- This is a **convenience lock** against casual viewing on a shared device — not a substitute for full-disk encryption or a password manager vault.

## XSS hardening

- User-controlled strings rendered in the table and tips are escaped in `app.js`.
- Import path validates structure and coerces types; unknown fields are dropped.

## Recommendations

1. On a shared computer, enable PIN and lock when leaving the desk.
2. Export JSON backups to a secure personal drive periodically.
3. Do not use this app for multi-user accounting or regulated financial records without additional controls.
4. Prefer HTTPS (e.g. GitHub Pages) so the origin is stable and not mixed with insecure contexts.

## Limitations

- localStorage is readable by any script on the same origin. Do not install untrusted browser extensions that can access page data.
- There is no remote wipe or account recovery — you own the backup files.
