import React, { useEffect, useState, useRef, memo } from 'react';
import { View, Text, Animated, Easing } from 'react-native';

interface CountdownTimerProps {
  duration: number; // in seconds
  onComplete: () => void;
  isDark: boolean;
  paused?: boolean; // Optional: pause the timer
}

function CountdownTimer({ duration, onComplete, isDark, paused = false }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState(duration);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const ringPulse = useRef(new Animated.Value(1)).current;
  const colorTransition = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Store animation references to pause/resume them
  const progressAnimRef = useRef<Animated.CompositeAnimation | null>(null);
  const colorAnimRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    // Smooth progress animation from 0 to 100 over the entire duration
    progressAnimRef.current = Animated.timing(progressAnim, {
      toValue: 100,
      duration: duration * 1000,
      easing: Easing.linear,
      useNativeDriver: false,
    });
    progressAnimRef.current.start();

    // Smooth color transition through all 3 phases over entire duration
    // 0 = yellow (30-20s), 0.5 = orange (20-10s), 1 = red (10-0s)
    colorAnimRef.current = Animated.timing(colorTransition, {
      toValue: 1,
      duration: duration * 1000,
      easing: Easing.linear,
      useNativeDriver: false,
    });
    colorAnimRef.current.start();

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

    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          pulse.stop();
          ringPulseAnimation.stop();
          onComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      pulse.stop();
      ringPulseAnimation.stop();
    };
  }, [duration, onComplete]);

  // Handle pause/resume
  useEffect(() => {
    if (paused) {
      // Pause the timer
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      
      // Pause animations
      if (progressAnimRef.current) {
        progressAnimRef.current.stop();
      }
      if (colorAnimRef.current) {
        colorAnimRef.current.stop();
      }
    } else {
      // Resume the timer if not already running
      if (!intervalRef.current && timeLeft > 0) {
        intervalRef.current = setInterval(() => {
          setTimeLeft((prev) => {
            if (prev <= 1) {
              if (intervalRef.current) clearInterval(intervalRef.current);
              onComplete();
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
      
      // Resume animations from current value
      const remainingTime = timeLeft;
      const elapsedTime = duration - remainingTime;
      const progressValue = (elapsedTime / duration) * 100;
      const colorValue = elapsedTime / duration;
      
      progressAnimRef.current = Animated.timing(progressAnim, {
        toValue: 100,
        duration: remainingTime * 1000,
        easing: Easing.linear,
        useNativeDriver: false,
      });
      progressAnimRef.current.start();
      
      colorAnimRef.current = Animated.timing(colorTransition, {
        toValue: 1,
        duration: remainingTime * 1000,
        easing: Easing.linear,
        useNativeDriver: false,
      });
      colorAnimRef.current.start();
    }

    return () => {
      if (paused && intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [paused, timeLeft, onComplete, duration]);

  // 3-phase color transition: Yellow → Orange → Red
  // Yellow: #eab308, Orange: #f97316, Red: #ef4444
  const borderColor = colorTransition.interpolate({
    inputRange: [0, 0.33, 0.67, 1],
    outputRange: ['#eab308', '#eab308', '#f97316', '#ef4444'], // Yellow stays until 20s, then orange, then red
  });

  const textColor = colorTransition.interpolate({
    inputRange: [0, 0.33, 0.67, 1],
    outputRange: isDark 
      ? ['#fef08a', '#fef08a', '#fed7aa', '#fecaca'] // Light yellow → light orange → light red (dark mode)
      : ['#854d0e', '#854d0e', '#9a3412', '#7f1d1d'], // Dark yellow → dark orange → dark red (light mode)
  });

  const progressColor = colorTransition.interpolate({
    inputRange: [0, 0.33, 0.67, 1],
    outputRange: ['#eab308', '#eab308', '#f97316', '#ef4444'], // Yellow → Orange → Red
  });

  // Animated progress width (smoothly transitions)
  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['100%', '0%'],
  });

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
            width: progressWidth,
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

