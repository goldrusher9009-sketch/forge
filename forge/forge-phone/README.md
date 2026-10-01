# Forge Phone Agent

Forge Phone Agent is a controlled internal Android candidate for executing bounded actions through Forge. Each real session is tied to the authenticated Owner's Agent Passport, permissions, selected application, and explicit execution budgets.

## Supported pilot boundary

- Android 11 or newer (`minSdk 30`).
- Planning-only mode is available when the native Android service is unavailable.
- Email/password sign-in verifies the actual account profile and Owner Passport before showing the task workspace.
- The Chinese workspace includes customer-reply, email-draft, and marketing-copy starting points. These are task prompts, not evidence of sending, publishing, leads, or earnings.
- Real execution requires a nonempty Android package allowlist and is limited to those packages.
- Every action except `wait` and `done` requires an individual Owner decision. Forge's bulk approval route cannot approve Phone actions.
- One user can have only one active Phone Agent session.
- Sessions are bounded to 5, 8, 10, or 12 steps and server-enforced token and cost budgets.
- A foreground-package change, expired or replayed authorization, native failure, rejection, cancellation, or restart stops execution safely.
- Before executing a reviewed action, the client captures the screen again and compares the exact JPEG bytes with the planning image. A changed screen records a not-executed result and stops. This conservative check can also reject dynamic pages, cursor changes, or status-bar updates; dynamic-page acceptance remains future work.
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

The client does not invent execution history or report success before Android returns a result. Access and rotating refresh credentials remain in the current app process only. Screenshots are used for the current planning request and are not persisted by Forge; audit history contains hashes and execution results rather than screenshots or reusable action payloads.

## Native account session

The client sends `X-Forge-Client: phone` and omits browser cookies. Login and body-token refresh return the rotating token pair in JSON without setting a cookie. Native login, refresh, and logout reject a refresh-cookie credential; native refresh cannot extract an HttpOnly browser token. Browser login and refresh keep the existing cookie contract and do not return refresh credentials in JSON.

Concurrent authentication failures share one refresh. A network failure or non-401 response is not automatically retried. Requests retain their original body, idempotency key, and cancellation signal. Logout clears local credentials immediately, and a late login or refresh cannot restore the old session. Failure to confirm remote revocation is shown explicitly. Each Phone run is also tied to its original account generation, so a late result cannot use a subsequently signed-in account's credentials.

After an app interruption or expired login, an unfinished server task can still exist. **查看未完成任务** reads only the current account's history. An active task blocks Start until the Owner explicitly ends it; the client verifies the same session ID and a known terminal status before clearing the card. It does not automatically cancel, resume, or execute the old task. Late history and cancellation responses cannot affect a different signed-in account.

## Application selection and action review

The app lists launchable applications through a scoped launcher-intent query, without `QUERY_ALL_PACKAGES`. Only the selected package is sent to Forge for the current real session. The Owner's Start button opens that app; individual action review brings Forge forward, and approval returns to the same selected app. These navigation operations are initiated by the Owner workflow and are not model tools. The client waits for the expected foreground package and rechecks the screenshot before invoking the authorized action. The native screenshot bridge also verifies the selected package before capture and when the asynchronous capture returns.

If Android prevents Forge from coming forward, the task waits and the Owner must return to Forge to review it. Stop dismisses the pending decision. A stopped task cannot overlap a new task while its outstanding native action is still draining. Actual late native receipts remain visible for the same account; logout removes that account's UI state and prevents reuse of new account credentials.

## Temporary managed free models (candidate)

The current candidate uses only available, platform-managed OpenRouter models with zero input and output token prices for Phone planning. Real screenshot planning also requires a model with verified image support. There is no automatic switch to a paid model or personal paid key. Free-model capacity, model availability, and provider rate limits can change; a missing eligible model or exhausted free quota can prevent the session from planning an action.

The client defaults to a session token budget of **1,200,000** and a cost budget of **$0**. These hosted free vision endpoints do not publish a verified image-token formula, so screenshot admission reserves the model's entire effective context, including output, instead of using a guessed image estimate. Only authoritative provider usage is accumulated after settlement; the context reservation is not a usage charge or a promise of free quota. Unresolved usage is shown as pending, with unknown totals left null. Real sessions require an explicit package allowlist, and every action other than wait or done requires individual approval.

The backend also defaults to **1,200,000 tokens / $0** and accepts token budgets up to **12,000,000**. The admission reservation checks whether the session can accommodate the request; successful settlement accumulates actual provider usage rather than charging the reserved context as usage.

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

Release candidates must use HTTPS. The main Android manifest disables cleartext traffic. The app requires a valid Forge account, an Owner-owned Agent Passport, and an available managed free model before a real session can be created. A zero prepaid balance or exhausted legacy token quota does not block the candidate's zero-price model route.

## Owner acceptance flow

1. Build and install the Android native application; Expo Go cannot load the Accessibility Service.
2. Set the Forge API URL for the selected environment before bundling.
3. Sign in with the Forge account's email and password. The app verifies the profile and Passport before continuing.
4. For planning-only validation, keep **先预览步骤** enabled. No native action can be authorized or executed.
5. For controlled execution, disable the preview switch, choose the application's label, enable Forge Phone Agent in **Settings -> Accessibility**, and prepare the target page. Tap **打开应用并开始**.
6. Review every proposed action. Approval applies only to that action and cannot be reused.
7. Stop the session immediately if the displayed target or action is not expected. A screenshot change after review stops the action and requires a fresh task and approval.

## Android release build

The historical container RC used `dockerproxy.net/mingc/android-build-box:1.27.0`. The current Windows validation reuses locally installed tools and uses Tencent for Gradle and Android SDK components, Aliyun for Maven, and npmmirror for npm. It does not require another large container download. Dependency versions remain unchanged. The Kotlin Gradle plugin is explicitly tied to the configured `1.9.23`; the app's ABI filters follow `reactNativeArchitectures` so a single-ABI native build cannot accidentally package incomplete extra ABIs.

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

The historical validation above predates the 2026-10-01 candidate changes. At the earlier isolated-compilation checkpoint on 2026-10-01, the corrected screenshot service was compiled using the existing local JDK 21.0.2, Kotlin 2.0.21 compiler, and real Android SDK 36 APIs. Only the external React Native event bridge used a temporary signature declaration. Android 11 and Android 14 platform sources confirm that hardware bitmap compression performs its own pixel readback, so no redundant software-bitmap copy was added.

That isolated service check alone did not establish a full application build. The subsequent complete 2026-10-01 `assembleRelease -PreactNativeArchitectures=arm64-v8a` build succeeded with Android SDK 34, build tools 34.0.0, Kotlin 1.9.23, NDK 26.1.10909125, JDK 17.0.2, and Gradle 8.8. All nine tracked client/native/build files had identical hashes before and after the final build. Actual APK inspection confirmed only ARM64 native libraries, including Expo modules core, Reanimated, and Hermes; the compiled manifest registers the Accessibility Service, scoped launcher queries, minSdk 30, and targetSdk 34. The compiled screenshot service passes display 0 (`Display.DEFAULT_DISPLAY`), and the compiled bridge accepts the expected package and rechecks it after asynchronous capture.

The resulting unsigned APK is 40,874,480 bytes, SHA256 `8E23A79AE72A7DD56DFDE3C5B763159458C1955C59B75945104D2C9B315C903E`. It explicitly bundles `https://localhost:3000` as the API for local compile validation; this endpoint does not connect the APK to an online environment. The manual unfinished-task recovery card is present in the Hermes bundle. APK verification passed 43 checks; the earlier 19 client checks are retained as historical evidence, separate from current component and backend checks.

No device was attached at the earlier `adb devices` checkpoint. No device or emulator was used for this full APK build. These candidate changes have not been verified on a physical device, installed as an APK, signed for production, or deployed. Client cancellation and request-identity behavior are checked with local mocked HTTP/native dependencies; those checks and the complete APK build do not establish physical-device acceptance.
