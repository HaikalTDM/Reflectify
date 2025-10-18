import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';

const USAGE_LIMIT_KEY = 'usageLimitMinutes';
const USAGE_START_TIME_KEY = 'usageStartTime';
const USAGE_ENABLED_KEY = 'usageLockEnabled';

export type UsageLimit = '60' | '120' | 'disabled'; // 1 hour or 2 hours

export const usageTracker = {
  // Get current usage limit setting
  async getUsageLimit(): Promise<UsageLimit> {
    try {
      const limit = await AsyncStorage.getItem(USAGE_LIMIT_KEY);
      return (limit as UsageLimit) || 'disabled';
    } catch (error) {
      console.error('Error getting usage limit:', error);
      return 'disabled';
    }
  },

  // Set usage limit
  async setUsageLimit(minutes: UsageLimit): Promise<void> {
    try {
      await AsyncStorage.setItem(USAGE_LIMIT_KEY, minutes);
      if (minutes !== 'disabled') {
        // Reset the start time when enabling
        await this.resetUsageTime();
      }
    } catch (error) {
      console.error('Error setting usage limit:', error);
    }
  },

  // Check if usage lock is enabled
  async isEnabled(): Promise<boolean> {
    try {
      const limit = await this.getUsageLimit();
      return limit !== 'disabled';
    } catch (error) {
      return false;
    }
  },

  // Get start time of current usage session
  async getStartTime(): Promise<number | null> {
    try {
      const startTime = await AsyncStorage.getItem(USAGE_START_TIME_KEY);
      return startTime ? parseInt(startTime, 10) : null;
    } catch (error) {
      console.error('Error getting start time:', error);
      return null;
    }
  },

  // Reset usage time (start new session)
  async resetUsageTime(): Promise<void> {
    try {
      const now = Date.now();
      await AsyncStorage.setItem(USAGE_START_TIME_KEY, now.toString());
    } catch (error) {
      console.error('Error resetting usage time:', error);
    }
  },

  // Check if usage limit has been exceeded
  async checkUsageExceeded(): Promise<boolean> {
    try {
      const limit = await this.getUsageLimit();
      if (limit === 'disabled') return false;

      const startTime = await this.getStartTime();
      if (!startTime) {
        // No start time, set it now
        await this.resetUsageTime();
        return false;
      }

      const now = Date.now();
      const elapsedMinutes = (now - startTime) / (1000 * 60);
      const limitMinutes = parseInt(limit, 10);

      return elapsedMinutes >= limitMinutes;
    } catch (error) {
      console.error('Error checking usage:', error);
      return false;
    }
  },

  // Get remaining time in minutes
  async getRemainingTime(): Promise<number> {
    try {
      const limit = await this.getUsageLimit();
      if (limit === 'disabled') return Infinity;

      const startTime = await this.getStartTime();
      if (!startTime) return parseInt(limit, 10);

      const now = Date.now();
      const elapsedMinutes = (now - startTime) / (1000 * 60);
      const limitMinutes = parseInt(limit, 10);
      const remaining = Math.max(0, limitMinutes - elapsedMinutes);

      return Math.floor(remaining);
    } catch (error) {
      console.error('Error getting remaining time:', error);
      return 0;
    }
  },

  // Format remaining time as string
  formatRemainingTime(minutes: number): string {
    if (minutes === Infinity) return 'No limit';
    
    const hours = Math.floor(minutes / 60);
    const mins = Math.floor(minutes % 60);

    if (hours > 0) {
      return `${hours}h ${mins}m remaining`;
    }
    return `${mins}m remaining`;
  },
};

// Hook to track app usage and trigger reflection when limit is reached
export function useUsageTracker(onLimitReached: () => void) {
  const appState = useRef(AppState.currentState);
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Initialize usage tracking
    const initializeTracking = async () => {
      const isEnabled = await usageTracker.isEnabled();
      if (isEnabled) {
        const startTime = await usageTracker.getStartTime();
        if (!startTime) {
          await usageTracker.resetUsageTime();
        }
      }
    };

    initializeTracking();

    // Check usage every minute
    const checkUsage = async () => {
      const exceeded = await usageTracker.checkUsageExceeded();
      if (exceeded) {
        onLimitReached();
        // Reset after triggering
        await usageTracker.resetUsageTime();
      }
    };

    // Set up interval to check every minute
    checkIntervalRef.current = setInterval(checkUsage, 60000); // Check every 1 minute

    // Also check immediately
    checkUsage();

    // Listen to app state changes
    const subscription = AppState.addEventListener('change', async (nextAppState: AppStateStatus) => {
      if (appState.current === 'background' && nextAppState === 'active') {
        // App came to foreground, check usage
        const exceeded = await usageTracker.checkUsageExceeded();
        if (exceeded) {
          onLimitReached();
          await usageTracker.resetUsageTime();
        }
      }
      appState.current = nextAppState;
    });

    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
      subscription.remove();
    };
  }, [onLimitReached]);
}

