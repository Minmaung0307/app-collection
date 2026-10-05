# MMUSA App Studio

Two independent applications, extracted from the uploaded `24.zip`.

- **registry/** — redesigned, responsive app portfolio and project registry.
- **re-member/** — original Re-Member application, with its root route dedicated to Re-Member. The portfolio component and hostname-dependent routing have been removed.

## Run the registry

Install Node.js 22.12 or newer, open a terminal in `registry`, then:

```sh
npm ci
npm run dev
```

Open the local address shown in the terminal. For a production build, run `npm run build`; serve `dist/` using `npm run preview` or a static host. Do not open `index.html` directly from disk.

The registry works immediately without Firebase setup. It starts with all **16 original app records** and their original descriptions, links, images, free/paid flags and dates. Existing lifecycle statuses were not supplied, so they start as **Unreviewed**. No repositories, accounts, emails, roles or user counts have been invented. Daily Scheduler remains listed but is explicitly identified as a feature within Re-Member.

## Manage apps

Choose **Manage apps → Add a new app**. The editor has three sections:

1. App details: name, description, launch URL, category, status, pricing, date and featured flag.
2. Artwork: optional uploaded JPG/PNG/WebP, image URL, or automatic icon/gradient artwork with an adjustable accent. Images are resized locally; missing and broken images fall back automatically.
3. Project management: repository/GitHub URL, Firebase project ID, account label, email, roles, users/audience and notes.

Search, category/status filtering, sorting, gallery/list views and saved apps are available. Export creates a JSON backup including private metadata; import merges by ID, validates the entire file first, and asks before updating matching records. Removing a record does not delete its deployed app or service accounts.

**Local mode** stores records in this browser and origin only. It has no authentication and is intended for personal use. Clearing browser data removes local edits; export backups regularly. Moving to a different port or device uses a different browser store. Do not store passwords, API secrets or recovery codes in project metadata. Exported files include private information.

## Optional cloud mode with owner authentication

Use a **separate Firebase project**, not the existing Re-Member project. The registry does not connect to or modify Re-Member's database.

1. Create the registry Firebase project and a Web app. Enable Firestore and Google sign-in. Add your deployment domain (and localhost for development) to Authentication authorized domains.
2. Copy `.env.example` to `.env.local` inside `registry`; fill in the four Web app configuration values. These Firebase client configuration values are not admin credentials.
3. Sign in via Manage apps, then open Setup to see your Firebase UID. Set it as `VITE_ADMIN_UID`, and replace `REPLACE_WITH_OWNER_UID` in `firestore.rules` with the same UID.
4. Deploy the registry's rules to this new project with `firebase deploy --only firestore:rules --project YOUR_REGISTRY_PROJECT_ID`. Until configured, the supplied rules deny all writes and private reads.
5. Restart the development server or rebuild. Sign in as the owner. Choose **Setup → Import original apps** or import your exported local backup. The empty cloud collection is intentionally not automatically seeded.
6. Build and deploy with `npm run build` and `firebase deploy --only hosting --project YOUR_REGISTRY_PROJECT_ID`.

Public metadata is stored in `apps`; admin-only metadata is stored in `appPrivate`. Private fields are not fetched for visitors. Firestore rules enforce owner-only edits and private reads. Public and private writes are batched together. Cloud imports are limited to 200 records per file. Uploaded images are compressed into the app record, with an encoded limit below Firestore's document limit; no Storage setup is needed. Public images and descriptions are, by design, public.

Keep the owner UID in the client and rules in sync. Client-side admin controls are convenience UI; deployed Firestore rules provide authorization. Firebase sign-in and production rules require configuration and were not exercised against your live services. No deployment has been performed.

## Re-Member

Inside `re-member`, run `npm ci` then `npm start`; `npm run build` creates its original production build. Its existing Firebase configuration, screens, scheduler, family features and application logic are preserved. Its root now always opens the original `FamilyVault` component, which is the uploaded Re-Member implementation despite that internal filename. Existing `/family/*` URLs continue to resolve to this same app.

The original Firebase rules are preserved for compatibility, but they permit any authenticated user to read/write broadly; they are not the new registry rules. This redesign does not claim to audit or change Re-Member's existing security model. Deploy the two projects separately; use `remember.mmusa.org` for Re-Member and a separate domain for the registry.

## Validation

`cd registry && npm test` validates migration, metadata separation, safe URLs, optional images and malformed backups. `npm run build` builds the registry. See `VALIDATION.md` for the executed UI checks and limitations.

### Repeat browser checks

Start the registry with `npm run dev` in one terminal. In another terminal in `registry`, run `npx playwright install chromium` once, then `npm run test:ui`. If Chrome is already installed, use `BROWSER_CHANNEL=chrome npm run test:ui` instead. The tests create an isolated browser session and exercise CRUD, image upload/fallback, local persistence, backups and narrow layouts. `TEST_URL` can override the default `http://127.0.0.1:5173`. Screenshots are written to `tests/screenshots/`.
