# Deployment checklist

## Repositories
- User: `ScaleGrid-User-Site`
- Admin: `ScaleGrid-Admin-Panel`

Expected GitHub Pages URLs:
- `https://fmd147726-crypto.github.io/ScaleGrid-User-Site/`
- `https://fmd147726-crypto.github.io/ScaleGrid-Admin-Panel/`

## Publish
1. Create/retain each repository with the exact name above.
2. Upload the contents of the corresponding ZIP to the repository root.
3. Enable GitHub Pages from the `main` branch and `/ (root)`.
4. Confirm `index.html` is at the repository root.
5. Add `fmd147726-crypto.github.io` and `localhost` to Firebase Authentication authorized domains.
6. Review and apply the matching `database.rules.json` only after the live backup and admin bootstrap checks.
7. Sign in to the Admin Panel, install starter content only if appropriate, review content, then publish.
8. Verify public content and all links from the deployed User Site.

## Static hosting notes
GitHub Pages serves static files. The public website loads Firebase content in the browser; search engines may not receive fully rendered dynamic page content from the initial HTML. Page metadata is updated client-side. For robust server-rendered SEO, prerender pages at build time or use a rendering service. Hash-based custom page URLs are not ideal canonical URLs; configure canonical URLs explicitly when needed.

## Not yet done
No repository was pushed, no GitHub Pages deployment was performed, no Firebase rules were applied, and no live content was changed during this build.


## Realtime Database rules deployment
The repository includes `firebase.json`, `.firebaserc`, and `database.rules.json` for `scalegrid-1c506`. Verify the Super Admin allowlist/profile and export live data before deploying. From either repository (only once): `firebase use scalegrid-1c506` then `firebase deploy --only database`. Do not deploy rules before confirming that the existing Super Admin is allowlisted.
