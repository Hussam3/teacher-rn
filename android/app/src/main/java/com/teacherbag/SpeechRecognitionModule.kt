package com.teacherbag

import android.content.ComponentName
import android.content.Intent
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.speech.RecognitionListener
import android.speech.RecognitionService
import android.speech.RecognizerIntent
import android.speech.SpeechRecognizer
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.WritableMap
import com.facebook.react.modules.core.DeviceEventManagerModule
import java.util.Locale

/**
 * Android speech-to-text bridge independent of the outdated VoiceModule.
 *
 * Gboard itself does not expose a public API. This module prefers the available
 * Google recognition service used by Google's voice features, then falls back to
 * the device default recognizer. Every callback is scoped to its recognition
 * session and accepts empty result bundles safely.
 */
class SpeechRecognitionModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

  private val mainHandler = Handler(Looper.getMainLooper())
  private var recognizer: SpeechRecognizer? = null
  private var sessionId = 0L
  private var isRecognizing = false

  override fun getName(): String = "SpeechRecognition"

  @ReactMethod
  fun start(locale: String, options: ReadableMap, promise: Promise) {
    runOnMain {
      try {
        if (!SpeechRecognizer.isRecognitionAvailable(reactApplicationContext)) {
          promise.reject(
              "SPEECH_RECOGNITION_UNAVAILABLE",
              "لا توجد خدمة للتعرف على الصوت مفعلة على هذا الجهاز.")
          return@runOnMain
        }

        val newSessionId = ++sessionId
        releaseRecognizer()
        val newRecognizer = createRecognizer()
        recognizer = newRecognizer
        newRecognizer.setRecognitionListener(SessionListener(newSessionId))
        newRecognizer.startListening(createIntent(locale, options))
        isRecognizing = true
        promise.resolve(null)
      } catch (error: Throwable) {
        releaseRecognizer()
        promise.reject("SPEECH_RECOGNITION_START_ERROR", error)
      }
    }
  }

  @ReactMethod
  fun stop(promise: Promise) {
    runOnMain {
      try {
        recognizer?.stopListening()
        promise.resolve(null)
      } catch (error: Throwable) {
        promise.reject("SPEECH_RECOGNITION_STOP_ERROR", error)
      }
    }
  }

  @ReactMethod
  fun cancel(promise: Promise) {
    runOnMain {
      try {
        ++sessionId
        recognizer?.cancel()
        isRecognizing = false
        promise.resolve(null)
      } catch (error: Throwable) {
        promise.reject("SPEECH_RECOGNITION_CANCEL_ERROR", error)
      }
    }
  }

  @ReactMethod
  fun destroy(promise: Promise) {
    runOnMain {
      try {
        ++sessionId
        releaseRecognizer()
        promise.resolve(null)
      } catch (error: Throwable) {
        promise.reject("SPEECH_RECOGNITION_DESTROY_ERROR", error)
      }
    }
  }

  @ReactMethod
  fun isAvailable(promise: Promise) {
    promise.resolve(SpeechRecognizer.isRecognitionAvailable(reactApplicationContext))
  }

  private fun runOnMain(action: () -> Unit) {
    if (Looper.myLooper() == Looper.getMainLooper()) {
      action()
    } else {
      mainHandler.post(action)
    }
  }

  private fun releaseRecognizer() {
    recognizer?.destroy()
    recognizer = null
    isRecognizing = false
  }

  private fun createRecognizer(): SpeechRecognizer {
    val googleService = reactApplicationContext.packageManager
        .queryIntentServices(Intent(RecognitionService.SERVICE_INTERFACE), 0)
        .firstOrNull { service -> service.serviceInfo.packageName in GOOGLE_RECOGNIZER_PACKAGES }

    return if (googleService != null) {
      val component = ComponentName(
          googleService.serviceInfo.packageName,
          googleService.serviceInfo.name)
      SpeechRecognizer.createSpeechRecognizer(reactApplicationContext, component)
    } else {
      SpeechRecognizer.createSpeechRecognizer(reactApplicationContext)
    }
  }

  private fun createIntent(locale: String, options: ReadableMap): Intent {
    return Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
      putExtra(
          RecognizerIntent.EXTRA_LANGUAGE_MODEL,
          RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
      putExtra(
          RecognizerIntent.EXTRA_LANGUAGE,
          locale.ifBlank { Locale.getDefault().toLanguageTag() })

      if (options.hasKey("EXTRA_MAX_RESULTS") && !options.isNull("EXTRA_MAX_RESULTS")) {
        putExtra(
            RecognizerIntent.EXTRA_MAX_RESULTS,
            options.getDouble("EXTRA_MAX_RESULTS").toInt())
      }
      if (options.hasKey("EXTRA_PARTIAL_RESULTS") && !options.isNull("EXTRA_PARTIAL_RESULTS")) {
        putExtra(
            RecognizerIntent.EXTRA_PARTIAL_RESULTS,
            options.getBoolean("EXTRA_PARTIAL_RESULTS"))
      }
      if (options.hasKey("EXTRA_SPEECH_INPUT_MINIMUM_LENGTH_MILLIS") &&
          !options.isNull("EXTRA_SPEECH_INPUT_MINIMUM_LENGTH_MILLIS")) {
        putExtra(
            RecognizerIntent.EXTRA_SPEECH_INPUT_MINIMUM_LENGTH_MILLIS,
            options.getDouble("EXTRA_SPEECH_INPUT_MINIMUM_LENGTH_MILLIS").toInt())
      }
      if (options.hasKey("EXTRA_SPEECH_INPUT_COMPLETE_SILENCE_LENGTH_MILLIS") &&
          !options.isNull("EXTRA_SPEECH_INPUT_COMPLETE_SILENCE_LENGTH_MILLIS")) {
        putExtra(
            RecognizerIntent.EXTRA_SPEECH_INPUT_COMPLETE_SILENCE_LENGTH_MILLIS,
            options.getDouble("EXTRA_SPEECH_INPUT_COMPLETE_SILENCE_LENGTH_MILLIS").toInt())
      }
      if (options.hasKey("EXTRA_SPEECH_INPUT_POSSIBLY_COMPLETE_SILENCE_LENGTH_MILLIS") &&
          !options.isNull("EXTRA_SPEECH_INPUT_POSSIBLY_COMPLETE_SILENCE_LENGTH_MILLIS")) {
        putExtra(
            RecognizerIntent.EXTRA_SPEECH_INPUT_POSSIBLY_COMPLETE_SILENCE_LENGTH_MILLIS,
            options.getDouble("EXTRA_SPEECH_INPUT_POSSIBLY_COMPLETE_SILENCE_LENGTH_MILLIS").toInt())
      }
    }
  }

  private fun emit(eventName: String, payload: WritableMap) {
    reactApplicationContext
        .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
        .emit(eventName, payload)
  }

  private fun emitValue(eventName: String, results: Bundle?) {
    val values = Arguments.createArray()
    results
        ?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
        .orEmpty()
        .forEach(values::pushString)

    val event = Arguments.createMap()
    event.putArray("value", values)
    emit(eventName, event)
  }

  private inner class SessionListener(private val listenerSessionId: Long) : RecognitionListener {
    private fun isCurrentSession(): Boolean = listenerSessionId == sessionId

    override fun onReadyForSpeech(params: Bundle?) {
      if (!isCurrentSession()) return
      emit(EVENT_START, Arguments.createMap().apply { putBoolean("error", false) })
    }

    override fun onBeginningOfSpeech() = Unit

    override fun onRmsChanged(rmsdB: Float) = Unit

    override fun onBufferReceived(buffer: ByteArray?) = Unit

    override fun onEndOfSpeech() {
      if (!isCurrentSession()) return
      isRecognizing = false
      emit(EVENT_END, Arguments.createMap().apply { putBoolean("error", false) })
    }

    override fun onError(error: Int) {
      if (!isCurrentSession()) return
      isRecognizing = false
      val errorValue = Arguments.createMap().apply {
        putString("code", error.toString())
        putString("message", "$error/${errorMessage(error)}")
      }
      emit(EVENT_ERROR, Arguments.createMap().apply { putMap("error", errorValue) })
    }

    override fun onResults(results: Bundle?) {
      if (!isCurrentSession()) return
      isRecognizing = false
      emitValue(EVENT_RESULTS, results)
    }

    override fun onPartialResults(partialResults: Bundle?) {
      if (!isCurrentSession()) return
      emitValue(EVENT_PARTIAL_RESULTS, partialResults)
    }

    override fun onEvent(eventType: Int, params: Bundle?) = Unit
  }

  companion object {
    private val GOOGLE_RECOGNIZER_PACKAGES = setOf(
        "com.google.android.googlequicksearchbox",
        "com.google.android.tts")

    const val EVENT_START = "teacherbagSpeechStart"
    const val EVENT_END = "teacherbagSpeechEnd"
    const val EVENT_RESULTS = "teacherbagSpeechResults"
    const val EVENT_PARTIAL_RESULTS = "teacherbagSpeechPartialResults"
    const val EVENT_ERROR = "teacherbagSpeechError"

    private fun errorMessage(error: Int): String = when (error) {
      SpeechRecognizer.ERROR_AUDIO -> "Audio recording error"
      SpeechRecognizer.ERROR_CLIENT -> "Client side error"
      SpeechRecognizer.ERROR_INSUFFICIENT_PERMISSIONS -> "Insufficient permissions"
      SpeechRecognizer.ERROR_NETWORK -> "Network error"
      SpeechRecognizer.ERROR_NETWORK_TIMEOUT -> "Network timeout"
      SpeechRecognizer.ERROR_NO_MATCH -> "No match"
      SpeechRecognizer.ERROR_RECOGNIZER_BUSY -> "Recognition service busy"
      SpeechRecognizer.ERROR_SERVER -> "Server error"
      SpeechRecognizer.ERROR_SPEECH_TIMEOUT -> "No speech input"
      else -> "Unknown recognition error"
    }
  }
}
