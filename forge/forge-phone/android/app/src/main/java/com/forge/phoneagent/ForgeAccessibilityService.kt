package com.forge.phoneagent

import android.accessibilityservice.AccessibilityService
import android.accessibilityservice.GestureDescription
import android.content.pm.ApplicationInfo
import android.graphics.Bitmap
import android.graphics.Path
import android.graphics.Point
import android.graphics.Region
import android.hardware.display.DisplayManager
import android.graphics.Rect
import android.os.Build
import android.util.Base64
import android.view.Display
import android.view.accessibility.AccessibilityEvent
import android.view.accessibility.AccessibilityNodeInfo
import android.view.accessibility.AccessibilityWindowInfo
import java.io.ByteArrayOutputStream
import java.nio.ByteBuffer
import java.security.MessageDigest
import org.json.JSONObject
import org.json.JSONArray

/** Accessibility Service used only after the backend issues one authorization. */
class ForgeAccessibilityService : AccessibilityService() {

    companion object {
        @Volatile
        var instance: ForgeAccessibilityService? = null
            private set
    }

    data class CapturedScreen(
        val screenshot: String,
        val revision: String,
        val structureRevision: String,
        val windowId: Int,
        val width: Int,
        val height: Int,
        val rotation: Int,
        val packageName: String,
        val captureMode: String,
        val protectedRegions: List<Rect>,
        val targetRegion: Region,
        val debugDisplayHash: String? = null,
        val debugAppSurfaceHash: String? = null,
        val debugIgnoredRegions: List<Rect> = emptyList(),
    )

    private data class ReviewStructure(
        val hash: String,
        val windowId: Int,
        val bounds: Rect,
        val width: Int,
        val height: Int,
        val rotation: Int,
        val protectedRegions: List<Rect>,
        val systemBarRegions: List<Rect>,
        val targetRegion: Region,
    )

    private var observedReviewPackage = ""
    private var reviewEventEpoch = 0L
    private var reviewCaptureAttempt = 0L
    private var reviewCaptureFailure: JSONObject? = null

    private fun recordCaptureFailure(attempt: Long, stage: String, reason: String, errorCode: Int? = null) {
        if (BuildConfig.DEBUG && attempt == reviewCaptureAttempt && reviewCaptureFailure == null) {
            try {
                reviewCaptureFailure = JSONObject().apply {
                    put("stage", stage); put("reason", reason)
                    if (errorCode != null) put("screenshotErrorCode", errorCode)
                }
            } catch (_: Exception) { /* Diagnostics cannot change the capture result. */ }
        }
    }

    override fun onServiceConnected() {
        super.onServiceConnected()
        instance = this
        ForgeModule.sendEvent("accessibilityConnected", null)
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        event ?: return
        val packageName = event.packageName?.toString().orEmpty()
        if (event.eventType == AccessibilityEvent.TYPE_WINDOWS_CHANGED ||
            packageName == observedReviewPackage
        ) reviewEventEpoch += 1
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
        // An event from an earlier window is not foreground authorization.
        val root = rootInActiveWindow ?: return ""
        return try { root.packageName?.toString().orEmpty() } finally { releaseNode(root) }
    }

    private fun realDisplay(): Pair<Point, Int>? {
        val display = getSystemService(DisplayManager::class.java)
            ?.getDisplay(Display.DEFAULT_DISPLAY) ?: return null
        val size = Point()
        @Suppress("DEPRECATION")
        display.getRealSize(size)
        return if (size.x > 0 && size.y > 0) size to display.rotation else null
    }

    private fun captureBitmap(windowId: Int?, failed: (String, Int?) -> Unit = { _, _ -> }, callback: (Bitmap?) -> Unit) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.R) { failed("API_UNSUPPORTED", null); callback(null); return }
        val receiver = object : TakeScreenshotCallback {
            override fun onSuccess(screenshot: ScreenshotResult) {
                val buffer = screenshot.hardwareBuffer
                var wrapped: Bitmap? = null
                val copied = try {
                    wrapped = Bitmap.wrapHardwareBuffer(buffer, screenshot.colorSpace)
                    wrapped?.copy(Bitmap.Config.ARGB_8888, false)
                } catch (_: Exception) { failed("BITMAP_COPY_EXCEPTION", null); null }
                finally { wrapped?.recycle(); buffer.close() }
                if (copied == null) failed("BITMAP_COPY_FAILED", null)
                callback(copied)
            }
            override fun onFailure(errorCode: Int) { failed("SCREENSHOT_API_FAILURE", errorCode); callback(null) }
        }
        try {
            if (windowId != null && Build.VERSION.SDK_INT >= 34)
                takeScreenshotOfWindow(windowId, mainExecutor, receiver)
            else takeScreenshot(Display.DEFAULT_DISPLAY, mainExecutor, receiver)
        } catch (_: Exception) { failed("SCREENSHOT_CALL_EXCEPTION", null); callback(null) }
    }

    private fun jpeg(bitmap: Bitmap): String? {
        val output = ByteArrayOutputStream()
        return if (bitmap.compress(Bitmap.CompressFormat.JPEG, 75, output))
            Base64.encodeToString(output.toByteArray(), Base64.NO_WRAP) else null
    }

    fun captureScreenBase64(callback: (String?) -> Unit) {
        captureBitmap(null) { bitmap ->
            if (bitmap == null) { callback(null); return@captureBitmap }
            val result = try { jpeg(bitmap) } catch (_: Exception) { null }
            bitmap.recycle()
            callback(result)
        }
    }

    private fun hash(value: String): String = MessageDigest.getInstance("SHA-256")
        .digest(value.toByteArray(Charsets.UTF_8)).joinToString("") { "%02x".format(it) }

    private fun hashPixels(bitmap: Bitmap, ignored: List<Rect>): String {
        val digest = MessageDigest.getInstance("SHA-256")
        digest.update("${bitmap.width}:${bitmap.height}:${bitmap.colorSpace?.name}".toByteArray())
        val row = IntArray(bitmap.width)
        val bytes = ByteBuffer.allocate(bitmap.width * 4)
        for (y in 0 until bitmap.height) {
            bitmap.getPixels(row, 0, bitmap.width, 0, y, bitmap.width, 1)
            for (rect in ignored) if (y >= rect.top && y < rect.bottom) {
                val start = rect.left.coerceIn(0, row.size)
                val end = rect.right.coerceIn(0, row.size)
                if (start < end) java.util.Arrays.fill(row, start, end, 0)
            }
            bytes.clear()
            for (pixel in row) bytes.putInt(pixel)
            digest.update(bytes.array())
        }
        return digest.digest().joinToString("") { "%02x".format(it) }
    }

    @Suppress("DEPRECATION")
    private fun releaseNode(node: AccessibilityNodeInfo?) {
        if (Build.VERSION.SDK_INT < 33) node?.recycle()
    }

    @Suppress("DEPRECATION")
    private fun releaseWindow(window: AccessibilityWindowInfo) {
        if (Build.VERSION.SDK_INT < 33) window.recycle()
    }

    @Suppress("DEPRECATION")
    private fun isSystemOwned(packageName: String): Boolean = try {
        packageName.isNotBlank() && (packageManager.getApplicationInfo(packageName, 0).flags and
            (ApplicationInfo.FLAG_SYSTEM or ApplicationInfo.FLAG_UPDATED_SYSTEM_APP)) != 0
    } catch (_: Exception) { false }

    private fun hasStatusBarRole(root: AccessibilityNodeInfo?, windowId: Int, frame: Rect): Boolean = try {
        if (root == null || !root.refresh() || root.packageName?.toString() != "com.android.systemui" ||
            root.windowId != windowId) false
        else {
            val roleId = "com.android.systemui:id/status_bar"
            val roles = root.findAccessibilityNodeInfosByViewId(roleId)
            try {
                if (roles.size != 1) false
                else {
                    val role = roles.single()
                    val bounds = Rect()
                    if (!role.refresh() || role.viewIdResourceName != roleId ||
                        role.packageName?.toString() != "com.android.systemui" || role.windowId != windowId ||
                        !role.isVisibleToUser) false
                    else { role.getBoundsInScreen(bounds); bounds == frame }
                }
            } finally { roles.forEach { if (it !== root) releaseNode(it) } }
        }
    } catch (_: Exception) { false }

    private fun reviewStructure(expectedPackage: String, failed: (String) -> Unit = {}): ReviewStructure? {
        fun reject(reason: String): ReviewStructure? { failed(reason); return null }
        if (Build.VERSION.SDK_INT < 30) return reject("API_UNSUPPORTED")
        if (expectedPackage.isBlank()) return reject("EXPECTED_PACKAGE_EMPTY")
        val epoch = reviewEventEpoch
        val (size, rotation) = realDisplay() ?: return reject("DISPLAY_UNAVAILABLE")
        val root = rootInActiveWindow ?: return reject("ROOT_UNAVAILABLE")
        var allWindows = emptyList<AccessibilityWindowInfo>()
        try {
            if (!root.refresh()) return reject("ROOT_REFRESH_FAILED")
            if (root.packageName?.toString() != expectedPackage) return reject("ROOT_PACKAGE_CHANGED")
            allWindows = windows
            val target = allWindows.find { it.id == root.windowId } ?: return reject("TARGET_WINDOW_UNAVAILABLE")
            if (target.type != AccessibilityWindowInfo.TYPE_APPLICATION) return reject("TARGET_WINDOW_TYPE")
            if (!target.isFocused) return reject("TARGET_WINDOW_UNFOCUSED")
            val bounds = Rect().also { target.getBoundsInScreen(it) }
            val targetRegion = Region().also { target.getRegionInScreen(it) }
            if (bounds.isEmpty || bounds.left < 0 || bounds.top < 0 ||
                bounds.right > size.x || bounds.bottom > size.y) return reject("TARGET_BOUNDS_INVALID")
            val value = StringBuilder()
            fun field(v: Any?) {
                val text = v?.toString().orEmpty()
                value.append(text.length).append(':').append(text).append('|')
            }
            field(expectedPackage); field(size.x); field(size.y); field(rotation); field(target.id)
            field(targetRegion.toString())
            val protected = mutableListOf<Rect>()
            val systemBars = mutableListOf<Rect>()
            for (window in allWindows.sortedWith(compareBy({ it.layer }, { it.id }))) {
                val frame = Rect().also { window.getBoundsInScreen(it) }
                val region = Region().also { window.getRegionInScreen(it) }
                val windowRoot = window.root
                var rootRefreshed = false
                val (pkg, rootId, statusRole) = try {
                    rootRefreshed = windowRoot?.refresh() == true
                    val pkg = windowRoot?.packageName?.toString().orEmpty()
                    Triple(pkg, windowRoot?.viewIdResourceName.orEmpty(),
                        rootRefreshed && window.type == AccessibilityWindowInfo.TYPE_SYSTEM && pkg == "com.android.systemui" &&
                            hasStatusBarRole(windowRoot, window.id, frame))
                } finally { if (windowRoot !== root) releaseNode(windowRoot) }
                field(window.id); field(window.type); field(window.layer); field(window.title)
                field(frame.flattenToString()); field(region.toString())
                val systemOwned = isSystemOwned(pkg)
                field(window.isActive); field(window.isFocused); field(pkg); field(rootId); field(systemOwned)
                val launcherNavigation = rootRefreshed && window.type == AccessibilityWindowInfo.TYPE_SYSTEM &&
                    pkg == "com.android.launcher3" && systemOwned && window.title?.toString() == "Navigation bar" &&
                    region.isRect && region.bounds == frame && frame.left == 0 && frame.right == size.x &&
                    frame.bottom == size.y && frame.top > 0 && frame.height() < size.y
                val statusBar = statusRole && systemOwned && region.isRect && region.bounds == frame &&
                    frame.left == 0 && frame.right == size.x && frame.top == 0 &&
                    frame.bottom > 0 && frame.height() < size.y
                field(if (statusRole) "com.android.systemui:id/status_bar" else "")
                field(statusBar); field(launcherNavigation)
                if (window.layer > target.layer && Rect.intersects(frame, bounds)) {
                    // Keyboard and SystemUI geometry stays protected even in full-display mode.
                    if (window.type != AccessibilityWindowInfo.TYPE_INPUT_METHOD &&
                        !(window.type == AccessibilityWindowInfo.TYPE_SYSTEM && pkg == "com.android.systemui") &&
                        !launcherNavigation) return reject("UNTRUSTED_UPPER_WINDOW")
                    protected.add(Rect(frame))
                    if (statusBar || launcherNavigation) {
                        systemBars.add(Rect(frame))
                    }
                }
            }
            field(systemBars.joinToString("|") { it.flattenToString() })
            var nodes = 0
            fun collect(node: AccessibilityNodeInfo, depth: Int): Boolean {
                if (++nodes > 4096 || depth > 64 || value.length > 1_000_000 || !node.refresh()) {
                    failed(when {
                        nodes > 4096 -> "TREE_NODE_LIMIT"
                        depth > 64 -> "TREE_DEPTH_LIMIT"
                        value.length > 1_000_000 -> "TREE_BYTE_LIMIT"
                        else -> "NODE_REFRESH_FAILED"
                    })
                    return false
                }
                if (node.packageName?.toString() != expectedPackage) { failed("NODE_PACKAGE_CHANGED"); return false }
                val rect = Rect().also { node.getBoundsInScreen(it) }
                field(node.windowId); field(node.viewIdResourceName); field(node.className)
                field(rect.flattenToString()); field(node.text); field(node.contentDescription)
                field(node.isVisibleToUser); field(node.isEnabled); field(node.isClickable)
                field(node.isLongClickable); field(node.isScrollable); field(node.isEditable)
                field(node.isPassword); field(node.isFocused); field(node.isAccessibilityFocused)
                field(node.isSelected); field(node.isCheckable); field(node.isChecked)
                field(node.textSelectionStart); field(node.textSelectionEnd)
                field(node.stateDescription); field(node.hintText); field(node.error)
                field(node.paneTitle); field(node.tooltipText); field(node.inputType)
                field(node.maxTextLength); field(node.isHeading)
                field(node.rangeInfo?.let { "${it.type}:${it.min}:${it.max}:${it.current}" })
                field(node.collectionInfo?.let { "${it.rowCount}:${it.columnCount}:${it.isHierarchical}:${it.selectionMode}" })
                field(node.collectionItemInfo?.let { "${it.rowIndex}:${it.columnIndex}:${it.rowSpan}:${it.columnSpan}:${it.isHeading}:${it.isSelected}" })
                field(node.actionList.map { it.id }.sorted().joinToString(","))
                field(node.childCount)
                for (index in 0 until node.childCount) {
                    val child = node.getChild(index) ?: run { failed("CHILD_UNAVAILABLE"); return false }
                    try {
                        field(index)
                        if (!collect(child, depth + 1)) return false
                    } finally { releaseNode(child) }
                }
                return (value.length <= 1_000_000).also { if (!it) failed("TREE_BYTE_LIMIT") }
            }
            if (!collect(root, 0)) return null
            if (reviewEventEpoch != epoch) return reject("STRUCTURE_EVENT_EPOCH_CHANGED")
            if (currentPackageName() != expectedPackage) return reject("STRUCTURE_PACKAGE_CHANGED")
            return ReviewStructure(hash(value.toString()), target.id, bounds, size.x, size.y,
                rotation, protected, systemBars, Region(targetRegion))
        } finally {
            releaseNode(root)
            allWindows.forEach { releaseWindow(it) }
        }
    }

    fun captureReviewedScreen(expectedPackage: String, onRetryableCaptureFailure: (Int?) -> Unit = { _ -> }, callback: (CapturedScreen?) -> Unit) {
        val attempt = ++reviewCaptureAttempt
        reviewCaptureFailure = null
        observedReviewPackage = expectedPackage
        val before = try { reviewStructure(expectedPackage) { recordCaptureFailure(attempt, "before_structure", it) } }
            catch (_: Exception) { recordCaptureFailure(attempt, "before_structure", "STRUCTURE_EXCEPTION"); null }
        if (before == null) { callback(null); return }
        val epoch = reviewEventEpoch
        fun captureFailed(stage: String, reason: String, code: Int?, displayBitmap: Bitmap? = null) {
            recordCaptureFailure(attempt, stage, reason, code)
            if (reason != "SCREENSHOT_API_FAILURE" || code != ERROR_TAKE_SCREENSHOT_INTERNAL_ERROR) return
            val retryable = try {
                val after = reviewStructure(expectedPackage) { recordCaptureFailure(attempt, "failure_structure", it) }
                after != null && after.hash == before.hash && after.width == before.width &&
                    after.height == before.height && after.rotation == before.rotation &&
                    reviewEventEpoch == epoch && currentPackageName() == expectedPackage &&
                    attempt == reviewCaptureAttempt && (displayBitmap == null ||
                        (displayBitmap.width == before.width && displayBitmap.height == before.height))
            } catch (_: Exception) { false }
            if (retryable) try { onRetryableCaptureFailure(code) } catch (_: Exception) { }
        }
        captureBitmap(null, { reason, code -> captureFailed("display_screenshot", reason, code) }) displayCapture@ { displayBitmap ->
            if (displayBitmap == null) { callback(null); return@displayCapture }
            fun finish(appBitmap: Bitmap?) {
                var finishStage = "after_structure"
                var epochInterrupted = false
                val result = try {
                    val after = reviewStructure(expectedPackage) { recordCaptureFailure(attempt, "after_structure", it) }
                    finishStage = "capture_compare"
                    val geometry = before.bounds == Rect(0, 0, before.width, before.height) &&
                        displayBitmap.width == before.width && displayBitmap.height == before.height
                    if (after == null || after.hash != before.hash || reviewEventEpoch != epoch ||
                        displayBitmap.width != before.width || displayBitmap.height != before.height) {
                        epochInterrupted = after != null && after.hash == before.hash && reviewEventEpoch != epoch &&
                            displayBitmap.width == before.width && displayBitmap.height == before.height
                        if (after != null) recordCaptureFailure(attempt, "capture_compare", when {
                            after.hash != before.hash -> "STRUCTURE_HASH_CHANGED"
                            reviewEventEpoch != epoch -> "CAPTURE_EVENT_EPOCH_CHANGED"
                            else -> "DISPLAY_DIMENSIONS_MISMATCH"
                        })
                        null
                    }
                    else {
                        finishStage = "pixel_hash"
                        val surfaceValid = geometry && appBitmap != null &&
                            appBitmap.width == before.width && appBitmap.height == before.height
                        val candidateRegions = if (surfaceValid) before.systemBarRegions else emptyList()
                        // Two asynchronous screenshots must agree on every visible app pixel.
                        val sharedDisplayHash = if (candidateRegions.isNotEmpty()) hashPixels(displayBitmap, candidateRegions) else null
                        val sharedSurfaceHash = if (candidateRegions.isNotEmpty() &&
                            displayBitmap.colorSpace == appBitmap?.colorSpace)
                            hashPixels(appBitmap!!, candidateRegions) else null
                        val ignored = if (sharedDisplayHash != null && sharedDisplayHash == sharedSurfaceHash)
                            candidateRegions else emptyList()
                        val mode = if (surfaceValid && ignored.isNotEmpty()) "verified_system_bars"
                            else if (surfaceValid) "display_and_app_window_exact" else "full_display_exact"
                        val displayHash = if (ignored.isNotEmpty()) sharedDisplayHash!! else hashPixels(displayBitmap, emptyList())
                        val surfaceHash = if (surfaceValid) hashPixels(appBitmap!!, emptyList()) else "none"
                        finishStage = "jpeg"
                        val image = jpeg(displayBitmap)
                        if (image == null) { recordCaptureFailure(attempt, "jpeg", "JPEG_ENCODE_FAILED"); null }
                        else CapturedScreen(image,
                            hash("$mode|${before.hash}|${ignored.joinToString("|") { it.flattenToString() }}|$displayHash|$surfaceHash"), before.hash,
                            before.windowId, before.width, before.height, before.rotation,
                            expectedPackage, mode, before.protectedRegions.map { Rect(it) }, Region(before.targetRegion),
                            if (BuildConfig.DEBUG) displayHash else null,
                            if (BuildConfig.DEBUG) surfaceHash else null,
                            if (BuildConfig.DEBUG) ignored.map { Rect(it) } else emptyList())
                    }
                } catch (_: Exception) { recordCaptureFailure(attempt, finishStage, "CAPTURE_FINISH_EXCEPTION"); null }
                appBitmap?.recycle(); displayBitmap.recycle()
                if (result != null && attempt == reviewCaptureAttempt) reviewCaptureFailure = null
                if (epochInterrupted) try { onRetryableCaptureFailure(null) } catch (_: Exception) { }
                callback(result)
            }
            if (Build.VERSION.SDK_INT >= 34 && before.bounds == Rect(0, 0, before.width, before.height))
                captureBitmap(before.windowId, { reason, code -> captureFailed("window_screenshot", reason, code, displayBitmap) }) { appBitmap ->
                    if (appBitmap == null) { displayBitmap.recycle(); callback(null) }
                    else finish(appBitmap)
                }
            else finish(null)
        }
    }

    fun getReviewWindowDiagnostics(): String {
        val real = realDisplay()
        val entries = JSONArray()
        val allWindows = windows
        try {
            for (window in allWindows.sortedBy { it.layer }) {
                val bounds = Rect().also { window.getBoundsInScreen(it) }
                val region = Region().also { window.getRegionInScreen(it) }
                val root = window.root
                try {
                    entries.put(JSONObject().apply {
                        put("id", window.id); put("type", window.type); put("layer", window.layer)
                        put("title", window.title?.toString() ?: JSONObject.NULL)
                        put("bounds", bounds.flattenToString()); put("region", region.toString())
                        put("active", window.isActive); put("focused", window.isFocused)
                        val pkg = root?.packageName?.toString().orEmpty()
                        put("rootPackage", if (pkg.isEmpty()) JSONObject.NULL else pkg)
                        put("rootViewId", root?.viewIdResourceName ?: JSONObject.NULL)
                        put("systemOwned", isSystemOwned(pkg))
                        if (root != null && pkg in setOf("com.android.systemui", "com.android.launcher3")) {
                            val descendants = JSONArray()
                            var count = 0
                            var truncated = false
                            fun collectIds(node: AccessibilityNodeInfo, depth: Int, path: String) {
                                if (count >= 48 || depth > 6) { truncated = true; return }
                                count += 1
                                val frame = Rect().also { node.getBoundsInScreen(it) }
                                descendants.put(JSONObject().apply {
                                    put("path", path); put("id", node.viewIdResourceName ?: JSONObject.NULL)
                                    put("class", node.className?.toString() ?: JSONObject.NULL)
                                    put("bounds", frame.flattenToString())
                                })
                                for (index in 0 until node.childCount) {
                                    if (count >= 48) { truncated = true; break }
                                    val child = node.getChild(index)
                                    if (child == null) { truncated = true; continue }
                                    try { collectIds(child, depth + 1, "$path/$index") }
                                    finally { releaseNode(child) }
                                }
                            }
                            collectIds(root, 0, "0")
                            put("roleNodes", descendants); put("roleNodesTruncated", truncated)
                        }
                    })
                } finally { releaseNode(root) }
            }
            return JSONObject().apply {
                put("displayId", Display.DEFAULT_DISPLAY)
                put("width", real?.first?.x ?: 0); put("height", real?.first?.y ?: 0)
                put("rotation", real?.second ?: -1); put("windows", entries)
                if (BuildConfig.DEBUG) put("captureFailure", reviewCaptureFailure ?: JSONObject.NULL)
            }.toString()
        } finally { allWindows.forEach { releaseWindow(it) } }
    }

    fun isReviewedStructureCurrent(screen: CapturedScreen): Boolean = try {
        reviewStructure(screen.packageName)?.hash == screen.structureRevision
    } catch (_: Exception) { false }

    fun allowedInReviewedScreen(action: String, args: JSONObject, screen: CapturedScreen): Boolean = try {
        if (currentPackageName() != screen.packageName) false
        else {
            fun allowed(rect: Rect): Boolean {
                if (rect.left < 0 || rect.top < 0 || rect.right > screen.width ||
                    rect.bottom > screen.height || rect.isEmpty) return false
                val outsideTarget = Region(rect)
                outsideTarget.op(screen.targetRegion, Region.Op.DIFFERENCE)
                return outsideTarget.isEmpty && screen.protectedRegions.none { Rect.intersects(it, rect) }
            }
            when (action) {
                "tap", "long_press" -> {
                    val x = (args.getInt("x") / 1000f * screen.width).toInt()
                    val y = (args.getInt("y") / 1000f * screen.height).toInt()
                    allowed(Rect(x, y, x + 1, y + 1))
                }
                "swipe", "scroll" -> when (args.getString("direction")) {
                    "up", "down" -> allowed(Rect(screen.width / 2, (screen.height * .3f).toInt(),
                        screen.width / 2 + 1, (screen.height * .7f).toInt() + 1))
                    "left", "right" -> allowed(Rect((screen.width * .2f).toInt(), screen.height / 2,
                        (screen.width * .8f).toInt() + 1, screen.height / 2 + 1))
                    else -> false
                }
                "type" -> {
                    val root = rootInActiveWindow
                    var node: AccessibilityNodeInfo? = null
                    try {
                        node = root?.findFocus(AccessibilityNodeInfo.FOCUS_INPUT)
                        val bounds = Rect()
                        if (node == null || !node.refresh()) false
                        else {
                            node.getBoundsInScreen(bounds)
                            node.packageName?.toString() == screen.packageName && node.isEditable &&
                                node.isEnabled && !node.isPassword && allowed(bounds)
                        }
                    } finally { if (node !== root) releaseNode(node); releaseNode(root) }
                }
                "back", "home", "wait", "done" -> true
                else -> false
            }
        }
    } catch (_: Exception) { false }

    fun tap(x: Int, y: Int, callback: (Boolean) -> Unit): Boolean {
        if (x !in 0..1000 || y !in 0..1000) {
            callback(false)
            return false
        }
        val size = realDisplay()?.first ?: run { callback(false); return false }
        val path = Path().apply {
            moveTo((x / 1000f) * size.x, (y / 1000f) * size.y)
        }
        return dispatchGesture(
            GestureDescription.Builder().addStroke(GestureDescription.StrokeDescription(path, 0, 100)).build(),
            object : GestureResultCallback() {
                override fun onCompleted(gestureDescription: GestureDescription) = callback(true)
                override fun onCancelled(gestureDescription: GestureDescription) = callback(false)
            },
            null,
        )
    }

    fun longPress(x: Int, y: Int, callback: (Boolean) -> Unit): Boolean {
        if (x !in 0..1000 || y !in 0..1000) {
            callback(false)
            return false
        }
        val size = realDisplay()?.first ?: run { callback(false); return false }
        val path = Path().apply {
            moveTo((x / 1000f) * size.x, (y / 1000f) * size.y)
        }
        return dispatchGesture(
            GestureDescription.Builder().addStroke(GestureDescription.StrokeDescription(path, 0, 1_000)).build(),
            object : GestureResultCallback() {
                override fun onCompleted(gestureDescription: GestureDescription) = callback(true)
                override fun onCancelled(gestureDescription: GestureDescription) = callback(false)
            },
            null,
        )
    }

    fun swipe(direction: String, callback: (Boolean) -> Unit): Boolean {
        val size = realDisplay()?.first ?: run { callback(false); return false }
        val width = size.x.toFloat()
        val height = size.y.toFloat()
        val path = Path()
        when (direction) {
            "up" -> { path.moveTo(width / 2, height * 0.7f); path.lineTo(width / 2, height * 0.3f) }
            "down" -> { path.moveTo(width / 2, height * 0.3f); path.lineTo(width / 2, height * 0.7f) }
            "left" -> { path.moveTo(width * 0.8f, height / 2); path.lineTo(width * 0.2f, height / 2) }
            "right" -> { path.moveTo(width * 0.2f, height / 2); path.lineTo(width * 0.8f, height / 2) }
            else -> { callback(false); return false }
        }
        return dispatchGesture(
            GestureDescription.Builder().addStroke(GestureDescription.StrokeDescription(path, 0, 300)).build(),
            object : GestureResultCallback() {
                override fun onCompleted(gestureDescription: GestureDescription) = callback(true)
                override fun onCancelled(gestureDescription: GestureDescription) = callback(false)
            },
            null,
        )
    }

    fun typeText(text: String, expectedPackage: String): Boolean {
        if (text.isEmpty() || text.length > 2_000 || expectedPackage.isBlank()) return false
        val root = rootInActiveWindow ?: return false
        var node: AccessibilityNodeInfo? = null
        try {
            if (root.packageName?.toString() != expectedPackage) return false
            node = root.findFocus(AccessibilityNodeInfo.FOCUS_INPUT) ?: return false
            if (!node.refresh() || node.packageName?.toString() != expectedPackage ||
                currentPackageName() != expectedPackage || !node.isEditable || !node.isEnabled || node.isPassword) return false
            val arguments = android.os.Bundle().apply {
                putCharSequence(AccessibilityNodeInfo.ACTION_ARGUMENT_SET_TEXT_CHARSEQUENCE, text)
            }
            return node.performAction(AccessibilityNodeInfo.ACTION_SET_TEXT, arguments)
        } finally { if (node !== root) releaseNode(node); releaseNode(root) }
    }

    fun tapByText(text: String, expectedPackage: String): Boolean {
        if (text.isBlank() || text.length > 200) return false
        val root = rootInActiveWindow ?: return false
        if (expectedPackage.isBlank() || root.packageName?.toString() != expectedPackage) return false
        val node = findNodeByText(root, text) ?: return false
        if (node.packageName?.toString() != expectedPackage || currentPackageName() != expectedPackage) return false
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
