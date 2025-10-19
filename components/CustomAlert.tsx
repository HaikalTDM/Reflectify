import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  Animated,
  Easing,
  Dimensions,
  StyleSheet,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

export interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

interface CustomAlertProps {
  visible: boolean;
  title: string;
  message: string;
  buttons?: AlertButton[];
  onClose: () => void;
  isDark?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
}

export default function CustomAlert({
  visible,
  title,
  message,
  buttons = [{ text: 'OK', style: 'default' }],
  onClose,
  isDark = false,
  icon,
  iconColor = '#d4af37',
}: CustomAlertProps) {
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    if (visible) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
      
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
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
    } else {
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 0.8,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handleButtonPress = async (button: AlertButton) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    if (button.onPress) {
      button.onPress();
    }
    onClose();
  };

  const getButtonStyle = (style?: string) => {
    switch (style) {
      case 'destructive':
        return {
          bg: '#ef4444',
          text: '#ffffff',
        };
      case 'cancel':
        return {
          bg: isDark ? '#374151' : '#f3f4f6',
          text: isDark ? '#9ca3af' : '#6b7280',
        };
      default:
        return {
          bg: '#d4af37',
          text: '#1a1a1a',
        };
    }
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.container}>
        {/* Darker background overlay */}
        <View 
          style={[
            StyleSheet.absoluteFill, 
            { backgroundColor: isDark ? 'rgba(0, 0, 0, 0.85)' : 'rgba(0, 0, 0, 0.75)' }
          ]}
        >
          <TouchableOpacity
            style={styles.backdrop}
            activeOpacity={1}
            onPress={onClose}
          />
        </View>

        <Animated.View
          style={[
            styles.alertContainer,
            {
              transform: [{ scale: scaleAnim }, { translateY: slideAnim }],
              opacity: opacityAnim,
            },
          ]}
        >
          <View
            style={[
              styles.alertBox,
              {
                backgroundColor: isDark ? '#1f2937' : '#ffffff',
              },
            ]}
          >
            {/* Icon */}
            {icon && (
              <View style={styles.iconContainer}>
                <View
                  style={[
                    styles.iconCircle,
                    {
                      backgroundColor: isDark
                        ? 'rgba(212, 175, 55, 0.2)'
                        : 'rgba(212, 175, 55, 0.15)',
                    },
                  ]}
                >
                  <Ionicons name={icon} size={40} color={iconColor} />
                </View>
              </View>
            )}

            {/* Title */}
            <Text
              style={[
                styles.title,
                {
                  color: isDark ? '#ffffff' : '#1a1a1a',
                  marginTop: icon ? 16 : 0,
                },
              ]}
            >
              {title}
            </Text>

            {/* Message */}
            <Text
              style={[
                styles.message,
                {
                  color: isDark ? '#d1d5db' : '#4b5563',
                },
              ]}
            >
              {message}
            </Text>

            {/* Buttons */}
            <View
              style={[
                styles.buttonContainer,
                buttons.length > 2 && styles.buttonContainerVertical,
              ]}
            >
              {buttons.map((button, index) => {
                const buttonStyle = getButtonStyle(button.style);
                const isLastButton = index === buttons.length - 1;
                const isCancelButton = button.style === 'cancel';

                return (
                  <TouchableOpacity
                    key={index}
                    onPress={() => handleButtonPress(button)}
                    activeOpacity={0.8}
                    style={[
                      styles.button,
                      {
                        backgroundColor: buttonStyle.bg,
                        marginLeft: buttons.length <= 2 && index > 0 ? 12 : 0,
                        marginTop: buttons.length > 2 && index > 0 ? 12 : 0,
                        flex: buttons.length <= 2 ? 1 : 0,
                        borderWidth: isCancelButton ? 1 : 0,
                        borderColor: isDark ? '#4b5563' : '#d1d5db',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.buttonText,
                        {
                          color: buttonStyle.text,
                          fontWeight: button.style === 'cancel' ? '500' : '700',
                        },
                      ]}
                    >
                      {button.text}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  alertContainer: {
    width: width - 64,
    maxWidth: 400,
  },
  alertBox: {
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  iconContainer: {
    alignItems: 'center',
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
  },
  message: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 24,
  },
  buttonContainer: {
    flexDirection: 'row',
  },
  buttonContainerVertical: {
    flexDirection: 'column',
  },
  button: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 16,
  },
});

