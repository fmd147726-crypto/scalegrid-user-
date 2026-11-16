# Release readiness

## Code readiness
The repositories contain the static public site, admin CMS, modular Firebase client integration, content projection, separate portfolio/FAQ categories, draft visibility filtering, version snapshots, activity records, backup export/merge restore, and deployment/migration documentation. Static syntax and JSON checks are run as part of this release.

## Firebase readiness
**Not verified.** The supplied database export was unavailable in the accessible files. Existing live records, administrator records, current rules, Auth providers, and App Check settings have not been queried or changed. Apply the rules only after owner verification and Emulator Suite tests.

## Deployment readiness
**Not deployed.** GitHub repositories and Pages settings were not accessed. Owner must upload the ZIP contents to the exact repositories and follow the deployment checklist.

## Known limitations
- Media library stores HTTPS/repository-relative references; no binary upload.
- Client-side activity logs are reviewable but not tamper-proof.
- Strict publication concurrency and server-side audit require Cloud Functions or another trusted backend.
- Dynamic SEO metadata is client-side on GitHub Pages.
- Emulator and browser automation tests remain to be performed.
