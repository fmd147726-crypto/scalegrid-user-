# Testing report

## Performed in this workspace
- Extracted both original ZIPs and checked ZIP CRC integrity (`testzip()` returned no errors).
- Inspected original HTML, CSS, JavaScript, Firebase configuration, starter content, README, deployment checklist, and database rules.
- Ran Node.js syntax checks on Admin `app.js`, `content-projection.js`, `starter-content.js`, Firebase config, migration scripts, and User `app.js` / Firebase config.
- Admin: `npm test` — 3 tests passed, 0 failed. Covers draft/hidden/disabled-category filtering, legacy category compatibility, and private-setting exclusion.
- User: `npm test` — 3 tests passed, 0 failed. Covers public-only data source, independent service/portfolio/FAQ filters, and metadata/404 presence.
- Both projects: `npm run check` passed.
- Parsed both Firebase rules files as JSON and confirmed they are identical.
- Confirmed both Firebase configs use the same existing project ID and Realtime Database URL.
- Confirmed the public app reads `publicContent` and the Admin app manages private `siteContent`.
- Checked local HTML asset references and module imports; no missing local references were found.
- Smoke-tested the Normal Admin patch-preparation script against a temporary fixture; it produced a path-specific patch without modifying Firebase.
- Confirmed all required documentation files exist in both repositories.

## Not performed
- Firebase Emulator Suite authorization tests.
- Live Firebase authentication, database reads/writes, or migration.
- Browser automation / visual desktop-tablet-mobile testing.
- GitHub Pages deployment or live URL verification.
- Full WHATWG HTML validator run.
- Firebase App Check enforcement or Storage upload tests.

## Owner verification required
Run Firebase Emulator Suite tests against the rules, then test the live project after a fresh backup and Super Admin verification. Static syntax and unit tests do not prove Firebase authorization correctness.


## Firebase rules package checks (2026-11-16)
- JSON parse: passed.
- Static policy assertions: passed.
- Cross-repository rules equality: checked by packaging workflow.
- Firebase Emulator Suite authorization tests: not performed (Firebase CLI/Emulator not available in this environment).
- Live Firebase deployment and live-data migration: not performed.
