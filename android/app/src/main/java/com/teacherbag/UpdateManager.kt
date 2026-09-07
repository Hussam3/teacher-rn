package com.teacherbag

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.os.Handler
import android.os.Looper
import android.os.Process
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import java.io.File
import java.security.MessageDigest
import kotlin.system.exitProcess

/**
 * إدارة التحديثات الفورية (Live OTA Updates) على مستوى الأصلي (native).
 *
 * يوفّر للجافاسكربت:
 *  - documentDir: مسار مجلد الملفات الخاص بالتطبيق لوضع ملف الـ bundle فيه
 *  - restartApp(): إعادة تشغيل التطبيق بالكامل بعد تثبيت تحديث جديد
 *  - confirmUpdate(): تأكيد أن البندل الجديد يعمل (يُزيل علامة الحماية من الدوران)
 *
 * كما يوفّر للـ MainApplication:
 *  - resolveBundle(): اختيار البندل المشغَّل (المحدّث أو المدمج) مع:
 *      * التحقق من السلامة (SHA-256) عند كل إقلاع
 *      * حماية من تعليق/انهيار متكرر: إذا لم يؤكّد الجافاسكربت تشغيله بعد محاولتين،
 *        يُحذف البندل المُحدَّث ويُرجَع تلقائياً إلى البندل المدمج داخل الـ APK.
 */
class UpdateManager(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

  override fun getName(): String = "UpdateManager"

  override fun getConstants(): Map<String, Any> {
    return mapOf(
        "documentDir" to reactApplicationContext.filesDir.absolutePath,
        "otaEnabled" to BuildConfig.ENABLE_OTA,
    )
  }

  /** إعادة تشغيل التطبيق بالكامل بعد تثبيت تحديث فوري جديد. */
  @ReactMethod
  fun restartApp(promise: Promise) {
    try {
      val context = reactApplicationContext.applicationContext
      // A plain RTC alarm is inexact and may be deferred after this process exits.
      // Use a fresh launcher task plus an idle-safe wakeup alarm before terminating.
      val restartIntent =
          Intent.makeRestartActivityTask(ComponentName(context, MainActivity::class.java))
      val pendingIntent =
          PendingIntent.getActivity(
              context,
              0,
              restartIntent,
              PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
      val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
      alarmManager.setAndAllowWhileIdle(
          AlarmManager.RTC_WAKEUP,
          System.currentTimeMillis() + 200,
          pendingIntent)
      promise.resolve(true)
      Handler(Looper.getMainLooper()).postDelayed({
        Process.killProcess(Process.myPid())
        exitProcess(0)
      }, 400)
    } catch (t: Throwable) {
      promise.reject("UPDATE_RESTART_ERROR", t)
    }
  }

  /**
   * تأكيد نجاح تشغيل البندل المحدّث. يُنادى من الجافاسكربت عند الإقلاع الناجح
   * ليزيل علامة "لم تتم التهيئة بعد" (توقف الحماية من الانهيار المتكرر).
   */
  @ReactMethod
  fun confirmUpdate() {
    try {
      confirm(reactApplicationContext.applicationContext)
    } catch (t: Throwable) {
      // تجاهل — الفشل هنا لا يمنع تشغيل التطبيق.
    }
  }

  companion object {
    const val OTA_DIR = "ota"
    const val OTA_BUNDLE_FILENAME = "index.android.bundle"
    const val OTA_STATE_FILENAME = "state.json"
    const val OTA_PENDING_FILENAME = "pending"
    const val MAX_UNCONFIRMED_BOOTS = 2

    /** إرجاع مسار البندل المُحدَّث القابل للتشغيل بعد كل فحوصات السلامة، أو null لاستعمال المدمج. */
    fun resolveBundle(context: Context): File? {
      val dir = File(context.filesDir, OTA_DIR)
      val bundle = File(dir, OTA_BUNDLE_FILENAME)
      if (!bundle.isFile || bundle.length() == 0L) return null

      // 1) التحقق من سلامة البندل (SHA-256) مقابل state.json.
      val expected = readExpectedHash(dir)
      if (expected != null && sha256Hex(bundle) != expected) {
        deleteOta(dir, bundle)
        return null
      }

      // 2) حماية من الانهيار المتكرر: يُرجَع إلى البندل المدمج إن لم يؤكّد
      //    الجافاسكربت تشغيل البندل الجديد بعد عدة محاولات إقلاع.
      val pending = File(dir, OTA_PENDING_FILENAME)
      val attempts = runCatching { pending.readText().trim().toIntOrNull() ?: 0 }.getOrDefault(0)
      if (attempts >= MAX_UNCONFIRMED_BOOTS) {
        deleteOta(dir, bundle)
        return null
      }
      pending.writeText((attempts + 1).toString())

      return bundle
    }

    /** تأكيد أن البندل الجديد يعمل — إزالة علامة الحماية من الانهيار المتكرر. */
    fun confirm(context: Context) {
      val pending = File(File(context.filesDir, OTA_DIR), OTA_PENDING_FILENAME)
      runCatching { if (pending.exists()) pending.delete() }
    }

    private fun deleteOta(dir: File, bundle: File) {
      runCatching { bundle.delete() }
      runCatching { File(dir, OTA_STATE_FILENAME).delete() }
      runCatching { File(dir, OTA_PENDING_FILENAME).delete() }
    }

    private fun readExpectedHash(dir: File): String? {
      val state = File(dir, OTA_STATE_FILENAME)
      if (!state.isFile) return null
      return try {
        val text = state.readText().trim()
        val start = text.indexOf("\"hash\"")
        if (start < 0) return null
        val valueStart = text.indexOf('"', start + 6)
        val valueEnd = text.indexOf('"', valueStart + 1)
        if (valueStart < 0 || valueEnd < 0) return null
        text.substring(valueStart + 1, valueEnd)
      } catch (t: Throwable) {
        null
      }
    }

    private fun sha256Hex(file: File): String {
      val digest = MessageDigest.getInstance("SHA-256")
      file.inputStream().use { input ->
        val buffer = ByteArray(64 * 1024)
        while (true) {
          val read = input.read(buffer)
          if (read < 0) break
          digest.update(buffer, 0, read)
        }
      }
      val bytes = digest.digest()
      return bytes.joinToString("") { "%02x".format(it) }
    }
  }
}
