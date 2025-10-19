import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, Dimensions, TouchableOpacity, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastProps {
  visible: boolean;
  message: string;
  type?: ToastType;
  duration?: number;
  onHide: () => void;
  isDark?: boolean;
}

export default function CustomToast({
  visible,
  message,
  type = 'info',
  duration = 3000,
  onHide,
  isDark = false,
}: ToastProps) {
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    if (visible) {
      // Haptic feedback
      Haptics.notificationAsync(
        type === 'success'
          ? Haptics.NotificationFeedbackType.Success
          : type === 'error'
          ? Haptics.NotificationFeedbackType.Error
          : Haptics.NotificationFeedbackType.Warning
      ).catch(() => {});

      // Show animation
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          tension: 65,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto hide after duration
      const timer = setTimeout(() => {
        hideToast();
      }, duration);

      return () => clearTimeout(timer);
    } else {
      hideToast();
    }
  }, [visible]);

  const hideToast = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -100,
        duration: 300,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 0.9,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onHide();
    });
  };

  const getToastConfig = () => {
    switch (type) {
      case 'success':
        return {
          icon: 'checkmark-circle' as const,
          color: '#10b981',
          bgColor: isDark ? 'rgba(6, 78, 59, 0.95)' : 'rgba(209, 250, 229, 0.95)',
          borderColor: '#10b981',
        };
      case 'error':
        return {
          icon: 'close-circle' as const,
          color: '#ef4444',
          bgColor: isDark ? 'rgba(127, 29, 29, 0.95)' : 'rgba(254, 226, 226, 0.95)',
          borderColor: '#ef4444',
        };
      case 'warning':
        return {
          icon: 'warning' as const,
          color: '#f59e0b',
          bgColor: isDark ? 'rgba(120, 53, 15, 0.95)' : 'rgba(254, 243, 199, 0.95)',
          borderColor: '#f59e0b',
        };
      case 'info':
      default:
        return {
          icon: 'information-circle' as const,
          color: '#3b82f6',
          bgColor: isDark ? 'rgba(30, 58, 138, 0.95)' : 'rgba(219, 234, 254, 0.95)',
          borderColor: '#3b82f6',
        };
    }
  };

  const config = getToastConfig();

  if (!visible) return null;

  return (
    <Animated.View
      style={{
        position: 'absolute',
        top: 60,
        left: 16,
        right: 16,
        zIndex: 9999,
        transform: [{ translateY }, { scale }],
        opacity,
      }}
    >
      <TouchableOpacity
        activeOpacity={0.95}
        onPress={hideToast}
        style={{
          backgroundColor: config.bgColor,
          borderLeftWidth: 4,
          borderLeftColor: config.borderColor,
          borderRadius: 16,
          padding: 16,
          flexDirection: 'row',
          alignItems: 'center',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 8,
        }}
      >
        <Ionicons name={config.icon} size={28} color={config.color} />
        <Text
          style={{
            flex: 1,
            marginLeft: 12,
            fontSize: 15,
            fontWeight: '600',
            color: isDark ? '#fff' : '#1a1a1a',
          }}
        >
          {message}
        </Text>
        <TouchableOpacity onPress={hideToast} style={{ marginLeft: 8 }}>
          <Ionicons name="close" size={20} color={isDark ? '#9ca3af' : '#6b7280'} />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
}

