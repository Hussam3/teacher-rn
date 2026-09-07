# Google Play Release

## Release identity

- Package: `com.teacherbag`
- Version: `1.0.8` (`versionCode 8`)
- Minimum SDK: 24
- Compile and target SDK: 36
- AAB path: `android/app/build/outputs/bundle/release/app-release.aab`

Google Play requires new submissions to target API 36 beginning 31 August 2026. The normal `npm run bundle:android` command creates a Play-safe bundle: remote OTA JavaScript is disabled and the bundle packaged in the AAB is used.

## Required Before Building

1. Configure an upload key in the ignored local file `android/keystore.properties`, using `android/keystore.properties.example` as the field reference.
2. Do not use the Android debug keystore for a Play build. The Gradle configuration now fails explicitly if release signing is missing.
3. Ensure `com.teacherbag` is the final package identifier before the first Play upload. Package identifiers cannot be reused or changed for an existing Play app.
4. Rotate the Gemini API key that was previously embedded in the client and configure the replacement only as the `GEMINI_API_KEY` secret in Supabase.

## Build And Verify

```powershell
npm run bundle:android
& "C:\Program Files\Android\Android Studio\jbr\bin\jarsigner.exe" -verify -verbose -certs "android\app\build\outputs\bundle\release\app-release.aab"
```

Use `npm run bundle:android:ota` or `npm run apk:android:ota` only for a separately signed direct-distribution build. Never upload that output to Google Play.

## Supabase Deployment

The app links to `https://yqqedfjadgyktiohkuwg.supabase.co/functions/v1/legal`. Before creating a Play release, deploy the included migrations (including cloud sync and AI quota tables) and functions to that exact project:

```powershell
supabase login
supabase link --project-ref yqqedfjadgyktiohkuwg
supabase db push
supabase secrets set GEMINI_API_KEY=<rotated-key>
supabase functions deploy gemini delete-account --project-ref yqqedfjadgyktiohkuwg
supabase functions deploy legal --project-ref yqqedfjadgyktiohkuwg --no-verify-jwt
```

- `gemini` keeps the shared Gemini key on the server and enforces authenticated usage.
- `delete-account` deletes the signed-in Supabase account and cascade-linked cloud data.
- `legal` hosts the privacy policy and the public account-deletion request form required by Play.
- Review pending external requests in `public.account_deletion_requests` and complete verified requests within the policy's stated 30-day period.

## Direct OTA Publishing

`npm run ota:publish` is reserved for direct-distribution builds and requires
`SUPABASE_SERVICE_ROLE_KEY` in the local environment or ignored `.env` file.
The publishable key cannot publish OTA bundles or curriculum data. Never put a
service-role key in application code, source control, or a Play build.

For a native OTA fix, build and publish a separately signed APK with:

```powershell
npm run apk:android:ota:arm64
npm run ota:publish-apk -- --label arm64-v8a
```

Build and publish `apk:android:ota:armv7` as a fallback for older 32-bit phones. These APKs are for direct distribution only and must never be uploaded to Google Play.

## OAuth Production Setup

Before testing Google or Facebook login from the signed AAB:

1. In Supabase Authentication URL Configuration, allow `teacherbag://auth-callback`.
2. In each Google/Facebook provider configuration, register `https://yqqedfjadgyktiohkuwg.supabase.co/auth/v1/callback` as the OAuth callback URL.
3. Test the browser return path on a signed Android build, not only a debug build.

## Play Console Checklist

1. Create an Arabic app listing as an app, not a game, and enter the required support email.
2. Enable Play App Signing and upload the signed AAB.
3. Use `listing-ar.md` and `data-safety.md` as the store-listing and declaration drafts.
4. Complete Content Rating, Target Audience, Data Safety, App Access, and Ads declarations accurately.
5. Add at least two real device screenshots and a 512x512 Play icon. Do not use emulator placeholders.
6. If the developer account is personal and was created after 13 November 2023, complete a closed test with at least 12 opted-in testers for 14 continuous days before applying for production access.
7. Give reviewers a functioning Google or Facebook test account if they need authenticated features. Do not provide production credentials.

## Permission Summary

- `INTERNET`: Supabase, curriculum resources, and optional AI features.
- `POST_NOTIFICATIONS`: lesson reminder notifications.
- `RECORD_AUDIO`: optional speech-to-text only when the user starts dictation.
- `RECEIVE_BOOT_COMPLETED`, `VIBRATE`, `WAKE_LOCK`, and `ACCESS_NETWORK_STATE` are transitive support permissions needed for notifications or downloads.

The Play build removes unused legacy storage, foreground-service, notification-policy, Wi-Fi-state, and exact-alarm permissions. Lesson reminders use inexact `AlarmManager.set` scheduling to avoid the restricted exact-alarm declaration.
