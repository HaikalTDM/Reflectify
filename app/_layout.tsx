// CRITICAL: These imports MUST come first to polyfill React Native's URL implementation
import 'react-native-url-polyfill/auto';
import '../global.css';

import { useEffect, useState } from 'react';
import { Stack, useRouter } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { registerForPushNotificationsAsync } from '../utils/notification';
import { ThemeProvider, useTheme } from '../contexts/ThemeContext';
import { NotificationProvider } from '../contexts/NotificationContext';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { useUsageTracker } from '../utils/usageTracker';
import { preloadHadiths } from '../utils/hadithApi';
import OnboardingModal from '../components/OnboardingModal';
import { parentalPin } from '../utils/parentalPin';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import ErrorBoundary from '../components/ErrorBoundary';

function RootNavigator() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { isDark } = useTheme();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);

  // Track usage and trigger reflection when limit is reached
  useUsageTracker(() => {
    // Navigate to reflection screen when usage limit is reached
    router.push('/reflection');
  });

  // Check if user has completed onboarding
  useEffect(() => {
    const checkOnboarding = async () => {
      try {
        const completed = await AsyncStorage.getItem('onboarding_completed');
        if (!completed && user) {
          // Show onboarding for new users
          setShowOnboarding(true);
        }
      } catch (error) {
        console.error('Error checking onboarding:', error);
      } finally {
        setCheckingOnboarding(false);
      }
    };

    if (!loading) {
      checkOnboarding();
    }
  }, [loading, user]);

  // Redirect to auth screen if not logged in
  useEffect(() => {
    if (!loading && !user) {
      // User is not logged in, redirect to auth
      router.replace('/auth');
    }
  }, [user, loading, router]);

  const handleOnboardingComplete = async (pin?: string) => {
    try {
      // Mark onboarding as completed
      await AsyncStorage.setItem('onboarding_completed', 'true');
      
      // Save PIN if provided
      if (pin && pin.length === 4) {
        await parentalPin.setPin(pin);
        console.log('✅ Parental PIN set during onboarding');
      }
      
      setShowOnboarding(false);
    } catch (error) {
      console.error('Error completing onboarding:', error);
      setShowOnboarding(false);
    }
  };

  // Show nothing while checking auth status
  if (loading) {
    return null;
  }

  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'fade',
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen 
          name="reflection" 
          options={{
            presentation: 'fullScreenModal',
            animation: 'fade',
          }}
        />
        <Stack.Screen name="settings" />
        <Stack.Screen name="auth" />
        <Stack.Screen name="profile" />
        <Stack.Screen name="bookmarks" />
        <Stack.Screen name="admin" />
        <Stack.Screen name="donation" />
      </Stack>

      {/* Onboarding Modal - Shows on first launch */}
      <OnboardingModal
        visible={showOnboarding && !checkingOnboarding}
        onComplete={handleOnboardingComplete}
        isDark={isDark}
      />
    </>
  );
}

// Main app wrapper without auth dependency
function AppInitializer() {
  useEffect(() => {
    // Initialize app
    const initializeApp = async () => {
      try {
        // Migrate old cache data to new unified system
        const AsyncStorage = await import('@react-native-async-storage/async-storage');
        console.log('🔄 Checking for old cache data...');
        
        const oldUserStats = await AsyncStorage.default.getItem('userStats');
        const oldBookmarks = await AsyncStorage.default.getItem('bookmarkedHadiths');
        const oldLastReflection = await AsyncStorage.default.getItem('lastReflectionDate');
        
        if (oldUserStats || oldBookmarks || oldLastReflection) {
          console.log('📦 Found old cache data, migrating to unified system...');
          
          // Parse old data
          const parsedStats = oldUserStats ? JSON.parse(oldUserStats) : null;
          const parsedBookmarks = oldBookmarks ? JSON.parse(oldBookmarks) : [];
          
          // Create unified stats object
          const unifiedStats = {
            totalReflections: parsedStats?.totalReflections || 0,
            totalScore: parsedStats?.totalScore || 0,
            currentStreak: parsedStats?.currentStreak || 0,
            longestStreak: parsedStats?.longestStreak || 0,
            lastReflectionDate: oldLastReflection || parsedStats?.lastReflectionDate || null,
            bookmarkedHadiths: parsedBookmarks,
          };
          
          // Save to new unified system
          await AsyncStorage.default.setItem('user_stats_local', JSON.stringify(unifiedStats));
          console.log('✅ Migrated stats:', unifiedStats);
          
          // Remove old keys
          await AsyncStorage.default.multiRemove([
            'userStats',
            'bookmarkedHadiths',
            'lastReflectionDate',
          ]);
          
          console.log('🧹 Cleaned up old cache keys');
        } else {
          console.log('✅ No old cache data to migrate');
        }
        
        // Initialize sound manager
        const { soundManager } = await import('../utils/soundManager');
        await soundManager.initialize();
        
        // Load sound effects
        try {
          console.log('📢 Loading sound effects...');
          await Promise.all([
            soundManager.loadSound('correct', require('../assets/sounds/correct.mp3')),
            soundManager.loadSound('wrong', require('../assets/sounds/wrong.mp3')),
            soundManager.loadSound('complete', require('../assets/sounds/complete.mp3')),
          ]);
          console.log('✅ Sound effects loaded successfully');
          
          // Check if sound is enabled in settings
          const AsyncStorage = await import('@react-native-async-storage/async-storage');
          const soundSetting = await AsyncStorage.default.getItem('soundEnabled');
          const isSoundEnabled = soundSetting === null ? true : soundSetting === 'true';
          soundManager.setMuted(!isSoundEnabled);
          console.log(`🔊 Sound ${isSoundEnabled ? 'enabled' : 'disabled'} in settings`);
          
          // Load volume level (default to high if not set)
          let volumeSetting = await AsyncStorage.default.getItem('soundVolume');
          if (!volumeSetting) {
            // First time - set default to high
            volumeSetting = 'high';
            await AsyncStorage.default.setItem('soundVolume', 'high');
            console.log('🔊 Set default volume to high');
          }
          const volumeLevel = volumeSetting as 'low' | 'medium' | 'high';
          soundManager.setVolume(volumeLevel);
          console.log(`🔊 Volume set to ${volumeLevel}`);
        } catch (error) {
          console.error('❌ Sound effects loading error:', error);
        }
        
        // Log question generation configuration
        const { logQuestionConfig } = await import('../utils/questionConfig');
        logQuestionConfig();
        
        // Load pregenerated questions (if available)
        try {
          const { loadPregeneratedQuestions } = await import('../utils/pregeneratedQuestionsLoader');
          await loadPregeneratedQuestions();
        } catch (error) {
          console.log('Pregenerated questions not loaded (run pregeneration script)');
        }
        
        // Avoid push token logic in Expo Go (not supported)
        if (Constants.appOwnership !== 'expo') {
          registerForPushNotificationsAsync().catch(() => {});
        }
        
        // Preload hadiths from API (temporarily disabled)
        // preloadHadiths().catch(() => {
        //   console.log('Preloading hadiths failed, will use local collection');
        // });
      } catch (error) {
        console.error('App initialization error:', error);
      }
    };

    initializeApp();
  }, []);

  return <RootNavigator />;
}

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <ThemeProvider>
            <AuthProvider>
              <NotificationProvider>
                <AppInitializer />
              </NotificationProvider>
            </AuthProvider>
          </ThemeProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}

