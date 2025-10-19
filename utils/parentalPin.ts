/**
 * Parental Control PIN System
 * Protects sensitive settings from being changed by children
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

const PIN_STORAGE_KEY = 'parental_pin';

export const parentalPin = {
  /**
   * Check if PIN is set
   */
  async isPinSet(): Promise<boolean> {
    try {
      const pin = await AsyncStorage.getItem(PIN_STORAGE_KEY);
      return pin !== null;
    } catch (error) {
      console.error('Error checking PIN:', error);
      return false;
    }
  },

  /**
   * Get stored PIN (for verification)
   */
  async getPin(): Promise<string | null> {
    try {
      const pin = await AsyncStorage.getItem(PIN_STORAGE_KEY);
      return pin;
    } catch (error) {
      console.error('Error getting PIN:', error);
      return null;
    }
  },

  /**
   * Set new PIN
   */
  async setPin(newPin: string): Promise<boolean> {
    try {
      if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
        return false; // PIN must be 4 digits
      }
      await AsyncStorage.setItem(PIN_STORAGE_KEY, newPin);
      return true;
    } catch (error) {
      console.error('Error setting PIN:', error);
      return false;
    }
  },

  /**
   * Verify entered PIN
   */
  async verifyPin(enteredPin: string): Promise<boolean> {
    try {
      const storedPin = await this.getPin();
      if (!storedPin) {
        return false; // No PIN set
      }
      return enteredPin === storedPin;
    } catch (error) {
      console.error('Error verifying PIN:', error);
      return false;
    }
  },

  /**
   * Reset PIN (change PIN)
   */
  async resetPin(oldPin: string, newPin: string): Promise<boolean> {
    try {
      const isValid = await this.verifyPin(oldPin);
      if (!isValid) {
        return false;
      }
      return await this.setPin(newPin);
    } catch (error) {
      console.error('Error resetting PIN:', error);
      return false;
    }
  },
};

/**
 * Settings that require PIN protection
 */
export const PROTECTED_SETTINGS = {
  USAGE_LOCK: 'usage_lock',           // Disable/reduce screen time limit
  NOTIFICATIONS: 'notifications',      // Disable reflection reminders
  REFLECTION_FREQUENCY: 'frequency',   // Change to 'manual' (no auto-reminders)
  RESET_DATA: 'reset_data',           // Delete progress
} as const;

export type ProtectedSetting = typeof PROTECTED_SETTINGS[keyof typeof PROTECTED_SETTINGS];

