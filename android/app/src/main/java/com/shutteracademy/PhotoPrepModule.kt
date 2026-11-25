package com.shutteracademy

import android.graphics.Bitmap
import android.graphics.ColorSpace
import android.graphics.ImageDecoder
import android.media.ExifInterface
import android.net.Uri
import android.util.Base64
import com.facebook.react.ReactPackage
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.WritableMap
import com.facebook.react.uimanager.ViewManager
import java.io.ByteArrayOutputStream
import java.util.concurrent.Executors
import kotlin.math.ln
import kotlin.math.max
import kotlin.math.roundToInt

class PhotoPrepPackage : ReactPackage {
    override fun createNativeModules(context: ReactApplicationContext): List<NativeModule> =
        listOf(PhotoPrepModule(context))
    override fun createViewManagers(context: ReactApplicationContext): List<ViewManager<*, *>> = emptyList()
}

class PhotoPrepModule(private val context: ReactApplicationContext) : ReactContextBaseJavaModule(context) {
    private val worker = Executors.newSingleThreadExecutor()
    override fun getName() = "PhotoPrep"
    override fun invalidate() {
        worker.shutdown()
        super.invalidate()
    }

    @ReactMethod
    fun prepare(value: String, promise: Promise) {
        worker.execute {
            try {
                val uri = Uri.parse(value)
                val source = ImageDecoder.createSource(context.contentResolver, uri)
                var format = ""
                val image = ImageDecoder.decodeBitmap(source) { decoder, info, _ ->
                    format = info.mimeType
                    require(format in setOf("image/jpeg", "image/heif", "image/heic")) { "请从相册选择 JPEG 或 HEIF 照片" }
                    val size = info.size
                    val scale = minOf(1.0, 1568.0 / max(size.width, size.height))
                    decoder.setTargetSize(max(1, (scale * size.width).roundToInt()), max(1, (scale * size.height).roundToInt()))
                    decoder.allocator = ImageDecoder.ALLOCATOR_SOFTWARE
                    decoder.setTargetColorSpace(ColorSpace.get(ColorSpace.Named.SRGB))
                }
                try {
                    val bytes = ByteArrayOutputStream()
                    check(image.compress(Bitmap.CompressFormat.JPEG, 85, bytes))
                    val result = Arguments.createMap()
                    result.putString("jpeg", Base64.encodeToString(bytes.toByteArray(), Base64.NO_WRAP))
                    result.putInt("width", image.width)
                    result.putInt("height", image.height)
                    result.putString("format", format)
                    result.putMap("exif", metadata(uri))
                    result.putMap("histogram", histogram(image))
                    promise.resolve(result)
                } finally {
                    image.recycle()
                }
            } catch (error: Exception) {
                promise.reject("PHOTO_PREP", "无法读取这张照片，请选择本机可打开的 JPEG 或 HEIF。", error)
            }
        }
    }

    private fun metadata(uri: Uri): WritableMap {
        val map = Arguments.createMap()
        val exif = runCatching {
            context.contentResolver.openInputStream(uri)?.use { ExifInterface(it) }
        }.getOrNull()
        // Only camera settings enter the model request. Original EXIF blocks stay on device.
        for ((field, tag) in mapOf("camera" to "Model", "lens" to "LensModel")) {
            map.putString(field, exif?.getAttribute(tag))
        }
        fun number(tag: String) = exif?.getAttributeDouble(tag, Double.NaN)?.takeIf { it.isFinite() }
        val aperture = number("FNumber")
        val seconds = number("ExposureTime")
        val iso = number("ISOSpeedRatings") ?: number("PhotographicSensitivity")
        val numbers = mapOf("aperture" to aperture, "shutter_seconds" to seconds, "iso" to iso,
            "focal_length" to number("FocalLength"), "ev_comp" to number("ExposureBiasValue"),
            "metering" to number("MeteringMode"), "wb" to number("WhiteBalance"))
        for ((key, n) in numbers) if (n == null) map.putNull(key) else map.putDouble(key, n)
        val modes = mapOf(1 to "M", 2 to "P", 3 to "A", 4 to "S")
        map.putString("mode", modes[number("ExposureProgram")?.toInt()])
        if (aperture != null && seconds != null && iso != null && aperture > 0 && seconds > 0 && iso > 0)
            map.putDouble("ev100", ln(aperture * aperture / seconds * 100 / iso) / ln(2.0))
        for (key in listOf("focus_mode", "focus_area", "af_point", "subject_detect", "steady_shot", "drive")) map.putNull(key)
        return map
    }

    private fun histogram(image: Bitmap): WritableMap {
        val bins = IntArray(256)
        val row = IntArray(image.width)
        for (y in 0 until image.height) {
            image.getPixels(row, 0, row.size, 0, y, row.size, 1)
            for (rgb in row) {
                val r = rgb ushr 16 and 255
                val g = rgb ushr 8 and 255
                val b = rgb and 255
                bins[(54 * r + 183 * g + 19 * b + 128) ushr 8]++
            }
        }
        val count = image.width * image.height
        val result = Arguments.createMap()
        for (percent in listOf(5, 50, 95)) {
            var sum = 0
            val level = bins.indices.first { sum += bins[it]; sum * 100L >= count.toLong() * percent }
            result.putInt("p" + percent, level)
        }
        result.putDouble("clipLow", bins.first().toDouble() / count)
        result.putDouble("clipHigh", bins.last().toDouble() / count)
        return result
    }
}
