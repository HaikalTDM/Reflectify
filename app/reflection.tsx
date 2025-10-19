import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, TouchableOpacity, Dimensions, Animated, Easing, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import ConfettiCannon from 'react-native-confetti-cannon';
import { getRandomHadith, Hadith } from '../utils/hadithData';
import CountdownTimer from '../components/CountdownTimer';
import HadithCard from '../components/HadithCard';
import HadithQuiz from '../components/HadithQuiz';
import { useTheme } from '../contexts/ThemeContext';
import { getQuestionsForHadith } from '../utils/hadithQuestions';

const COUNTDOWN_DURATION = 30; // 30 seconds
const { width } = Dimensions.get('window');

export default function ReflectionScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { isDark } = useTheme();
  const [hadith, setHadith] = useState<Hadith | null>(null);
  const [language, setLanguage] = useState<'en' | 'ar' | 'ms' | 'en+ar' | 'en+ms' | 'ar+ms' | 'all'>('en');
  const [timerComplete, setTimerComplete] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [quizTimerKey, setQuizTimerKey] = useState(0); // Key to reset timer for quiz
  const [quizQuestions, setQuizQuestions] = useState<any[]>([]); // Store generated questions
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);
  const [questionsPreloaded, setQuestionsPreloaded] = useState(false);
  const [quizTimerPaused, setQuizTimerPaused] = useState(false); // Track if quiz timer should be paused

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const slideUpAnim = useRef(new Animated.Value(50)).current;
  const blurIntensity = useRef(new Animated.Value(0)).current;
  const completeButtonScale = useRef(new Animated.Value(0)).current;
  const celebrationScale = useRef(new Animated.Value(1)).current; // Start at 1, not 0!

  useEffect(() => {
    loadSettingsAndHadith();
    
    // Entrance animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(slideUpAnim, {
        toValue: 0,
        duration: 600,
        easing: Easing.out(Easing.back(1.1)),
        useNativeDriver: true,
      }),
      Animated.timing(blurIntensity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: false,
      }),
    ]).start();
  }, []);

  // OPTIMIZATION: Preload questions during the 30-second timer!
  useEffect(() => {
    if (hadith && !questionsPreloaded && !timerComplete) {
      // Start generating questions in the background after 3 seconds
      const preloadTimer = setTimeout(async () => {
        try {
          console.log('🚀 Preloading questions during hadith reflection...');
          const { getQuestionsForHadith } = await import('../utils/hadithQuestions');
          const questions = await getQuestionsForHadith(
            hadith.reference || '',
            hadith.theme || '',
            hadith.text_en || ''
          );
          
          setQuizQuestions(questions);
          setQuestionsPreloaded(true);
          console.log('✅ Questions preloaded successfully!');
        } catch (error) {
          console.error('⚠️ Preload failed, will generate on demand:', error);
        }
      }, 3000); // Start after 3 seconds of reflection

      return () => clearTimeout(preloadTimer);
    }
  }, [hadith, questionsPreloaded, timerComplete]);

  const loadSettingsAndHadith = useCallback(async () => {
    setIsLoading(true);
    try {
      const lang = await AsyncStorage.getItem('language');
      setLanguage((lang as 'en' | 'ar' | 'ms' | 'en+ar' | 'en+ms' | 'ar+ms' | 'all') || 'en');

      let loadedHadith: Hadith;

      // Check if specific hadith was requested via URL params
      if (params.collection && params.hadithNumber) {
        const { fetchSpecificHadith } = await import('../utils/hadithApi');
        const specificHadith = await fetchSpecificHadith(
          params.collection as string, 
          params.hadithNumber as string
        );
        
        if (specificHadith) {
          loadedHadith = specificHadith;
        } else {
          // If specific hadith not found, fall back to random
          loadedHadith = await getRandomHadith();
        }
      } else {
        // Get a random hadith (now async - tries API first, falls back to local)
        loadedHadith = await getRandomHadith();
      }

      setHadith(loadedHadith);
      
      // Check if bookmarked
      const { isBookmarked: checkBookmark } = await import('../utils/userStatsSupabase');
      const bookmarked = await checkBookmark(loadedHadith.reference);
      setIsBookmarked(bookmarked);
    } catch (error) {
      console.error('Error loading settings:', error);
      // Fallback - this should not happen as getRandomHadith has internal fallback
      const { getRandomHadithSync } = await import('../utils/hadithData');
      const randomHadith = getRandomHadithSync();
      setHadith(randomHadith);
    } finally {
      setIsLoading(false);
    }
  }, [params]);

  const handleTimerComplete = useCallback(async () => {
    setTimerComplete(true);
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      // Celebration animation when timer completes
      Animated.sequence([
        Animated.spring(celebrationScale, {
          toValue: 1.1,
          tension: 100,
          friction: 3,
          useNativeDriver: true,
        }),
        Animated.spring(celebrationScale, {
          toValue: 1,
          tension: 50,
          friction: 5,
          useNativeDriver: true,
        }),
      ]).start();

      // Button entrance animation
      Animated.spring(completeButtonScale, {
        toValue: 1,
        tension: 60,
        friction: 6,
        delay: 200,
        useNativeDriver: true,
      }).start();
    } catch (error) {
      console.error('Haptic feedback error:', error);
    }
  }, []);

  const handleSkip = useCallback(() => {
    setTimerComplete(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    
    // Same celebration for skip
    Animated.sequence([
      Animated.spring(celebrationScale, {
        toValue: 1.1,
        tension: 100,
        friction: 3,
        useNativeDriver: true,
      }),
      Animated.spring(celebrationScale, {
        toValue: 1,
        tension: 50,
        friction: 5,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.spring(completeButtonScale, {
      toValue: 1,
      tension: 60,
      friction: 6,
      delay: 100,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleCompleteReflection = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    // Check if questions are already preloaded
    if (questionsPreloaded && quizQuestions.length > 0) {
      console.log('✅ Using preloaded questions - instant start!');
      setShowQuiz(true);
      setQuizTimerKey(prev => prev + 1);
      setTimerComplete(false);
      return;
    }
    
    // If not preloaded, generate now (with loading state)
    setIsLoadingQuestions(true);
    try {
      console.log('⏳ Generating questions on demand...');
      const { getQuestionsForHadith } = await import('../utils/hadithQuestions');
      const questions = await getQuestionsForHadith(
        hadith?.reference || '',
        hadith?.theme || '',
        hadith?.text_en || ''
      );
      
      setQuizQuestions(questions);
      setShowQuiz(true);
      setQuizTimerKey(prev => prev + 1);
      setTimerComplete(false);
    } catch (error) {
      console.error('Error loading quiz questions:', error);
      // Fallback to sync method
      const { getQuestionsForHadithSync } = await import('../utils/hadithQuestions');
      const questions = getQuestionsForHadithSync(
        hadith?.reference || '',
        hadith?.theme || '',
        hadith?.text_en || ''
      );
      setQuizQuestions(questions);
      setShowQuiz(true);
      setQuizTimerKey(prev => prev + 1);
      setTimerComplete(false);
    } finally {
      setIsLoadingQuestions(false);
    }
  }, [hadith, questionsPreloaded, quizQuestions]);

  const handleQuizTimerComplete = useCallback(() => {
    // When quiz timer completes, auto-finish with current score
    const totalPoints = quizQuestions.reduce((sum, q) => sum + q.points, 0);
    handleQuizComplete(quizScore, totalPoints);
  }, [quizScore, quizQuestions]);

  const handleQuizComplete = useCallback(async (score: number, totalPoints: number) => {
    setQuizScore(score);
    
    // Show confetti if score is good (70% or more)
    if (score / totalPoints >= 0.7) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
    }

    // Save stats
    try {
      const { updateStatsAfterReflection } = await import('../utils/userStatsSupabase');
      await updateStatsAfterReflection(score);
      await Promise.all([
        AsyncStorage.setItem('justCompleted', 'true'),
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {}),
      ]);
    } catch (error) {
      console.error('Error saving stats:', error);
    }

    // Exit animation after a short delay
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.9,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Use replace instead of back to avoid navigation errors
        if (router.canGoBack()) {
          router.back();
        } else {
          router.replace('/');
        }
      });
    }, 1500);
  }, [router, fadeAnim, scaleAnim]);

  const handleToggleBookmark = useCallback(async () => {
    if (!hadith) return;
    
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const { toggleBookmark } = await import('../utils/userStatsSupabase');
      const newBookmarkState = await toggleBookmark(hadith.reference);
      setIsBookmarked(newBookmarkState);
    } catch (error) {
      console.error('Error toggling bookmark:', error);
    }
  }, [hadith]);

  if (!hadith || isLoading) {
    return (
      <SafeAreaView className={`flex-1 ${isDark ? 'bg-primary-dark' : 'bg-white'}`}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <View className="flex-1 justify-center items-center">
          <Animated.View style={{ opacity: fadeAnim }} className="items-center justify-center">
            <Ionicons name="book-outline" size={64} color="#d4af37" />
            <Text className={`mt-4 text-lg font-semibold text-center ${
              isDark ? 'text-white' : 'text-primary-dark'
            }`}>
              Loading Hadith...
            </Text>
          </Animated.View>
        </View>
      </SafeAreaView>
    );
  }

  const animatedBlurIntensity = blurIntensity.interpolate({
    inputRange: [0, 1],
    outputRange: [0, isDark ? 20 : 80],
  });

  return (
    <Animated.View 
      style={{ 
        flex: 1,
        opacity: fadeAnim,
        transform: [{ scale: scaleAnim }]
      }}
    >
      <StatusBar style={isDark ? 'light' : 'dark'} />
      
      {/* Confetti */}
      {showConfetti && (
        <ConfettiCannon
          count={200}
          origin={{ x: width / 2, y: 0 }}
          autoStart={true}
          fadeOut={true}
          explosionSpeed={350}
        />
      )}

      {/* Background with blur */}
      <View className={`flex-1 ${isDark ? 'bg-primary-dark' : 'bg-primary-light'}`}>
        <BlurView
          intensity={isDark ? 20 : 80}
          tint={isDark ? 'dark' : 'light'}
          className="flex-1"
        >
          {/* Header */}
          <Animated.View 
            style={{ transform: [{ translateY: slideUpAnim }] }}
            className="pt-16 px-6 pb-4"
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-1" />
              <View className="flex-row items-center">
                <Ionicons name="time-outline" size={24} color="#d4af37" />
                <Text className={`ml-2 text-lg font-semibold ${
                  isDark ? 'text-white' : 'text-primary-dark'
                }`}>
                  Reflection Time
                </Text>
              </View>
              <View className="flex-1 items-end">
                <TouchableOpacity
                  onPress={handleToggleBookmark}
                  className={`p-2 rounded-full ${isDark ? 'bg-gray-800/50' : 'bg-white/50'}`}
                  activeOpacity={0.7}
                >
                  <Ionicons 
                    name={isBookmarked ? "bookmark" : "bookmark-outline"} 
                    size={24} 
                    color={isBookmarked ? "#d4af37" : (isDark ? "#fff" : "#1a1a1a")} 
                  />
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>

          {/* Timer Section - Shows for both hadith and quiz */}
          {!showQuiz && (
            <Animated.View 
              style={{ 
                opacity: fadeAnim,
                transform: [{ scale: celebrationScale }]
              }}
              className="px-6 py-8"
            >
              <CountdownTimer
                duration={COUNTDOWN_DURATION}
                onComplete={handleTimerComplete}
                isDark={isDark}
              />
              
              {/* Developer Skip Button */}
              {__DEV__ && !timerComplete && (
                <TouchableOpacity
                  onPress={handleSkip}
                  className="mt-6 py-3 px-6 rounded-xl bg-yellow-500/20 border border-yellow-500"
                  activeOpacity={0.7}
                >
                  <Text className="text-yellow-500 text-center font-semibold">
                    ⚡ Skip Timer (Dev Only)
                  </Text>
                </TouchableOpacity>
              )}
            </Animated.View>
          )}
          
          {/* Quiz Timer - Shows during quiz */}
          {showQuiz && (
            <Animated.View 
              style={{ 
                opacity: fadeAnim,
                transform: [{ scale: celebrationScale }]
              }}
              className="px-6 py-8"
            >
              <CountdownTimer
                key={quizTimerKey}
                duration={COUNTDOWN_DURATION}
                onComplete={handleQuizTimerComplete}
                isDark={isDark}
                paused={quizTimerPaused}
              />
            </Animated.View>
          )}

          {/* Content: Hadith or Quiz */}
          {!showQuiz ? (
            <>
              {/* Hadith Content */}
              <Animated.View 
                style={{ 
                  flex: 1,
                  opacity: fadeAnim,
                  transform: [{ translateY: slideUpAnim }]
                }}
                className="justify-center"
              >
                <HadithCard hadith={hadith} isDark={isDark} language={language} />
              </Animated.View>

              {/* Complete Reflection Button (only shows when timer is complete) */}
              {timerComplete ? (
                <Animated.View 
                  style={{ transform: [{ scale: completeButtonScale }] }}
                  className="px-6 pb-12"
                >
                  <TouchableOpacity
                    onPress={handleCompleteReflection}
                    activeOpacity={0.8}
                    disabled={isLoadingQuestions}
                    className="bg-primary-accent rounded-2xl py-5 px-8 items-center shadow-lg"
                  >
                    <View className="flex-row items-center">
                      {isLoadingQuestions ? (
                        <>
                          <Text className="text-primary-dark text-lg font-bold">
                            Generating Questions...
                          </Text>
                        </>
                      ) : (
                        <>
                          <Ionicons name="checkmark-circle" size={24} color="#1a1a1a" />
                          <Text className="text-primary-dark text-lg font-bold ml-2">
                            Continue to Questions
                          </Text>
                        </>
                      )}
                    </View>
                  </TouchableOpacity>
                </Animated.View>
              ) : (
                <View className="px-6 pb-12">
                  <View className={`rounded-2xl py-5 px-8 items-center ${
                    isDark ? 'bg-gray-800/50' : 'bg-gray-100/50'
                  }`}>
                    <Text className={`text-sm ${
                      isDark ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      Please wait for the timer to complete
                    </Text>
                  </View>
                </View>
              )}
            </>
          ) : (
            <>
              {/* Quiz Section */}
              <ScrollView 
                className="flex-1"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 100 }}
              >
                {quizQuestions.length > 0 ? (
                  <HadithQuiz
                    questions={quizQuestions}
                    language={language}
                    isDark={isDark}
                    onComplete={handleQuizComplete}
                    onScoreUpdate={(score) => setQuizScore(score)}
                    onPauseTimer={(paused) => setQuizTimerPaused(paused)}
                  />
                ) : (
                  <View className="flex-1 justify-center items-center p-6">
                    <Text className={`text-lg ${isDark ? 'text-white' : 'text-primary-dark'}`}>
                      Loading questions...
                    </Text>
                  </View>
                )}
              </ScrollView>
            </>
          )}

          {/* Old Close Button - now replaced */}
          {false && timerComplete ? (
            <View />
          ) : null}
        </BlurView>
      </View>
    </Animated.View>
  );
}

