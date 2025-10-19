/**
 * Utility to clear corrupted/bad cached data
 * Run this if translations or hadiths are showing incorrect data
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { clearTranslationCache } from './translator';

export async function clearAllBadCache(): Promise<void> {
  try {
    console.log('🧹 Clearing bad cache...');
    
    // 1. Clear in-memory translation cache
    clearTranslationCache();
    
    // 2. Clear shared question cache (contains translations)
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter(
      key => key.startsWith('shared_cache_') || key.startsWith('hadith_cache_')
    );
    
    if (cacheKeys.length > 0) {
      await AsyncStorage.multiRemove(cacheKeys);
      console.log(`✅ Removed ${cacheKeys.length} cached items`);
    }
    
    console.log('✅ Cache cleared successfully!');
    console.log('ℹ️ New hadiths will fetch fresh translations');
  } catch (error) {
    console.error('❌ Error clearing cache:', error);
    throw error;
  }
}

export async function getCacheSize(): Promise<number> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter(
      key => key.startsWith('shared_cache_') || key.startsWith('hadith_cache_')
    );
    return cacheKeys.length;
  } catch (error) {
    console.error('Error getting cache size:', error);
    return 0;
  }
}

