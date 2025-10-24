/**
 * Advanced Streak Management System
 * - 24-hour deadline tracking
 * - Streak loss notifications
 * - 3 freeze chances per month
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { getUserStats, saveUserStats } from './userStatsSupabase';

// Check if we're in Expo Go (notifications not supported on Android)
const isExpoGo = Constants.appOwnership === 'expo';
const isAndroid = Platform.OS === 'android';
const canUseNotifications = !(isExpoGo && isAndroid);

// Storage keys
const FREEZE_CHANCES_KEY = 'streak_freeze_chances';
const FREEZE_RESET_DATE_KEY = 'streak_freeze_reset_date';
const LAST_STREAK_CHECK_KEY = 'last_streak_check';
const STREAK_WARNING_SENT_KEY = 'streak_warning_sent';

export interface StreakFreezeData {
  remainingFreezes: number; // 0-3
  lastResetDate: string; // ISO date when it was last reset
  freezesUsedThisMonth: number; // Track usage
}

/**
 * Initialize or get freeze chances for the current month
 */
export async function getFreezeChances(): Promise<StreakFreezeData> {
  try {
    const stored = await AsyncStorage.getItem(FREEZE_CHANCES_KEY);
    const resetDate = await AsyncStorage.getItem(FREEZE_RESET_DATE_KEY);
    
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${now.getMonth()}`;
    
    if (!stored || !resetDate) {
      // First time - initialize with 3 chances
      const initialData: StreakFreezeData = {
        remainingFreezes: 3,
        lastResetDate: currentMonth,
        freezesUsedThisMonth: 0,
      };
      await saveFreezeChances(initialData);
      return initialData;
    }
    
    const data: StreakFreezeData = JSON.parse(stored);
    
    // Check if we need to reset for new month
    if (data.lastResetDate !== currentMonth) {
      console.log('🔄 New month - resetting freeze chances to 3');
      data.remainingFreezes = 3;
      data.freezesUsedThisMonth = 0;
      data.lastResetDate = currentMonth;
      await saveFreezeChances(data);
    }
    
    return data;
  } catch (error) {
    console.error('Error getting freeze chances:', error);
    return {
      remainingFreezes: 3,
      lastResetDate: `${new Date().getFullYear()}-${new Date().getMonth()}`,
      freezesUsedThisMonth: 0,
    };
  }
}

/**
 * Save freeze chances data
 */
async function saveFreezeChances(data: StreakFreezeData): Promise<void> {
  await AsyncStorage.setItem(FREEZE_CHANCES_KEY, JSON.stringify(data));
  await AsyncStorage.setItem(FREEZE_RESET_DATE_KEY, data.lastResetDate);
}

/**
 * Use a freeze chance to save streak
 * @returns true if freeze was successful, false if no freezes left
 */
export async function useFreeze(): Promise<boolean> {
  const freezeData = await getFreezeChances();
  
  if (freezeData.remainingFreezes <= 0) {
    console.log('❌ No freeze chances remaining');
    return false;
  }
  
  // Deduct one freeze
  freezeData.remainingFreezes -= 1;
  freezeData.freezesUsedThisMonth += 1;
  await saveFreezeChances(freezeData);
  
  console.log(`❄️ Freeze used! Remaining: ${freezeData.remainingFreezes}/3`);
  
  // Update last reflection date to today to "save" the streak
  const stats = await getUserStats();
  stats.lastReflectionDate = new Date().toISOString();
  await saveUserStats(stats);
  
  return true;
}

/**
 * Check if streak is at risk (last reflection was more than 24 hours ago)
 * @returns Object with risk status and hours remaining
 */
export async function checkStreakRisk(): Promise<{
  isAtRisk: boolean;
  hoursRemaining: number;
  shouldLoseStreak: boolean;
  canUseFreeze: boolean;
}> {
  const stats = await getUserStats();
  const freezeData = await getFreezeChances();
  
  if (!stats.lastReflectionDate || stats.currentStreak === 0) {
    return {
      isAtRisk: false,
      hoursRemaining: 24,
      shouldLoseStreak: false,
      canUseFreeze: false,
    };
  }
  
  const lastReflection = new Date(stats.lastReflectionDate);
  const now = new Date();
  const hoursSinceLastReflection = (now.getTime() - lastReflection.getTime()) / (1000 * 60 * 60);
  const hoursRemaining = Math.max(0, 24 - hoursSinceLastReflection);
  
  // Check if it's been more than 24 hours
  const shouldLoseStreak = hoursSinceLastReflection > 24;
  
  // At risk if between 20-24 hours (4-hour warning window)
  const isAtRisk = hoursSinceLastReflection >= 20 && hoursSinceLastReflection < 24;
  
  return {
    isAtRisk,
    hoursRemaining: Math.round(hoursRemaining * 10) / 10, // Round to 1 decimal
    shouldLoseStreak,
    canUseFreeze: freezeData.remainingFreezes > 0,
  };
}

/**
 * Reset streak to 0 (called when user fails to complete reflection in 24 hours)
 */
export async function resetStreak(): Promise<void> {
  const stats = await getUserStats();
  
  console.log(`💔 Streak lost! Was at ${stats.currentStreak} days`);
  
  stats.currentStreak = 0;
  await saveUserStats(stats);
  
  // Clear warning flag
  await AsyncStorage.removeItem(STREAK_WARNING_SENT_KEY);
}

/**
 * Schedule a notification to warn about streak loss
 * Sends notification 4 hours before 24-hour deadline
 */
export async function scheduleStreakWarningNotification(): Promise<void> {
  // Skip notifications if in Expo Go on Android
  if (!canUseNotifications) {
    console.log('⚠️ Notifications not available in Expo Go (Android). Use dev build.');
    return;
  }
  
  const riskCheck = await checkStreakRisk();
  const stats = await getUserStats();
  
  if (!riskCheck.isAtRisk || stats.currentStreak === 0) {
    return;
  }
  
  // Check if warning already sent
  const warningSent = await AsyncStorage.getItem(STREAK_WARNING_SENT_KEY);
  if (warningSent) {
    return; // Don't spam warnings
  }
  
  const freezeData = await getFreezeChances();
  
  // Cancel any existing streak warnings
  await Notifications.cancelAllScheduledNotificationsAsync();
  
  // Schedule immediate notification
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '🔥 Your Streak is at Risk!',
      body: `You have ${riskCheck.hoursRemaining.toFixed(1)} hours left to complete your reflection. Current streak: ${stats.currentStreak} days.${freezeData.remainingFreezes > 0 ? ` You have ${freezeData.remainingFreezes} freeze ${freezeData.remainingFreezes === 1 ? 'chance' : 'chances'} available.` : ''}`,
      data: { 
        type: 'streak_warning',
        screen: 'reflection',
      },
      sound: true,
      priority: Notifications.AndroidNotificationPriority.HIGH,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 5,
      repeats: false,
    },
  });
  
  // Mark warning as sent
  await AsyncStorage.setItem(STREAK_WARNING_SENT_KEY, new Date().toISOString());
  
  console.log('⚠️ Streak warning notification scheduled');
}

/**
 * Schedule final warning notification (1 hour before deadline)
 */
export async function scheduleFinalWarningNotification(): Promise<void> {
  // Skip notifications if in Expo Go on Android
  if (!canUseNotifications) {
    return;
  }
  
  const riskCheck = await checkStreakRisk();
  const stats = await getUserStats();
  
  if (riskCheck.hoursRemaining > 1 || stats.currentStreak === 0) {
    return;
  }
  
  const freezeData = await getFreezeChances();
  
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '⏰ FINAL WARNING: Streak Ending Soon!',
      body: `Only ${Math.round(riskCheck.hoursRemaining * 60)} minutes left! Your ${stats.currentStreak}-day streak will be lost.${freezeData.remainingFreezes > 0 ? ` Use a freeze to save it!` : ''}`,
      data: { 
        type: 'streak_final_warning',
        screen: 'reflection',
      },
      sound: true,
      priority: Notifications.AndroidNotificationPriority.MAX,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 5,
      repeats: false,
    },
  });
  
  console.log('🚨 Final streak warning sent');
}

/**
 * Check streak status and handle automatic reset
 * Should be called on app open and daily via background task
 */
export async function performStreakCheck(): Promise<void> {
  console.log('🔍 Performing streak check...');
  
  const riskCheck = await checkStreakRisk();
  const stats = await getUserStats();
  
  if (stats.currentStreak === 0) {
    console.log('ℹ️ No active streak');
    return;
  }
  
  // Lost streak (more than 24 hours passed)
  if (riskCheck.shouldLoseStreak) {
    console.log('💔 24 hours passed without reflection - streak lost');
    await resetStreak();
    
    // Send notification about lost streak (skip in Expo Go Android)
    if (canUseNotifications) {
      await Notifications.scheduleNotificationAsync({
      content: {
        title: '💔 Streak Lost',
        body: `Your ${stats.currentStreak}-day streak has been lost. Start a new one today!`,
        data: { 
          type: 'streak_lost',
          screen: 'reflection',
        },
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 2,
        repeats: false,
      },
    });
    }
    
    return;
  }
  
  // At risk (20-24 hours) - send warning
  if (riskCheck.isAtRisk) {
    console.log(`⚠️ Streak at risk! ${riskCheck.hoursRemaining} hours remaining`);
    await scheduleStreakWarningNotification();
  }
  
  // Final warning (less than 1 hour)
  if (riskCheck.hoursRemaining < 1 && riskCheck.hoursRemaining > 0) {
    console.log('🚨 Final warning - less than 1 hour remaining');
    await scheduleFinalWarningNotification();
  }
  
  // Save last check time
  await AsyncStorage.setItem(LAST_STREAK_CHECK_KEY, new Date().toISOString());
}

/**
 * Clear warning flag when user completes a reflection
 */
export async function clearStreakWarnings(): Promise<void> {
  await AsyncStorage.removeItem(STREAK_WARNING_SENT_KEY);
  
  if (canUseNotifications) {
    await Notifications.dismissAllNotificationsAsync();
  }
  
  console.log('✅ Streak warnings cleared');
}

/**
 * Get streak status for UI display
 */
export async function getStreakStatus(): Promise<{
  currentStreak: number;
  isAtRisk: boolean;
  hoursRemaining: number;
  freezesRemaining: number;
  canUseFreeze: boolean;
}> {
  const stats = await getUserStats();
  const riskCheck = await checkStreakRisk();
  const freezeData = await getFreezeChances();
  
  return {
    currentStreak: stats.currentStreak,
    isAtRisk: riskCheck.isAtRisk,
    hoursRemaining: riskCheck.hoursRemaining,
    freezesRemaining: freezeData.remainingFreezes,
    canUseFreeze: riskCheck.canUseFreeze,
  };
}

