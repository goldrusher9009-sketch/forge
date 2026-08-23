# Forge Phone Agent

Forge Phone Agent is a controlled internal Android pilot for executing bounded actions through Forge. It is not an unrestricted phone-control product. Each real session is tied to the authenticated Owner's Agent Passport, subscription, permissions, package allowlist, and explicit execution budgets.

## Supported pilot boundary

- Android 11 or newer (`minSdk 30`).
- Planning-only mode is available when the native Android service is unavailable.
- Real execution is limited to Android packages explicitly allowlisted for that session.
- Every executable pilot action requires an individual Owner decision. Forge's bulk approval route cannot approve Phone actions.
- One user can have only one active Phone Agent session.
- Sessions are bounded to 5, 8, 10, or 12 steps and server-enforced token and cost budgets.
- A foreground-package change, expired or replayed authorization, native failure, rejection, cancellation, or restart stops execution safely.
- Banking, payment, authentication, security settings, and other high-risk applications are outside the internal pilot scope.

## Execution lifecycle

```text
Owner starts a bounded session
  -> Android captures the current screenshot and foreground package
  -> Forge plans one schema-validated action
  -> Owner sees and approves or rejects that exact action
  -> Forge issues a short-lived, one-time authorization
  -> Android rechecks the foreground package and executes the authorized payload
  -> Android returns a structured native receipt
  -> Forge records the evidence and either plans the next step or stops
```

The client does not invent execution history or report success before Android returns a result. The authentication token remains in the current app process only. Screenshots are used for the current planning request and are not persisted by Forge; audit history contains hashes and execution results rather than screenshots or reusable action payloads.

## Accessibility disclosure

The native pilot uses an Android Accessibility Service to observe foreground-window changes, capture the current screen after the Owner starts a session, and perform an individually approved gesture or text action. The service can read visible screen content while enabled. Owners must enable it manually in Android Settings and can disable it at any time. The implementation is intended for controlled internal acceptance only; public distribution requires final policy, consent, privacy, data-retention, and store-review approval.

## Configuration

`EXPO_PUBLIC_FORGE_API_URL` is required at bundle time. No Railway, Vercel, production, or local fallback endpoint is compiled automatically.

```dotenv
# Android emulator development
EXPO_PUBLIC_FORGE_API_URL=http://10.0.2.2:3000

# Release candidate example; select the actual environment explicitly
EXPO_PUBLIC_FORGE_API_URL=https://forge-staging.example.com
```

Release candidates must use HTTPS. The main Android manifest disables cleartext traffic. The app requires a valid Forge access token, an active subscription with remaining usage, and an Owner-owned Agent Passport before a real session can be created.

## Owner acceptance flow

1. Build and install the Android native application; Expo Go cannot load the Accessibility Service.
2. Set the Forge API URL for the selected environment before bundling.
3. Sign in to Forge and enter the short-lived access token for the current app session.
4. For planning-only validation, keep **Planning only** enabled. No native action can be authorized or executed.
5. For controlled execution, enter the exact Android package allowlist, enable Forge Phone Agent in **Settings -> Accessibility**, and foreground one of the allowed apps.
6. Review every proposed action. Approval applies only to that action and cannot be reused.
7. Stop the session immediately if the displayed target, action, or package is not expected.

## Android release build

The validated local RC uses the pinned China-accessible image `dockerproxy.net/mingc/android-build-box:1.27.0`, Gradle from the Tencent mirror, Maven from Aliyun mirrors, and Android NDK `26.1.10909125` from the Tencent Android SDK mirror. Dependency versions must remain unchanged.

The native Release task is:

```bash
cd android
./gradlew assembleRelease
```

Without external signing variables, this intentionally produces an unsigned validation APK. Production signing material must stay outside the repository and is read only from:

```text
FORGE_ANDROID_KEYSTORE_PATH
FORGE_ANDROID_KEYSTORE_PASSWORD
FORGE_ANDROID_KEY_ALIAS
FORGE_ANDROID_KEY_PASSWORD
```

Never commit a keystore, signing password, `.env`, generated APK, `node_modules`, Gradle cache, or build output.

## Current release boundary

The Android Release build, manifest, Accessibility Service registration, native compilation, and backend Phone Agent regression have been validated locally. Physical-device acceptance, production signing, public-store policy approval, production configuration, and live rollout remain separate release gates.
