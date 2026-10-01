package com.forge.phoneagent

import android.content.Intent
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

    init {
        moduleInstance = this
    }

    override fun getName() = "ForgeAccessibility"

    override fun invalidate() {
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
        service.captureScreenBase64 { screenshot ->
            if (service.currentPackageName() != expectedPackage) promise.reject("PACKAGE_CHANGED", "PHONE_PACKAGE_CHANGED")
            else if (screenshot != null) promise.resolve(screenshot)
            else promise.reject("CAPTURE_FAILED", "PHONE_SCREENSHOT_REQUIRED")
        }
    }

    @ReactMethod
    fun performAction(actionJson: String, expectedPackage: String, promise: Promise) {
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
            val success = try {
                when (action) {
                    "tap" -> awaitGesture(2_000) { callback -> service.tap(args.getInt("x"), args.getInt("y"), callback) }
                    "long_press" -> awaitGesture(3_000) { callback -> service.longPress(args.getInt("x"), args.getInt("y"), callback) }
                    "swipe" -> awaitGesture(2_000) { callback -> service.swipe(args.getString("direction"), callback) }
                    "scroll" -> awaitGesture(2_000) { callback ->
                        // Scroll names describe the content to reveal; gestures describe finger movement.
                        val direction = when (args.getString("direction")) {
                            "up" -> "down"
                            "down" -> "up"
                            "left" -> "right"
                            "right" -> "left"
                            else -> throw IllegalArgumentException("Unsupported scroll direction")
                        }
                        service.swipe(direction, callback)
                    }
                    "type" -> {
                        val element = args.optString("element", "")
                        if (element.isNotBlank()) {
                            if (!service.tapByText(element, expectedPackage)) false
                            else {
                                delay(300)
                                service.typeText(args.getString("text"), expectedPackage)
                            }
                        } else {
                            service.typeText(args.getString("text"), expectedPackage)
                        }
                    }
                    "back" -> service.goBack()
                    "home" -> service.goHome()
                    "wait" -> {
                        delay(args.getLong("ms"))
                        true
                    }
                    "done" -> true
                    else -> false
                }
            } catch (_: Exception) {
                false
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

    private suspend fun awaitGesture(
        timeoutMs: Long,
        start: ((Boolean) -> Unit) -> Unit,
    ): Boolean {
        val result = CompletableDeferred<Boolean>()
        start { success -> if (!result.isCompleted) result.complete(success) }
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
