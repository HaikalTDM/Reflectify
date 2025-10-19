# Device Screen Time Tracking Guide

## Overview

Reflectify now supports **device-wide screen time tracking** on Android! This feature monitors your total phone usage across ALL apps (not just Reflectify) and triggers reflection screens when you've used your phone for the configured duration.

## How It Works

### Traditional App-Only Mode (Default)
- Tracks time only when Reflectify is open
- Works on both Android and iOS
- No special permissions required

### Device Screen Time Mode (Android Only)
- Tracks total phone usage across ALL apps
- Works even when Reflectify is closed
- Requires special permission: `PACKAGE_USAGE_STATS`
- Uses Android's UsageStatsManager API

## Usage Example

If you set Usage Lock to **1 hour** and enable **Device Screen Time**:
- Phone usage tracked across all apps
- After 1 hour of total screen time, Reflectify triggers a reflection lock
- User must complete a hadith reflection to continue
- Timer resets after completing reflection

**Example scenario:**
- User spends 4 hours on phone throughout the day
- With 1-hour limit, they get locked 4 times
- Each lock requires completing a hadith reflection

## Setup Instructions

### For Users

1. **Open Settings** in Reflectify
2. Navigate to **Usage Lock** section
3. Set your desired limit (1 hour or 2 hours)
4. Toggle **"Track Device Screen Time"**
5. Grant permission when prompted:
   - Tap "Open Settings"
   - Find "Reflectify" in the list
   - Toggle "Permit usage access"
   - Return to Reflectify

### For Developers

#### Building with EAS Build

The native module is automatically included when building with EAS:

```bash
# Build preview APK
eas build --platform android --profile preview

# Build production AAB
eas build --platform android --profile production
```

#### Local Development

If you want to test locally:

```bash
# Install dependencies
npm install

# Prebuild (generates native folders)
npx expo prebuild

# Run on Android
npx expo run:android
```

**Note:** Device screen time tracking will NOT work in Expo Go. You must build a development client or production build.

## Technical Details

### Architecture

```
┌─────────────────────────────────────┐
│   React Native Layer                │
│   (modules/screen-time/index.ts)    │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│   Native Android Module             │
│   (ScreenTimeModule.kt)             │
│   - Uses UsageStatsManager          │
│   - Aggregates app usage stats      │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│   Usage Tracker                     │
│   (utils/usageTracker.ts)           │
│   - Checks usage periodically       │
│   - Triggers reflection when needed │
└─────────────────────────────────────┘
```

### Files Created

1. **`modules/screen-time/index.ts`** - TypeScript wrapper for native module
2. **`modules/screen-time/android/src/main/java/expo/modules/screentime/ScreenTimeModule.kt`** - Native Android implementation
3. **`modules/screen-time/expo-module.config.json`** - Expo module configuration
4. **`modules/screen-time/app.plugin.js`** - Config plugin to add Android permissions
5. **`modules/screen-time/package.json`** - Module package definition

### Files Modified

1. **`app.json`** - Added config plugin
2. **`utils/usageTracker.ts`** - Integrated device screen time tracking
3. **`app/settings.tsx`** - Added UI for toggling and permission request

### Permissions

The following permission is automatically added to `AndroidManifest.xml`:

```xml
<uses-permission 
  android:name="android.permission.PACKAGE_USAGE_STATS"
  tools:ignore="ProtectedPermissions" />
```

This is a **protected permission** that requires user approval via system settings (cannot be granted at runtime).

## API Reference

### ScreenTime Module

```typescript
import ScreenTime, { ScreenTimeUtils } from '../modules/screen-time';

// Check if permission is granted
const hasPermission = await ScreenTimeUtils.checkPermission();

// Request permission (opens system settings)
await ScreenTimeUtils.requestPermission();

// Get screen time for last N minutes
const minutes = await ScreenTimeUtils.getScreenTimeLastMinutes(60);

// Get screen time for today
const todayMinutes = await ScreenTimeUtils.getTodayScreenTime();

// Get screen time since specific timestamp
const sinceMinutes = await ScreenTimeUtils.getScreenTimeSince(timestamp);
```

### Usage Tracker

```typescript
import { usageTracker } from '../utils/usageTracker';

// Enable device screen time tracking
await usageTracker.enableDeviceScreenTime();

// Disable device screen time tracking
await usageTracker.disableDeviceScreenTime();

// Check if enabled
const isEnabled = await usageTracker.isDeviceScreenTimeEnabled();

// Check if has permission
const hasPermission = await usageTracker.hasScreenTimePermission();

// Request permission
await usageTracker.requestScreenTimePermission();
```

## Troubleshooting

### Permission Not Granted

**Problem:** User toggled the feature but permission wasn't granted.

**Solution:**
1. Go to Android Settings
2. Apps → Special app access
3. Usage access
4. Find "Reflectify"
5. Toggle ON

### Feature Not Working

**Problem:** Device screen time tracking is enabled but doesn't work.

**Checks:**
1. Ensure you're on Android (iOS not supported)
2. Verify permission is granted
3. Check Usage Lock is enabled (not "Off")
4. Ensure app is built with EAS (not Expo Go)

### Fallback Behavior

If device screen time tracking fails (no permission, Android < 5.0, or error), the app automatically falls back to **app-only tracking**.

## Privacy & Security

- **Data stays local** - Screen time data is only used locally and never sent to servers
- **Minimal access** - Only aggregate usage stats are accessed, not individual app activities
- **User control** - Users can disable at any time
- **Parental control** - Protected by PIN to prevent children from disabling

## Limitations

1. **Android only** - iOS doesn't provide similar APIs
2. **Android 5.0+** - Requires API level 21 or higher
3. **Approximate timing** - Android's usage stats update periodically, not in real-time
4. **System delays** - May take a few seconds for usage stats to refresh

## Future Enhancements

Potential improvements:
- [ ] Background service to check more frequently
- [ ] Customizable check intervals
- [ ] Usage statistics dashboard
- [ ] Per-app tracking (which apps used most)
- [ ] Weekly/monthly reports

## Support

If you encounter issues:
1. Check this guide
2. Review console logs for errors
3. Verify Android version compatibility
4. Ensure proper build process (EAS Build)

---

**Built with ❤️ for mindful phone usage and spiritual growth**

