/**
 * Set PIN Modal Component
 * For first-time PIN setup (no verification required)
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  Animated,
  Easing,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

interface SetPinModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: (pin: string) => void;
  title?: string;
  subtitle?: string;
  isDark?: boolean;
}

export default function SetPinModal({
  visible,
  onClose,
  onSuccess,
  title = 'Set Parental PIN',
  subtitle = 'Create a 4-digit PIN to protect settings',
  isDark = false,
}: SetPinModalProps) {
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [step, setStep] = useState<'enter' | 'confirm'>('enter');
  const [error, setError] = useState('');
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    if (visible) {
      setPin('');
      setConfirmPin('');
      setStep('enter');
      setError('');
      
      // Entrance animation
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.9);
    }
  }, [visible]);

  const handleNumberPress = async (num: string) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    if (step === 'enter') {
      if (pin.length < 4) {
        const newPin = pin + num;
        setPin(newPin);
        setError('');
      }
    } else {
      if (confirmPin.length < 4) {
        const newConfirmPin = confirmPin + num;
        setConfirmPin(newConfirmPin);
        setError('');
        
        if (newConfirmPin.length === 4) {
          // Check if PINs match
          setTimeout(() => {
            if (pin === newConfirmPin) {
              // Success!
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              onSuccess(pin);
            } else {
              // PINs don't match - shake and reset
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
              setError("PINs don't match");
              
              Animated.sequence([
                Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
                Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
                Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
                Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
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

  const handleDelete = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (step === 'enter') {
      setPin(pin.slice(0, -1));
    } else {
      setConfirmPin(confirmPin.slice(0, -1));
    }
    setError('');
  };

  const handleBack = () => {
    if (step === 'confirm') {
      setStep('enter');
      setConfirmPin('');
      setError('');
    }
  };

  const currentPin = step === 'enter' ? pin : confirmPin;

  const renderDots = () => {
    return (
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
    );
  };

  const renderNumberPad = () => {
    const numbers = [
      ['1', '2', '3'],
      ['4', '5', '6'],
      ['7', '8', '9'],
      ['', '0', 'delete'],
    ];

    return (
      <View className="w-full">
        {numbers.map((row, rowIndex) => (
          <View key={rowIndex} className="flex-row justify-center gap-4 mb-4">
            {row.map((num, colIndex) => {
              if (num === '') {
                return <View key={colIndex} className="w-16 h-16" />;
              }

              const isDelete = num === 'delete';

              return (
                <TouchableOpacity
                  key={colIndex}
                  onPress={() => {
                    if (isDelete) {
                      handleDelete();
                    } else {
                      handleNumberPress(num);
                    }
                  }}
                  className={`w-16 h-16 rounded-full items-center justify-center ${
                    isDark ? 'bg-gray-700' : 'bg-gray-200'
                  }`}
                  activeOpacity={0.7}
                >
                  {isDelete ? (
                    <Ionicons
                      name="backspace-outline"
                      size={24}
                      color={isDark ? '#d1d5db' : '#374151'}
                    />
                  ) : (
                    <Text
                      className={`text-2xl font-bold ${
                        isDark ? 'text-white' : 'text-primary-dark'
                      }`}
                    >
                      {num}
                    </Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <Animated.View
        style={{ opacity: fadeAnim }}
        className="flex-1 bg-black/50 items-center justify-center"
      >
        <Animated.View
          style={{
            transform: [{ scale: scaleAnim }, { translateX: shakeAnim }],
          }}
          className={`w-11/12 max-w-md rounded-3xl p-6 ${
            isDark ? 'bg-gray-800' : 'bg-white'
          }`}
        >
          {/* Header */}
          <View className="items-center mb-6">
            <View
              className={`w-16 h-16 rounded-full items-center justify-center mb-4 ${
                isDark ? 'bg-primary-accent/20' : 'bg-primary-accent/10'
              }`}
            >
              <Ionicons 
                name={step === 'enter' ? 'lock-closed' : 'checkmark-circle'} 
                size={32} 
                color="#d4af37" 
              />
            </View>
            <Text
              className={`text-xl font-bold text-center mb-2 ${
                isDark ? 'text-white' : 'text-primary-dark'
              }`}
            >
              {step === 'enter' ? title : 'Confirm PIN'}
            </Text>
            <Text
              className={`text-sm text-center ${
                isDark ? 'text-gray-400' : 'text-gray-600'
              }`}
            >
              {step === 'enter' ? subtitle : 'Re-enter your PIN to confirm'}
            </Text>
          </View>

          {/* PIN Dots */}
          {renderDots()}

          {/* Error Message */}
          {error && (
            <Text className="text-red-500 text-sm text-center mb-4 font-semibold">
              ❌ {error}
            </Text>
          )}

          {/* Number Pad */}
          {renderNumberPad()}

          {/* Next Button (when 4 digits entered in first step) */}
          {step === 'enter' && pin.length === 4 && (
            <TouchableOpacity
              onPress={async () => {
                await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                setStep('confirm');
              }}
              className="bg-primary-accent rounded-2xl py-4 mb-4 shadow-lg"
              activeOpacity={0.8}
            >
              <Text className="text-primary-dark text-center text-lg font-bold">
                Next →
              </Text>
            </TouchableOpacity>
          )}

          {/* Action Buttons */}
          <View className="flex-row justify-between mt-4">
            {step === 'confirm' && (
              <TouchableOpacity
                onPress={async () => {
                  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  handleBack();
                }}
                className="py-3 px-6"
              >
                <Text
                  className={`text-center font-semibold ${
                    isDark ? 'text-gray-400' : 'text-gray-600'
                  }`}
                >
                  ← Back
                </Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity
              onPress={async () => {
                await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onClose();
              }}
              className="py-3 px-6 ml-auto"
            >
              <Text
                className={`text-center font-semibold ${
                  isDark ? 'text-gray-400' : 'text-gray-600'
                }`}
              >
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

