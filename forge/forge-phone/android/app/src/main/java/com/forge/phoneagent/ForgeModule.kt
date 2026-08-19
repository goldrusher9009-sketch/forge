package com.forge.phoneagent

import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule
import kotlinx.coroutines.*

/**
 * ForgeModule — React Native bridge to the Forge Accessibility Service.
 * Exposes native Android capabilities to the React Native JS layer.
 */
class ForgeModule(private val reactContext: ReactApplicationContext)
    : ReactContextBaseJavaModule(reactContext) {

    companion object {
        private var moduleInstance: ForgeModule? = null

        fun sendEvent(name: String, data: Any?) {
            moduleInstance?.reactContext
                ?.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                ?.emit(name, data)
        }
    }

    init { moduleInstance = this }

    override fun getName() = "ForgeAccessibility"

    // Check if Accessibility Service is running
    @ReactMethod
    fun isAccessibilityEnabled(promise: Promise) {
        promise.resolve(ForgeAccessibilityService.instance != null)
    }

    // Capture screenshot as base64 JPEG
    @ReactMethod
    fun captureScreen(promise: Promise) {
        val svc = ForgeAccessibilityService.instance
        if (svc == null) { promise.reject("NO_SERVICE", "Accessibility service not running"); return }
        svc.captureScreenBase64 { b64 ->
            if (b64 != null) promise.resolve(b64)
            else promise.reject("CAPTURE_FAILED", "Screenshot capture failed")
        }
    }

    // Get text visible on screen
    @ReactMethod
    fun getScreenText(promise: Promise) {
        val svc = ForgeAccessibilityService.instance
        if (svc == null) { promise.reject("NO_SERVICE", "Accessibility service not running"); return }
        promise.resolve(svc.getScreenText())
    }

    // Perform an action returned by the AI
    @ReactMethod
    fun performAction(actionJson: String, promise: Promise) {
        val svc = ForgeAccessibilityService.instance
        if (svc == null) { promise.reject("NO_SERVICE", "Accessibility service not running"); return }

        val action = org.json.JSONObject(actionJson)
        val type = action.getString("action")
        val args = action.optJSONObject("args") ?: org.json.JSONObject()

        CoroutineScope(Dispatchers.Main).launch {
            when (type) {
                "tap" -> {
                    val x = args.optInt("x", 500)
                    val y = args.optInt("y", 500)
                    var done = false
                    svc.tap(x, y) { success ->
                        promise.resolve(success)
                        done = true
                    }
                    // Wait up to 2s
                    var waited = 0
                    while (!done && waited < 2000) { delay(50); waited += 50 }
                }
                "long_press" -> {
                    val x = args.optInt("x", 500)
                    val y = args.optInt("y", 500)
                    var done = false
                    svc.longPress(x, y) { success ->
                        promise.resolve(success)
                        done = true
                    }
                    var waited = 0
                    while (!done && waited < 3000) { delay(50); waited += 50 }
                }
                "swipe", "scroll" -> {
                    val dir = args.optString("direction", "up")
                    var done = false
                    svc.swipe(dir) { success ->
                        promise.resolve(success)
                        done = true
                    }
                    var waited = 0
                    while (!done && waited < 2000) { delay(50); waited += 50 }
                }
                "type" -> {
                    val text = args.optString("text", "")
                    val element = args.optString("element", "")
                    // Try to tap element first if specified
                    if (element.isNotBlank()) svc.tapByText(element)
                    delay(300)
                    val success = svc.typeText(text)
                    promise.resolve(success)
                }
                "tap_text" -> {
                    val text = args.optString("text", "")
                    promise.resolve(svc.tapByText(text))
                }
                "back" -> promise.resolve(svc.goBack())
                "home" -> promise.resolve(svc.goHome())
                "wait" -> {
                    delay(args.optLong("ms", 1000))
                    promise.resolve(true)
                }
                "done" -> promise.resolve(true)
                else -> promise.reject("UNKNOWN_ACTION", "Unknown action: $type")
            }
        }
    }

    // Open Settings → Accessibility for the user to enable the service
    @ReactMethod
    fun openAccessibilitySettings(promise: Promise) {
        try {
            val intent = android.content.Intent(android.provider.Settings.ACTION_ACCESSIBILITY_SETTINGS)
            intent.flags = android.content.Intent.FLAG_ACTIVITY_NEW_TASK
            reactContext.startActivity(intent)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }
}
