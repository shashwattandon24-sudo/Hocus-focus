# Hocus Focus — Android APK project

This is an Android WebView wrapper around the Hocus Focus app found in the uploaded Word document. It includes a native Android speech recognition bridge, Android notification permissions and scheduled reminder notifications, an image picker, and bundled app icons.

## Fastest way to make an APK (no Android Studio)

1. Create an empty **GitHub repository** (e.g. `hocus-focus-android`).
2. Upload **all files and folders from this project** to the root of the repository (including the `.github` folder). **Do not upload the ZIP alone.** You can alternatively `git init && git add . && git commit -m 'Initial app' && git push`.
3. Open **Actions** → **Build Android APK** → **Run workflow**. (On the first upload, the workflow also runs if your repository's default branch is named `main`.)
4. When the workflow succeeds, click the run → **Artifacts** → **HocusFocus-debug-APK**. Download the zip, extract `app-debug.apk`, then install it on your Samsung phone.

## Android Studio route

Open the project directory in Android Studio, allow Android Gradle Plugin 8.7.3, Gradle 8.9, and Android SDK API 35 to download, then choose **Build → Build Bundle(s) / APK(s) → Build APK(s)**. The debug APK is created at `app/build/outputs/apk/debug/app-debug.apk`.

## What works

- Hocus Focus dashboard, onboarding, focus/task list, daily wins, smart rule-based sorting, dates, language selection, photo, local storage.
- Voice capture uses Android's on-device speech recognition service via native bridge. Google/Samsung speech service availability and recognition/network requirements vary by phone.
- Reminders use Android alarm scheduling even when the app is closed or the phone reboots, after notification permission is granted in app settings.
- All essential icon glyphs are bundled, so the UI can work without icon-CDN access.

## Important limitations

- The reminders are **inexact**; Android battery optimisation/Doze may delay delivery. They are not guaranteed second-accurate alarms.
- Text parsing is a heuristic/rules engine, **not** an LLM. It supports a limited set of relative-date phrases. Check times before relying on them.
- Records are in Android WebView `localStorage`, not cloud-synced; uninstalling or clearing app data permanently removes them. The current app has no export or backup function.
- Only **time-specific** items schedule notifications. Snoozing the 'Now' card hides it for an hour in the dashboard, but does not reschedule a notification.
- Depends on the device WebView and installed speech recognition service; some settings/features should be validated on a real phone.
- Build output is a debug-signed APK for personal testing. A production Play Store release requires separate signing, privacy disclosures and additional QA.

## Android compatibility

- `minSdk 26` = Android 8.0 and later.
- `targetSdk 35` = Android 15 target, installable on newer Android versions, including Android 16 subject to device policy.
- Portrait orientation, dark charcoal/amber visuals, name **Hocus Focus**.

## Privacy

- Tasks and photos stay inside app storage under normal operation.
- Voice capture uses the phone's configured Android speech recognition provider and **may require internet or transmit audio to that provider**. The APK does not add a separate analytics/backend server.
- Online Google Fonts are optional; system fonts are used as fallback.
