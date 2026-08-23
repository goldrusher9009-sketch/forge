package com.forge.phoneagent

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

        fun sendEvent(name: String, data: Any?) {
            moduleInstance?.reactContext
                ?.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                ?.emit(name, data)
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
    fun captureScreen(promise: Promise) {
        val service = ForgeAccessibilityService.instance
        if (service == null) {
            promise.reject("NO_SERVICE", "Accessibility service not running")
            return
        }
        service.captureScreenBase64 { screenshot ->
            if (screenshot != null) promise.resolve(screenshot)
            else promise.reject("CAPTURE_FAILED", "Screenshot capture failed")
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
            val success = try {
                when (action) {
                    "tap" -> awaitGesture(2_000) { callback -> service.tap(args.getInt("x"), args.getInt("y"), callback) }
                    "long_press" -> awaitGesture(3_000) { callback -> service.longPress(args.getInt("x"), args.getInt("y"), callback) }
                    "swipe", "scroll" -> awaitGesture(2_000) { callback -> service.swipe(args.getString("direction"), callback) }
                    "type" -> {
                        val element = args.optString("element", "")
                        if (element.isNotBlank()) {
                            if (!service.tapByText(element)) false
                            else {
                                delay(300)
                                service.typeText(args.getString("text"))
                            }
                        } else {
                            service.typeText(args.getString("text"))
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

            val result = Arguments.createMap().apply {
                putBoolean("executed", true)
                putBoolean("success", success)
                putString("currentPackage", packageBefore)
                putString("observedPackageAfter", service.currentPackageName())
                if (!success) putString("error", "Native action failed or timed out")
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
