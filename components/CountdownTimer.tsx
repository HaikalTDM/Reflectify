import React, { useEffect, useState, useRef, memo } from 'react';
import { View, Text, Animated, Easing } from 'react-native';

interface CountdownTimerProps {
  duration: number; // in seconds
  onComplete: () => void;
  isDark: boolean;
}

function CountdownTimer({ duration, onComplete, isDark }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState(duration);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const ringPulse = useRef(new Animated.Value(1)).current;
  const colorTransition = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Color transition from gold to red in last 10 seconds
    const colorStartTime = Math.max(0, duration - 10);
    setTimeout(() => {
      Animated.timing(colorTransition, {
        toValue: 1,
        duration: 10000,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: false,
      }).start();
    }, colorStartTime * 1000);

    // Gentle breathing pulse animation - peaceful and meditative
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.08, // More visible breathing
          duration: 2000, // Slower inhale
          easing: Easing.inOut(Easing.sin), // Sine wave for natural breathing
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000, // Slower exhale
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();

    // Visible ring pulse - gentle but noticeable
    const ringPulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(ringPulse, {
          toValue: 1.12, // More visible ring expansion
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(ringPulse, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    ringPulseAnimation.start();

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          pulse.stop();
          ringPulseAnimation.stop();
          onComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(interval);
      pulse.stop();
      ringPulseAnimation.stop();
    };
  }, [duration, onComplete]);

  // Smooth color transition from gold (#d4af37) to red (#ef4444)
  const borderColor = colorTransition.interpolate({
    inputRange: [0, 1],
    outputRange: ['#d4af37', '#ef4444'],
  });

  const textColor = colorTransition.interpolate({
    inputRange: [0, 1],
    outputRange: isDark ? ['#ffffff', '#fecaca'] : ['#1a202c', '#ef4444'],
  });

  const progressColor = colorTransition.interpolate({
    inputRange: [0, 1],
    outputRange: ['#d4af37', '#ef4444'],
  });

  // Calculate progress percentage for width
  const progressPercentage = ((duration - timeLeft) / duration) * 100;

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View className="w-full items-center">
      {/* Circular countdown display */}
      <Animated.View 
        style={{ 
          borderColor: borderColor,
        }}
        className="w-32 h-32 rounded-full items-center justify-center border-4"
      >
        <Animated.View style={{ transform: [{ scale: ringPulse }] }}>
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <Animated.Text 
              style={{ 
                color: textColor,
              }}
              className="text-4xl font-bold"
            >
              {formatTime(timeLeft)}
            </Animated.Text>
          </Animated.View>
        </Animated.View>
      </Animated.View>

      {/* Progress bar */}
      <View className={`w-full h-2 rounded-full mt-6 overflow-hidden ${
        isDark ? 'bg-gray-700' : 'bg-gray-200'
      }`}>
        <Animated.View
          style={{
            width: `${100 - progressPercentage}%`,
            height: '100%',
            borderRadius: 9999,
            backgroundColor: progressColor,
          }}
        />
      </View>

      {/* Status text */}
      <Text className={`mt-4 text-sm ${
        isDark ? 'text-gray-400' : 'text-gray-600'
      }`}>
        Reflect on this wisdom...
      </Text>
    </View>
  );
}

export default memo(CountdownTimer);

