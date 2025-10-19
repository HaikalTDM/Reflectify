/**
 * Onboarding Modal Component
 * Beautiful guided tutorial for first-time users
 * Includes: Welcome, Features Tour, PIN Setup, Donation Prompt
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  Animated,
  Easing,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

interface OnboardingModalProps {
  visible: boolean;
  onComplete: (pin?: string) => void;
  isDark?: boolean;
}

type OnboardingStep = 
  | 'welcome' 
  | 'feature1' 
  | 'feature2' 
  | 'feature3' 
  | 'pin_intro'
  | 'pin_setup'
  | 'donation';

export default function OnboardingModal({
  visible,
  onComplete,
  isDark = false,
}: OnboardingModalProps) {
  const router = useRouter();
  const [step, setStep] = useState<OnboardingStep>('welcome');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinStep, setPinStep] = useState<'enter' | 'confirm'>('enter');
  const [error, setError] = useState('');

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const iconBounce = useRef(new Animated.Value(1)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Entrance animation
      Animated.parallel([
        Animated.spring(fadeAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 40,
          friction: 6,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 500,
          easing: Easing.out(Easing.back(1.2)),
          useNativeDriver: true,
        }),
      ]).start();

      // Icon bounce animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(iconBounce, {
            toValue: 1.1,
            duration: 1000,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(iconBounce, {
            toValue: 1,
            duration: 1000,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [visible]);

  useEffect(() => {
    // Update progress bar based on step
    const progressMap: Record<OnboardingStep, number> = {
      welcome: 0,
      feature1: 0.2,
      feature2: 0.4,
      feature3: 0.6,
      pin_intro: 0.7,
      pin_setup: 0.8,
      donation: 0.9,
    };

    Animated.timing(progressAnim, {
      toValue: progressMap[step],
      duration: 300,
      useNativeDriver: false,
    }).start();

    // Reset animations on step change
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 50,
        duration: 0,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 0,
        useNativeDriver: true,
      }),
    ]).start(() => {
      Animated.parallel([
        Animated.spring(fadeAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 400,
          easing: Easing.out(Easing.back(1.1)),
          useNativeDriver: true,
        }),
      ]).start();
    });
  }, [step]);

  const handleNext = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    const stepFlow: Record<OnboardingStep, OnboardingStep> = {
      welcome: 'feature1',
      feature1: 'feature2',
      feature2: 'feature3',
      feature3: 'pin_intro',
      pin_intro: 'pin_setup',
      pin_setup: 'donation',
      donation: 'welcome', // Will call onComplete instead
    };

    if (step === 'donation') {
      onComplete(pin || undefined);
    } else {
      setStep(stepFlow[step]);
    }
  };

  const handleSkip = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (step === 'pin_setup' && pin.length === 4) {
      // Save PIN and skip to end
      setStep('donation');
    } else {
      onComplete(undefined);
    }
  };

  const handlePinInput = (num: string) => {
    if (pinStep === 'enter') {
      if (pin.length < 4) {
        setPin(pin + num);
        setError('');
      }
    } else {
      if (confirmPin.length < 4) {
        const newConfirm = confirmPin + num;
        setConfirmPin(newConfirm);
        setError('');
        
        if (newConfirm.length === 4) {
          setTimeout(() => {
            if (pin === newConfirm) {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              // PIN set successfully, move to donation
              setTimeout(() => setStep('donation'), 500);
            } else {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
              setError("PINs don't match");
              Animated.sequence([
                Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
                Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
                Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
                Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
              ]).start();
              setTimeout(() => {
                setConfirmPin('');
                setError('');
              }, 1500);
            }
          }, 200);
        }
      }
    }
  };

  const handlePinDelete = () => {
    if (pinStep === 'enter') {
      setPin(pin.slice(0, -1));
    } else {
      setConfirmPin(confirmPin.slice(0, -1));
    }
  };

  const handlePinNext = () => {
    if (pin.length === 4) {
      setPinStep('confirm');
    }
  };

  const renderContent = () => {
    switch (step) {
      case 'welcome':
        return (
          <Animated.View 
            style={{ 
              opacity: fadeAnim, 
              transform: [{ translateY: slideAnim }, { scale: scaleAnim }] 
            }}
            className="items-center"
          >
            <Animated.View 
              style={{ transform: [{ scale: iconBounce }] }}
              className={`w-32 h-32 rounded-full items-center justify-center mb-6 ${
                isDark ? 'bg-primary-accent/20' : 'bg-primary-accent/10'
              }`}
            >
              <Ionicons name="book" size={64} color="#d4af37" />
            </Animated.View>
            
            <Text className={`text-4xl font-bold mb-4 text-center ${
              isDark ? 'text-white' : 'text-primary-dark'
            }`}>
              Welcome to{'\n'}Reflectify! 🌙
            </Text>
            
            <Text className={`text-lg text-center mb-8 ${
              isDark ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Your daily companion for{'\n'}
              <Text className="text-primary-accent font-bold">Islamic reflection</Text> and{'\n'}
              <Text className="text-primary-accent font-bold">spiritual growth</Text>
            </Text>

            <View className={`p-4 rounded-2xl mb-6 ${
              isDark ? 'bg-gray-800' : 'bg-gray-100'
            }`}>
              <Text className={`text-sm text-center ${
                isDark ? 'text-gray-400' : 'text-gray-600'
              }`}>
                ✨ Learn from authentic hadiths{'\n'}
                🎯 Build consistent habits{'\n'}
                📱 Healthy screen time for children
              </Text>
            </View>
          </Animated.View>
        );

      case 'feature1':
        return (
          <Animated.View 
            style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
            className="items-center"
          >
            <View className={`w-24 h-24 rounded-full items-center justify-center mb-6 ${
              isDark ? 'bg-blue-500/20' : 'bg-blue-50'
            }`}>
              <Ionicons name="book-outline" size={48} color={isDark ? '#60a5fa' : '#3b82f6'} />
            </View>
            
            <Text className={`text-3xl font-bold mb-4 text-center ${
              isDark ? 'text-white' : 'text-primary-dark'
            }`}>
              Authentic Hadiths 📖
            </Text>
            
            <Text className={`text-base text-center mb-6 px-4 ${
              isDark ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Access <Text className="font-bold text-primary-accent">7,563 authentic hadiths</Text> from{' '}
              <Text className="font-semibold">Sahih al-Bukhari</Text> and{' '}
              <Text className="font-semibold">Sahih Muslim</Text>
            </Text>

            <View className={`w-full p-4 rounded-xl ${
              isDark ? 'bg-gray-800' : 'bg-gray-100'
            }`}>
              <View className="flex-row items-center mb-2">
                <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                <Text className={`ml-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  3 languages: English, Arabic, Malay
                </Text>
              </View>
              <View className="flex-row items-center mb-2">
                <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                <Text className={`ml-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  100% Sahih (authentic) sources only
                </Text>
              </View>
              <View className="flex-row items-center">
                <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                <Text className={`ml-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Daily fresh content from API
                </Text>
              </View>
            </View>
          </Animated.View>
        );

      case 'feature2':
        return (
          <Animated.View 
            style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
            className="items-center"
          >
            <View className={`w-24 h-24 rounded-full items-center justify-center mb-6 ${
              isDark ? 'bg-purple-500/20' : 'bg-purple-50'
            }`}>
              <Ionicons name="medal-outline" size={48} color={isDark ? '#a78bfa' : '#8b5cf6'} />
            </View>
            
            <Text className={`text-3xl font-bold mb-4 text-center ${
              isDark ? 'text-white' : 'text-primary-dark'
            }`}>
              Gamified Learning 🎯
            </Text>
            
            <Text className={`text-base text-center mb-6 px-4 ${
              isDark ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Make learning fun with <Text className="font-bold text-primary-accent">quizzes</Text>,{' '}
              <Text className="font-bold text-primary-accent">streaks</Text>, and{' '}
              <Text className="font-bold text-primary-accent">scores</Text>!
            </Text>

            <View className="flex-row justify-around w-full px-4 mb-6">
              <View className="items-center">
                <View className={`w-16 h-16 rounded-2xl items-center justify-center mb-2 ${
                  isDark ? 'bg-orange-500/20' : 'bg-orange-50'
                }`}>
                  <Text className="text-2xl">🔥</Text>
                </View>
                <Text className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Streaks
                </Text>
              </View>

              <View className="items-center">
                <View className={`w-16 h-16 rounded-2xl items-center justify-center mb-2 ${
                  isDark ? 'bg-yellow-500/20' : 'bg-yellow-50'
                }`}>
                  <Text className="text-2xl">⭐</Text>
                </View>
                <Text className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Points
                </Text>
              </View>

              <View className="items-center">
                <View className={`w-16 h-16 rounded-2xl items-center justify-center mb-2 ${
                  isDark ? 'bg-green-500/20' : 'bg-green-50'
                }`}>
                  <Text className="text-2xl">📝</Text>
                </View>
                <Text className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Quizzes
                </Text>
              </View>
            </View>

            <View className={`p-4 rounded-xl ${
              isDark ? 'bg-primary-accent/10' : 'bg-primary-accent/5'
            }`}>
              <Text className={`text-sm text-center ${
                isDark ? 'text-primary-accent' : 'text-gray-700'
              }`}>
                💡 Answer questions correctly to earn points and maintain your streak!
              </Text>
            </View>
          </Animated.View>
        );

      case 'feature3':
        return (
          <Animated.View 
            style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
            className="items-center"
          >
            <View className={`w-24 h-24 rounded-full items-center justify-center mb-6 ${
              isDark ? 'bg-red-500/20' : 'bg-red-50'
            }`}>
              <Ionicons name="timer-outline" size={48} color={isDark ? '#f87171' : '#ef4444'} />
            </View>
            
            <Text className={`text-3xl font-bold mb-4 text-center ${
              isDark ? 'text-white' : 'text-primary-dark'
            }`}>
              Screen Time Control ⏰
            </Text>
            
            <Text className={`text-base text-center mb-6 px-4 ${
              isDark ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Perfect for <Text className="font-bold text-primary-accent">children</Text>!{' '}
              Encourage healthy habits with automatic reflection reminders.
            </Text>

            <View className={`w-full p-4 rounded-xl mb-4 ${
              isDark ? 'bg-gray-800' : 'bg-gray-100'
            }`}>
              <View className="flex-row items-center mb-3">
                <View className={`w-10 h-10 rounded-full items-center justify-center ${
                  isDark ? 'bg-primary-accent/20' : 'bg-primary-accent/10'
                }`}>
                  <Ionicons name="lock-closed" size={20} color="#d4af37" />
                </View>
                <View className="flex-1 ml-3">
                  <Text className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Usage Lock (1-2 hours)
                  </Text>
                  <Text className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Auto-lock app after time limit
                  </Text>
                </View>
              </View>

              <View className="flex-row items-center mb-3">
                <View className={`w-10 h-10 rounded-full items-center justify-center ${
                  isDark ? 'bg-primary-accent/20' : 'bg-primary-accent/10'
                }`}>
                  <Ionicons name="notifications" size={20} color="#d4af37" />
                </View>
                <View className="flex-1 ml-3">
                  <Text className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Daily Reminders
                  </Text>
                  <Text className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Never miss a reflection
                  </Text>
                </View>
              </View>

              <View className="flex-row items-center">
                <View className={`w-10 h-10 rounded-full items-center justify-center ${
                  isDark ? 'bg-primary-accent/20' : 'bg-primary-accent/10'
                }`}>
                  <Ionicons name="shield-checkmark" size={20} color="#d4af37" />
                </View>
                <View className="flex-1 ml-3">
                  <Text className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    PIN Protected
                  </Text>
                  <Text className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Children can't disable controls
                  </Text>
                </View>
              </View>
            </View>
          </Animated.View>
        );

      case 'pin_intro':
        return (
          <Animated.View 
            style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
            className="items-center"
          >
            <View className={`w-24 h-24 rounded-full items-center justify-center mb-6 ${
              isDark ? 'bg-primary-accent/20' : 'bg-primary-accent/10'
            }`}>
              <Ionicons name="lock-closed" size={48} color="#d4af37" />
            </View>
            
            <Text className={`text-3xl font-bold mb-4 text-center ${
              isDark ? 'text-white' : 'text-primary-dark'
            }`}>
              Set Parental PIN 🔒
            </Text>
            
            <Text className={`text-base text-center mb-6 px-4 ${
              isDark ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Create a <Text className="font-bold text-primary-accent">4-digit PIN</Text> to protect important settings from being changed.
            </Text>

            <View className={`w-full p-5 rounded-xl mb-4 ${
              isDark ? 'bg-yellow-900/20 border-2 border-yellow-600/30' : 'bg-yellow-50 border-2 border-yellow-200'
            }`}>
              <View className="flex-row items-start">
                <Ionicons name="warning" size={24} color={isDark ? '#fbbf24' : '#d97706'} />
                <View className="flex-1 ml-3">
                  <Text className={`font-bold mb-2 ${
                    isDark ? 'text-yellow-400' : 'text-yellow-800'
                  }`}>
                    Protected Settings:
                  </Text>
                  <Text className={`text-sm ${
                    isDark ? 'text-yellow-300' : 'text-yellow-700'
                  }`}>
                    • Disable screen time limits{'\n'}
                    • Turn off reminders{'\n'}
                    • Delete progress data{'\n'}
                    • Change frequency to manual
                  </Text>
                </View>
              </View>
            </View>

            <View className={`p-4 rounded-xl ${
              isDark ? 'bg-primary-accent/10' : 'bg-primary-accent/5'
            }`}>
              <Text className={`text-sm text-center ${
                isDark ? 'text-primary-accent' : 'text-gray-700'
              }`}>
                💡 Your child can enable stricter settings, but only YOU can make them less strict!
              </Text>
            </View>
          </Animated.View>
        );

      case 'pin_setup':
        const currentPin = pinStep === 'enter' ? pin : confirmPin;
        return (
          <Animated.View 
            style={{ 
              opacity: fadeAnim, 
              transform: [{ translateY: slideAnim }, { translateX: shakeAnim }] 
            }}
            className="items-center"
          >
            <View className={`w-16 h-16 rounded-full items-center justify-center mb-4 ${
              isDark ? 'bg-primary-accent/20' : 'bg-primary-accent/10'
            }`}>
              <Ionicons 
                name={pinStep === 'enter' ? 'key' : 'checkmark-circle'} 
                size={32} 
                color="#d4af37" 
              />
            </View>
            
            <Text className={`text-2xl font-bold mb-2 text-center ${
              isDark ? 'text-white' : 'text-primary-dark'
            }`}>
              {pinStep === 'enter' ? 'Create Your PIN' : 'Confirm Your PIN'}
            </Text>
            
            <Text className={`text-sm text-center mb-6 ${
              isDark ? 'text-gray-400' : 'text-gray-600'
            }`}>
              {pinStep === 'enter' ? 'Enter a 4-digit PIN' : 'Re-enter your PIN to confirm'}
            </Text>

            {/* PIN Dots */}
            <View className="flex-row justify-center gap-4 mb-6">
              {[0, 1, 2, 3].map((index) => (
                <View
                  key={index}
                  className={`w-4 h-4 rounded-full ${
                    currentPin.length > index
                      ? error
                        ? 'bg-red-500'
                        : 'bg-primary-accent'
                      : isDark
                      ? 'bg-gray-700'
                      : 'bg-gray-300'
                  }`}
                />
              ))}
            </View>

            {/* Error */}
            {error && (
              <Text className="text-red-500 text-sm mb-4 font-semibold">
                ❌ {error}
              </Text>
            )}

            {/* Number Pad */}
            <View className="w-full">
              {[['1', '2', '3'], ['4', '5', '6'], ['7', '8', '9'], ['', '0', 'delete']].map((row, rowIndex) => (
                <View key={rowIndex} className="flex-row justify-center gap-4 mb-4">
                  {row.map((num, colIndex) => {
                    if (num === '') return <View key={colIndex} className="w-16 h-16" />;
                    const isDelete = num === 'delete';
                    
                    return (
                      <TouchableOpacity
                        key={colIndex}
                        onPress={async () => {
                          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          if (isDelete) {
                            handlePinDelete();
                          } else {
                            handlePinInput(num);
                          }
                        }}
                        className={`w-16 h-16 rounded-full items-center justify-center ${
                          isDark ? 'bg-gray-700' : 'bg-gray-200'
                        }`}
                        activeOpacity={0.7}
                      >
                        {isDelete ? (
                          <Ionicons name="backspace-outline" size={24} color={isDark ? '#d1d5db' : '#374151'} />
                        ) : (
                          <Text className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-primary-dark'}`}>
                            {num}
                          </Text>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ))}
            </View>

            {/* Next Button */}
            {pinStep === 'enter' && pin.length === 4 && (
              <TouchableOpacity
                onPress={async () => {
                  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  handlePinNext();
                }}
                className="bg-primary-accent rounded-2xl py-4 w-full mt-2 shadow-lg"
                activeOpacity={0.8}
              >
                <Text className="text-primary-dark text-center text-lg font-bold">
                  Next →
                </Text>
              </TouchableOpacity>
            )}

            {/* Back Button */}
            {pinStep === 'confirm' && (
              <TouchableOpacity
                onPress={() => {
                  setPinStep('enter');
                  setConfirmPin('');
                  setError('');
                }}
                className="mt-4"
              >
                <Text className={`text-center ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  ← Back
                </Text>
              </TouchableOpacity>
            )}
          </Animated.View>
        );

      case 'donation':
        return (
          <Animated.View 
            style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
            className="items-center"
          >
            <Animated.View style={{ transform: [{ scale: iconBounce }] }}>
              <Ionicons name="heart" size={64} color="#d4af37" />
            </Animated.View>
            
            <Text className={`text-3xl font-bold mb-4 mt-6 text-center ${
              isDark ? 'text-white' : 'text-primary-dark'
            }`}>
              Support Reflectify 💚
            </Text>
            
            <Text className={`text-base text-center mb-6 px-4 ${
              isDark ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Reflectify is <Text className="font-bold text-primary-accent">100% free</Text> with no ads!{'\n'}
              Help us keep it that way with a small donation.
            </Text>

            <View className={`w-full p-5 rounded-xl mb-4 ${
              isDark ? 'bg-primary-accent/10' : 'bg-primary-accent/5'
            }`}>
              <Text className={`text-center font-semibold mb-3 ${
                isDark ? 'text-primary-accent' : 'text-gray-800'
              }`}>
                Your donation helps:
              </Text>
              <View className="space-y-2">
                <View className="flex-row items-center">
                  <Ionicons name="book-outline" size={18} color="#d4af37" />
                  <Text className={`ml-2 text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Keep hadiths free for everyone
                  </Text>
                </View>
                <View className="flex-row items-center">
                  <Ionicons name="language-outline" size={18} color="#d4af37" />
                  <Text className={`ml-2 text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Add more languages & features
                  </Text>
                </View>
                <View className="flex-row items-center">
                  <Ionicons name="server-outline" size={18} color="#d4af37" />
                  <Text className={`ml-2 text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Cover server & maintenance costs
                  </Text>
                </View>
              </View>
            </View>

            <View className={`p-4 rounded-xl mb-6 ${
              isDark ? 'bg-gray-800' : 'bg-gray-100'
            }`}>
              <Text className={`text-xs text-center italic ${
                isDark ? 'text-gray-400' : 'text-gray-600'
              }`}>
                "The best charity is that given when one has little."{'\n'}
                - Prophet Muhammad ﷺ
              </Text>
            </View>

            <TouchableOpacity
              onPress={async () => {
                await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                onComplete(pin || undefined);
                router.push('/donation');
              }}
              className="bg-primary-accent rounded-2xl py-4 w-full mb-3 shadow-lg"
              activeOpacity={0.8}
            >
              <View className="flex-row items-center justify-center">
                <Ionicons name="heart" size={20} color="#1a1a1a" />
                <Text className="text-primary-dark text-center text-lg font-bold ml-2">
                  Donate Now
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={async () => {
                await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onComplete(pin || undefined);
              }}
              className="py-3"
            >
              <Text className={`text-center ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Maybe Later
              </Text>
            </TouchableOpacity>
          </Animated.View>
        );

      default:
        return null;
    }
  };

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={() => onComplete(undefined)}
    >
      <View className="flex-1 bg-black/60">
        <Animated.View
          style={{ transform: [{ scale: scaleAnim }] }}
          className={`flex-1 m-6 mt-20 mb-10 rounded-3xl overflow-hidden ${
            isDark ? 'bg-gray-900' : 'bg-white'
          }`}
        >
          {/* Progress Bar */}
          <View className={`h-1 ${isDark ? 'bg-gray-800' : 'bg-gray-200'}`}>
            <Animated.View
              style={{ width: progressWidth }}
              className="h-full bg-primary-accent"
            />
          </View>

          {/* Content */}
          <View className="flex-1 p-6 justify-center">
            {renderContent()}
          </View>

          {/* Navigation */}
          {step !== 'pin_setup' && step !== 'donation' && (
            <View className="flex-row justify-between p-6 pt-0">
              <TouchableOpacity onPress={handleSkip} className="py-3 px-6">
                <Text className={`font-semibold ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Skip
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleNext}
                className="bg-primary-accent rounded-2xl py-3 px-8 shadow-md"
                activeOpacity={0.8}
              >
                <Text className="text-primary-dark font-bold text-lg">
                  {step === 'pin_intro' ? "Let's Set It!" : 'Next'}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Skip for PIN setup */}
          {step === 'pin_setup' && (
            <View className="p-6 pt-0">
              <TouchableOpacity onPress={handleSkip} className="py-3">
                <Text className={`text-center ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Skip (Not Recommended)
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
}

