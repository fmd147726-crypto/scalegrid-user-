# Security rules and limitations

`database.rules.json` is the proposed ruleset for both repositories. It denies root reads/writes by default, makes `publicContent` public-read only, protects private working content behind the UID allowlist, scopes normal-admin reads and writes by collection permission, and reserves full working-content reads for Super Admins or explicitly authorized publishers. `admins` and `adminUids` management is Super Admin-only. The rules preserve legacy read paths for public `pages`, `categories`, and `notifications`.

## Important deployment safeguards
- Take a fresh live database export before applying rules.
- Bootstrap/verify the existing Super Admin first. A missing allowlist record can lock out the dashboard.
- The old normal-admin push key is not accepted as an auth UID.
- Do not enable broad public writes.
- Do not place service-account credentials in client code.
- Do not enable App Check enforcement until all legitimate clients are registered.

## Honest limitations
- The rules have been syntax-checked as JSON, but were not executed in Firebase Emulator Suite in this environment.
- Client-generated activity logs are not tamper-proof.
- Publishing is client-driven; a trusted Cloud Function is required for strict multi-editor locking, server-authoritative attribution, and fully atomic validation against concurrent edits.
- Storage uploads are not implemented. The media library is URL/reference-based.
- Rules should be validated with the Firebase Emulator Suite and a live owner-controlled test account before production application.
