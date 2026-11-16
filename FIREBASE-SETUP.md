# Firebase setup — ScaleGrid

Project retained: `scalegrid-1c506`

Realtime Database: `https://scalegrid-1c506-default-rtdb.asia-southeast1.firebasedatabase.app`

## 1. Authentication
In Firebase Console → Authentication → Sign-in method, enable Google and Email/Password. Add these authorized domains:
- `fmd147726-crypto.github.io`
- `localhost` (local development)

The dashboard does not create Authentication users. Create the account in Firebase Authentication first, then approve the exact UID from the Super Admin dashboard.

## 2. Realtime Database
1. Export a fresh backup of the live database before changing rules.
2. Review `database.rules.json` and `SECURITY-RULES.md`.
3. Apply the rules in Realtime Database → Rules only after confirming the bootstrap account and migration state.
4. The public website reads `publicContent` only. Admin working records are in `siteContent`.
5. Do not import a snapshot at the database root. The JSON export in the original brief was not present in the files available for this build; inspect the live database and take a new export before migration.

## 3. Bootstrap the existing Super Admin
Existing identity supplied in the project brief:
- Email: `fmd147726@gmail.com`
- UID: `afaATJbCBLZzwVRNEyQwluEjqkJ3`
- Role: `super`

If the matching `admins/{uid}` and `adminUids/{uid}` records already exist in the live database, preserve them. If not, use Firebase Console after verifying the account exists in Authentication:
```json
{
  "adminUids": {
    "afaATJbCBLZzwVRNEyQwluEjqkJ3": true
  },
  "admins": {
    "afaATJbCBLZzwVRNEyQwluEjqkJ3": {
      "email": "fmd147726@gmail.com",
      "role": "super",
      "permissions": {
        "publishing": true,
        "settings": true
      }
    }
  }
}
```
This is a path-specific bootstrap patch example, not a root replacement. Do not paste it over existing records; merge only after inspecting the live values. Apply it with the Firebase Console JSON editor or an authenticated administrative workflow. Do not add service-account keys to either repository.

## 4. Normal Admin migration
The legacy key `-P6EIURxhvKTnOwy-8Ty` is not a verified Authentication UID. Keep its old `admins` profile and permission data untouched. The owner must sign in as `fmd541616@gmail.com`, obtain the actual Firebase Authentication UID from the pending-access screen, verify it in Authentication, and then create a separate `adminUids/{actualUid}` allowlist record plus a matching `admins/{actualUid}` profile. Do not copy the push-style key into `adminUids`.

Legacy permission intent supplied: FAQs=true, Portfolio=true, Pricing=false, Sections=false. Map these only after verifying the actual UID; do not grant broader permissions.

## 5. App Check and Storage
App Check support is documented but enforcement is not enabled by this static client. Register both GitHub Pages origins and configure the chosen provider before enabling enforcement. Firebase Storage uploads are intentionally not claimed as implemented. The CMS Media Library stores public HTTPS URLs and repository-relative paths only.

## 6. Verify
- Test sign-in for the existing Super Admin.
- Confirm a non-allowlisted account is rejected.
- Confirm private `siteContent` is denied to unauthenticated users.
- Confirm public `publicContent` reads work.
- Test rules in Firebase Emulator Suite before production rollout.

## Firebase CLI deployment (added setup)
Both repositories include `firebase.json`, `.firebaserc`, and the same `database.rules.json` file. From the repository directory, after installing Firebase CLI and signing in with an account that can deploy database rules:

```bash
firebase use scalegrid-1c506
firebase deploy --only database
```

Deploy the rules from only one repository; the rules are identical in both. Before deployment, export the live database and verify that the existing Super Admin UID is allowlisted. Do not deploy rules before bootstrap verification.

The `firebase-seed/` directory is included in the Admin Panel repository. Follow its README. Never import a root-level seed over the live database.
