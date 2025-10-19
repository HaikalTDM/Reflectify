import { NativeModulesProxy, requireNativeModule } from 'expo-modules-core';
import { Platform } from 'react-native';

// Define the native module interface
interface ScreenTimeModule {
  /**
   * Check if the app has usage stats permission
   */
  hasUsageStatsPermission(): Promise<boolean>;

  /**
   * Open the usage stats settings page where user can grant permission
   */
  requestUsageStatsPermission(): Promise<void>;

  /**
   * Get total screen time in minutes for the specified time period
   * @param startTime - Start time in milliseconds
   * @param endTime - End time in milliseconds
   * @returns Total screen time in minutes
   */
  getScreenTime(startTime: number, endTime: number): Promise<number>;

  /**
   * Get screen time for today (since midnight)
   * @returns Total screen time in minutes
   */
  getTodayScreenTime(): Promise<number>;
}

// For iOS or when module is not available, return stub implementation
const stubModule: ScreenTimeModule = {
  hasUsageStatsPermission: async () => false,
  requestUsageStatsPermission: async () => {
    console.warn('Screen time tracking is only available on Android');
  },
  getScreenTime: async () => 0,
  getTodayScreenTime: async () => 0,
};

let ScreenTime: ScreenTimeModule;

try {
  if (Platform.OS === 'android') {
    // Try to load the native module
    ScreenTime = requireNativeModule('ScreenTimeModule') as ScreenTimeModule;
  } else {
    ScreenTime = stubModule;
  }
} catch (error) {
  console.warn('ScreenTimeModule not available:', error);
  ScreenTime = stubModule;
}

export default ScreenTime;

/**
 * Utility functions for screen time tracking
 */
export const ScreenTimeUtils = {
  /**
   * Check if permission is granted
   */
  async checkPermission(): Promise<boolean> {
    try {
      return await ScreenTime.hasUsageStatsPermission();
    } catch (error) {
      console.error('Error checking permission:', error);
      return false;
    }
  },

  /**
   * Request usage stats permission (opens system settings)
   */
  async requestPermission(): Promise<void> {
    try {
      await ScreenTime.requestUsageStatsPermission();
    } catch (error) {
      console.error('Error requesting permission:', error);
    }
  },

  /**
   * Get screen time for the last N minutes
   */
  async getScreenTimeLastMinutes(minutes: number): Promise<number> {
    try {
      const endTime = Date.now();
      const startTime = endTime - minutes * 60 * 1000;
      return await ScreenTime.getScreenTime(startTime, endTime);
    } catch (error) {
      console.error('Error getting screen time:', error);
      return 0;
    }
  },

  /**
   * Get screen time for today
   */
  async getTodayScreenTime(): Promise<number> {
    try {
      return await ScreenTime.getTodayScreenTime();
    } catch (error) {
      console.error('Error getting today screen time:', error);
      return 0;
    }
  },

  /**
   * Get screen time since a specific timestamp
   */
  async getScreenTimeSince(timestamp: number): Promise<number> {
    try {
      const now = Date.now();
      return await ScreenTime.getScreenTime(timestamp, now);
    } catch (error) {
      console.error('Error getting screen time since timestamp:', error);
      return 0;
    }
  },
};

