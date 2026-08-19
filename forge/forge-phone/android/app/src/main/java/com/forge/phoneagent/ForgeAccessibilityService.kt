package com.forge.phoneagent

import android.accessibilityservice.AccessibilityService
import android.accessibilityservice.GestureDescription
import android.graphics.Bitmap
import android.graphics.Path
import android.graphics.Rect
import android.os.Build
import android.util.Base64
import android.view.accessibility.AccessibilityEvent
import android.view.accessibility.AccessibilityNodeInfo
import kotlinx.coroutines.*
import org.json.JSONObject
import java.io.ByteArrayOutputStream

/**
 * ForgeAccessibilityService — the Android bridge that lets the AI actually control the phone.
 *
 * This service must be enabled by the user in Settings → Accessibility → Forge Phone Agent.
 * Once enabled, it can:
 *   - Capture screenshots of any app
 *   - Find and click UI elements by text/description
 *   - Perform gestures (tap, swipe, long press)
 *   - Type text into any input field
 *   - Navigate back/home
 *   - Read screen content (accessibility tree)
 */
class ForgeAccessibilityService : AccessibilityService() {

    companion object {
        var instance: ForgeAccessibilityService? = null
        private val scope = CoroutineScope(Dispatchers.Main + SupervisorJob())
    }

    override fun onServiceConnected() {
        super.onServiceConnected()
        instance = this
        // Notify React Native that the accessibility service is active
        ForgeModule.sendEvent("accessibilityConnected", null)
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        // Forward screen change events to React Native for real-time monitoring
        event?.let {
            when (it.eventType) {
                AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED,
                AccessibilityEvent.TYPE_WINDOW_CONTENT_CHANGED -> {
                    val pkg = it.packageName?.toString() ?: ""
                    ForgeModule.sendEvent("screenChanged", mapOf("package" to pkg))
                }
            }
        }
    }

    override fun onInterrupt() {
        instance = null
    }

    override fun onDestroy() {
        super.onDestroy()
        instance = null
        scope.cancel()
    }

    // ── Screenshot capture ─────────────────────────────────────────────────
    fun captureScreenBase64(callback: (String?) -> Unit) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            takeScreenshot(GLOBAL_ACTION_TAKE_SCREENSHOT, mainExecutor, object : TakeScreenshotCallback {
                override fun onSuccess(screenshot: ScreenshotResult) {
                    val bmp = Bitmap.wrapHardwareBuffer(screenshot.hardwareBuffer, screenshot.colorSpace)
                    val out = ByteArrayOutputStream()
                    bmp?.compress(Bitmap.CompressFormat.JPEG, 75, out)
                    bmp?.recycle()
                    val b64 = Base64.encodeToString(out.toByteArray(), Base64.DEFAULT)
                    callback(b64)
                }
                override fun onFailure(errorCode: Int) { callback(null) }
            })
        } else {
            // Pre-Android 11: return null (screenshot requires system overlay)
            callback(null)
        }
    }

    // ── Tap at normalized coordinates (0–1000 scale) ──────────────────────
    fun tap(x: Int, y: Int, callback: (Boolean) -> Unit) {
        val display = resources.displayMetrics
        val realX = (x / 1000f) * display.widthPixels
        val realY = (y / 1000f) * display.heightPixels

        val path = Path().apply { moveTo(realX, realY) }
        val gesture = GestureDescription.Builder()
            .addStroke(GestureDescription.StrokeDescription(path, 0, 100))
            .build()

        dispatchGesture(gesture, object : GestureResultCallback() {
            override fun onCompleted(gestureDescription: GestureDescription) { callback(true) }
            override fun onCancelled(gestureDescription: GestureDescription) { callback(false) }
        }, null)
    }

    // ── Long press ─────────────────────────────────────────────────────────
    fun longPress(x: Int, y: Int, callback: (Boolean) -> Unit) {
        val display = resources.displayMetrics
        val realX = (x / 1000f) * display.widthPixels
        val realY = (y / 1000f) * display.heightPixels

        val path = Path().apply { moveTo(realX, realY) }
        val gesture = GestureDescription.Builder()
            .addStroke(GestureDescription.StrokeDescription(path, 0, 1000))
            .build()

        dispatchGesture(gesture, object : GestureResultCallback() {
            override fun onCompleted(gestureDescription: GestureDescription) { callback(true) }
            override fun onCancelled(gestureDescription: GestureDescription) { callback(false) }
        }, null)
    }

    // ── Swipe gesture ──────────────────────────────────────────────────────
    fun swipe(direction: String, callback: (Boolean) -> Unit) {
        val display = resources.displayMetrics
        val w = display.widthPixels.toFloat()
        val h = display.heightPixels.toFloat()

        val path = Path()
        when (direction) {
            "up"    -> { path.moveTo(w/2, h*0.7f); path.lineTo(w/2, h*0.3f) }
            "down"  -> { path.moveTo(w/2, h*0.3f); path.lineTo(w/2, h*0.7f) }
            "left"  -> { path.moveTo(w*0.8f, h/2); path.lineTo(w*0.2f, h/2) }
            "right" -> { path.moveTo(w*0.2f, h/2); path.lineTo(w*0.8f, h/2) }
            else    -> { callback(false); return }
        }

        val gesture = GestureDescription.Builder()
            .addStroke(GestureDescription.StrokeDescription(path, 0, 300))
            .build()

        dispatchGesture(gesture, object : GestureResultCallback() {
            override fun onCompleted(gestureDescription: GestureDescription) { callback(true) }
            override fun onCancelled(gestureDescription: GestureDescription) { callback(false) }
        }, null)
    }

    // ── Type text into focused field ───────────────────────────────────────
    fun typeText(text: String): Boolean {
        val node = findFocusedInput() ?: return false
        val args = android.os.Bundle().apply {
            putCharSequence(AccessibilityNodeInfo.ACTION_ARGUMENT_SET_TEXT_CHARSEQUENCE, text)
        }
        return node.performAction(AccessibilityNodeInfo.ACTION_SET_TEXT, args)
    }

    // ── Find element by text and click it ─────────────────────────────────
    fun tapByText(text: String): Boolean {
        val root = rootInActiveWindow ?: return false
        val node = findNodeByText(root, text) ?: return false
        val bounds = Rect()
        node.getBoundsInScreen(bounds)
        val cx = bounds.centerX().toFloat()
        val cy = bounds.centerY().toFloat()
        val path = Path().apply { moveTo(cx, cy) }
        val gesture = GestureDescription.Builder()
            .addStroke(GestureDescription.StrokeDescription(path, 0, 100))
            .build()
        dispatchGesture(gesture, null, null)
        return true
    }

    // ── Navigate back ──────────────────────────────────────────────────────
    fun goBack(): Boolean = performGlobalAction(GLOBAL_ACTION_BACK)

    // ── Go home ───────────────────────────────────────────────────────────
    fun goHome(): Boolean = performGlobalAction(GLOBAL_ACTION_HOME)

    // ── Read screen text (accessibility tree) ─────────────────────────────
    fun getScreenText(): String {
        val root = rootInActiveWindow ?: return ""
        val sb = StringBuilder()
        collectText(root, sb, 0)
        return sb.toString().take(3000)
    }

    // ── Helpers ───────────────────────────────────────────────────────────
    private fun findFocusedInput(): AccessibilityNodeInfo? {
        val root = rootInActiveWindow ?: return null
        return root.findFocus(AccessibilityNodeInfo.FOCUS_INPUT)
    }

    private fun findNodeByText(node: AccessibilityNodeInfo, text: String): AccessibilityNodeInfo? {
        val t = node.text?.toString()?.lowercase() ?: ""
        val cd = node.contentDescription?.toString()?.lowercase() ?: ""
        if (t.contains(text.lowercase()) || cd.contains(text.lowercase())) return node
        for (i in 0 until node.childCount) {
            val found = findNodeByText(node.getChild(i) ?: continue, text)
            if (found != null) return found
        }
        return null
    }

    private fun collectText(node: AccessibilityNodeInfo?, sb: StringBuilder, depth: Int) {
        node ?: return
        if (depth > 10) return
        val text = node.text?.toString()
        val desc = node.contentDescription?.toString()
        if (!text.isNullOrBlank()) sb.append("  ".repeat(depth)).append(text).append("\n")
        else if (!desc.isNullOrBlank()) sb.append("  ".repeat(depth)).append("[").append(desc).append("]\n")
        for (i in 0 until node.childCount) collectText(node.getChild(i), sb, depth + 1)
    }
}
