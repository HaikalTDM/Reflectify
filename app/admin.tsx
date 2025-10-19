import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
// import * as Clipboard from 'expo-clipboard'; // Not installed yet
import {
  getReportedQuestions,
  clearReportedQuestions,
  exportReportedQuestions,
  ReportedQuestion,
  MANUAL_CORRECTIONS,
} from '../utils/questionReview';
import { clearAllBadCache, getCacheSize } from '../utils/clearBadCache';
import { useTheme } from '../contexts/ThemeContext';

export default function AdminPanel() {
  const router = useRouter();
  const { isDark } = useTheme();
  const [reports, setReports] = useState<ReportedQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [cacheSize, setCacheSize] = useState(0);

  useEffect(() => {
    loadReports();
    loadCacheSize();
  }, []);

  const loadCacheSize = async () => {
    const size = await getCacheSize();
    setCacheSize(size);
  };

  const loadReports = async () => {
    setLoading(true);
    const reportedQuestions = await getReportedQuestions();
    setReports(reportedQuestions);
    setLoading(false);
  };

  const handleExport = async () => {
    try {
      const exported = await exportReportedQuestions();
      // Show the JSON in an alert for now (can copy manually)
      Alert.alert(
        'Export Data',
        `Copy this data:\n\n${exported.substring(0, 500)}...`,
        [
          { text: 'Share Instead', onPress: handleShare },
          { text: 'OK' }
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to export questions');
    }
  };

  const handleShare = async () => {
    try {
      const exported = await exportReportedQuestions();
      await Share.share({
        message: `Reflectify - Reported Questions\n\n${exported}`,
        title: 'Reported Questions for Review',
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleClear = () => {
    Alert.alert(
      'Clear All Reports',
      'Are you sure you want to clear all reported questions? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            await clearReportedQuestions();
            setReports([]);
            Alert.alert('Success', 'All reports cleared');
          },
        },
      ]
    );
  };

  const handleClearCache = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      '🧹 Clear Bad Cache',
      `This will clear ${cacheSize} cached translations and hadiths that may have corrupted data.\n\nNew hadiths will fetch fresh translations from the API.\n\nContinue?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear Cache',
          style: 'destructive',
          onPress: async () => {
            try {
              await clearAllBadCache();
              await loadCacheSize();
              Alert.alert('✅ Success', 'Cache cleared! Fresh translations will be fetched.');
            } catch (error) {
              Alert.alert('Error', 'Failed to clear cache');
            }
          },
        },
      ]
    );
  };

  const groupByHadith = (reports: ReportedQuestion[]) => {
    const grouped: Record<string, ReportedQuestion[]> = {};
    reports.forEach(report => {
      if (!grouped[report.hadithReference]) {
        grouped[report.hadithReference] = [];
      }
      grouped[report.hadithReference].push(report);
    });
    return grouped;
  };

  const groupedReports = groupByHadith(reports);

  return (
    <SafeAreaView className={`flex-1 ${isDark ? 'bg-primary-dark' : 'bg-white'}`}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* Header */}
      <View className="flex-row items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <TouchableOpacity onPress={() => router.back()} className="p-2">
          <Ionicons name="arrow-back" size={24} color={isDark ? '#ffffff' : '#1a1a1a'} />
        </TouchableOpacity>
        <Text className={`text-xl font-bold ${isDark ? 'text-white' : 'text-primary-dark'}`}>
          Admin Panel
        </Text>
        <View className="w-10" />
      </View>

      <ScrollView className="flex-1 px-6 py-4">
        {/* Stats Card */}
        <View className={`p-6 rounded-2xl mb-6 ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
          <Text className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-primary-dark'}`}>
            📊 Question Reports
          </Text>
          <Text className={`text-lg ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            Total Reports: <Text className="font-bold text-primary-accent">{reports.length}</Text>
          </Text>
          <Text className={`text-sm mt-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            Unique Hadiths: {Object.keys(groupedReports).length}
          </Text>
          <Text className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            Cached Items: {cacheSize}
          </Text>
        </View>

        {/* Action Buttons */}
        <View className="flex-row gap-3 mb-4">
          <TouchableOpacity
            onPress={handleExport}
            className="flex-1 bg-blue-500 p-4 rounded-xl flex-row items-center justify-center"
          >
            <Ionicons name="copy-outline" size={20} color="#ffffff" />
            <Text className="text-white font-semibold ml-2">Copy</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleShare}
            className="flex-1 bg-green-500 p-4 rounded-xl flex-row items-center justify-center"
          >
            <Ionicons name="share-outline" size={20} color="#ffffff" />
            <Text className="text-white font-semibold ml-2">Share</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleClear}
            className="flex-1 bg-red-500 p-4 rounded-xl flex-row items-center justify-center"
          >
            <Ionicons name="trash-outline" size={20} color="#ffffff" />
            <Text className="text-white font-semibold ml-2">Clear</Text>
          </TouchableOpacity>
        </View>

        {/* Clear Cache Button */}
        <TouchableOpacity
          onPress={handleClearCache}
          className={`p-5 rounded-2xl mb-6 flex-row items-center justify-between ${
            isDark ? 'bg-orange-900/20 border border-orange-500/30' : 'bg-orange-50 border border-orange-200'
          }`}
        >
          <View className="flex-row items-center flex-1">
            <Ionicons name="refresh-circle" size={32} color="#f97316" />
            <View className="ml-4 flex-1">
              <Text className={`text-base font-bold ${isDark ? 'text-orange-300' : 'text-orange-700'}`}>
                🧹 Clear Bad Cache
              </Text>
              <Text className={`text-sm mt-1 ${isDark ? 'text-orange-400/70' : 'text-orange-600/70'}`}>
                Fix corrupted translations ({cacheSize} items)
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#f97316" />
        </TouchableOpacity>

        {/* Reported Questions */}
        {loading ? (
          <Text className={`text-center ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Loading reports...
          </Text>
        ) : reports.length === 0 ? (
          <View className="items-center py-12">
            <Ionicons name="checkmark-circle-outline" size={64} color={isDark ? '#4b5563' : '#9ca3af'} />
            <Text className={`text-lg mt-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              No reported questions yet
            </Text>
            <Text className={`text-sm mt-2 text-center ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
              When users find incorrect answers, they'll appear here
            </Text>
          </View>
        ) : (
          Object.entries(groupedReports).map(([hadithRef, hadithReports]) => (
            <View
              key={hadithRef}
              className={`mb-6 p-4 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}
            >
              <Text className={`text-lg font-bold mb-3 ${isDark ? 'text-white' : 'text-primary-dark'}`}>
                📖 {hadithRef}
              </Text>
              <Text className={`text-sm mb-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                {hadithReports.length} report(s)
              </Text>

              {hadithReports.map((report, index) => (
                <View
                  key={index}
                  className={`mb-3 p-4 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-white'}`}
                >
                  <Text className={`text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Question:
                  </Text>
                  <Text className={`text-sm mb-3 ${isDark ? 'text-white' : 'text-primary-dark'}`}>
                    {report.question}
                  </Text>

                  <View className="flex-row justify-between mb-2">
                    <Text className={`text-xs ${isDark ? 'text-red-400' : 'text-red-600'}`}>
                      ❌ Reported Answer: {report.reportedAnswer}
                    </Text>
                    <Text className={`text-xs ${isDark ? 'text-green-400' : 'text-green-600'}`}>
                      ✅ Correct Answer: {report.correctAnswer}
                    </Text>
                  </View>

                  {report.userSuggestion && (
                    <View className={`mt-2 p-2 rounded-lg ${isDark ? 'bg-gray-600' : 'bg-gray-100'}`}>
                      <Text className={`text-xs ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                        💡 User feedback: {report.userSuggestion}
                      </Text>
                    </View>
                  )}

                  <Text className={`text-xs mt-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    {new Date(report.timestamp).toLocaleString()}
                  </Text>
                </View>
              ))}
            </View>
          ))
        )}

        {/* Instructions */}
        <View className={`p-6 rounded-2xl mt-6 mb-6 ${isDark ? 'bg-blue-900/20 border border-blue-500/30' : 'bg-blue-50 border border-blue-200'}`}>
          <Text className={`text-lg font-bold mb-3 ${isDark ? 'text-blue-300' : 'text-blue-900'}`}>
            📝 How to Fix Questions
          </Text>
          <Text className={`text-sm leading-6 ${isDark ? 'text-blue-200' : 'text-blue-800'}`}>
            1. Export or share the reports{'\n'}
            2. Review each question carefully{'\n'}
            3. Add corrections to <Text className="font-mono">utils/questionReview.ts</Text> in the <Text className="font-mono">MANUAL_CORRECTIONS</Text> object{'\n'}
            4. Corrections will override AI answers{'\n'}
            5. Clear reports after fixing
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

