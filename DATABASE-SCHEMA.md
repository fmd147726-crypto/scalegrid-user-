# Database schema

## Private working content
`siteContent/{collection}` is editable working data. Only allowlisted administrators can read it.

- `siteContent/settings`
- `siteContent/navigation`
- `siteContent/serviceCategories`
- `siteContent/services`
- `siteContent/portfolioCategories`
- `siteContent/portfolio`
- `siteContent/faqCategories`
- `siteContent/faqs`
- `siteContent/pages/{pageId}`
- `siteContent/pages/{pageId}/sections/{sectionId}`
- `siteContent/process`
- `siteContent/features`
- `siteContent/socialLinks`
- `siteContent/media`

Content records may have `enabled`, `status` (`draft`, `published`, `archived`), and `order`. Existing records without `status` remain publishable when enabled for compatibility.

FAQ records may include `serviceCategoryIds` (an array of service-category IDs) and `showOnHome` (a boolean). A question appears on a service page only when that page ID is assigned. It appears in the homepage FAQ section unless `showOnHome` is `false`. Existing single-value `serviceCategoryId` records are normalized to the array format during publishing for backwards compatibility.

## Public projection
`publicContent` is the only new content path read by the public website. It is created by the Admin Panel's Publish action. Draft, archived, hidden, disabled-category, unpublished-page, and unpublished-section records are omitted. Settings are allowlisted before projection so unknown private settings are not copied.

`publicContent/_meta` contains `revision`, `publishedAt`, `publishedBy`, and `source`. A complete projection is written as one database operation, so readers see the previous or new projection rather than a partially copied collection.

The publishing action runs in the authenticated browser. It is not a trusted Cloud Function; strict concurrency locking and tamper-proof publisher attribution require a server-side function and are not claimed here.

## Access control
- `adminUids/{uid}` — boolean allowlist.
- `admins/{uid}` — email, role, and permissions.
- `adminActivity/{pushId}` — client-generated activity records.
- `siteContentHistory/{collection}/{recordId}/{versionId}` — pre-edit/pre-delete snapshots.

## Legacy paths preserved
- `pages/general/about`
- `pages`
- `categories`
- `notifications`

The new application does not rename or delete these paths. Legacy notifications remain separately readable by the public site. Existing legacy FAQ strings and portfolio category links are adapted in the public projection without rewriting the working records.

## Backup format
JSON object:
- `format`: `scalegrid-content-backup`
- `schemaVersion`: `1`
- `projectId`: `scalegrid-1c506`
- `createdAt`, `createdBy`
- `content`: selected website content collections

Administrator records, UID allowlists, audit history, and private credentials are excluded.
