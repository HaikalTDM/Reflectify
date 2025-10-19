import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Switch,
  Animated,
  Easing,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { scheduleReflectionNotification, cancelAllNotifications } from '../utils/notification';
import { useTheme } from '../contexts/ThemeContext';
import { useNotification } from '../contexts/NotificationContext';
import { usageTracker, UsageLimit } from '../utils/usageTracker';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { enableSync, disableSync, syncLocalToCloud, syncCloudToLocal } from '../utils/userStatsSupabase';
import { soundManager } from '../utils/soundManager';

type Frequency = 'manual' | 'daily' | 'weekly' | 'random';
type Language = 'en' | 'ar' | 'ms' | 'en+ar' | 'en+ms' | 'ar+ms' | 'all';

export default function SettingsScreen() {
  const router = useRouter();
  const { isDark, setTheme } = useTheme();
  const { showToast, showAlert } = useNotification();
  const { user, isAnonymous, signOut, isAdmin } = useAuth();
  const [frequency, setFrequency] = useState<Frequency>('manual');
  const [language, setLanguage] = useState<Language>('en');
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [usageLimit, setUsageLimit] = useState<UsageLimit>('disabled');
  const [remainingTime, setRemainingTime] = useState<number>(0);
  const [syncEnabled, setSyncEnabled] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [soundVolume, setSoundVolume] = useState<'low' | 'medium' | 'high'>('high');

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const contentFadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadSettings();
    
    // Entrance animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        easing: Easing.out(Easing.back(1.2)),
        useNativeDriver: true,
      }),
    ]).start();

    // Staggered content fade-in
    Animated.timing(contentFadeAnim, {
      toValue: 1,
      duration: 600,
      delay: 150,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, []);

  const handleBack = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // Smooth exit animation before going back
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 30,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(contentFadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      router.back();
    });
  };

  const loadSettings = async () => {
    try {
      const freq = await AsyncStorage.getItem('frequency');
      setFrequency((freq as Frequency) || 'manual');

      const lang = await AsyncStorage.getItem('language');
      setLanguage((lang as Language) || 'en');

      const notifs = await AsyncStorage.getItem('notifications');
      setNotificationsEnabled(notifs === 'true');

      const limit = await usageTracker.getUsageLimit();
      setUsageLimit(limit);

      const remaining = await usageTracker.getRemainingTime();
      setRemainingTime(remaining);

      // Load sound setting (default to enabled)
      const sound = await AsyncStorage.getItem('soundEnabled');
      const isSoundEnabled = sound === null ? true : sound === 'true';
      setSoundEnabled(isSoundEnabled);
      soundManager.setMuted(!isSoundEnabled);

      // Load volume setting (default to high)
      const volume = await AsyncStorage.getItem('soundVolume') as 'low' | 'medium' | 'high' | null;
      const volumeLevel = volume || 'high';
      setSoundVolume(volumeLevel);
      soundManager.setVolume(volumeLevel);

      // Check if cloud sync is enabled (default to true for signed-in users)
      if (user && !isAnonymous) {
        const syncSetting = await AsyncStorage.getItem('cloudSyncEnabled');
        if (syncSetting === null) {
          // First time - enable sync by default
          setSyncEnabled(true);
          await AsyncStorage.setItem('cloudSyncEnabled', 'true');
          await enableSync();
        } else {
          setSyncEnabled(syncSetting === 'true');
        }
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  // Update remaining time every minute
  useEffect(() => {
    const interval = setInterval(async () => {
      const remaining = await usageTracker.getRemainingTime();
      setRemainingTime(remaining);
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  const handleThemeToggle = async (value: boolean) => {
    setTheme(value);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    showToast({
      message: value ? '🌙 Dark mode enabled' : '☀️ Light mode enabled',
      type: 'success',
      duration: 2000,
    });
  };

  const handleFrequencyChange = async (newFrequency: Frequency) => {
    setFrequency(newFrequency);
    await AsyncStorage.setItem('frequency', newFrequency);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Schedule or cancel notifications based on frequency
    if (newFrequency !== 'manual' && notificationsEnabled) {
      await scheduleReflectionNotification(newFrequency);
      showToast({
        message: `Reflection reminders scheduled ${newFrequency}`,
        type: 'success',
        duration: 3000,
      });
    } else {
      await cancelAllNotifications();
    }
  };

  const handleLanguageChange = async (newLanguage: Language) => {
    setLanguage(newLanguage);
    await AsyncStorage.setItem('language', newLanguage);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    const languageNames: Record<Language, string> = {
      en: 'English',
      ar: 'Arabic',
      ms: 'Malay',
      'en+ar': 'English & Arabic',
      'en+ms': 'English & Malay',
      'ar+ms': 'Arabic & Malay',
      all: 'All Languages',
    };
    
    showToast({
      message: `Language set to ${languageNames[newLanguage]}`,
      type: 'success',
      duration: 2000,
    });
  };

  const handleNotificationsToggle = async (value: boolean) => {
    setNotificationsEnabled(value);
    await AsyncStorage.setItem('notifications', value.toString());
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (value && frequency !== 'manual') {
      await scheduleReflectionNotification(frequency);
    } else {
      await cancelAllNotifications();
    }
  };

  const handleUsageLimitChange = async (newLimit: UsageLimit) => {
    setUsageLimit(newLimit);
    await usageTracker.setUsageLimit(newLimit);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (newLimit !== 'disabled') {
      const remaining = await usageTracker.getRemainingTime();
      setRemainingTime(remaining);
      showToast({
        message: `Usage lock set to ${newLimit === '60' ? '1 hour' : '2 hours'}`,
        type: 'success',
        duration: 3000,
      });
    } else {
      showToast({
        message: 'Usage lock disabled',
        type: 'info',
        duration: 2000,
      });
    }
  };

  const handleResetData = () => {
    showAlert({
      title: 'Reset Data',
      message: 'Are you sure you want to reset all your reflection data? This cannot be undone.',
      icon: 'warning',
      iconColor: '#f59e0b',
      buttons: [
        { 
          text: 'Cancel', 
          style: 'cancel',
        },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              // Clear all local storage data
              await AsyncStorage.multiRemove([
                'reflectionCount',
                'userStats',
                'bookmarkedHadiths',
                'lastReflectionDate',
              ]);
              
              // Reset usage time
              await usageTracker.resetUsageTime();
              
              // If user is signed in (not anonymous), also reset cloud data
              if (user && !isAnonymous) {
                console.log('Resetting cloud data for user:', user.id);
                
                // Reset user stats in Supabase
                const { error: statsError } = await supabase
                  .from('user_stats')
                  .update({
                    current_streak: 0,
                    longest_streak: 0,
                    total_score: 0,
                    total_reflections: 0,
                    last_reflection_date: null,
                  })
                  .eq('user_id', user.id);
                
                if (statsError) {
                  console.error('Error resetting stats:', statsError);
                }
                
                // Delete all bookmarks in Supabase
                const { error: bookmarksError } = await supabase
                  .from('bookmarks')
                  .delete()
                  .eq('user_id', user.id);
                
                if (bookmarksError) {
                  console.error('Error deleting bookmarks:', bookmarksError);
                }
              }
              
              await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              
              showToast({
                message: 'All data has been reset successfully',
                type: 'success',
                duration: 3000,
              });
              
              // Navigate to homepage to trigger data reload via useFocusEffect
              router.replace('/');
            } catch (error) {
              console.error('Error resetting data:', error);
              showToast({
                message: 'Failed to reset data',
                type: 'error',
                duration: 3000,
              });
            }
          },
        },
      ],
    });
  };

  const SettingSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <View className="mb-6">
      <Text className={`text-sm font-semibold mb-3 ${
        isDark ? 'text-gray-400' : 'text-gray-600'
      }`}>
        {title}
      </Text>
      <View className={`rounded-2xl overflow-hidden ${
        isDark ? 'bg-gray-800' : 'bg-gray-50'
      }`}>
        {children}
      </View>
    </View>
  );

  const SettingItem = ({
    icon,
    title,
    subtitle,
    rightComponent,
    onPress,
  }: {
    icon: string;
    title: string;
    subtitle?: string;
    rightComponent?: React.ReactNode;
    onPress?: () => void;
  }) => (
    <TouchableOpacity
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={onPress ? 0.7 : 1}
      className={`p-4 flex-row items-center ${
        isDark ? 'border-gray-700' : 'border-gray-200'
      }`}
    >
      <View className="mr-3">
        <Ionicons name={icon as any} size={24} color="#d4af37" />
      </View>
      <View className="flex-1">
        <Text className={`text-base font-medium ${
          isDark ? 'text-white' : 'text-primary-dark'
        }`}>
          {title}
        </Text>
        {subtitle && (
          <Text className={`text-sm mt-1 ${
            isDark ? 'text-gray-400' : 'text-gray-600'
          }`}>
            {subtitle}
          </Text>
        )}
      </View>
      {rightComponent && <View>{rightComponent}</View>}
    </TouchableOpacity>
  );

  const FrequencyButton = ({ value, label }: { value: Frequency; label: string }) => (
    <TouchableOpacity
      onPress={() => handleFrequencyChange(value)}
      className={`flex-1 py-3 px-4 rounded-xl ${
        frequency === value
          ? 'bg-primary-accent'
          : isDark
          ? 'bg-gray-700'
          : 'bg-gray-200'
      }`}
    >
      <Text
        className={`text-center font-semibold ${
          frequency === value ? 'text-primary-dark' : isDark ? 'text-gray-300' : 'text-gray-700'
        }`}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  const LanguageButton = ({ value, label }: { value: Language; label: string }) => (
    <TouchableOpacity
      onPress={() => handleLanguageChange(value)}
      className={`flex-1 py-3 px-4 rounded-xl ${
        language === value
          ? 'bg-primary-accent'
          : isDark
          ? 'bg-gray-700'
          : 'bg-gray-200'
      }`}
    >
      <Text
        className={`text-center font-semibold ${
          language === value ? 'text-primary-dark' : isDark ? 'text-gray-300' : 'text-gray-700'
        }`}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  const UsageLimitButton = ({ value, label }: { value: UsageLimit; label: string }) => (
    <TouchableOpacity
      onPress={() => handleUsageLimitChange(value)}
      className={`flex-1 py-3 px-4 rounded-xl ${
        usageLimit === value
          ? 'bg-primary-accent'
          : isDark
          ? 'bg-gray-700'
          : 'bg-gray-200'
      }`}
    >
      <Text
        className={`text-center font-semibold ${
          usageLimit === value ? 'text-primary-dark' : isDark ? 'text-gray-300' : 'text-gray-700'
        }`}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View className={`flex-1 ${isDark ? 'bg-primary-dark' : 'bg-white'}`}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* Header */}
      <Animated.View 
        style={{ 
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }]
        }}
        className="pt-16 px-6 pb-4 flex-row items-center"
      >
        <TouchableOpacity
          onPress={handleBack}
          className={`p-2 rounded-full mr-4 ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}
        >
          <Ionicons name="arrow-back" size={24} color={isDark ? '#fff' : '#1a1a1a'} />
        </TouchableOpacity>
        <View>
          <Text className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-primary-dark'}`}>
            Settings
          </Text>
        </View>
      </Animated.View>

      <Animated.ScrollView 
        style={{ opacity: contentFadeAnim }}
        className="flex-1 px-6" 
        showsVerticalScrollIndicator={false}
      >
        {/* Appearance */}
        <SettingSection title="APPEARANCE">
          <SettingItem
            icon="moon-outline"
            title="Dark Mode"
            subtitle="Switch between light and dark theme"
            rightComponent={
              <Switch
                value={isDark}
                onValueChange={handleThemeToggle}
                trackColor={{ false: '#d1d5db', true: '#d4af37' }}
                thumbColor={isDark ? '#1a1a1a' : '#ffffff'}
              />
            }
          />
        </SettingSection>

        {/* Reflection Settings */}
        <SettingSection title="REFLECTION FREQUENCY">
          <View className="p-4">
            <View className="flex-row gap-2 mb-2">
              <FrequencyButton value="manual" label="Manual" />
              <FrequencyButton value="daily" label="Daily" />
            </View>
            <View className="flex-row gap-2">
              <FrequencyButton value="weekly" label="Weekly" />
              <FrequencyButton value="random" label="Random" />
            </View>
          </View>
        </SettingSection>

        {/* Language */}
        <SettingSection title="LANGUAGE">
          <View className="p-4">
            <Text className={`text-xs mb-3 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Single Language
            </Text>
            <View className="flex-row gap-2 mb-3">
              <LanguageButton value="en" label="English" />
              <LanguageButton value="ar" label="عربي" />
              <LanguageButton value="ms" label="Melayu" />
            </View>
            
            <Text className={`text-xs mb-3 mt-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Dual Languages
            </Text>
            <View className="flex-row gap-2 mb-2">
              <LanguageButton value="en+ar" label="EN + AR" />
              <LanguageButton value="en+ms" label="EN + MS" />
            </View>
            <View className="flex-row gap-2 mb-3">
              <LanguageButton value="ar+ms" label="AR + MS" />
              <LanguageButton value="all" label="All" />
            </View>
          </View>
        </SettingSection>

        {/* Usage Lock */}
        <SettingSection title="USAGE LOCK">
          <View className="p-4">
            <Text className={`text-sm mb-3 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Automatically lock the screen with a reflection after usage time
            </Text>
            <View className="flex-row gap-2 mb-2">
              <UsageLimitButton value="disabled" label="Off" />
              <UsageLimitButton value="60" label="1 Hour" />
            </View>
            <View className="flex-row gap-2">
              <UsageLimitButton value="120" label="2 Hours" />
              <View className="flex-1" />
            </View>
            {usageLimit !== 'disabled' && (
              <View className={`mt-4 p-3 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
                <Text className={`text-center font-semibold ${isDark ? 'text-primary-accent' : 'text-primary-dark'}`}>
                  {usageTracker.formatRemainingTime(remainingTime)}
                </Text>
              </View>
            )}
          </View>
        </SettingSection>

        {/* Notifications */}
        <SettingSection title="NOTIFICATIONS">
          <SettingItem
            icon="notifications-outline"
            title="Enable Notifications"
            subtitle="Receive reminders for reflections"
            rightComponent={
              <Switch
                value={notificationsEnabled}
                onValueChange={handleNotificationsToggle}
                trackColor={{ false: '#d1d5db', true: '#d4af37' }}
                thumbColor={notificationsEnabled ? '#1a1a1a' : '#ffffff'}
              />
            }
          />
        </SettingSection>

        {/* Sound Effects */}
        <SettingSection title="SOUND">
          <SettingItem
            icon="volume-high-outline"
            title="Sound Effects"
            subtitle={soundEnabled ? 'Enabled' : 'Disabled'}
            rightComponent={
              <Switch
                value={soundEnabled}
                onValueChange={async (value) => {
                  setSoundEnabled(value);
                  soundManager.setMuted(!value);
                  await AsyncStorage.setItem('soundEnabled', value.toString());
                  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  showToast({
                    message: value ? 'Sound effects enabled' : 'Sound effects disabled',
                    type: 'success',
                    duration: 2000,
                  });
                }}
                trackColor={{ false: '#d1d5db', true: '#d4af37' }}
                thumbColor={soundEnabled ? '#1a1a1a' : '#ffffff'}
              />
            }
          />

          {/* Volume Control */}
          {soundEnabled && (
            <View className={`px-4 py-4 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
              <Text className={`text-sm font-semibold mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Volume Level
              </Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity
                  onPress={async () => {
                    setSoundVolume('low');
                    soundManager.setVolume('low');
                    await AsyncStorage.setItem('soundVolume', 'low');
                    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    showToast({ message: 'Volume: Low', type: 'success', duration: 1500 });
                  }}
                  style={{ 
                    flex: 1, 
                    paddingVertical: 10,
                    paddingHorizontal: 4,
                    borderRadius: 12, 
                    alignItems: 'center',
                    backgroundColor: soundVolume === 'low' ? '#d4af37' : (isDark ? '#1f2937' : '#f3f4f6'),
                    borderWidth: 1,
                    borderColor: soundVolume === 'low' ? '#d4af37' : (isDark ? '#374151' : '#d1d5db'),
                  }}
                >
                  <Ionicons 
                    name="volume-low" 
                    size={18} 
                    color={soundVolume === 'low' ? '#1a1a1a' : '#d4af37'} 
                  />
                  <Text 
                    style={{ 
                      fontSize: 9, 
                      marginTop: 3, 
                      fontWeight: '600',
                      color: soundVolume === 'low' ? '#1a1a1a' : (isDark ? '#d1d5db' : '#374151'),
                      letterSpacing: -0.3,
                    }}
                  >
                    Low
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={async () => {
                    setSoundVolume('medium');
                    soundManager.setVolume('medium');
                    await AsyncStorage.setItem('soundVolume', 'medium');
                    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    showToast({ message: 'Volume: Medium', type: 'success', duration: 1500 });
                  }}
                  style={{ 
                    flex: 1, 
                    paddingVertical: 10,
                    paddingHorizontal: 4,
                    borderRadius: 12, 
                    alignItems: 'center',
                    backgroundColor: soundVolume === 'medium' ? '#d4af37' : (isDark ? '#1f2937' : '#f3f4f6'),
                    borderWidth: 1,
                    borderColor: soundVolume === 'medium' ? '#d4af37' : (isDark ? '#374151' : '#d1d5db'),
                  }}
                >
                  <Ionicons 
                    name="volume-medium" 
                    size={18} 
                    color={soundVolume === 'medium' ? '#1a1a1a' : '#d4af37'} 
                  />
                  <Text 
                    style={{ 
                      fontSize: 9, 
                      marginTop: 3, 
                      fontWeight: '600',
                      color: soundVolume === 'medium' ? '#1a1a1a' : (isDark ? '#d1d5db' : '#374151'),
                      letterSpacing: -0.3,
                    }}
                  >
                    Medium
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={async () => {
                    setSoundVolume('high');
                    soundManager.setVolume('high');
                    await AsyncStorage.setItem('soundVolume', 'high');
                    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    showToast({ message: 'Volume: High', type: 'success', duration: 1500 });
                  }}
                  style={{ 
                    flex: 1, 
                    paddingVertical: 10,
                    paddingHorizontal: 4,
                    borderRadius: 12, 
                    alignItems: 'center',
                    backgroundColor: soundVolume === 'high' ? '#d4af37' : (isDark ? '#1f2937' : '#f3f4f6'),
                    borderWidth: 1,
                    borderColor: soundVolume === 'high' ? '#d4af37' : (isDark ? '#374151' : '#d1d5db'),
                  }}
                >
                  <Ionicons 
                    name="volume-high" 
                    size={18} 
                    color={soundVolume === 'high' ? '#1a1a1a' : '#d4af37'} 
                  />
                  <Text 
                    style={{ 
                      fontSize: 9, 
                      marginTop: 3, 
                      fontWeight: '600',
                      color: soundVolume === 'high' ? '#1a1a1a' : (isDark ? '#d1d5db' : '#374151'),
                      letterSpacing: -0.3,
                    }}
                  >
                    High
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </SettingSection>

        {/* Data Management */}
        <SettingSection title="DATA">
          <SettingItem
            icon="refresh-outline"
            title="Reset Progress"
            subtitle="Clear all reflection data"
            onPress={handleResetData}
            rightComponent={
              <Ionicons
                name="chevron-forward"
                size={20}
                color={isDark ? '#9ca3af' : '#6b7280'}
              />
            }
          />
        </SettingSection>

        {/* About */}
        <SettingSection title="ABOUT">
          <SettingItem
            icon="information-circle-outline"
            title="Version"
            subtitle="1.0.0"
          />
          <View className={`h-px ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`} />
          <SettingItem
            icon="heart-outline"
            title="Made with love"
            subtitle="For reflection and growth"
          />
        </SettingSection>

        {/* Account & Cloud Sync Section */}
        <SettingSection title="Account & Cloud Sync">
          {/* Account Info */}
          <View className={`rounded-2xl p-5 mb-4 ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
            <View className="flex-row items-center mb-3">
              <View className="w-12 h-12 rounded-full bg-primary-accent/20 items-center justify-center mr-3">
                <Ionicons 
                  name={isAnonymous || !user ? 'person-circle' : 'person'} 
                  size={24} 
                  color="#d4af37" 
                />
              </View>
              <View className="flex-1">
                <Text className={`text-base font-bold ${isDark ? 'text-white' : 'text-primary-dark'}`}>
                  {isAnonymous || !user ? 'Anonymous User' : user?.email || 'Not signed in'}
                </Text>
                <Text className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {isAnonymous || !user ? 'Data stored locally only' : 'Cloud sync available'}
                </Text>
              </View>
            </View>

            {(isAnonymous || !user) && (
              <TouchableOpacity
                onPress={() => router.push('/auth')}
                className="bg-primary-accent rounded-xl py-3 items-center"
              >
                <Text className="text-primary-dark font-bold">Sign In or Create Account</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Cloud Sync Toggle - Only for signed-in users */}
          {user && !isAnonymous && (
            <>
              <SettingItem
                icon="cloud-outline"
                title="Auto Cloud Sync"
                subtitle={syncEnabled ? 'Enabled' : 'Disabled'}
                rightComponent={
                  <Switch
                    value={syncEnabled}
                    onValueChange={async (value) => {
                      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      if (value) {
                        setSyncing(true);
                        await enableSync();
                        await AsyncStorage.setItem('cloudSyncEnabled', 'true');
                        setSyncEnabled(true);
                        setSyncing(false);
                        showToast({ message: '✅ Cloud sync enabled', type: 'success' });
                      } else {
                        await disableSync();
                        await AsyncStorage.setItem('cloudSyncEnabled', 'false');
                        setSyncEnabled(false);
                        showToast({ message: 'Cloud sync disabled' });
                      }
                    }}
                    trackColor={{ false: isDark ? '#374151' : '#d1d5db', true: '#d4af37' }}
                    thumbColor={syncEnabled ? '#ffffff' : '#f3f4f6'}
                  />
                }
              />

              {/* Manual Sync Buttons */}
              {syncEnabled && (
                <>
                  <SettingItem
                    icon="cloud-upload-outline"
                    title="Upload to Cloud"
                    subtitle="Replace cloud with local data"
                    onPress={async () => {
                      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                      setSyncing(true);
                      const result = await syncLocalToCloud();
                      setSyncing(false);
                      if (result.success) {
                        showToast({ message: '✅ Uploaded to cloud', type: 'success' });
                      } else {
                        showAlert({ title: 'Upload Failed', message: result.error || 'Failed to upload', buttons: [{ text: 'OK' }] });
                      }
                    }}
                    rightComponent={syncing ? <ActivityIndicator color="#d4af37" /> : undefined}
                  />

                  <SettingItem
                    icon="cloud-download-outline"
                    title="Download from Cloud"
                    subtitle="Replace local with cloud data"
                    onPress={async () => {
                      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                      setSyncing(true);
                      const result = await syncCloudToLocal();
                      setSyncing(false);
                      if (result.success) {
                        showToast({ message: '✅ Downloaded from cloud', type: 'success' });
                      } else {
                        showAlert({ title: 'Download Failed', message: result.error || 'Failed to download', buttons: [{ text: 'OK' }] });
                      }
                    }}
                    rightComponent={syncing ? <ActivityIndicator color="#d4af37" /> : undefined}
                  />
                </>
              )}

            </>
          )}
        </SettingSection>

        {/* Sign Out Button - Outside Section for Full Width */}
        {user && !isAnonymous && (
          <View style={{ paddingHorizontal: 24, marginBottom: 16 }}>
            <TouchableOpacity
              onPress={async () => {
                await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                showAlert({
                  title: 'Sign Out?',
                  message: 'Your local data will remain on this device.',
                  buttons: [
                    { text: 'Cancel', style: 'cancel' },
                    { 
                      text: 'Sign Out',
                      style: 'destructive',
                      onPress: async () => {
                        await signOut();
                        showToast({ message: 'Signed out', type: 'success' });
                      }
                    },
                  ],
                });
              }}
              activeOpacity={0.7}
              style={{
                padding: 20,
                borderRadius: 16,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1,
                borderColor: isDark ? 'rgba(127, 29, 29, 0.3)' : 'rgba(254, 226, 226, 1)',
                backgroundColor: isDark ? 'rgba(127, 29, 29, 0.1)' : 'rgba(254, 226, 226, 1)',
                width: '100%',
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="log-out" size={20} color="#ef4444" />
                <Text 
                  style={{ 
                    color: '#ef4444', 
                    fontWeight: '600', 
                    marginLeft: 8, 
                    fontSize: 16,
                  }}
                  allowFontScaling={false}
                  ellipsizeMode="clip"
                >
                  SignOutt
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* Support / Donation Button */}
        <TouchableOpacity
          onPress={async () => {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            router.push('/donation');
          }}
          activeOpacity={0.7}
          className={`mx-6 my-4 p-6 rounded-2xl ${isDark ? 'bg-primary-accent/10 border-2 border-primary-accent/30' : 'bg-primary-accent/5 border-2 border-primary-accent/20'}`}
        >
          <View className="flex-row items-center justify-center mb-2">
            <Text className="text-2xl mr-2">💚</Text>
            <Text className={`text-lg font-bold ${isDark ? 'text-primary-accent' : 'text-primary-dark'}`}>
              Support Reflectify
            </Text>
          </View>
          <Text className={`text-center text-sm leading-5 ${isDark ? 'text-primary-accent/80' : 'text-gray-700'}`}>
            Help keep hadiths free • Earn Sadaqah Jariyah
          </Text>
        </TouchableOpacity>

        {/* Admin Panel Button - Only for Admin Users */}
        {isAdmin && (
          <TouchableOpacity
            onPress={async () => {
              await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              router.push('/admin');
            }}
            activeOpacity={0.7}
            className={`mx-6 my-4 p-5 rounded-2xl ${isDark ? 'bg-red-900/20 border border-red-500/30' : 'bg-red-50 border border-red-200'}`}
          >
            <View className="flex-row items-center justify-center">
              <Ionicons name="shield-checkmark-outline" size={24} color={isDark ? '#fca5a5' : '#dc2626'} />
              <Text className={`ml-3 text-lg font-bold ${isDark ? 'text-red-300' : 'text-red-700'}`}>
                Admin Panel - Review Questions
              </Text>
            </View>
            <Text className={`text-center mt-2 text-sm ${isDark ? 'text-red-400' : 'text-red-600'}`}>
              Report and review incorrect quiz answers
            </Text>
          </TouchableOpacity>
        )}

        <View className="h-8" />
      </Animated.ScrollView>
    </View>
  );
}

