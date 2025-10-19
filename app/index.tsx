import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, TouchableOpacity, Dimensions, Animated, Easing } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ConfettiCannon from 'react-native-confetti-cannon';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../contexts/ThemeContext';
import { useNotification } from '../contexts/NotificationContext';
import { usageTracker } from '../utils/usageTracker';
import { getUserStats, UserStats } from '../utils/userStatsSupabase';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const router = useRouter();
  const { isDark } = useTheme();
  const { showToast, showAlert } = useNotification();
  const [nextReflection, setNextReflection] = useState<string | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [stats, setStats] = useState<UserStats>({
    totalReflections: 0,
    totalScore: 0,
    currentStreak: 0,
    longestStreak: 0,
    lastReflectionDate: null,
    bookmarkedHadiths: [],
  });
  const [usageRemaining, setUsageRemaining] = useState<string | null>(null);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const statsScaleAnim = useRef(new Animated.Value(0.9)).current;
  const buttonScaleAnim = useRef(new Animated.Value(0.95)).current;
  const dotsOpacity = useRef(new Animated.Value(0)).current;
  const streakPulse = useRef(new Animated.Value(1)).current;
  const scorePulse = useRef(new Animated.Value(1)).current;
  const leafRotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadSettings();
    checkReflectionCompletion();
    
    // Entrance animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        easing: Easing.bezier(0.34, 1.56, 0.64, 1),
        useNativeDriver: true,
      }),
      Animated.spring(statsScaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.spring(buttonScaleAnim, {
        toValue: 1,
        tension: 40,
        friction: 6,
        delay: 200,
        useNativeDriver: true,
      }),
    ]).start();

    // Animate dots with stagger
    Animated.stagger(100, [
      Animated.timing(dotsOpacity, {
        toValue: 1,
        duration: 400,
        delay: 500,
        useNativeDriver: true,
      }),
    ]).start();

    // Continuous micro-animations
    // Streak flame pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(streakPulse, {
          toValue: 1.05,
          duration: 1500,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(streakPulse, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Score star pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(scorePulse, {
          toValue: 1.08,
          duration: 2000,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(scorePulse, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Leaf gentle rotation
    Animated.loop(
      Animated.sequence([
        Animated.timing(leafRotate, {
          toValue: 1,
          duration: 3000,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(leafRotate, {
          toValue: 0,
          duration: 3000,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  // Reload data when screen comes back into focus with re-entrance animation
  useFocusEffect(
    useCallback(() => {
      loadSettings();
      checkReflectionCompletion();
      
      // Re-animate when coming back from other screens
      fadeAnim.setValue(0);
      slideAnim.setValue(30);
      statsScaleAnim.setValue(0.9);
      
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          easing: Easing.bezier(0.25, 0.1, 0.25, 1),
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 350,
          easing: Easing.bezier(0.34, 1.56, 0.64, 1),
          useNativeDriver: true,
        }),
        Animated.spring(statsScaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start();
    }, [loadSettings, checkReflectionCompletion])
  );

  const loadSettings = useCallback(async () => {
    try {
      const [frequency, userStats] = await Promise.all([
        AsyncStorage.getItem('frequency'),
        getUserStats(),
      ]);

      const freq = frequency || 'manual';
      if (freq !== 'manual') {
        const nextTime = calculateNextReflection(freq as 'daily' | 'weekly' | 'random');
        setNextReflection(nextTime);
      }

      setStats(userStats);

      // Load usage tracking info
      const isUsageEnabled = await usageTracker.isEnabled();
      if (isUsageEnabled) {
        const remaining = await usageTracker.getRemainingTime();
        setUsageRemaining(usageTracker.formatRemainingTime(remaining));
      } else {
        setUsageRemaining(null);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  }, []);

  const calculateNextReflection = (frequency: 'daily' | 'weekly' | 'random'): string => {
    const now = new Date();
    let next = new Date();

    switch (frequency) {
      case 'daily':
        next.setDate(now.getDate() + 1);
        next.setHours(10, 0, 0, 0); // Default to 10 AM
        break;
      case 'weekly':
        next.setDate(now.getDate() + 7);
        next.setHours(10, 0, 0, 0);
        break;
      case 'random':
        next.setHours(now.getHours() + Math.floor(Math.random() * 24) + 1);
        break;
    }

    return next.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const checkReflectionCompletion = useCallback(async () => {
    try {
      const completed = await AsyncStorage.getItem('justCompleted');
      if (completed === 'true') {
        setShowConfetti(true);
        await AsyncStorage.removeItem('justCompleted');
        setTimeout(() => setShowConfetti(false), 3000);
        
        // Show celebration toast
        showToast({
          message: '🎉 Reflection completed! Great job!',
          type: 'success',
          duration: 4000,
        });
      }
    } catch (error) {
      console.error('Error checking completion:', error);
    }
  }, [showToast]);

  const handleStartReflection = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    // Button press animation
    Animated.sequence([
      Animated.timing(buttonScaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(buttonScaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
    
    router.push('/reflection');
  };

  const handleSettings = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // Smooth exit animation before navigation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: -20,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      router.push('/settings');
    });
  };

  const handleStreakPress = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    const encouragement = stats.currentStreak === 0 
      ? "Start your reflection journey today! 🌱"
      : stats.currentStreak === 1
      ? "Great start! Keep it going tomorrow! 💪"
      : stats.currentStreak < 7
      ? "Amazing! You're building a habit! 🔥"
      : stats.currentStreak < 30
      ? "Incredible dedication! Keep it up! 🌟"
      : "Mashallah! You're an inspiration! 👑";

    showAlert({
      title: `🔥 ${stats.currentStreak} Day Streak!`,
      message: `Current Streak: ${stats.currentStreak} days\nLongest Streak: ${stats.longestStreak} days\n\n${encouragement}`,
      buttons: [{ text: 'Keep Going!', style: 'primary' }],
    });
  };

  const handleScorePress = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    const avgScore = stats.totalReflections > 0 
      ? Math.round(stats.totalScore / stats.totalReflections) 
      : 0;
    
    const rank = stats.totalScore >= 1000 
      ? "🏆 Master Scholar"
      : stats.totalScore >= 500
      ? "📚 Advanced Learner"
      : stats.totalScore >= 100
      ? "⭐ Growing Student"
      : "🌱 Beginner";

    showAlert({
      title: `⭐ ${stats.totalScore} Points!`,
      message: `Total Score: ${stats.totalScore} points\nReflections: ${stats.totalReflections}\nAverage: ${avgScore} pts/reflection\n\nYour Rank: ${rank}`,
      buttons: [
        { text: 'Amazing!', style: 'primary' },
      ],
    });
  };

  const handleReflectionsPress = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // If user has bookmarks, navigate to bookmarks page
    if (stats.bookmarkedHadiths.length > 0) {
      router.push('/bookmarks');
      return;
    }
    
    const message = stats.totalReflections === 0
      ? "Start your first reflection today! Tap the button below to begin your journey of growth and learning. 🌟"
      : `You've completed ${stats.totalReflections} reflections!\n\nBookmark hadiths you love by tapping the bookmark icon during reflection. 📖\n\nMay Allah accept your efforts! 🤲`;

    showAlert({
      title: `📿 ${stats.totalReflections} Reflections`,
      message: message,
      buttons: [
        { text: 'Alhamdulillah', style: 'primary' },
      ],
    });
  };

  return (
    <SafeAreaView className={`flex-1 ${isDark ? 'bg-primary-dark' : 'bg-white'}`}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      
      {showConfetti && (
        <ConfettiCannon
          count={200}
          origin={{ x: width / 2, y: 0 }}
          autoStart={true}
          fadeOut={true}
          explosionSpeed={350}
        />
      )}

      {/* Header */}
      <Animated.View 
        style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
        className="pt-16 px-6 pb-4 flex-row justify-between items-center"
      >
        <View>
          <Text className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-primary-dark'}`}>
            Reflectify
          </Text>
          <Text className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Pause. Reflect. Grow.
          </Text>
        </View>
        <TouchableOpacity
          onPress={handleSettings}
          className={`p-3 rounded-full ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}
        >
          <Ionicons name="settings-outline" size={24} color={isDark ? '#fff' : '#1a1a1a'} />
        </TouchableOpacity>
      </Animated.View>

      {/* Main Content */}
      <View className="flex-1 justify-center items-center px-6">
        {/* Stats Grid */}
        <Animated.View 
          style={{ 
            opacity: fadeAnim,
            transform: [{ scale: statsScaleAnim }]
          }}
          className="w-full mb-8"
        >
          {/* Main Stats Row */}
          <View className="flex-row gap-3 mb-3">
            {/* Streak Card */}
            <TouchableOpacity 
              activeOpacity={0.9}
              onPress={handleStreakPress}
              className={`flex-1 p-4 rounded-2xl ${isDark ? 'bg-orange-900/20 border border-orange-500/30' : 'bg-orange-50 border border-orange-200'}`}
            >
              <View className="items-center">
                <Animated.View style={{ transform: [{ scale: streakPulse }] }}>
                  <Ionicons name="flame" size={32} color="#f97316" />
                </Animated.View>
                <Text className={`text-3xl font-bold mt-2 ${isDark ? 'text-orange-400' : 'text-orange-600'}`}>
                  {stats.currentStreak}
                </Text>
                <Text className={`text-xs mt-1 ${isDark ? 'text-orange-300/70' : 'text-orange-700/70'}`}>
                  Day Streak
                </Text>
              </View>
            </TouchableOpacity>

            {/* Score Card */}
            <TouchableOpacity 
              activeOpacity={0.9}
              onPress={handleScorePress}
              className={`flex-1 p-4 rounded-2xl ${isDark ? 'bg-yellow-900/20 border border-yellow-500/30' : 'bg-yellow-50 border border-yellow-200'}`}
            >
              <View className="items-center">
                <Animated.View style={{ transform: [{ scale: scorePulse }] }}>
                  <Ionicons name="star" size={32} color="#d4af37" />
                </Animated.View>
                <Text className={`text-3xl font-bold mt-2 ${isDark ? 'text-yellow-400' : 'text-yellow-600'}`}>
                  {stats.totalScore}
                </Text>
                <Text className={`text-xs mt-1 ${isDark ? 'text-yellow-300/70' : 'text-yellow-700/70'}`}>
                  Total Points
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Reflections Card */}
          <TouchableOpacity 
            activeOpacity={0.9}
            onPress={handleReflectionsPress}
            className={`p-6 rounded-2xl ${isDark ? 'bg-primary-accent/10 border border-primary-accent/30' : 'bg-primary-accent/10 border border-primary-accent/30'}`}
          >
            <View className="items-center">
              <Animated.View 
                style={{ 
                  transform: [{ 
                    rotate: leafRotate.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['-5deg', '5deg']
                    })
                  }] 
                }}
              >
                <Ionicons name="leaf" size={40} color="#d4af37" />
              </Animated.View>
              <Text className={`text-4xl font-bold mt-3 ${isDark ? 'text-white' : 'text-primary-dark'}`}>
                {stats.totalReflections}
              </Text>
              <Text className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Reflections Completed
              </Text>
              {stats.bookmarkedHadiths.length > 0 && (
                <View className="flex-row items-center mt-3 px-4 py-2 bg-primary-accent/20 rounded-full">
                  <Ionicons name="bookmark" size={14} color="#d4af37" />
                  <Text className={`ml-2 text-xs font-semibold ${isDark ? 'text-primary-accent' : 'text-primary-accent'}`}>
                    {stats.bookmarkedHadiths.length} saved · Tap to view
                  </Text>
                  <Ionicons name="chevron-forward" size={14} color="#d4af37" style={{ marginLeft: 4 }} />
                </View>
              )}
            </View>
          </TouchableOpacity>

              {(nextReflection || usageRemaining) && (
                <View className="mt-6 pt-6 border-t border-primary-accent/20 space-y-3">
                  {nextReflection && (
                    <View>
                      <Text className={`text-xs text-center ${
                        isDark ? 'text-gray-500' : 'text-gray-500'
                      }`}>
                        Next scheduled reflection
                      </Text>
                      <Text className={`text-sm text-center mt-1 ${
                        isDark ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        {nextReflection}
                      </Text>
                    </View>
                  )}
                  {usageRemaining && (
                    <View>
                      <Text className={`text-xs text-center ${
                        isDark ? 'text-gray-500' : 'text-gray-500'
                      }`}>
                        Usage lock timer
                      </Text>
                      <Text className={`text-sm text-center mt-1 ${
                        isDark ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        ⏱️ {usageRemaining}
                      </Text>
                    </View>
                  )}
                </View>
              )}
        </Animated.View>

        {/* Start Button */}
        <Animated.View style={{ transform: [{ scale: buttonScaleAnim }] }} className="w-full">
          <TouchableOpacity
            onPress={handleStartReflection}
            activeOpacity={0.8}
          >
            <View className="bg-primary-accent rounded-2xl py-6 px-8 items-center shadow-lg">
            <Text className="text-primary-dark text-lg font-bold">
              Start Reflection Now
            </Text>
            </View>
          </TouchableOpacity>
        </Animated.View>

        <Animated.Text 
          style={{ opacity: fadeAnim }}
          className={`text-xs mt-4 text-center ${
            isDark ? 'text-gray-500' : 'text-gray-500'
          }`}
        >
          Take 30 seconds to reflect on a hadith
        </Animated.Text>
      </View>

      {/* Bottom Decoration */}
      <Animated.View style={{ opacity: dotsOpacity }} className="pb-8 items-center">
        <View className="flex-row items-center gap-2">
          <View className="w-2 h-2 rounded-full bg-primary-accent/30" />
          <View className="w-2 h-2 rounded-full bg-primary-accent/50" />
          <View className="w-2 h-2 rounded-full bg-primary-accent" />
          <View className="w-2 h-2 rounded-full bg-primary-accent/50" />
          <View className="w-2 h-2 rounded-full bg-primary-accent/30" />
        </View>
      </Animated.View>
    </SafeAreaView>
  );
}

