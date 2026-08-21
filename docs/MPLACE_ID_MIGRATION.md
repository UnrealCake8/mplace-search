# MPlace ID migration

MPlace Search now treats the Firebase project `mplace-id` as the shared identity authority for the MPlace product family.

## Deployment

Set the `NEXT_PUBLIC_FIREBASE_*` variables from `.env.example` in Vercel.

The Search server also uses Firebase Admin session cookies. Replace `FIREBASE_CLIENT_EMAIL` and `FIREBASE_PRIVATE_KEY` with credentials from a service account belonging to the **mplace-id** Firebase project. `FIREBASE_PROJECT_ID` must be `mplace-id`.

Do not reuse the old MPlace Search Firebase Admin credentials after switching the browser config.

## Supabase-backed products

MPlace Pages and MVideo use the same Firebase ID token with Supabase Third-Party Auth. In each Supabase project, enable **Authentication → Third-Party Auth → Firebase** and enter Firebase project ID `mplace-id`.
