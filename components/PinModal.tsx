/**
 * PIN Modal Component
 * Shows a modal to enter parental control PIN
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

interface PinModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onFail?: () => void;
  title?: string;
  subtitle?: string;
  isDark?: boolean;
}

export default function PinModal({
  visible,
  onClose,
  onSuccess,
  onFail,
  title = 'Parental Control',
  subtitle = 'Enter 4-digit PIN to continue',
  isDark = false,
}: PinModalProps) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    if (visible) {
      setPin('');
      setError(false);
      
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


  const handleSubmit = async () => {
    if (pin.length !== 4) {
      return;
    }

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Import dynamically to avoid circular dependency
    const { parentalPin } = await import('../utils/parentalPin');
    const isValid = await parentalPin.verifyPin(pin);

    if (isValid) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onSuccess();
      onClose();
    } else {
      // Wrong PIN - shake animation
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setError(true);
      setPin('');
      
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
      ]).start(() => {
        if (onFail) {
          onFail();
        }
      });
    }
  };

  const renderDots = () => {
    return (
      <View className="flex-row justify-center gap-4 mb-6">
        {[0, 1, 2, 3].map((index) => (
          <View
            key={index}
            className={`w-4 h-4 rounded-full ${
              pin.length > index
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
                  onPress={async () => {
                    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    if (isDelete) {
                      setPin(pin.slice(0, -1));
                    } else {
                      if (pin.length < 4) {
                        const newPin = pin + num;
                        setPin(newPin);
                        if (newPin.length === 4) {
                          // Auto-submit when 4 digits entered
                          setTimeout(() => handleSubmit(), 200);
                        }
                      }
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
              <Ionicons name="lock-closed" size={32} color="#d4af37" />
            </View>
            <Text
              className={`text-xl font-bold text-center mb-2 ${
                isDark ? 'text-white' : 'text-primary-dark'
              }`}
            >
              {title}
            </Text>
            <Text
              className={`text-sm text-center ${
                isDark ? 'text-gray-400' : 'text-gray-600'
              }`}
            >
              {subtitle}
            </Text>
          </View>

          {/* PIN Dots */}
          {renderDots()}

          {/* Error Message */}
          {error && (
            <Text className="text-red-500 text-sm text-center mb-4">
              ❌ Incorrect PIN. Try again.
            </Text>
          )}

          {/* Number Pad */}
          {renderNumberPad()}

          {/* Submit Button (appears when 4 digits entered) */}
          {pin.length === 4 && !error && (
            <TouchableOpacity
              onPress={async () => {
                await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                handleSubmit();
              }}
              className="bg-primary-accent rounded-2xl py-4 mb-4 shadow-lg"
              activeOpacity={0.8}
            >
              <Text className="text-primary-dark text-center text-lg font-bold">
                Submit
              </Text>
            </TouchableOpacity>
          )}

          {/* Cancel Button */}
          <TouchableOpacity
            onPress={async () => {
              await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onClose();
            }}
            className="mt-4 py-3"
          >
            <Text
              className={`text-center font-semibold ${
                isDark ? 'text-gray-400' : 'text-gray-600'
              }`}
            >
              Cancel
            </Text>
          </TouchableOpacity>

          {/* Hint */}
          <Text
            className={`text-xs text-center mt-4 ${
              isDark ? 'text-gray-500' : 'text-gray-500'
            }`}
          >
            Forgot PIN? Go to Settings → Parental Control
          </Text>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

