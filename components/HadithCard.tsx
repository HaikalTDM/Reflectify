import React, { memo } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { Hadith } from '../utils/hadithData';

interface HadithCardProps {
  hadith: Hadith;
  isDark: boolean;
  language: 'en' | 'ar' | 'ms' | 'en+ar' | 'en+ms' | 'ar+ms' | 'all';
}

function HadithCard({ hadith, isDark, language }: HadithCardProps) {
  const showArabic = language === 'ar' || language === 'en+ar' || language === 'ar+ms' || language === 'all';
  const showEnglish = language === 'en' || language === 'en+ar' || language === 'en+ms' || language === 'all';
  const showMalay = language === 'ms' || language === 'en+ms' || language === 'ar+ms' || language === 'all';
  
  const textsToShow = [
    showArabic && { text: hadith.text_ar, align: 'right', size: 'text-2xl', label: null },
    showEnglish && { text: hadith.text_en, align: 'left', size: 'text-lg', label: showMalay || showArabic ? 'English' : null },
    showMalay && { text: hadith.text_ms, align: 'left', size: 'text-lg', label: showEnglish || showArabic ? 'Bahasa Melayu' : null },
  ].filter(Boolean);

  return (
    <ScrollView className="w-full px-6" showsVerticalScrollIndicator={false}>
      <View className={`rounded-3xl p-6 ${
        isDark ? 'bg-gray-800/90' : 'bg-white/90'
      }`}>
        {/* Theme Badge */}
        <View className="self-start mb-4">
          <Text className={`px-4 py-1 rounded-full text-xs font-semibold ${
            isDark ? 'bg-primary-accent/20 text-primary-accent' : 'bg-primary-accent/30 text-primary-dark'
          }`}>
            {hadith.theme}
          </Text>
        </View>

        {/* Texts */}
        {textsToShow.map((item: any, index: number) => (
          <View key={index}>
            {item.label && (
              <Text className={`text-xs font-semibold mb-2 ${
                isDark ? 'text-gray-400' : 'text-gray-600'
              }`}>
                {item.label}
              </Text>
            )}
            <Text
              className={`${item.size} ${item.align === 'right' ? 'text-right' : 'text-left'} leading-relaxed ${
                isDark ? 'text-white' : 'text-primary-dark'
              }`}
              style={item.align === 'right' ? { fontFamily: 'System' } : undefined}
            >
              {item.text}
            </Text>
            {index < textsToShow.length - 1 && (
              <View className={`h-px w-full my-6 ${
                isDark ? 'bg-gray-700' : 'bg-gray-300'
              }`} />
            )}
          </View>
        ))}

        {/* Reference */}
        <View className="mt-8 pt-4 border-t border-primary-accent/30">
          <Text className={`text-sm ${
            isDark ? 'text-gray-400' : 'text-gray-600'
          }`}>
            {hadith.narrator}
          </Text>
          <Text className={`text-xs mt-1 ${
            isDark ? 'text-gray-500' : 'text-gray-500'
          }`}>
            {hadith.reference}
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

export default memo(HadithCard);

