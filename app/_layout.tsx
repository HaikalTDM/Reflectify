import { useEffect } from 'react';
import { Stack, useRouter } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { registerForPushNotificationsAsync } from '../utils/notification';
import { ThemeProvider } from '../contexts/ThemeContext';
import { NotificationProvider } from '../contexts/NotificationContext';
import { useUsageTracker } from '../utils/usageTracker';
import { preloadHadiths } from '../utils/hadithApi';
import Constants from 'expo-constants';
import '../global.css';

function RootNavigator() {
  const router = useRouter();

  // Track usage and trigger reflection when limit is reached
  useUsageTracker(() => {
    // Navigate to reflection screen when usage limit is reached
    router.push('/reflection');
  });

  return (
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
    </Stack>
  );
}

export default function RootLayout() {
  useEffect(() => {
    // Initialize app
    const initializeApp = async () => {
      try {
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

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <NotificationProvider>
            <RootNavigator />
          </NotificationProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

