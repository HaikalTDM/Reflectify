import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator, Animated, Easing, Image } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function AuthScreen() {
  const [mode, setMode] = useState<'welcome' | 'signin' | 'signup' | 'reset'>('welcome');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isDark, setIsDark] = useState(false);
  
  // Password validation states
  const [passwordChecks, setPasswordChecks] = useState({
    minLength: false,
    hasUpperCase: false,
    hasLowerCase: false,
    hasNumber: false,
    hasSpecialChar: false,
  });
  
  const { signInAnonymously, signInWithEmail, signUpWithEmail } = useAuth();
  const { showToast, showAlert } = useNotification();

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const logoScale = useRef(new Animated.Value(0.8)).current;
  const button1Anim = useRef(new Animated.Value(0)).current;
  const button2Anim = useRef(new Animated.Value(0)).current;
  const button3Anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadDarkMode();
  }, []);

  useEffect(() => {
    if (mode === 'welcome') {
      // Entrance animations for welcome screen
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
        Animated.spring(logoScale, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Stagger button animations
        Animated.stagger(100, [
          Animated.timing(button1Anim, {
            toValue: 1,
            duration: 400,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(button2Anim, {
            toValue: 1,
            duration: 400,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(button3Anim, {
            toValue: 1,
            duration: 400,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]).start();
      });
    } else {
      // Trigger form animations when not on welcome screen
      fadeAnim.setValue(0);
      slideAnim.setValue(30);
      
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 350,
          easing: Easing.out(Easing.back(1.1)),
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [mode]);

  const loadDarkMode = async () => {
    const dark = await AsyncStorage.getItem('darkMode');
    setIsDark(dark === 'true');
  };

  const handleAnonymous = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    
    try {
      // Just continue without authentication (local storage only)
      // No need for Supabase anonymous auth
      await AsyncStorage.setItem('hasLaunchedBefore', 'true');
      await AsyncStorage.setItem('userMode', 'anonymous');
      
      setLoading(false);
      showToast({ message: 'Welcome! Your progress will be saved locally.', type: 'success' });
      router.replace('/');
    } catch (error: any) {
      setLoading(false);
      showAlert({
        title: 'Error',
        message: error.message || 'Failed to continue',
        buttons: [{ text: 'OK' }],
      });
    }
  };

  const handleSignIn = async () => {
    if (!email || !password) {
      showToast('Please enter email and password');
      return;
    }
    
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    
    const { error } = await signInWithEmail(email, password);
    
    setLoading(false);
    
    if (error) {
      showAlert({
        title: 'Sign In Failed',
        message: error.message || 'Invalid email or password',
        buttons: [{ text: 'OK' }],
      });
    } else {
      showToast({ message: 'Welcome back! ✨', type: 'success' });
      router.replace('/');
    }
  };

  // Check password requirements in real-time
  const checkPasswordRequirements = (password: string) => {
    setPasswordChecks({
      minLength: password.length >= 6,
      hasUpperCase: /[A-Z]/.test(password),
      hasLowerCase: /[a-z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    });
  };

  const validatePassword = (password: string): { valid: boolean; message?: string } => {
    if (password.length < 6) {
      return { valid: false, message: 'Password must be at least 6 characters' };
    }
    
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    if (!hasUpperCase) {
      return { valid: false, message: 'Password must contain at least one uppercase letter' };
    }
    if (!hasLowerCase) {
      return { valid: false, message: 'Password must contain at least one lowercase letter' };
    }
    if (!hasNumber) {
      return { valid: false, message: 'Password must contain at least one number' };
    }
    if (!hasSpecialChar) {
      return { valid: false, message: 'Password must contain at least one special character (!@#$%^&*...)' };
    }
    
    return { valid: true };
  };

  const handleSignUp = async () => {
    if (!email || !password || !confirmPassword) {
      showToast('Please fill in all fields');
      return;
    }
    
    if (password !== confirmPassword) {
      showAlert({
        title: 'Passwords Don\'t Match',
        message: 'Please make sure both passwords are the same.',
        buttons: [{ text: 'OK' }],
      });
      return;
    }
    
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      showAlert({
        title: 'Weak Password',
        message: passwordValidation.message,
        buttons: [{ text: 'OK' }],
      });
      return;
    }
    
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    
    const { error } = await signUpWithEmail(email, password);
    
    setLoading(false);
    
    if (error) {
      // Check if error is because email already exists
      const errorMessage = error.message || '';
      const isEmailAlreadyExists = errorMessage.toLowerCase().includes('already') || 
                                     errorMessage.toLowerCase().includes('exists') ||
                                     errorMessage.toLowerCase().includes('registered');
      
      if (isEmailAlreadyExists) {
        // Email already registered - offer to sign in instead
        showAlert({
          title: 'Email Already Registered',
          message: 'This email is already registered. Would you like to sign in instead? Your anonymous progress will be replaced with your existing account data.',
          buttons: [
            { 
              text: 'Cancel', 
              style: 'cancel',
              onPress: () => {
                // Keep anonymous data, stay on sign up screen
                console.log('User cancelled - keeping anonymous data');
              }
            },
            { 
              text: 'Sign In', 
              onPress: async () => {
                // Try to sign in with these credentials
                setMode('signin');
                // Auto-fill the email
                console.log('Switching to sign in mode');
              }
            },
          ],
        });
      } else {
        // Other error
        showAlert({
          title: 'Sign Up Failed',
          message: errorMessage || 'Failed to create account',
          buttons: [{ text: 'OK' }],
        });
      }
    } else {
      // Success! Check if data was migrated
      const wasAnonymous = await AsyncStorage.getItem('userMode');
      const successMessage = wasAnonymous === 'anonymous'
        ? '🎉 Your account has been created and all your progress has been saved!'
        : 'Your account has been created successfully!';
      
      showAlert({
        title: 'Welcome! 🎉',
        message: successMessage,
        buttons: [{ text: 'Got it!', onPress: () => router.replace('/') }],
      });
    }
  };

  const handlePasswordReset = async () => {
    if (!email) {
      showToast('Please enter your email address');
      return;
    }

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);

    try {
      const { supabase } = await import('../lib/supabase');
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'reflectify://reset-password', // Deep link for mobile
      });

      setLoading(false);

      if (error) {
        showAlert({
          title: 'Reset Failed',
          message: error.message || 'Failed to send reset email',
          buttons: [{ text: 'OK' }],
        });
      } else {
        showAlert({
          title: 'Check Your Email',
          message: `We've sent a password reset link to ${email}. Check your inbox and follow the instructions.`,
          buttons: [
            { 
              text: 'OK', 
              onPress: () => {
                setMode('signin');
                setPassword('');
              }
            }
          ],
        });
      }
    } catch (error) {
      setLoading(false);
      showAlert({
        title: 'Error',
        message: 'Failed to send reset email. Please try again.',
        buttons: [{ text: 'OK' }],
      });
    }
  };

  if (mode === 'welcome') {
    return (
      <SafeAreaView className={`flex-1 ${isDark ? 'bg-primary-dark' : 'bg-[#faf8f5]'}`} style={{ backgroundColor: isDark ? '#1a1a1a' : '#faf8f5' }}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}>
          {/* Logo/Icon */}
          <Animated.View
            style={{
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }, { scale: logoScale }],
            }}
            className="items-center mb-16"
          >
            {/* Logo */}
            <View className="w-32 h-32 rounded-full bg-white items-center justify-center mb-6 shadow-lg">
              <Image
                source={require('../assets/logo.png')}
                style={{ width: 100, height: 100 }}
                resizeMode="contain"
              />
            </View>
            <Text className={`text-4xl font-bold mb-3 ${isDark ? 'text-white' : 'text-primary-dark'}`}>
              Reflectify
            </Text>
            <Text className={`text-center text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Daily Hadith Reflections{'\n'}& Spiritual Growth
            </Text>
          </Animated.View>

          {/* Buttons */}
          <View className="gap-y-5">
            <Animated.View style={{ opacity: button1Anim, transform: [{ scale: button1Anim }] }}>
              <TouchableOpacity
                onPress={() => setMode('signin')}
                disabled={loading}
                className="bg-primary-accent rounded-2xl py-5 px-6 items-center shadow-lg"
                activeOpacity={0.8}
              >
                <View className="flex-row items-center">
                  <Ionicons name="log-in" size={24} color="#1a1a1a" />
                  <Text className="text-primary-dark text-lg font-bold ml-3">Sign In with Email</Text>
                </View>
              </TouchableOpacity>
            </Animated.View>

            <Animated.View style={{ opacity: button2Anim, transform: [{ scale: button2Anim }] }}>
              <TouchableOpacity
                onPress={() => setMode('signup')}
                disabled={loading}
                className={`rounded-2xl py-5 px-6 items-center border-2 ${
                  isDark ? 'border-gray-700' : 'border-gray-300'
                }`}
                activeOpacity={0.8}
              >
                <View className="flex-row items-center">
                  <Ionicons name="person-add" size={24} color="#d4af37" />
                  <Text className={`text-lg font-bold ml-3 ${isDark ? 'text-white' : 'text-primary-dark'}`}>
                    Create Account
                  </Text>
                </View>
              </TouchableOpacity>
            </Animated.View>

          </View>

          {/* Info */}
          <Animated.View style={{ opacity: fadeAnim }} className="mt-12 px-4">
            <Text className={`text-center text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
              Sign in or create an account to get started.
              {'\n'}Your progress will be synced to the cloud.
            </Text>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Sign In / Sign Up Form
  return (
    <SafeAreaView className={`flex-1 ${isDark ? 'bg-primary-dark' : 'bg-[#faf8f5]'}`} style={{ backgroundColor: isDark ? '#1a1a1a' : '#faf8f5' }}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <Animated.ScrollView 
          style={{ opacity: fadeAnim }}
          contentContainerStyle={{ flexGrow: 1, padding: 24 }}
        >
          {/* Back Button */}
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setMode('welcome');
            }}
            className="mb-8 flex-row items-center"
          >
            <Ionicons name="arrow-back" size={24} color="#d4af37" />
            <Text className="text-primary-accent text-lg font-semibold ml-2">Back</Text>
          </TouchableOpacity>

          {/* Title */}
          <Animated.View 
            style={{
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            }}
            className="mb-12"
          >
            <Text className={`text-3xl font-bold mb-2 ${isDark ? 'text-white' : 'text-primary-dark'}`}>
              {mode === 'signin' ? 'Welcome Back' : mode === 'signup' ? 'Create Account' : 'Reset Password'}
            </Text>
            <Text className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              {mode === 'signin' 
                ? 'Sign in to sync your progress across devices' 
                : mode === 'signup'
                ? 'Sign up to save your progress to the cloud'
                : 'Enter your email to receive a password reset link'}
            </Text>
          </Animated.View>

          {/* Form */}
          <Animated.View 
            style={{
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            }}
            className="gap-y-6"
          >
            <View>
              <Text className={`text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Email
              </Text>
              <Animated.View
                style={{
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }],
                }}
              >
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="your@email.com"
                  placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  className={`rounded-xl px-5 py-4 text-lg ${
                    isDark ? 'bg-gray-800 text-white border border-gray-700' : 'bg-gray-50 text-primary-dark border border-gray-200'
                  }`}
                />
              </Animated.View>
            </View>

            {mode !== 'reset' && (
              <View>
                <Text className={`text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Password
                </Text>
                <Animated.View
                  style={{
                    opacity: fadeAnim,
                    transform: [{ translateY: slideAnim }],
                  }}
                >
                  <TextInput
                    value={password}
                    onChangeText={(text) => {
                      setPassword(text);
                      if (mode === 'signup') {
                        checkPasswordRequirements(text);
                      }
                    }}
                    placeholder="••••••••"
                    placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
                    secureTextEntry
                    className={`rounded-xl px-5 py-4 text-lg ${
                      isDark ? 'bg-gray-800 text-white border border-gray-700' : 'bg-gray-50 text-primary-dark border border-gray-200'
                    }`}
                  />
                </Animated.View>
                {mode === 'signup' && (
                  <Animated.View 
                    style={{ opacity: fadeAnim }}
                    className="mt-3 px-2"
                  >
                  <Text className={`text-xs font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Password Requirements:
                  </Text>
                  <View className="flex-row items-center mb-1">
                    <Ionicons 
                      name={passwordChecks.minLength ? 'checkmark-circle' : 'ellipse-outline'} 
                      size={16} 
                      color={passwordChecks.minLength ? '#10b981' : (isDark ? '#6b7280' : '#9ca3af')} 
                    />
                    <Text className={`text-xs ml-2 ${passwordChecks.minLength ? 'text-green-500 font-semibold' : (isDark ? 'text-gray-400' : 'text-gray-600')}`}>
                      At least 6 characters
                    </Text>
                  </View>
                  <View className="flex-row items-center mb-1">
                    <Ionicons 
                      name={passwordChecks.hasUpperCase ? 'checkmark-circle' : 'ellipse-outline'} 
                      size={16} 
                      color={passwordChecks.hasUpperCase ? '#10b981' : (isDark ? '#6b7280' : '#9ca3af')} 
                    />
                    <Text className={`text-xs ml-2 ${passwordChecks.hasUpperCase ? 'text-green-500 font-semibold' : (isDark ? 'text-gray-400' : 'text-gray-600')}`}>
                      Uppercase letter (A-Z)
                    </Text>
                  </View>
                  <View className="flex-row items-center mb-1">
                    <Ionicons 
                      name={passwordChecks.hasLowerCase ? 'checkmark-circle' : 'ellipse-outline'} 
                      size={16} 
                      color={passwordChecks.hasLowerCase ? '#10b981' : (isDark ? '#6b7280' : '#9ca3af')} 
                    />
                    <Text className={`text-xs ml-2 ${passwordChecks.hasLowerCase ? 'text-green-500 font-semibold' : (isDark ? 'text-gray-400' : 'text-gray-600')}`}>
                      Lowercase letter (a-z)
                    </Text>
                  </View>
                  <View className="flex-row items-center mb-1">
                    <Ionicons 
                      name={passwordChecks.hasNumber ? 'checkmark-circle' : 'ellipse-outline'} 
                      size={16} 
                      color={passwordChecks.hasNumber ? '#10b981' : (isDark ? '#6b7280' : '#9ca3af')} 
                    />
                    <Text className={`text-xs ml-2 ${passwordChecks.hasNumber ? 'text-green-500 font-semibold' : (isDark ? 'text-gray-400' : 'text-gray-600')}`}>
                      Number (0-9)
                    </Text>
                  </View>
                  <View className="flex-row items-center mb-1">
                    <Ionicons 
                      name={passwordChecks.hasSpecialChar ? 'checkmark-circle' : 'ellipse-outline'} 
                      size={16} 
                      color={passwordChecks.hasSpecialChar ? '#10b981' : (isDark ? '#6b7280' : '#9ca3af')} 
                    />
                    <Text className={`text-xs ml-2 ${passwordChecks.hasSpecialChar ? 'text-green-500 font-semibold' : (isDark ? 'text-gray-400' : 'text-gray-600')}`}>
                      Special character (!@#$%^&*...)
                    </Text>
                  </View>
                </Animated.View>
                )}
              </View>
            )}

            {/* Confirm Password - Only for Sign Up */}
            {mode === 'signup' && (
              <View>
                <Text className={`text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Confirm Password
                </Text>
                <Animated.View
                  style={{
                    opacity: fadeAnim,
                    transform: [{ translateY: slideAnim }],
                  }}
                >
                  <TextInput
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholder="••••••••"
                    placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
                    secureTextEntry
                    className={`rounded-xl px-5 py-4 text-lg ${
                      isDark ? 'bg-gray-800 text-white border border-gray-700' : 'bg-gray-50 text-primary-dark border border-gray-200'
                    }`}
                  />
                </Animated.View>
                {confirmPassword.length > 0 && (
                  <Animated.View 
                    style={{ opacity: fadeAnim }}
                    className="mt-2 px-2 flex-row items-center"
                  >
                    <Ionicons 
                      name={password === confirmPassword ? 'checkmark-circle' : 'close-circle'} 
                      size={16} 
                      color={password === confirmPassword ? '#10b981' : '#ef4444'} 
                    />
                    <Text className={`text-xs ml-2 ${password === confirmPassword ? 'text-green-500 font-semibold' : 'text-red-500'}`}>
                      {password === confirmPassword ? 'Passwords match' : 'Passwords do not match'}
                    </Text>
                  </Animated.View>
                )}
              </View>
            )}

            <Animated.View
              style={{
                opacity: fadeAnim,
                transform: [{ scale: fadeAnim }],
              }}
            >
              <TouchableOpacity
                onPress={mode === 'signin' ? handleSignIn : mode === 'signup' ? handleSignUp : handlePasswordReset}
                disabled={loading}
                className="bg-primary-accent rounded-2xl py-5 items-center shadow-lg mt-2"
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator color="#1a1a1a" />
                ) : (
                  <Text className="text-primary-dark text-lg font-bold">
                    {mode === 'signin' ? 'Sign In' : mode === 'signup' ? 'Create Account' : 'Send Reset Link'}
                  </Text>
                )}
              </TouchableOpacity>
            </Animated.View>

            {mode === 'signin' && (
              <Animated.View style={{ opacity: fadeAnim }}>
                <TouchableOpacity
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setMode('reset');
                  }}
                  disabled={loading}
                  className="py-3 items-center"
                >
                  <Text className="text-primary-accent text-base font-semibold">
                    Forgot Password?
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            )}

            <Animated.View style={{ opacity: fadeAnim }}>
              <TouchableOpacity
                onPress={() => {
                  if (mode === 'reset') {
                    setMode('signin');
                  } else {
                    setMode(mode === 'signin' ? 'signup' : 'signin');
                  }
                }}
                disabled={loading}
                className="py-5 items-center"
              >
                <Text className={`text-base ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {mode === 'reset' 
                    ? 'Remember your password? '
                    : mode === 'signin' 
                    ? "Don't have an account? " 
                    : 'Already have an account? '}
                  <Text className="text-primary-accent font-semibold">
                    {mode === 'reset' ? 'Sign In' : mode === 'signin' ? 'Sign Up' : 'Sign In'}
                  </Text>
                </Text>
              </TouchableOpacity>
            </Animated.View>
          </Animated.View>
        </Animated.ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

