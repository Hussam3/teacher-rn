package com.teacherbag

import android.app.Application
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeApplicationEntryPoint.loadReactNative
import com.facebook.react.defaults.DefaultReactHost.getDefaultReactHost
import com.facebook.react.common.build.ReactBuildConfig
import com.wenkesj.voice.VoicePackage

class MainApplication : Application(), ReactApplication {

  override val reactHost: ReactHost by lazy {
    // لا يُسمح بتشغيل بندل خارجي إلا في بناء توزيع مباشر صريح (-PenableOta=true).
    // بناء Google Play يشغّل دائماً البندل الموقّع داخل الـ AAB.
    val otaBundle: String? =
        if (!ReactBuildConfig.DEBUG && BuildConfig.ENABLE_OTA) {
          UpdateManager.resolveBundle(applicationContext)?.absolutePath
        } else {
          null
        }

    getDefaultReactHost(
      context = applicationContext,
      packageList =
        PackageList(this).packages.apply {
          // Packages that cannot be autolinked yet can be added manually here:
          if (BuildConfig.IS_LICENSE_ADMIN && none { it is ClipboardPackage }) {
            add(ClipboardPackage())
          }
          if (!BuildConfig.IS_LICENSE_ADMIN) {
            if (none { it is VoicePackage }) {
              add(VoicePackage())
            }
            if (none { it is SpeechRecognitionPackage }) {
              add(SpeechRecognitionPackage())
            }
          }
          if (BuildConfig.ENABLE_OTA && none { it is UpdateManagerPackage }) {
            add(UpdateManagerPackage())
          }
        },
      jsBundleFilePath = otaBundle,
    )
  }

  override fun onCreate() {
    super.onCreate()
    loadReactNative(this)
  }
}
