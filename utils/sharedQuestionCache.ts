/**
 * Shared Question Cache System
 * Once a question is generated for ANY user, it's saved and reused by ALL users
 * This dramatically reduces API costs and improves speed!
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { QuizQuestion } from './hadithQuestions';

const SHARED_CACHE_PREFIX = 'shared_questions_';
const SHARED_CACHE_VERSION = 'v1_'; // Version prefix for cache invalidation

export interface SharedQuestionEntry {
  hadithReference: string;
  questions: QuizQuestion[];
  timestamp: number;
  language: 'en' | 'bilingual';
  generatedBy: 'deepseek' | 'smart' | 'manual';
  version: string;
}

/**
 * Save questions to shared cache
 * These questions will be available to ALL users
 */
export async function saveToSharedCache(
  hadithReference: string,
  questions: QuizQuestion[],
  language: 'en' | 'bilingual',
  generatedBy: 'deepseek' | 'smart' | 'manual'
): Promise<void> {
  try {
    const entry: SharedQuestionEntry = {
      hadithReference,
      questions,
      timestamp: Date.now(),
      language,
      generatedBy,
      version: SHARED_CACHE_VERSION,
    };

    const key = `${SHARED_CACHE_PREFIX}${SHARED_CACHE_VERSION}${hadithReference}_${language}`;
    await AsyncStorage.setItem(key, JSON.stringify(entry));
    
    console.log(`💾 Saved to shared cache: ${hadithReference} (${generatedBy})`);
  } catch (error) {
    console.error('Error saving to shared cache:', error);
    // Non-critical error, don't throw
  }
}

/**
 * Load questions from shared cache
 * Returns questions if available, null if not cached
 */
export async function loadFromSharedCache(
  hadithReference: string,
  language: 'en' | 'bilingual'
): Promise<QuizQuestion[] | null> {
  try {
    const key = `${SHARED_CACHE_PREFIX}${SHARED_CACHE_VERSION}${hadithReference}_${language}`;
    const stored = await AsyncStorage.getItem(key);
    
    if (!stored) {
      return null;
    }

    const entry: SharedQuestionEntry = JSON.parse(stored);
    
    // Check if cache is still valid (never expires for shared cache!)
    // Shared questions are permanent unless version changes
    if (entry.version === SHARED_CACHE_VERSION) {
      const ageInDays = Math.round((Date.now() - entry.timestamp) / (24 * 60 * 60 * 1000));
      console.log(`📦 Loaded from shared cache: ${hadithReference} (${ageInDays}d old, ${entry.generatedBy})`);
      return entry.questions;
    }

    // Version mismatch, remove old cache
    await AsyncStorage.removeItem(key);
    return null;
  } catch (error) {
    console.error('Error loading from shared cache:', error);
    return null;
  }
}

/**
 * Check if questions exist in shared cache
 */
export async function hasSharedCache(
  hadithReference: string,
  language: 'en' | 'bilingual'
): Promise<boolean> {
  const key = `${SHARED_CACHE_PREFIX}${SHARED_CACHE_VERSION}${hadithReference}_${language}`;
  const stored = await AsyncStorage.getItem(key);
  return stored !== null;
}

/**
 * Get all cached hadith references
 */
export async function getAllCachedHadiths(): Promise<string[]> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter(key => 
      key.startsWith(SHARED_CACHE_PREFIX + SHARED_CACHE_VERSION)
    );
    
    const references = cacheKeys.map(key => {
      const parts = key.replace(SHARED_CACHE_PREFIX + SHARED_CACHE_VERSION, '').split('_');
      return parts.slice(0, -1).join('_'); // Remove language suffix
    });
    
    return [...new Set(references)]; // Remove duplicates
  } catch (error) {
    console.error('Error getting cached hadiths:', error);
    return [];
  }
}

/**
 * Get cache statistics
 */
export async function getCacheStats() {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter(key => 
      key.startsWith(SHARED_CACHE_PREFIX + SHARED_CACHE_VERSION)
    );
    
    const stats = {
      totalCached: cacheKeys.length,
      bilingualCount: 0,
      englishCount: 0,
      deepseekCount: 0,
      smartCount: 0,
      manualCount: 0,
    };
    
    for (const key of cacheKeys) {
      const stored = await AsyncStorage.getItem(key);
      if (stored) {
        const entry: SharedQuestionEntry = JSON.parse(stored);
        
        if (entry.language === 'bilingual') stats.bilingualCount++;
        else stats.englishCount++;
        
        if (entry.generatedBy === 'deepseek') stats.deepseekCount++;
        else if (entry.generatedBy === 'smart') stats.smartCount++;
        else stats.manualCount++;
      }
    }
    
    return stats;
  } catch (error) {
    console.error('Error getting cache stats:', error);
    return null;
  }
}

/**
 * Pre-populate shared cache with existing questions
 * Run this once to seed the cache with manual questions
 */
export async function seedSharedCache(): Promise<void> {
  try {
    const { specificHadithQuestions } = await import('./hadithQuestions');
    
    let seeded = 0;
    for (const [key, hadithQuiz] of Object.entries(specificHadithQuestions)) {
      if (hadithQuiz.hadithReference) {
        await saveToSharedCache(
          hadithQuiz.hadithReference,
          hadithQuiz.questions,
          'bilingual', // Manual questions are usually bilingual
          'manual'
        );
        seeded++;
      }
    }
    
    console.log(`🌱 Seeded ${seeded} manual questions to shared cache`);
  } catch (error) {
    console.error('Error seeding shared cache:', error);
  }
}

/**
 * Clear all shared cache (use carefully!)
 */
export async function clearSharedCache(): Promise<void> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter(key => 
      key.startsWith(SHARED_CACHE_PREFIX)
    );
    
    await AsyncStorage.multiRemove(cacheKeys);
    console.log(`🗑️ Cleared ${cacheKeys.length} items from shared cache`);
  } catch (error) {
    console.error('Error clearing shared cache:', error);
  }
}

/**
 * Estimate cost savings from shared cache
 */
export async function estimateCostSavings(
  totalReflections: number,
  uniqueHadiths: number = 50
): Promise<{
  withoutCache: { apiCalls: number; costUSD: number; costMYR: number };
  withCache: { apiCalls: number; costUSD: number; costMYR: number };
  savings: { apiCalls: number; costUSD: number; costMYR: number; percentage: number };
}> {
  const COST_PER_CALL_USD = 0.00018;
  const USD_TO_MYR = 4.70;
  
  // Without cache: Every reflection generates a new question
  const withoutCache = {
    apiCalls: totalReflections,
    costUSD: totalReflections * COST_PER_CALL_USD,
    costMYR: totalReflections * COST_PER_CALL_USD * USD_TO_MYR,
  };
  
  // With cache: Only unique hadiths need generation
  const withCache = {
    apiCalls: uniqueHadiths,
    costUSD: uniqueHadiths * COST_PER_CALL_USD,
    costMYR: uniqueHadiths * COST_PER_CALL_USD * USD_TO_MYR,
  };
  
  // Savings
  const savings = {
    apiCalls: withoutCache.apiCalls - withCache.apiCalls,
    costUSD: withoutCache.costUSD - withCache.costUSD,
    costMYR: withoutCache.costMYR - withCache.costMYR,
    percentage: ((withoutCache.apiCalls - withCache.apiCalls) / withoutCache.apiCalls) * 100,
  };
  
  return { withoutCache, withCache, savings };
}

