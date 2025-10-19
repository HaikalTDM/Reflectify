import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Animated, Easing, Linking, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../contexts/ThemeContext';
import { useNotification } from '../contexts/NotificationContext';
import { useAuth } from '../contexts/AuthContext';

type DonationAmount = 5 | 10 | 20 | 50 | 100 | 'custom';

export default function DonationScreen() {
  const { isDark } = useTheme();
  const { showToast, showAlert } = useNotification();
  const { user } = useAuth();
  const [selectedAmount, setSelectedAmount] = useState<DonationAmount | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [loading, setLoading] = useState(false);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const heartBeat = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Entrance animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        easing: Easing.out(Easing.back(1.2)),
        useNativeDriver: true,
      }),
    ]).start();

    // Heartbeat animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(heartBeat, {
          toValue: 1.1,
          duration: 1000,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(heartBeat, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const donationOptions: { amount: DonationAmount; label: string; desc: string }[] = [
    { amount: 5, label: 'RM 5', desc: 'Buy us a coffee' },
    { amount: 10, label: 'RM 10', desc: 'Support for a month' },
    { amount: 20, label: 'RM 20', desc: 'Generous supporter' },
    { amount: 50, label: 'RM 50', desc: 'Sustaining donor' },
    { amount: 100, label: 'RM 100', desc: 'Major sponsor' },
  ];

  const handleDonation = async () => {
    if (!selectedAmount) {
      showToast({ message: 'Please select an amount', type: 'error' });
      return;
    }

    // Validate custom amount
    if (selectedAmount === 'custom') {
      const amount = parseFloat(customAmount);
      if (!customAmount || isNaN(amount) || amount < 1) {
        showToast({ message: 'Please enter a valid amount (minimum RM 1)', type: 'error' });
        return;
      }
    }

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Get the final amount
    const finalAmount = selectedAmount === 'custom' ? parseFloat(customAmount) : selectedAmount;
    
    // Show reminder BEFORE opening payment page
    showAlert({
      title: 'Opening Payment Page... 💚',
      message: `You selected RM ${finalAmount}.\n\nPlease select the same amount on the Toyyibpay page.\n\nReady to proceed?`,
      buttons: [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Got it!',
          onPress: async () => {
            // Now open the payment page
            setLoading(true);
            try {
              const paymentUrl = 'https://toyyibpay.com/ReflectifyDonation';
              
              const canOpen = await Linking.canOpenURL(paymentUrl);
              if (canOpen) {
                await Linking.openURL(paymentUrl);
                
                // Show thank you message after opening browser
                setTimeout(() => {
                  showAlert({
                    title: 'Jazakallahu Khairan! 💚',
                    message: `Thank you for your RM ${finalAmount} donation.\n\nYour support helps keep hadiths free for everyone.\n\n"The best charity is that given when one has little." - Prophet Muhammad ﷺ`,
                    buttons: [
                      { 
                        text: 'Alhamdulillah', 
                        onPress: () => router.back() 
                      }
                    ],
                  });
                }, 1000); // Small delay to let browser open first
              } else {
                throw new Error('Cannot open payment link');
              }
            } catch (error) {
              showAlert({
                title: 'Payment Error',
                message: 'Unable to open payment page. Please try again later.',
                buttons: [{ text: 'OK' }],
              });
            } finally {
              setLoading(false);
            }
          }
        }
      ],
    });
  };

  const handleBack = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  return (
    <SafeAreaView className={`flex-1 ${isDark ? 'bg-primary-dark' : 'bg-white'}`}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* Header */}
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        }}
        className="px-6 pt-4 pb-6"
      >
        <View className="flex-row items-center justify-between">
          <TouchableOpacity
            onPress={handleBack}
            className="flex-row items-center"
          >
            <Ionicons name="arrow-back" size={24} color="#d4af37" />
            <Text className="text-primary-accent text-lg font-semibold ml-2">Back</Text>
          </TouchableOpacity>
        </View>

        <View className="mt-6 items-center">
          <Animated.View style={{ transform: [{ scale: heartBeat }] }}>
            <View className="w-20 h-20 rounded-full bg-primary-accent/20 items-center justify-center mb-4">
              <Ionicons name="heart" size={40} color="#d4af37" />
            </View>
          </Animated.View>
          <Text className={`text-3xl font-bold text-center ${isDark ? 'text-white' : 'text-primary-dark'}`}>
            Support Reflectify
          </Text>
          <Text className={`text-center mt-3 text-base ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Your donation keeps hadiths free for everyone
          </Text>
        </View>
      </Animated.View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 24 }}
      >
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }}
        >
          {/* Islamic Message */}
          <View className={`rounded-2xl p-6 mb-6 ${isDark ? 'bg-primary-accent/10 border border-primary-accent/30' : 'bg-primary-accent/5 border border-primary-accent/20'}`}>
            <View className="flex-row items-start mb-3">
              <Ionicons name="book" size={24} color="#d4af37" />
              <Text className={`flex-1 ml-3 text-base font-semibold ${isDark ? 'text-primary-accent' : 'text-primary-dark'}`}>
                Sadaqah Jariyah (Continuous Charity)
              </Text>
            </View>
            <Text className={`text-sm leading-6 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              "When a person dies, their deeds come to an end except for three: 
              ongoing charity (Sadaqah Jariyah), knowledge that is benefited from, 
              and a righteous child who prays for them."
            </Text>
            <Text className={`text-xs mt-2 ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
              - Sahih Muslim 1631
            </Text>
          </View>

          {/* Donation Amounts */}
          <Text className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-primary-dark'}`}>
            Choose Amount (MYR)
          </Text>

          <View className="gap-y-3">
            {donationOptions.map((option) => (
              <TouchableOpacity
                key={option.amount}
                onPress={async () => {
                  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setSelectedAmount(option.amount);
                }}
                activeOpacity={0.7}
                className={`rounded-2xl p-5 flex-row items-center justify-between border-2 ${
                  selectedAmount === option.amount
                    ? 'bg-primary-accent/20 border-primary-accent'
                    : isDark
                    ? 'bg-gray-800 border-gray-700'
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <View>
                  <Text className={`text-2xl font-bold ${
                    selectedAmount === option.amount
                      ? 'text-primary-accent'
                      : isDark
                      ? 'text-white'
                      : 'text-primary-dark'
                  }`}>
                    {option.label}
                  </Text>
                  <Text className={`text-sm mt-1 ${
                    selectedAmount === option.amount
                      ? 'text-primary-accent/80'
                      : isDark
                      ? 'text-gray-400'
                      : 'text-gray-600'
                  }`}>
                    {option.desc}
                  </Text>
                </View>
                <View className={`w-8 h-8 rounded-full border-2 items-center justify-center ${
                  selectedAmount === option.amount
                    ? 'border-primary-accent bg-primary-accent'
                    : isDark
                    ? 'border-gray-600'
                    : 'border-gray-300'
                }`}>
                  {selectedAmount === option.amount && (
                    <Ionicons name="checkmark" size={20} color="#1a1a1a" />
                  )}
                </View>
              </TouchableOpacity>
            ))}

            {/* Custom Amount Option */}
            <TouchableOpacity
              onPress={async () => {
                await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setSelectedAmount('custom');
              }}
              activeOpacity={0.7}
              className={`rounded-2xl p-5 flex-row items-center justify-between border-2 ${
                selectedAmount === 'custom'
                  ? 'bg-primary-accent/20 border-primary-accent'
                  : isDark
                  ? 'bg-gray-800 border-gray-700'
                  : 'bg-gray-50 border-gray-200'
              }`}
            >
              <View className="flex-1 mr-4">
                <Text className={`text-2xl font-bold ${
                  selectedAmount === 'custom'
                    ? 'text-primary-accent'
                    : isDark
                    ? 'text-white'
                    : 'text-primary-dark'
                }`}>
                  Custom Amount
                </Text>
                <Text className={`text-sm mt-1 ${
                  selectedAmount === 'custom'
                    ? 'text-primary-accent/80'
                    : isDark
                    ? 'text-gray-400'
                    : 'text-gray-600'
                }`}>
                  Enter your own amount
                </Text>
              </View>
              <View className={`w-8 h-8 rounded-full border-2 items-center justify-center ${
                selectedAmount === 'custom'
                  ? 'border-primary-accent bg-primary-accent'
                  : isDark
                  ? 'border-gray-600'
                  : 'border-gray-300'
              }`}>
                {selectedAmount === 'custom' && (
                  <Ionicons name="checkmark" size={20} color="#1a1a1a" />
                )}
              </View>
            </TouchableOpacity>

            {/* Custom Amount Input */}
            {selectedAmount === 'custom' && (
              <Animated.View 
                style={{ opacity: fadeAnim }}
                className="mt-4"
              >
                <Text className={`text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Enter Amount (RM)
                </Text>
                <View className="flex-row items-center">
                  <View className={`flex-1 rounded-xl px-5 py-4 flex-row items-center ${
                    isDark ? 'bg-gray-800 border border-gray-700' : 'bg-gray-50 border border-gray-200'
                  }`}>
                    <Text className={`text-xl font-bold mr-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      RM
                    </Text>
                    <TextInput
                      value={customAmount}
                      onChangeText={setCustomAmount}
                      placeholder="0.00"
                      placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
                      keyboardType="decimal-pad"
                      className={`flex-1 text-xl font-bold ${isDark ? 'text-white' : 'text-primary-dark'}`}
                      style={{ padding: 0 }}
                    />
                  </View>
                </View>
                <Text className={`text-xs mt-2 ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
                  Minimum RM 1 • Any amount is appreciated 💚
                </Text>
              </Animated.View>
            )}
          </View>

          {/* Payment Methods */}
          <View className="mt-8 mb-6">
            <Text className={`text-sm font-semibold mb-3 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Accepted Payment Methods
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {/* Currently Available */}
              <View
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 20,
                  backgroundColor: isDark ? '#1f2937' : '#f3f4f6',
                }}
              >
                <Text 
                  style={{
                    fontSize: 12,
                    fontWeight: '600',
                    color: isDark ? '#d1d5db' : '#374151',
                    flexShrink: 0,
                    flexWrap: 'nowrap',
                  }}
                  numberOfLines={1}
                  allowFontScaling={false}
                >
                  FPX (Online Banking)
                </Text>
              </View>
              
              {/* Coming Soon */}
              {['TNG', 'Grab', 'Card'].map((method) => (
                <View
                  key={method}
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    borderRadius: 20,
                    backgroundColor: isDark ? '#374151' : '#e5e7eb',
                    opacity: 0.5,
                  }}
                >
                  <Text 
                    style={{
                      fontSize: 12,
                      fontWeight: '600',
                      color: isDark ? '#9ca3af' : '#6b7280',
                      flexShrink: 0,
                      flexWrap: 'nowrap',
                    }}
                    numberOfLines={1}
                    allowFontScaling={false}
                  >
                    {method} (Soon)
                  </Text>
                </View>
              ))}
            </View>
            <Text className={`text-xs mt-2 ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
              More payment options coming soon
            </Text>
          </View>

          {/* Info Note */}
          {selectedAmount && (
            <View className={`p-4 rounded-xl mb-4 ${isDark ? 'bg-primary-accent/10' : 'bg-primary-accent/10'}`}>
              <View className="flex-row items-start">
                <Ionicons name="information-circle" size={20} color="#d4af37" style={{ marginTop: 2 }} />
                <Text className={`flex-1 ml-2 text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  You'll select RM {selectedAmount === 'custom' ? customAmount : selectedAmount} on the payment page
                </Text>
              </View>
            </View>
          )}

          {/* Donate Button */}
          <TouchableOpacity
            onPress={handleDonation}
            disabled={!selectedAmount || loading}
            className={`rounded-2xl py-5 items-center shadow-lg ${
              selectedAmount && !loading
                ? 'bg-primary-accent'
                : isDark
                ? 'bg-gray-700'
                : 'bg-gray-300'
            }`}
            activeOpacity={0.8}
          >
            <View className="flex-row items-center">
              <Ionicons 
                name="heart" 
                size={24} 
                color={selectedAmount && !loading ? '#1a1a1a' : '#9ca3af'} 
              />
              <Text className={`text-lg font-bold ml-2 ${
                selectedAmount && !loading
                  ? 'text-primary-dark'
                  : 'text-gray-500'
              }`}>
                {loading ? 'Opening Payment...' : 'Proceed to Payment'}
              </Text>
            </View>
          </TouchableOpacity>

          {/* Benefits */}
          <View className="mt-8">
            <Text className={`text-base font-semibold mb-4 ${isDark ? 'text-white' : 'text-primary-dark'}`}>
              Your Donation Helps:
            </Text>
            {[
              'Keep all hadiths free for everyone',
              'Add more languages and translations',
              'Improve app performance',
              'Support server and maintenance costs',
              'Develop new Islamic learning features',
            ].map((benefit, index) => (
              <View key={index} className="flex-row items-center mb-3">
                <View className="w-6 h-6 rounded-full bg-primary-accent/20 items-center justify-center mr-3">
                  <Ionicons name="checkmark" size={16} color="#d4af37" />
                </View>
                <Text className={`flex-1 text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  {benefit}
                </Text>
              </View>
            ))}
          </View>

          {/* Footer Note */}
          <View className={`mt-8 p-4 rounded-xl ${isDark ? 'bg-gray-800/50' : 'bg-gray-50'}`}>
            <Text className={`text-xs text-center ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
              🔒 Secure payment • No recurring charges • Cancel anytime
              {'\n'}
              100% of donations go towards app development
            </Text>
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

