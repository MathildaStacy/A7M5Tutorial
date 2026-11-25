package com.shutteracademy

import android.os.Bundle
import android.view.View
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate
import com.swmansion.rnscreens.fragment.restoration.RNScreensFragmentFactory

class MainActivity : ReactActivity() {

  override fun onCreate(savedInstanceState: Bundle?) {
    // react-native-screens 的恢复工厂须先于系统恢复 Fragment 注册。
    supportFragmentManager.fragmentFactory = RNScreensFragmentFactory()
    super.onCreate(savedInstanceState)
    val content = findViewById<View>(android.R.id.content)
    val decor = window.decorView
    val origin = IntArray(2)
    val restingPadding = content.paddingBottom
    var imeBottom = 0
    fun fitKeyboard() {
      // Edge-to-edge leaves the React surface behind the IME. A resized window may
      // already exclude some or all of it, including when rotating or in split screen.
      content.getLocationInWindow(origin)
      val contentBottom = origin[1] + content.height
      decor.getLocationInWindow(origin)
      val covered = (contentBottom - (origin[1] + decor.height - imeBottom)).coerceIn(0, imeBottom)
      val bottom = restingPadding + covered
      if (content.paddingBottom != bottom) {
        content.setPadding(content.paddingLeft, content.paddingTop, content.paddingRight, bottom)
      }
    }
    ViewCompat.setOnApplyWindowInsetsListener(content) { view, insets ->
      imeBottom = insets.getInsets(WindowInsetsCompat.Type.ime()).bottom
      fitKeyboard()
      ViewCompat.onApplyWindowInsets(view, insets)
    }
    content.addOnLayoutChangeListener { _, _, _, _, _, _, _, _, _ -> fitKeyboard() }
    ViewCompat.requestApplyInsets(content)
  }

  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  override fun getMainComponentName(): String = "ShutterAcademy"

  /**
   * Returns the instance of the [ReactActivityDelegate]. We use [DefaultReactActivityDelegate]
   * which allows you to enable New Architecture with a single boolean flags [fabricEnabled]
   */
  override fun createReactActivityDelegate(): ReactActivityDelegate =
      DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)
}
