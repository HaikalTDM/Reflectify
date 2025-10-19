package expo.modules.screentime

import android.app.AppOpsManager
import android.app.usage.UsageStats
import android.app.usage.UsageStatsManager
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.Process
import android.provider.Settings
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.util.*

class ScreenTimeModule : Module() {
  // Module name that will be used in JavaScript
  override fun definition() = ModuleDefinition {
    Name("ScreenTimeModule")

    // Check if app has usage stats permission
    AsyncFunction("hasUsageStatsPermission") {
      hasUsageStatsPermission()
    }

    // Request usage stats permission (opens system settings)
    AsyncFunction("requestUsageStatsPermission") {
      requestUsageStatsPermission()
    }

    // Get screen time for a specific time period
    AsyncFunction("getScreenTime") { startTime: Long, endTime: Long ->
      getScreenTime(startTime, endTime)
    }

    // Get screen time for today (since midnight)
    AsyncFunction("getTodayScreenTime") {
      getTodayScreenTime()
    }
  }

  private val context: Context
    get() = appContext.reactContext ?: throw IllegalStateException("React context is not available")

  /**
   * Check if the app has PACKAGE_USAGE_STATS permission
   */
  private fun hasUsageStatsPermission(): Boolean {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.LOLLIPOP) {
      return false
    }

    val appOps = context.getSystemService(Context.APP_OPS_SERVICE) as AppOpsManager
    val mode = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
      appOps.unsafeCheckOpNoThrow(
        AppOpsManager.OPSTR_GET_USAGE_STATS,
        Process.myUid(),
        context.packageName
      )
    } else {
      @Suppress("DEPRECATION")
      appOps.checkOpNoThrow(
        AppOpsManager.OPSTR_GET_USAGE_STATS,
        Process.myUid(),
        context.packageName
      )
    }

    return mode == AppOpsManager.MODE_ALLOWED
  }

  /**
   * Request usage stats permission by opening system settings
   */
  private fun requestUsageStatsPermission() {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.LOLLIPOP) {
      return
    }

    val intent = Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS)
    intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK
    context.startActivity(intent)
  }

  /**
   * Get total screen time in minutes for the specified time period
   */
  private fun getScreenTime(startTime: Long, endTime: Long): Double {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.LOLLIPOP) {
      return 0.0
    }

    if (!hasUsageStatsPermission()) {
      throw Exception("Usage stats permission not granted")
    }

    val usageStatsManager = context.getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager
    
    // Query usage stats for the specified time period
    val usageStatsList = usageStatsManager.queryUsageStats(
      UsageStatsManager.INTERVAL_DAILY,
      startTime,
      endTime
    )

    // Calculate total time in foreground
    var totalTimeInForeground = 0L
    for (usageStats in usageStatsList) {
      totalTimeInForeground += usageStats.totalTimeInForeground
    }

    // Convert milliseconds to minutes
    return totalTimeInForeground / (1000.0 * 60.0)
  }

  /**
   * Get screen time for today (since midnight)
   */
  private fun getTodayScreenTime(): Double {
    // Get midnight today
    val calendar = Calendar.getInstance()
    calendar.set(Calendar.HOUR_OF_DAY, 0)
    calendar.set(Calendar.MINUTE, 0)
    calendar.set(Calendar.SECOND, 0)
    calendar.set(Calendar.MILLISECOND, 0)
    val startTime = calendar.timeInMillis
    val endTime = System.currentTimeMillis()

    return getScreenTime(startTime, endTime)
  }
}

