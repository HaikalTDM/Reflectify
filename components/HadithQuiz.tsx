import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, Animated, Easing, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { QuizQuestion } from '../utils/hadithQuestions';

interface HadithQuizProps {
  questions: QuizQuestion[];
  language: 'en' | 'ar' | 'ms' | 'en+ar' | 'en+ms' | 'ar+ms' | 'all';
  isDark: boolean;
  onComplete: (score: number, totalPoints: number) => void;
  onScoreUpdate?: (score: number) => void;
  onPauseTimer?: (paused: boolean) => void; // Notify parent to pause timer
}

export default function HadithQuiz({ questions, language, isDark, onComplete, onScoreUpdate, onPauseTimer }: HadithQuizProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [score, setScore] = useState(0);
  const [answeredCorrectly, setAnsweredCorrectly] = useState(false);
  const [showScorePop, setShowScorePop] = useState(false);
  const [earnedPoints, setEarnedPoints] = useState(0);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const celebrationScale = useRef(new Animated.Value(1)).current;
  const scorePopAnim = useRef(new Animated.Value(0)).current;
  const scorePopSlide = useRef(new Animated.Value(-30)).current;
  
  // Scroll ref to auto-scroll to top
  const scrollViewRef = useRef<ScrollView>(null);

  const showMalay = language === 'ms' || language.includes('ms');
  const question = questions[currentQuestion];
  
  // Notify parent of score updates
  useEffect(() => {
    if (onScoreUpdate) {
      onScoreUpdate(score);
    }
  }, [score, onScoreUpdate]);

  useEffect(() => {
    // Entrance animation for each question (no timer reset)
    fadeAnim.setValue(0);
    slideAnim.setValue(30);
    scaleAnim.setValue(0.9);

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        easing: Easing.out(Easing.back(1.1)),
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, [currentQuestion]);

  const handleAnswerSelect = async (index: number) => {
    if (showExplanation) return; // Already answered

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // Pause the timer when answer is selected
    if (onPauseTimer) {
      onPauseTimer(true);
    }
    
    setSelectedAnswer(index);
    
    const correct = index === question.correctAnswer;
    setAnsweredCorrectly(correct);
    setShowExplanation(true);

    if (correct) {
      const newScore = score + question.points;
      setScore(newScore);
      setEarnedPoints(question.points);
      setShowScorePop(true);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      // Score pop animation - appears above sticky score
      scorePopAnim.setValue(0);
      scorePopSlide.setValue(-50);
      Animated.parallel([
        Animated.spring(scorePopAnim, {
          toValue: 1,
          tension: 80,
          friction: 6,
          useNativeDriver: true,
        }),
        Animated.spring(scorePopSlide, {
          toValue: 50, // Moves down to be visible above score
          tension: 80,
          friction: 6,
          useNativeDriver: true,
        }),
      ]).start();

      // Celebration animation
      Animated.sequence([
        Animated.spring(celebrationScale, {
          toValue: 1.15,
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

      // Fade out score pop
      setTimeout(() => {
        Animated.timing(scorePopAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start(() => setShowScorePop(false));
      }, 1200);

      // Auto-advance to next question after brief celebration
      setTimeout(() => {
        if (currentQuestion < questions.length - 1) {
          handleNext();
        }
      }, 1800); // 1.8 seconds to see the celebration
    } else {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      // Auto-advance for wrong answers too, after reading explanation
      setTimeout(() => {
        if (currentQuestion < questions.length - 1) {
          handleNext();
        }
      }, 3000); // 3 seconds to read explanation
    }
  };

  const handleNext = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    if (currentQuestion < questions.length - 1) {
      // Resume the timer when advancing to next question
      if (onPauseTimer) {
        onPauseTimer(false);
      }
      
      // Scroll to top smoothly
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
      
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
      setAnsweredCorrectly(false);
    } else {
      // Quiz complete
      const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);
      onComplete(score, totalPoints);
    }
  };

  const getOptionStyle = (index: number) => {
    if (!showExplanation) {
      return selectedAnswer === index
        ? isDark ? 'bg-primary-accent/30 border-primary-accent' : 'bg-primary-accent/20 border-primary-accent'
        : isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200';
    }

    if (index === question.correctAnswer) {
      return 'bg-green-500/20 border-green-500';
    }

    if (selectedAnswer === index && !answeredCorrectly) {
      return 'bg-red-500/20 border-red-500';
    }

    return isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200';
  };

  const getOptionIcon = (index: number) => {
    if (!showExplanation) return null;

    if (index === question.correctAnswer) {
      return <Ionicons name="checkmark-circle" size={24} color="#10b981" />;
    }

    if (selectedAnswer === index && !answeredCorrectly) {
      return <Ionicons name="close-circle" size={24} color="#ef4444" />;
    }

    return null;
  };

  return (
    <View style={{ flex: 1 }}>
      {/* Sticky Score Display - Fixed at top center */}
      <View
        style={{
          position: 'absolute',
          top: 10,
          left: 0,
          right: 0,
          zIndex: 1000,
          alignItems: 'center',
        }}
      >
        <Animated.View style={{ opacity: fadeAnim }}>
          <View className={`rounded-full px-8 py-3 shadow-xl border-2 border-primary-accent ${
            isDark ? 'bg-gray-800' : 'bg-white'
          }`}>
            <Text className={`text-3xl font-bold ${isDark ? 'text-primary-accent' : 'text-primary-dark'}`}>
              {score} pts
            </Text>
          </View>
        </Animated.View>
      </View>

      {/* Score Pop Animation */}
      {showScorePop && (
        <Animated.View
          style={{
            position: 'absolute',
            top: 70,
            left: 0,
            right: 0,
            zIndex: 1001,
            alignItems: 'center',
            opacity: scorePopAnim,
            transform: [
              { translateY: scorePopSlide },
              { scale: scorePopAnim },
            ],
          }}
        >
          <View className="bg-green-500 rounded-full px-6 py-3 shadow-2xl">
            <Text className="text-white text-2xl font-bold">
              +{earnedPoints} ✨
            </Text>
          </View>
        </Animated.View>
      )}

      <ScrollView
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1 }}
      >
        <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
        }}
        className="w-full px-6 pb-8 pt-28"
      >
        {/* Progress Bar */}
        <View className="mb-8">
          <View className="flex-row justify-between items-center mb-2">
            <Text className={`text-sm font-semibold ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Question {currentQuestion + 1} of {questions.length}
            </Text>
            <Text className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
              {Math.round((score / (questions.length * 10)) * 100)}% correct
            </Text>
          </View>
          <View className={`h-2 rounded-full ${isDark ? 'bg-gray-800' : 'bg-gray-200'}`}>
            <View
              className="h-full rounded-full bg-primary-accent"
              style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
            />
          </View>
        </View>

      {/* Question */}
      <Animated.View style={{ transform: [{ scale: celebrationScale }] }}>
        <View className={`rounded-3xl p-6 mb-8 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
          <View className="flex-row items-start mb-4">
            <Ionicons 
              name={question.type === 'reflection' ? 'bulb' : 'help-circle'} 
              size={28} 
              color="#d4af37" 
            />
            <View className="flex-1 ml-3">
              <Text className={`text-lg font-semibold leading-relaxed ${
                isDark ? 'text-white' : 'text-primary-dark'
              }`}>
                {showMalay && question.question_ms ? question.question_ms : question.question}
              </Text>
            </View>
          </View>
        </View>
      </Animated.View>

      {/* Options */}
      <View className="mb-8">
        {question.options?.map((option, index) => {
          const optionText = showMalay && question.options_ms ? question.options_ms[index] : option;
          
          return (
            <TouchableOpacity
              key={index}
              onPress={() => handleAnswerSelect(index)}
              disabled={showExplanation}
              activeOpacity={0.7}
              className={`rounded-2xl p-5 border-2 mb-4 ${getOptionStyle(index)}`}
              style={{ marginBottom: index === question.options.length - 1 ? 0 : 16 }}
            >
              <View className="flex-row items-center justify-between">
                <Text className={`flex-1 text-base font-medium leading-6 ${
                  isDark ? 'text-white' : 'text-primary-dark'
                }`}>
                  {optionText}
                </Text>
                {getOptionIcon(index) && (
                  <View className="ml-3">
                    {getOptionIcon(index)}
                  </View>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Explanation */}
      {showExplanation && (
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }}
          className={`rounded-2xl p-5 mb-8 ${
            answeredCorrectly
              ? 'bg-green-500/10 border-2 border-green-500'
              : 'bg-orange-500/10 border-2 border-orange-500'
          }`}
        >
          <View className="flex-row items-start">
            <Ionicons 
              name={answeredCorrectly ? 'checkmark-circle' : 'information-circle'} 
              size={24} 
              color={answeredCorrectly ? '#10b981' : '#f59e0b'} 
            />
            <View className="flex-1 ml-3">
              <Text className={`text-sm font-semibold mb-1 ${
                answeredCorrectly ? 'text-green-600' : 'text-orange-600'
              }`}>
                {answeredCorrectly ? '✨ Correct!' : '💡 Learn More'}
              </Text>
              <Text className={`text-sm leading-relaxed ${
                isDark ? 'text-gray-300' : 'text-gray-700'
              }`}>
                {showMalay && question.explanation_ms ? question.explanation_ms : question.explanation}
              </Text>
            </View>
          </View>
        </Animated.View>
      )}

      {/* Auto-advancing message */}
      {showExplanation && currentQuestion < questions.length - 1 && (
        <View className="items-center mb-8">
          <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            {answeredCorrectly 
              ? 'Next question in 2s... ⏱️'
              : 'Next question in 3s... ⏱️'}
          </Text>
        </View>
      )}
      
      {/* Finish button for last question */}
      {showExplanation && currentQuestion === questions.length - 1 && (
        <TouchableOpacity
          onPress={handleNext}
          activeOpacity={0.8}
          className="bg-primary-accent rounded-2xl py-5 px-8 items-center shadow-lg mb-8"
        >
          <View className="flex-row items-center">
            <Text className="text-primary-dark text-lg font-bold">
              Finish Quiz
            </Text>
            <Ionicons 
              name="checkmark-circle" 
              size={24} 
              color="#1a1a1a" 
              style={{ marginLeft: 8 }}
            />
          </View>
        </TouchableOpacity>
      )}
      </Animated.View>
      </ScrollView>
    </View>
  );
}

