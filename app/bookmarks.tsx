import React, { useEffect, useState, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Animated, Easing, Modal, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../contexts/ThemeContext';
import { getUserStats, toggleBookmark } from '../utils/userStatsSupabase';
import { useNotification } from '../contexts/NotificationContext';
import { fetchSpecificHadith } from '../utils/hadithApi';
import { Hadith } from '../utils/hadithData';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function BookmarksScreen() {
  const router = useRouter();
  const { isDark } = useTheme();
  const { showToast, showAlert } = useNotification();
  const [bookmarkedHadiths, setBookmarkedHadiths] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedHadith, setSelectedHadith] = useState<Hadith | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [loadingHadith, setLoadingHadith] = useState(false);
  const [hadithPreviews, setHadithPreviews] = useState<Record<string, { text: string; theme: string }>>({});

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const modalSlideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const modalBackdropAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadBookmarks();
    
    // Entrance animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
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
  }, []);

  const loadBookmarks = async () => {
    try {
      const stats = await getUserStats();
      setBookmarkedHadiths(stats.bookmarkedHadiths);
      
      // Fetch preview data for each bookmarked hadith
      const previews: Record<string, { text: string; theme: string }> = {};
      for (const hadithRef of stats.bookmarkedHadiths) {
        const parts = hadithRef.split(', ');
        if (parts.length === 2) {
          const book = parts[0].toLowerCase();
          const number = parts[1];
          let collection = '';
          if (book.includes('bukhari')) {
            collection = 'bukhari';
          } else if (book.includes('muslim')) {
            collection = 'muslim';
          }
          
          if (collection) {
            const hadith = await fetchSpecificHadith(collection, number);
            if (hadith) {
              previews[hadithRef] = {
                text: hadith.text_en.substring(0, 100) + '...',
                theme: hadith.theme
              };
            }
          }
        }
      }
      setHadithPreviews(previews);
    } catch (error) {
      console.error('Error loading bookmarks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // Exit animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 30,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      router.back();
    });
  };

  const handleRemoveBookmark = async (hadithReference: string) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    showAlert({
      title: 'Remove Bookmark',
      message: `Remove "${hadithReference}" from bookmarks?`,
      icon: 'warning',
      iconColor: '#f59e0b',
      buttons: [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            await toggleBookmark(hadithReference);
            setBookmarkedHadiths(prev => prev.filter(h => h !== hadithReference));
            showToast({
              message: 'Bookmark removed',
              type: 'info',
              duration: 2000,
            });
          },
        },
      ],
    });
  };

  const handleViewHadith = async (hadithReference: string) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLoadingHadith(true);
    
    // Parse the hadith reference to get book and number
    const parts = hadithReference.split(', ');
    if (parts.length !== 2) {
      showToast({
        message: 'Invalid hadith reference',
        type: 'error',
        duration: 2000,
      });
      setLoadingHadith(false);
      return;
    }

    const book = parts[0].toLowerCase();
    const number = parts[1];
    
    // Map book names to API collection names
    let collection = '';
    if (book.includes('bukhari')) {
      collection = 'bukhari';
    } else if (book.includes('muslim')) {
      collection = 'muslim';
    } else {
      showToast({
        message: 'Book not supported yet',
        type: 'error',
        duration: 2000,
      });
      setLoadingHadith(false);
      return;
    }

    // Fetch the hadith
    const hadith = await fetchSpecificHadith(collection, number);
    setLoadingHadith(false);
    
    if (hadith) {
      setSelectedHadith(hadith);
      openModal();
    } else {
      showToast({
        message: 'Could not load hadith',
        type: 'error',
        duration: 2000,
      });
    }
  };

  const openModal = () => {
    setModalVisible(true);
    Animated.parallel([
      Animated.spring(modalSlideAnim, {
        toValue: 0,
        tension: 50,
        friction: 10,
        useNativeDriver: true,
      }),
      Animated.timing(modalBackdropAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const closeModal = () => {
    Animated.parallel([
      Animated.timing(modalSlideAnim, {
        toValue: SCREEN_HEIGHT,
        duration: 300,
        easing: Easing.bezier(0.4, 0.0, 0.2, 1),
        useNativeDriver: true,
      }),
      Animated.timing(modalBackdropAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setModalVisible(false);
      setSelectedHadith(null);
    });
  };

  if (loading) {
    return (
      <SafeAreaView className={`flex-1 ${isDark ? 'bg-primary-dark' : 'bg-white'}`}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <View className="flex-1 justify-center items-center">
          <Ionicons name="bookmark-outline" size={64} color="#d4af37" />
          <Text className={`mt-4 text-lg ${isDark ? 'text-white' : 'text-primary-dark'}`}>
            Loading bookmarks...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className={`flex-1 ${isDark ? 'bg-primary-dark' : 'bg-white'}`}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* Header */}
      <Animated.View 
        style={{ 
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }]
        }}
        className="pt-4 px-6 pb-4 flex-row items-center"
      >
        <TouchableOpacity
          onPress={handleBack}
          className={`p-2 rounded-full mr-4 ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}
        >
          <Ionicons name="arrow-back" size={24} color={isDark ? '#fff' : '#1a1a1a'} />
        </TouchableOpacity>
        <View className="flex-1">
          <Text className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-primary-dark'}`}>
            Bookmarks
          </Text>
          <Text className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            {bookmarkedHadiths.length} saved {bookmarkedHadiths.length === 1 ? 'hadith' : 'hadiths'}
          </Text>
        </View>
      </Animated.View>

      {/* Content */}
      <Animated.ScrollView 
        style={{ opacity: fadeAnim }}
        className="flex-1 px-6"
        showsVerticalScrollIndicator={false}
      >
        {bookmarkedHadiths.length === 0 ? (
          <View className="flex-1 justify-center items-center py-20">
            <Ionicons name="bookmark-outline" size={80} color={isDark ? '#374151' : '#e5e7eb'} />
            <Text className={`text-xl font-semibold mt-6 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              No bookmarks yet
            </Text>
            <Text className={`text-sm mt-2 text-center px-8 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              Bookmark hadiths during reflection to save them here for easy access
            </Text>
            <TouchableOpacity
              onPress={async () => {
                await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                router.push('/');
              }}
              className="mt-8 bg-primary-accent px-8 py-4 rounded-2xl"
            >
              <Text className="text-primary-dark font-bold text-base">
                Start Reflecting
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View className="pb-8">
            {bookmarkedHadiths.map((hadith, index) => (
              <Animated.View
                key={hadith}
                style={{
                  opacity: fadeAnim,
                  transform: [{
                    translateY: slideAnim.interpolate({
                      inputRange: [0, 30],
                      outputRange: [0, 30 + (index * 10)],
                    })
                  }]
                }}
                className={`mb-4 p-5 rounded-2xl ${
                  isDark ? 'bg-gray-800 border border-gray-700' : 'bg-gray-50 border border-gray-200'
                }`}
              >
                <View className="flex-row items-start justify-between">
                  <View className="flex-1 mr-3">
                    <View className="flex-row items-center mb-2">
                      <Ionicons name="bookmark" size={18} color="#d4af37" />
                      <Text className={`ml-2 text-base font-semibold ${
                        isDark ? 'text-white' : 'text-primary-dark'
                      }`}>
                        {hadith}
                      </Text>
                    </View>
                    
                    {/* Theme Badge */}
                    {hadithPreviews[hadith]?.theme && (
                      <View className="mb-2">
                        <View className="self-start px-3 py-1 bg-primary-accent/20 rounded-full">
                          <Text className="text-primary-accent text-xs font-semibold">
                            {hadithPreviews[hadith].theme}
                          </Text>
                        </View>
                      </View>
                    )}
                    
                    {/* Preview Text */}
                    <Text className={`text-sm leading-6 ${isDark ? 'text-gray-300' : 'text-gray-700'}`} numberOfLines={2}>
                      {hadithPreviews[hadith]?.text || (hadith.includes('Bukhari') 
                        ? 'Narrated from the authentic collection of Imam Bukhari...'
                        : 'Narrated from the authentic collection of Imam Muslim...')}
                    </Text>
                    <Text className={`text-xs mt-2 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                      Tap below to read full hadith with translations
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleRemoveBookmark(hadith)}
                    className={`p-2 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}
                  >
                    <Ionicons name="trash-outline" size={20} color={isDark ? '#ef4444' : '#dc2626'} />
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  onPress={() => handleViewHadith(hadith)}
                  disabled={loadingHadith}
                  className="mt-4 py-3 bg-primary-accent/20 rounded-xl"
                >
                  <Text className="text-primary-accent text-center font-semibold">
                    {loadingHadith ? 'Loading...' : 'View Hadith'}
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>
        )}
      </Animated.ScrollView>

      {/* Hadith Modal */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="none"
        onRequestClose={closeModal}
      >
        <View className="flex-1">
          {/* Backdrop */}
          <Animated.View
            style={{ opacity: modalBackdropAnim }}
            className="absolute inset-0 bg-black"
          >
            <TouchableOpacity
              activeOpacity={1}
              onPress={closeModal}
              className="flex-1"
            />
          </Animated.View>

          {/* Modal Content */}
          <Animated.View
            style={{
              transform: [{ translateY: modalSlideAnim }],
            }}
            className="absolute bottom-0 left-0 right-0"
          >
            <View className={`${isDark ? 'bg-primary-dark' : 'bg-white'} rounded-t-3xl shadow-2xl`}>
              {/* Header */}
              <View className="flex-row items-center justify-between px-6 pt-6 pb-4 border-b border-gray-700/30">
                <View className="flex-1">
                  <Text className={`text-xl font-bold ${isDark ? 'text-white' : 'text-primary-dark'}`}>
                    {selectedHadith?.reference}
                  </Text>
                  <Text className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Narrator: {selectedHadith?.narrator}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={closeModal}
                  className={`p-2 rounded-full ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}
                >
                  <Ionicons name="close" size={24} color={isDark ? '#fff' : '#1a1a1a'} />
                </TouchableOpacity>
              </View>

              {/* Content */}
              <ScrollView 
                className="px-6 py-6"
                style={{ maxHeight: SCREEN_HEIGHT * 0.7 }}
                showsVerticalScrollIndicator={false}
              >
                {/* Arabic Text */}
                {selectedHadith?.text_ar && (
                  <View className="mb-6">
                    <Text className={`text-2xl text-right leading-10 ${
                      isDark ? 'text-primary-accent' : 'text-primary-accent'
                    }`} style={{ fontFamily: 'System' }}>
                      {selectedHadith.text_ar}
                    </Text>
                  </View>
                )}

                {/* English Translation */}
                <View className={`p-4 rounded-2xl mb-4 ${
                  isDark ? 'bg-gray-800/50' : 'bg-gray-50'
                }`}>
                  <Text className={`text-xs font-semibold mb-2 ${
                    isDark ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    ENGLISH
                  </Text>
                  <Text className={`text-base leading-7 ${
                    isDark ? 'text-white' : 'text-primary-dark'
                  }`}>
                    {selectedHadith?.text_en}
                  </Text>
                </View>

                {/* Malay Translation */}
                {selectedHadith?.text_ms && (
                  <View className={`p-4 rounded-2xl ${
                    isDark ? 'bg-gray-800/50' : 'bg-gray-50'
                  }`}>
                    <Text className={`text-xs font-semibold mb-2 ${
                      isDark ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      MALAY
                    </Text>
                    <Text className={`text-base leading-7 ${
                      isDark ? 'text-white' : 'text-primary-dark'
                    }`}>
                      {selectedHadith.text_ms}
                    </Text>
                  </View>
                )}

                {/* Theme Badge */}
                {selectedHadith?.theme && (
                  <View className="mt-6 flex-row items-center justify-center">
                    <View className="px-4 py-2 bg-primary-accent/20 rounded-full">
                      <Text className="text-primary-accent text-sm font-semibold">
                        {selectedHadith.theme}
                      </Text>
                    </View>
                  </View>
                )}
              </ScrollView>

              {/* Footer */}
              <View className={`px-6 py-4 border-t ${
                isDark ? 'border-gray-700/30' : 'border-gray-200'
              }`}>
                <TouchableOpacity
                  onPress={closeModal}
                  className="bg-primary-accent py-4 rounded-2xl"
                >
                  <Text className="text-primary-dark text-center font-bold text-base">
                    Close
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

