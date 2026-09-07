package com.teacherbag

import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

/** جسر صغير لحافظة Android، ويُسجّل في تطبيق الأدمن فقط. */
class ClipboardModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

  override fun getName(): String = "TeacherBagClipboard"

  @ReactMethod
  fun setString(value: String) {
    val clipboard =
        reactApplicationContext.getSystemService(Context.CLIPBOARD_SERVICE) as? ClipboardManager
    clipboard?.setPrimaryClip(ClipData.newPlainText("activation-code", value))
  }
}
