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

## Temporary managed free models (candidate)

The current candidate uses only available, platform-managed OpenRouter models with zero input and output token prices for Phone planning. Real screenshot planning also requires a model with verified image support. There is no automatic switch to a paid model or personal paid key. Free-model capacity, model availability, and provider rate limits can change; a missing eligible model or exhausted free quota can prevent the session from planning an action.

The client defaults to a session token budget of **1,200,000** and a cost budget of **$0**. These hosted free vision endpoints do not publish a verified image-token formula, so screenshot admission reserves the model's entire effective context, including output, instead of using a guessed image estimate. Only authoritative provider usage is accumulated after settlement; the context reservation is not a usage charge or a promise of free quota. Unresolved usage is shown as pending, with unknown totals left null. Real sessions require an explicit package allowlist, and every action other than wait or done requires individual approval.

Each planning step sends `Idempotency-Key: phone:<sessionId>:<stepIndex>` and the same `request_id` in its body. A retry of that step must retain this identifier. Stop aborts the active planning HTTP request and requests server-session cancellation. The client checks whether the run is still active after asynchronous planning, approval, and authorization work before invoking Android. If an action was already handed to Android when Stop was pressed, its real completion or failure receipt is still sent; cancellation cannot undo an action already performed.

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

Release candidates must use HTTPS. The main Android manifest disables cleartext traffic. The app requires a valid Forge access token, an Owner-owned Agent Passport, and an available managed free model before a real session can be created. A zero prepaid balance or exhausted legacy token quota does not block the candidate's zero-price model route.

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

The historical validation above predates the 2026-10-01 candidate changes. For this candidate, the corrected screenshot service was compiled in isolation using the existing local JDK 21.0.2, Kotlin 2.0.21 compiler, and real Android SDK 36 APIs. Only the external React Native event bridge used a temporary signature declaration. Android 11 and Android 14 platform sources confirm that hardware bitmap compression performs its own pixel readback, so no redundant software-bitmap copy was added.

The isolated service check does not establish a full build with this application's configured Kotlin 1.9.23 and Android SDK 34. No device was attached when `adb devices` was checked. These candidate changes have not been verified on a physical device, installed as an APK, signed for production, or deployed. Client cancellation and request-identity behavior are checked with local mocked HTTP/native dependencies; that check is not physical-device acceptance.
