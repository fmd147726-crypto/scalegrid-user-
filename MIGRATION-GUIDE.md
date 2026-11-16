# Migration guide — non-destructive

## Before any change
1. Take a fresh export of the live Realtime Database.
2. Keep an untouched copy outside the repositories.
3. Inspect the live `admins`, `adminUids`, `pages`, `categories`, `notifications`, and `siteContent` paths.
4. Confirm the existing Super Admin can sign in.
5. Do not use a whole-database import to apply a partial snapshot.

The requested `scalegrid-1c506-default-rtdb-export (1).json` was not present in the accessible project files for this build. The two source ZIPs were available; no live database was queried or modified.

## Administrator records
Preserve Super Admin UID `afaATJbCBLZzwVRNEyQwluEjqkJ3` and email `fmd147726@gmail.com`. Do not create a replacement account.

Preserve the legacy Normal Admin record keyed `-P6EIURxhvKTnOwy-8Ty`. That key is not verified as an Authentication UID. Sign in with the normal admin account to reveal its actual UID, verify that UID in Firebase Authentication, then add a matching allowlist/profile record. Map FAQs and Portfolio permissions as true, Pricing and Sections as false unless the owner explicitly changes them.

## Content migration
1. Do not overwrite `pages/general/about`, `pages`, `categories`, or `notifications`.
2. Review existing records in `siteContent`.
3. Create missing `portfolioCategories` and `faqCategories` through the Admin Panel. Legacy portfolio category references and FAQ category strings are projected into separate public categories for compatibility; source records are not rewritten.
4. Review the generated public content and SEO fields.
5. Use Admin Panel → Review & publish to create `publicContent`.
6. Confirm the public website renders from `publicContent`.

## Rollback
- Restore only the affected database paths from the pre-migration backup after reviewing them.
- Do not restore `admins` or `adminUids` from a website-content backup.
- Revert to the previous database rules if the new rules block owner access; retain the secure backup and have the owner verify the allowlist first.
- No live migration or rollback was performed during this development session.
