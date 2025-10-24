import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { getStreakStatus, useFreeze } from '../utils/streakManager';

interface StreakStatusCardProps {
  isDark: boolean;
  onFreezeUsed?: () => void;
}

export default function StreakStatusCard({ isDark, onFreezeUsed }: StreakStatusCardProps) {
  const [streakStatus, setStreakStatus] = useState({
    currentStreak: 0,
    isAtRisk: false,
    hoursRemaining: 24,
    freezesRemaining: 3,
    canUseFreeze: false,
  });
  const [isUsingFreeze, setIsUsingFreeze] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    loadStreakStatus();
    
    // Refresh every minute
    const interval = setInterval(loadStreakStatus, 60000);
    return () => clearInterval(interval);
  }, []);

  const loadStreakStatus = async () => {
    try {
      const status = await getStreakStatus();
      setStreakStatus(status);
    } catch (error) {
      console.error('Error loading streak status:', error);
    }
  };

  const handleUseFreeze = async () => {
    if (!streakStatus.canUseFreeze) return;
    
    setIsUsingFreeze(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    try {
      const success = await useFreeze();
      
      if (success) {
        setShowSuccess(true);
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        
        // Reload status
        await loadStreakStatus();
        
        // Hide success message after 3 seconds
        setTimeout(() => setShowSuccess(false), 3000);
        
        // Notify parent
        onFreezeUsed?.();
      } else {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } catch (error) {
      console.error('Error using freeze:', error);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsUsingFreeze(false);
    }
  };

  if (streakStatus.currentStreak === 0) {
    return null; // Don't show if no active streak
  }

  return (
    <View className={`mx-6 mb-4 p-4 rounded-2xl border ${isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-200'} ${streakStatus.isAtRisk ? 'border-red-500/50' : ''}`}>
      {/* Header */}
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center">
          <Ionicons 
            name={streakStatus.isAtRisk ? "warning" : "flame"} 
            size={24} 
            color={streakStatus.isAtRisk ? "#ef4444" : "#f59e0b"} 
          />
          <Text className={`ml-2 text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {streakStatus.currentStreak} Day Streak
          </Text>
        </View>
        
        {/* Freeze Indicator */}
        <View className="flex-row items-center">
          {[...Array(3)].map((_, i) => (
            <Ionicons
              key={i}
              name="snow"
              size={16}
              color={i < streakStatus.freezesRemaining ? "#3b82f6" : isDark ? "#374151" : "#d1d5db"}
              style={{ marginLeft: i > 0 ? 4 : 0 }}
            />
          ))}
          <Text className={`ml-2 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            {streakStatus.freezesRemaining}/3
          </Text>
        </View>
      </View>

      {/* At Risk Warning */}
      {streakStatus.isAtRisk && (
        <>
          <View className={`p-3 rounded-xl mb-3 ${isDark ? 'bg-red-900/30' : 'bg-red-50'}`}>
            <View className="flex-row items-start">
              <Ionicons name="alert-circle" size={20} color="#ef4444" style={{ marginRight: 8, marginTop: 2 }} />
              <View className="flex-1">
                <Text className={`font-semibold mb-1 ${isDark ? 'text-red-400' : 'text-red-700'}`}>
                  Streak at Risk!
                </Text>
                <Text className={`text-sm ${isDark ? 'text-red-300' : 'text-red-600'}`}>
                  {streakStatus.hoursRemaining < 1 
                    ? `Only ${Math.round(streakStatus.hoursRemaining * 60)} minutes remaining!`
                    : `${streakStatus.hoursRemaining.toFixed(1)} hours remaining to complete your reflection`
                  }
                </Text>
              </View>
            </View>
          </View>

          {/* Use Freeze Button */}
          {streakStatus.canUseFreeze && !showSuccess && (
            <TouchableOpacity
              onPress={handleUseFreeze}
              disabled={isUsingFreeze}
              className={`p-3 rounded-xl flex-row items-center justify-center ${isDark ? 'bg-blue-600' : 'bg-blue-500'} ${isUsingFreeze ? 'opacity-50' : ''}`}
              activeOpacity={0.7}
            >
              {isUsingFreeze ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <>
                  <Ionicons name="snow" size={20} color="white" />
                  <Text className="text-white font-semibold ml-2">
                    Use Freeze ({streakStatus.freezesRemaining} left)
                  </Text>
                </>
              )}
            </TouchableOpacity>
          )}

          {/* Success Message */}
          {showSuccess && (
            <View className={`p-3 rounded-xl ${isDark ? 'bg-green-900/30' : 'bg-green-50'}`}>
              <View className="flex-row items-center justify-center">
                <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                <Text className={`ml-2 font-semibold ${isDark ? 'text-green-400' : 'text-green-700'}`}>
                  Freeze Used! Streak Saved ❄️
                </Text>
              </View>
            </View>
          )}

          {/* No Freezes Left */}
          {!streakStatus.canUseFreeze && !showSuccess && (
            <View className={`p-3 rounded-xl ${isDark ? 'bg-gray-700/50' : 'bg-gray-100'}`}>
              <Text className={`text-center text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                No freeze chances left. Complete a reflection to save your streak!
              </Text>
            </View>
          )}
        </>
      )}

      {/* Healthy Streak Info */}
      {!streakStatus.isAtRisk && (
        <View className={`p-3 rounded-xl ${isDark ? 'bg-green-900/20' : 'bg-green-50'}`}>
          <Text className={`text-sm text-center ${isDark ? 'text-green-400' : 'text-green-700'}`}>
            🎉 Your streak is safe! Complete your next reflection within {streakStatus.hoursRemaining.toFixed(1)} hours.
          </Text>
        </View>
      )}

      {/* Freeze Info */}
      <View className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
        <Text className={`text-xs text-center ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
          💡 Freezes reset monthly. Use them to save your streak when you can't reflect.
        </Text>
      </View>
    </View>
  );
}

