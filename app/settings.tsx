import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Switch,
  Animated,
  Easing,
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

type Frequency = 'manual' | 'daily' | 'weekly' | 'random';
type Language = 'en' | 'ar' | 'ms' | 'en+ar' | 'en+ms' | 'ar+ms' | 'all';

export default function SettingsScreen() {
  const router = useRouter();
  const { isDark, setTheme } = useTheme();
  const { showToast, showAlert } = useNotification();
  const [frequency, setFrequency] = useState<Frequency>('manual');
  const [language, setLanguage] = useState<Language>('en');
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [usageLimit, setUsageLimit] = useState<UsageLimit>('disabled');
  const [remainingTime, setRemainingTime] = useState<number>(0);

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
            await AsyncStorage.setItem('reflectionCount', '0');
            await usageTracker.resetUsageTime();
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            showToast({
              message: 'All data has been reset successfully',
              type: 'success',
              duration: 3000,
            });
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

        {/* Admin Panel Button */}
        <TouchableOpacity
          onPress={async () => {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            router.push('/admin');
          }}
          activeOpacity={0.7}
          className={`mx-6 my-6 p-5 rounded-2xl ${isDark ? 'bg-red-900/20 border border-red-500/30' : 'bg-red-50 border border-red-200'}`}
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

        <View className="h-8" />
      </Animated.ScrollView>
    </View>
  );
}

