package com.forge.phoneagent

import android.accessibilityservice.AccessibilityService

import android.content.Intent
import android.os.SystemClock
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.modules.core.DeviceEventManagerModule
import kotlinx.coroutines.CompletableDeferred
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlinx.coroutines.withTimeoutOrNull
import org.json.JSONObject
import java.util.UUID
import java.util.concurrent.atomic.AtomicLong
import java.util.concurrent.atomic.AtomicReference

/** React Native bridge for one bounded, server-authorized phone action. */
class ForgeModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    companion object {
        private var moduleInstance: ForgeModule? = null

        fun sendEvent(name: String, data: Map<String, Any?>?) {
            moduleInstance?.reactContext
                ?.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                ?.emit(name, data?.let { Arguments.makeNativeMap(it) })
        }
    }

    private val moduleScope = CoroutineScope(SupervisorJob() + Dispatchers.Main.immediate)
    private val executionLock = Any()
    private val executionEpoch = AtomicLong()
    private val pendingExecution = AtomicReference<String?>(null)
    private data class ReviewTicket(
        val id: String,
        val screen: ForgeAccessibilityService.CapturedScreen,
        val createdAt: Long,
        val epoch: Long,
    )
    @Volatile private var reviewTicket: ReviewTicket? = null
    @Volatile private var reviewComparison: JSONObject? = null

    init {
        moduleInstance = this
    }

    override fun getName() = "ForgeAccessibility"

    override fun invalidate() {
        cancelPendingActions()
        if (moduleInstance === this) moduleInstance = null
        moduleScope.cancel()
        super.invalidate()
    }

    @ReactMethod
    fun isAccessibilityEnabled(promise: Promise) {
        promise.resolve(ForgeAccessibilityService.instance != null)
    }

    @ReactMethod
    fun getCurrentPackage(promise: Promise) {
        val service = ForgeAccessibilityService.instance
        if (service == null) {
            promise.reject("NO_SERVICE", "Accessibility service not running")
            return
        }
        promise.resolve(service.currentPackageName())
    }

    @ReactMethod
    fun getReviewWindowDiagnostics(promise: Promise) {
        if (!BuildConfig.DEBUG) { promise.reject("UNAVAILABLE", "Debug diagnostics are unavailable"); return }
        moduleScope.launch {
            val service = ForgeAccessibilityService.instance
            if (service == null) promise.reject("NO_SERVICE", "Accessibility service not running")
            else promise.resolve(JSONObject(service.getReviewWindowDiagnostics()).apply {
                put("executionReview", reviewComparison ?: JSONObject.NULL)
            }.toString())
        }
    }

    // Only invalidates local work; no UI or network work on this synchronous call.
    @ReactMethod(isBlockingSynchronousMethod = true)
    fun cancelPendingActions() {
        pendingExecution.set(null)
        executionEpoch.incrementAndGet()
        reviewTicket = null
    }

    @ReactMethod
    fun listLaunchableApps(promise: Promise) {
        try {
            val manager = reactContext.packageManager
            val intent = Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_LAUNCHER)
            val apps = manager.queryIntentActivities(intent, 0)
                .filter { it.activityInfo.packageName != reactContext.packageName }
                .distinctBy { it.activityInfo.packageName }
                .sortedBy { it.loadLabel(manager).toString().lowercase() }
            val result = Arguments.createArray()
            apps.forEach { app -> result.pushMap(Arguments.createMap().apply {
                putString("packageName", app.activityInfo.packageName)
                putString("label", app.loadLabel(manager).toString())
            }) }
            promise.resolve(result)
        } catch (_: Exception) {
            promise.reject("APP_LIST_UNAVAILABLE", "Could not list launchable apps")
        }
    }

    // Owner navigation only: the model cannot request an application launch.
    @ReactMethod
    fun openApp(packageName: String, promise: Promise) {
        if (!packageName.matches(Regex("^[A-Za-z0-9_.]{3,200}$"))) {
            promise.reject("APP_UNAVAILABLE", "Invalid application")
            return
        }
        openPackage(packageName, promise)
    }

    @ReactMethod
    fun openReview(promise: Promise) = openPackage(reactContext.packageName, promise)

    @ReactMethod
    fun returnToApp(packageName: String, promise: Promise) {
        val epoch = executionEpoch.get()
        moduleScope.launch {
            if (epoch != executionEpoch.get()) {
                promise.reject("PHONE_SESSION_STOPPED", "PHONE_SESSION_STOPPED")
                return@launch
            }
            if (ForgeAccessibilityService.instance?.currentPackageName() != reactContext.packageName ||
                epoch != executionEpoch.get() || currentActivity?.moveTaskToBack(true) != true) {
                promise.reject("PACKAGE_CHANGED", "PHONE_PACKAGE_CHANGED")
                return@launch
            }
            // Resume the task that was reviewed; a launcher intent can reset its page.
            val ready = withTimeoutOrNull(10_000) {
                while (epoch == executionEpoch.get()) {
                    val observed = ForgeAccessibilityService.instance?.currentPackageName().orEmpty()
                    if (observed.isNotBlank() && observed != reactContext.packageName) break
                    delay(100)
                }
                if (epoch != executionEpoch.get() || ForgeAccessibilityService.instance?.currentPackageName() != packageName) false
                else {
                    delay(500)
                    epoch == executionEpoch.get() && ForgeAccessibilityService.instance?.currentPackageName() == packageName
                }
            }
            if (ready == true) promise.resolve(true)
            else promise.reject("PACKAGE_CHANGED", "PHONE_PACKAGE_CHANGED")
        }
    }

    private fun openPackage(packageName: String, promise: Promise) {
        try {
            val intent = reactContext.packageManager.getLaunchIntentForPackage(packageName)
                ?: throw IllegalArgumentException("Application has no launcher")
            intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP
            (ForgeAccessibilityService.instance ?: reactContext).startActivity(intent)
            if (ForgeAccessibilityService.instance == null) {
                promise.resolve(true)
                return
            }
            // JS timers pause while another application is foreground.
            moduleScope.launch {
                val ready = withTimeoutOrNull(10_000) {
                    while (ForgeAccessibilityService.instance?.currentPackageName() != packageName) delay(200)
                    // The foreground package can arrive before its final transition frame.
                    delay(500)
                    ForgeAccessibilityService.instance?.currentPackageName() == packageName
                }
                if (ready == true) promise.resolve(true)
                else promise.reject("PACKAGE_CHANGED", "PHONE_PACKAGE_CHANGED")
            }
        } catch (_: Exception) {
            promise.reject("APP_UNAVAILABLE", "Could not open the application")
        }
    }

    @ReactMethod
    fun captureScreen(expectedPackage: String, promise: Promise) {
        val service = ForgeAccessibilityService.instance
        if (service == null) {
            promise.reject("NO_SERVICE", "Accessibility service not running")
            return
        }
        if (expectedPackage.isBlank() || service.currentPackageName() != expectedPackage) {
            promise.reject("PACKAGE_CHANGED", "PHONE_PACKAGE_CHANGED")
            return
        }
        val epoch = executionEpoch.get()
        moduleScope.launch {
            val screen = captureStableReviewedScreen(service, expectedPackage, epoch)
            synchronized(executionLock) {
                reviewTicket = null
                if (epoch != executionEpoch.get()) promise.reject("PHONE_SESSION_STOPPED", "PHONE_SESSION_STOPPED")
                else if (service.currentPackageName() != expectedPackage) promise.reject("PHONE_PACKAGE_CHANGED", "PHONE_PACKAGE_CHANGED")
                else if (screen == null) promise.reject("PHONE_SCREENSHOT_REQUIRED", "PHONE_SCREENSHOT_REQUIRED")
                else {
                    val ticket = ReviewTicket(UUID.randomUUID().toString(), screen, SystemClock.elapsedRealtime(), epoch)
                    reviewTicket = ticket
                    promise.resolve(Arguments.createMap().apply {
                        putString("screenshot", screen.screenshot)
                        putString("captureId", ticket.id)
                        putInt("width", screen.width)
                        putInt("height", screen.height)
                        putString("captureMode", screen.captureMode)
                        if (BuildConfig.DEBUG) {
                            putString("reviewRevision", screen.revision)
                            putString("structureRevision", screen.structureRevision)
                            putInt("windowId", screen.windowId)
                            putString("displayPixelHash", screen.debugDisplayHash)
                            putString("appSurfacePixelHash", screen.debugAppSurfaceHash)
                            putString("ignoredSystemBars", screen.debugIgnoredRegions.joinToString("|") { it.flattenToString() })
                        }
                    })
                }
            }
        }
    }

    private suspend fun captureStableReviewedScreen(
        service: ForgeAccessibilityService, expectedPackage: String, epoch: Long,
    ): ForgeAccessibilityService.CapturedScreen? {
        val deadline = SystemClock.elapsedRealtime() + 10_000
        return withTimeoutOrNull(10_000) {
            var previous: ForgeAccessibilityService.CapturedScreen? = null
            var retriedInternalError = false
            repeat(3) { attempt ->
                if (epoch != executionEpoch.get() || service.currentPackageName() != expectedPackage ||
                    SystemClock.elapsedRealtime() >= deadline) return@withTimeoutOrNull null
                var retryableFailure = false
                var internalError = false
                val captured = CompletableDeferred<ForgeAccessibilityService.CapturedScreen?>()
                service.captureReviewedScreen(expectedPackage, { code ->
                    retryableFailure = true
                    internalError = code == AccessibilityService.ERROR_TAKE_SCREENSHOT_INTERNAL_ERROR
                }) {
                    if (!captured.isCompleted) captured.complete(it)
                }
                val screen = captured.await()
                if (epoch != executionEpoch.get() || service.currentPackageName() != expectedPackage ||
                    SystemClock.elapsedRealtime() >= deadline) return@withTimeoutOrNull null
                if (screen == null) {
                    if (!retryableFailure || (internalError && retriedInternalError)) return@withTimeoutOrNull null
                    if (internalError) retriedInternalError = true
                    previous = null
                } else {
                    if (previous?.revision == screen.revision) return@withTimeoutOrNull screen
                    previous = screen
                }
                if (attempt < 2) delay(500)
            }
            null
        }
    }

    @ReactMethod
    fun performAction(actionJson: String, expectedPackage: String, captureId: String, promise: Promise) {
        if (BuildConfig.DEBUG) reviewComparison = null
        val service = ForgeAccessibilityService.instance
        if (service == null) {
            promise.reject("NO_SERVICE", "Accessibility service not running")
            return
        }

        val packageBefore = service.currentPackageName()
        if (expectedPackage.isBlank() || packageBefore != expectedPackage) {
            promise.reject("PACKAGE_CHANGED", "Expected $expectedPackage but foreground package is $packageBefore")
            return
        }

        val payload = try {
            JSONObject(actionJson)
        } catch (_: Exception) {
            promise.reject("ACTION_INVALID", "Action payload is not valid JSON")
            return
        }
        val action = payload.optString("action", "")
        val args = payload.optJSONObject("args") ?: JSONObject()
        val validationError = validateAction(action, args)
        if (validationError != null) {
            promise.reject("ACTION_INVALID", validationError)
            return
        }

        val ticket = synchronized(executionLock) {
            val saved = reviewTicket
            reviewTicket = null
            saved?.takeIf { it.id == captureId && it.screen.packageName == expectedPackage &&
                it.epoch == executionEpoch.get() && SystemClock.elapsedRealtime() - it.createdAt <= 15 * 60_000 }
        }
        if (ticket == null) {
            notExecuted(promise, expectedPackage, "PHONE_ACTION_CAPTURE_REQUIRED")
            return
        }
        pendingExecution.set(ticket.id)

        moduleScope.launch {
            if (service.currentPackageName() != expectedPackage) {
                promise.resolve(Arguments.createMap().apply {
                    putBoolean("executed", false)
                    putBoolean("success", false)
                    putString("currentPackage", expectedPackage)
                    putString("observedPackageAfter", service.currentPackageName())
                    putString("error", "PHONE_PACKAGE_CHANGED")
                })
                return@launch
            }
            if (action !in setOf("wait", "done")) {
                val current = captureStableReviewedScreen(service, expectedPackage, ticket.epoch)
                if (ticket.epoch != executionEpoch.get()) {
                    notExecuted(promise, expectedPackage, "PHONE_SESSION_STOPPED")
                    return@launch
                }
                val captureMatches = current != null && current.revision == ticket.screen.revision
                val structureMatches = if (captureMatches) service.isReviewedStructureCurrent(ticket.screen) else null
                if (BuildConfig.DEBUG) reviewComparison = JSONObject().apply {
                    put("stage", "preflight_capture_compare")
                    put("capturePresent", current != null); put("revisionMatches", captureMatches)
                    put("liveStructureMatches", structureMatches ?: JSONObject.NULL)
                    fun frame(screen: ForgeAccessibilityService.CapturedScreen?): JSONObject? = screen?.let {
                        JSONObject().apply {
                            put("revision", it.revision); put("structureRevision", it.structureRevision)
                            put("displayPixelHash", it.debugDisplayHash ?: JSONObject.NULL)
                            put("appSurfacePixelHash", it.debugAppSurfaceHash ?: JSONObject.NULL)
                            put("captureMode", it.captureMode); put("windowId", it.windowId)
                            put("width", it.width); put("height", it.height)
                            put("ignoredSystemBars", it.debugIgnoredRegions.joinToString("|") { region -> region.flattenToString() })
                        }
                    }
                    put("reviewed", frame(ticket.screen)); put("current", frame(current) ?: JSONObject.NULL)
                }
                if (!captureMatches || structureMatches != true) {
                    notExecuted(promise, expectedPackage, "PHONE_SCREEN_CHANGED")
                    return@launch
                }
                if (!service.allowedInReviewedScreen(action, args, ticket.screen)) {
                    notExecuted(promise, expectedPackage, "PHONE_ACTION_TARGET_BLOCKED")
                    return@launch
                }
            }
            var dispatched = false
            fun dispatchNative(start: () -> Boolean): Boolean = synchronized(executionLock) {
                if (ticket.epoch != executionEpoch.get()) throw IllegalStateException("PHONE_SESSION_STOPPED")
                if (service.currentPackageName() != expectedPackage ||
                    (action !in setOf("wait", "done") && !service.isReviewedStructureCurrent(ticket.screen))) {
                    throw IllegalStateException("PHONE_SCREEN_CHANGED")
                }
                // Stop and dispatch compete for this single native handoff.
                if (ticket.epoch != executionEpoch.get() || !pendingExecution.compareAndSet(ticket.id, null)) {
                    throw IllegalStateException("PHONE_SESSION_STOPPED")
                }
                start().also { dispatched = it }
            }
            val success = try {
                when (action) {
                    "tap" -> awaitGesture(2_000) { callback -> dispatchNative { service.tap(args.getInt("x"), args.getInt("y"), callback) } }
                    "long_press" -> awaitGesture(3_000) { callback -> dispatchNative { service.longPress(args.getInt("x"), args.getInt("y"), callback) } }
                    "swipe" -> awaitGesture(2_000) { callback -> dispatchNative { service.swipe(args.getString("direction"), callback) } }
                    "scroll" -> awaitGesture(2_000) { callback ->
                        // Scroll names describe the content to reveal; gestures describe finger movement.
                        val direction = when (args.getString("direction")) {
                            "up" -> "down"
                            "down" -> "up"
                            "left" -> "right"
                            "right" -> "left"
                            else -> throw IllegalArgumentException("Unsupported scroll direction")
                        }
                        dispatchNative { service.swipe(direction, callback) }
                    }
                    "type" -> dispatchNative { service.typeText(args.getString("text"), expectedPackage) }
                    "back" -> dispatchNative { service.goBack() }
                    "home" -> dispatchNative { service.goHome() }
                    "wait" -> {
                        dispatchNative { true }
                        delay(args.getLong("ms"))
                        true
                    }
                    "done" -> dispatchNative { true }
                    else -> false
                }
            } catch (error: Exception) {
                if (!dispatched) {
                    notExecuted(promise, expectedPackage, error.message ?: "PHONE_NATIVE_ACTION_FAILED")
                    return@launch
                }
                false
            }
            if (!dispatched) {
                notExecuted(promise, expectedPackage, "PHONE_NATIVE_ACTION_NOT_DISPATCHED")
                return@launch
            }

            // Let the target settle without a paused background JS timer.
            delay(500)
            val result = Arguments.createMap().apply {
                putBoolean("executed", true)
                putBoolean("success", success)
                putString("currentPackage", packageBefore)
                putString("observedPackageAfter", service.currentPackageName())
                if (!success) putString("error", if (service.currentPackageName() != expectedPackage) "PHONE_PACKAGE_CHANGED" else "PHONE_NATIVE_ACTION_FAILED")
            }
            promise.resolve(result)
        }
    }

    private fun notExecuted(promise: Promise, expectedPackage: String, error: String) {
        promise.resolve(Arguments.createMap().apply {
            putBoolean("executed", false)
            putBoolean("success", false)
            putString("currentPackage", expectedPackage)
            putString("error", error)
        })
    }

    private suspend fun awaitGesture(
        timeoutMs: Long,
        start: ((Boolean) -> Unit) -> Boolean,
    ): Boolean {
        val result = CompletableDeferred<Boolean>()
        if (!start { success -> if (!result.isCompleted) result.complete(success) }) return false
        return withTimeoutOrNull(timeoutMs) { result.await() } ?: false
    }

    private fun validateAction(action: String, args: JSONObject): String? {
        fun keysAllowed(vararg names: String): Boolean {
            val allowed = names.toSet()
            val keys = args.keys()
            while (keys.hasNext()) if (keys.next() !in allowed) return false
            return true
        }

        return try {
            when (action) {
                "tap", "long_press" -> {
                    if (!keysAllowed("x", "y", "element")) return "Unexpected action argument"
                    val x = args.getInt("x")
                    val y = args.getInt("y")
                    val element = args.getString("element")
                    if (x !in 0..1000 || y !in 0..1000) "Coordinates must be between 0 and 1000"
                    else if (element.isBlank() || element.length > 200) "Element description is required and must be at most 200 characters"
                    else null
                }
                "swipe", "scroll" -> {
                    if (!keysAllowed("direction", "element")) return "Unexpected action argument"
                    val direction = args.getString("direction")
                    val element = args.optString("element", "")
                    if (direction !in setOf("up", "down", "left", "right")) "Unsupported direction"
                    else if (element.length > 200) "Element description must be at most 200 characters"
                    else null
                }
                "type" -> {
                    if (!keysAllowed("text", "element")) return "Unexpected action argument"
                    val text = args.getString("text")
                    val element = args.optString("element", "")
                    if (text.isEmpty() || text.length > 2000) "Text must contain 1 to 2000 characters"
                    else if (element.length > 200) "Element description must be at most 200 characters"
                    else null
                }
                "back", "home" -> if (keysAllowed()) null else "This action does not accept arguments"
                "wait" -> {
                    if (!keysAllowed("ms")) return "Unexpected action argument"
                    val waitMs = args.getLong("ms")
                    if (waitMs !in 250..10_000) "Wait must be between 250 and 10000 milliseconds" else null
                }
                "done" -> {
                    if (!keysAllowed("summary")) return "Unexpected action argument"
                    if (args.optString("summary", "").length > 2000) "Summary must be at most 2000 characters" else null
                }
                else -> "Unsupported action"
            }
        } catch (_: Exception) {
            "Missing or invalid action argument"
        }
    }

    @ReactMethod
    fun openAccessibilitySettings(promise: Promise) {
        try {
            val intent = android.content.Intent(android.provider.Settings.ACTION_ACCESSIBILITY_SETTINGS).apply {
                flags = android.content.Intent.FLAG_ACTIVITY_NEW_TASK
            }
            reactContext.startActivity(intent)
            promise.resolve(true)
        } catch (error: Exception) {
            promise.reject("SETTINGS_ERROR", error.message)
        }
    }
}
