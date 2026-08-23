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
import java.io.ByteArrayOutputStream

/** Accessibility Service used only after the backend issues one authorization. */
class ForgeAccessibilityService : AccessibilityService() {

    companion object {
        @Volatile
        var instance: ForgeAccessibilityService? = null
            private set
    }

    @Volatile
    private var lastPackageName = ""

    override fun onServiceConnected() {
        super.onServiceConnected()
        instance = this
        ForgeModule.sendEvent("accessibilityConnected", null)
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        event ?: return
        val packageName = event.packageName?.toString().orEmpty()
        if (packageName.isNotBlank()) lastPackageName = packageName
        if (event.eventType == AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED ||
            event.eventType == AccessibilityEvent.TYPE_WINDOW_CONTENT_CHANGED
        ) {
            ForgeModule.sendEvent("screenChanged", mapOf("package" to packageName))
        }
    }

    override fun onInterrupt() {
        instance = null
    }

    override fun onDestroy() {
        instance = null
        super.onDestroy()
    }

    fun currentPackageName(): String {
        val activePackage = rootInActiveWindow?.packageName?.toString().orEmpty()
        return if (activePackage.isNotBlank()) activePackage else lastPackageName
    }

    fun captureScreenBase64(callback: (String?) -> Unit) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.R) {
            callback(null)
            return
        }
        takeScreenshot(GLOBAL_ACTION_TAKE_SCREENSHOT, mainExecutor, object : TakeScreenshotCallback {
            override fun onSuccess(screenshot: ScreenshotResult) {
                val hardwareBuffer = screenshot.hardwareBuffer
                try {
                    val bitmap = Bitmap.wrapHardwareBuffer(hardwareBuffer, screenshot.colorSpace)
                    if (bitmap == null) {
                        callback(null)
                        return
                    }
                    val output = ByteArrayOutputStream()
                    val compressed = bitmap.compress(Bitmap.CompressFormat.JPEG, 75, output)
                    bitmap.recycle()
                    callback(if (compressed) Base64.encodeToString(output.toByteArray(), Base64.NO_WRAP) else null)
                } catch (_: Exception) {
                    callback(null)
                } finally {
                    hardwareBuffer.close()
                }
            }

            override fun onFailure(errorCode: Int) {
                callback(null)
            }
        })
    }

    fun tap(x: Int, y: Int, callback: (Boolean) -> Unit) {
        if (x !in 0..1000 || y !in 0..1000) {
            callback(false)
            return
        }
        val display = resources.displayMetrics
        val path = Path().apply {
            moveTo((x / 1000f) * display.widthPixels, (y / 1000f) * display.heightPixels)
        }
        dispatchGesture(
            GestureDescription.Builder().addStroke(GestureDescription.StrokeDescription(path, 0, 100)).build(),
            object : GestureResultCallback() {
                override fun onCompleted(gestureDescription: GestureDescription) = callback(true)
                override fun onCancelled(gestureDescription: GestureDescription) = callback(false)
            },
            null,
        )
    }

    fun longPress(x: Int, y: Int, callback: (Boolean) -> Unit) {
        if (x !in 0..1000 || y !in 0..1000) {
            callback(false)
            return
        }
        val display = resources.displayMetrics
        val path = Path().apply {
            moveTo((x / 1000f) * display.widthPixels, (y / 1000f) * display.heightPixels)
        }
        dispatchGesture(
            GestureDescription.Builder().addStroke(GestureDescription.StrokeDescription(path, 0, 1_000)).build(),
            object : GestureResultCallback() {
                override fun onCompleted(gestureDescription: GestureDescription) = callback(true)
                override fun onCancelled(gestureDescription: GestureDescription) = callback(false)
            },
            null,
        )
    }

    fun swipe(direction: String, callback: (Boolean) -> Unit) {
        val display = resources.displayMetrics
        val width = display.widthPixels.toFloat()
        val height = display.heightPixels.toFloat()
        val path = Path()
        when (direction) {
            "up" -> { path.moveTo(width / 2, height * 0.7f); path.lineTo(width / 2, height * 0.3f) }
            "down" -> { path.moveTo(width / 2, height * 0.3f); path.lineTo(width / 2, height * 0.7f) }
            "left" -> { path.moveTo(width * 0.8f, height / 2); path.lineTo(width * 0.2f, height / 2) }
            "right" -> { path.moveTo(width * 0.2f, height / 2); path.lineTo(width * 0.8f, height / 2) }
            else -> { callback(false); return }
        }
        dispatchGesture(
            GestureDescription.Builder().addStroke(GestureDescription.StrokeDescription(path, 0, 300)).build(),
            object : GestureResultCallback() {
                override fun onCompleted(gestureDescription: GestureDescription) = callback(true)
                override fun onCancelled(gestureDescription: GestureDescription) = callback(false)
            },
            null,
        )
    }

    fun typeText(text: String): Boolean {
        if (text.isEmpty() || text.length > 2_000) return false
        val node = rootInActiveWindow?.findFocus(AccessibilityNodeInfo.FOCUS_INPUT) ?: return false
        val arguments = android.os.Bundle().apply {
            putCharSequence(AccessibilityNodeInfo.ACTION_ARGUMENT_SET_TEXT_CHARSEQUENCE, text)
        }
        return node.performAction(AccessibilityNodeInfo.ACTION_SET_TEXT, arguments)
    }

    fun tapByText(text: String): Boolean {
        if (text.isBlank() || text.length > 200) return false
        val root = rootInActiveWindow ?: return false
        val node = findNodeByText(root, text) ?: return false
        val bounds = Rect()
        node.getBoundsInScreen(bounds)
        val path = Path().apply { moveTo(bounds.centerX().toFloat(), bounds.centerY().toFloat()) }
        return dispatchGesture(
            GestureDescription.Builder().addStroke(GestureDescription.StrokeDescription(path, 0, 100)).build(),
            null,
            null,
        )
    }

    fun goBack(): Boolean = performGlobalAction(GLOBAL_ACTION_BACK)

    fun goHome(): Boolean = performGlobalAction(GLOBAL_ACTION_HOME)

    fun getScreenText(): String {
        val root = rootInActiveWindow ?: return ""
        val output = StringBuilder()
        collectText(root, output, 0)
        return output.toString().take(3_000)
    }

    private fun findNodeByText(node: AccessibilityNodeInfo, target: String): AccessibilityNodeInfo? {
        val normalized = target.lowercase()
        val text = node.text?.toString()?.lowercase().orEmpty()
        val description = node.contentDescription?.toString()?.lowercase().orEmpty()
        if (text.contains(normalized) || description.contains(normalized)) return node
        for (index in 0 until node.childCount) {
            val child = node.getChild(index) ?: continue
            val found = findNodeByText(child, target)
            if (found != null) return found
        }
        return null
    }

    private fun collectText(node: AccessibilityNodeInfo?, output: StringBuilder, depth: Int) {
        node ?: return
        if (depth > 10 || output.length >= 3_000) return
        val text = node.text?.toString()
        val description = node.contentDescription?.toString()
        if (!text.isNullOrBlank()) output.append("  ".repeat(depth)).append(text).append('\n')
        else if (!description.isNullOrBlank()) output.append("  ".repeat(depth)).append('[').append(description).append("]\n")
        for (index in 0 until node.childCount) collectText(node.getChild(index), output, depth + 1)
    }
}
