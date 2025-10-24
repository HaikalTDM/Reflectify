/**
 * User statistics with Supabase cloud sync + local fallback
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';

export interface UserStats {
  totalReflections: number;
  totalScore: number;
  currentStreak: number;
  longestStreak: number;
  lastReflectionDate: string | null;
  bookmarkedHadiths: string[];
}

const STATS_KEY = 'user_stats_local';
const SYNC_ENABLED_KEY = 'sync_enabled';
const LAST_SYNC_KEY = 'last_sync_timestamp';
const SYNC_INTERVAL = 5 * 60 * 1000; // 5 minutes

// In-memory cache for instant access
let cachedStats: UserStats | null = null;
let cachedUserId: string | null = null; // Track which user's data is cached

/**
 * Clear in-memory cache (call on logout or user switch)
 */
export function clearStatsCache(): void {
  cachedStats = null;
  cachedUserId = null;
  console.log('🧹 Stats cache cleared');
}

/**
 * Check if user is signed in and sync is enabled
 */
async function isSyncEnabled(): Promise<boolean> {
  try {
    const enabled = await AsyncStorage.getItem(SYNC_ENABLED_KEY);
    const { data: { session } } = await supabase.auth.getSession();
    return enabled === 'true' && session !== null;
  } catch {
    return false;
  }
}

/**
 * Check if we need to sync (hasn't synced in last 5 minutes)
 */
async function shouldSync(): Promise<boolean> {
  try {
    const lastSync = await AsyncStorage.getItem(LAST_SYNC_KEY);
    if (!lastSync) return true;
    
    const timeSinceSync = Date.now() - parseInt(lastSync);
    return timeSinceSync > SYNC_INTERVAL;
  } catch {
    return true;
  }
}

/**
 * Background sync from cloud (non-blocking)
 */
async function backgroundSyncFromCloud(): Promise<void> {
  const syncEnabled = await isSyncEnabled();
  if (!syncEnabled) return;
  
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;
    
    // Fetch from Supabase in background
    const [statsResult, bookmarksResult] = await Promise.all([
      supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', session.user.id)
        .single(),
      supabase
        .from('bookmarks')
        .select('hadith_reference')
        .eq('user_id', session.user.id),
    ]);
    
    if (!statsResult.error && statsResult.data) {
      const cloudStats: UserStats = {
        totalReflections: statsResult.data.total_reflections,
        totalScore: statsResult.data.total_score,
        currentStreak: statsResult.data.current_streak,
        longestStreak: statsResult.data.longest_streak,
        lastReflectionDate: statsResult.data.last_reflection_date,
        bookmarkedHadiths: bookmarksResult.data?.map(b => b.hadith_reference) || [],
      };
      
      // Update cache and local storage
      cachedStats = cloudStats;
      await saveLocalStats(cloudStats);
      await AsyncStorage.setItem(LAST_SYNC_KEY, Date.now().toString());
      
      console.log('🔄 Background sync completed');
    }
  } catch (error) {
    console.log('Background sync failed:', error);
  }
}

/**
 * Get user statistics (LOCAL FIRST for instant load, then background sync)
 */
export async function getUserStats(): Promise<UserStats> {
  // Get current user ID
  const { data: { session } } = await supabase.auth.getSession();
  const currentUserId = session?.user?.id || null;
  
  // If user changed, clear cache
  if (cachedUserId && currentUserId !== cachedUserId) {
    console.log('🔄 User changed, clearing cache');
    clearStatsCache();
  }
  
  // Update cached user ID
  cachedUserId = currentUserId;
  
  // 1. Return from memory cache if available (INSTANT)
  if (cachedStats) {
    // Trigger background sync if needed (non-blocking)
    if (await shouldSync()) {
      backgroundSyncFromCloud().catch(() => {}); // Fire and forget
    }
    return cachedStats;
  }
  
  // 2. Load from local storage (FAST)
  const localStats = await getLocalStats();
  cachedStats = localStats;
  
  // 3. Trigger background sync if needed (non-blocking)
  if (await shouldSync()) {
    backgroundSyncFromCloud().catch(() => {}); // Fire and forget
  }
  
  return localStats;
}

/**
 * Get stats from local storage only
 */
async function getLocalStats(): Promise<UserStats> {
  try {
    // Check if cloud sync is enabled
    const syncEnabled = await isSyncEnabled();
    
    if (syncEnabled) {
      // If cloud sync is enabled, fetch from cloud first
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const [statsResult, bookmarksResult] = await Promise.all([
          supabase
            .from('user_stats')
            .select('*')
            .eq('user_id', session.user.id)
            .single(),
          supabase
            .from('bookmarks')
            .select('hadith_reference')
            .eq('user_id', session.user.id),
        ]);
        
        if (!statsResult.error && statsResult.data) {
          const cloudStats: UserStats = {
            totalReflections: statsResult.data.total_reflections,
            totalScore: statsResult.data.total_score,
            currentStreak: statsResult.data.current_streak,
            longestStreak: statsResult.data.longest_streak,
            lastReflectionDate: statsResult.data.last_reflection_date,
            bookmarkedHadiths: bookmarksResult.data?.map(b => b.hadith_reference) || [],
          };
          
          // Save to local storage for future
          await saveLocalStats(cloudStats);
          return cloudStats;
        }
      }
    }
    
    // Fall back to local storage if cloud sync disabled or failed
    const stored = await AsyncStorage.getItem(STATS_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error loading local stats:', error);
  }

  return {
    totalReflections: 0,
    totalScore: 0,
    currentStreak: 0,
    longestStreak: 0,
    lastReflectionDate: null,
    bookmarkedHadiths: [],
  };
}

/**
 * Save stats to local storage
 */
async function saveLocalStats(stats: UserStats): Promise<void> {
  try {
    await AsyncStorage.setItem(STATS_KEY, JSON.stringify(stats));
  } catch (error) {
    console.error('Error saving local stats:', error);
  }
}

/**
 * Save user statistics (cloud + local)
 */
export async function saveUserStats(stats: UserStats): Promise<void> {
  // 1. Update memory cache FIRST (instant)
  cachedStats = stats;
  
  // 2. Save to local storage (fast)
  await saveLocalStats(stats);
  console.log('💾 Saved to cache & local storage');
  
  // 3. Background sync to cloud (non-blocking)
  const syncEnabled = await isSyncEnabled();
  console.log('☁️  Sync enabled:', syncEnabled);
  
  if (syncEnabled) {
    // Fire and forget - don't block on cloud sync
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        console.log('👤 User session:', session?.user?.email || 'No user');
        
        if (session?.user) {
          // Update stats (use UPDATE instead of UPSERT since record should exist)
          const { error } = await supabase
            .from('user_stats')
            .update({
              current_streak: stats.currentStreak,
              longest_streak: stats.longestStreak,
              total_score: stats.totalScore,
              total_reflections: stats.totalReflections,
              last_reflection_date: stats.lastReflectionDate,
              updated_at: new Date().toISOString(),
            })
            .eq('user_id', session.user.id);
          
          if (error) {
            console.error('❌ Supabase sync error:', error);
          } else {
            await AsyncStorage.setItem(LAST_SYNC_KEY, Date.now().toString());
            console.log('✅ Stats synced to cloud successfully');
          }
        } else {
          console.log('⚠️  No user session, skipping cloud sync');
        }
      } catch (error) {
        console.error('❌ Cloud sync failed:', error);
        console.log('💾 Data saved locally only');
      }
    })();
  } else {
    console.log('ℹ️  Cloud sync disabled, data saved locally only');
  }
}

/**
 * Update stats after completing a reflection
 */
export async function updateStatsAfterReflection(score: number): Promise<UserStats> {
  console.log('📊 Updating stats after reflection. Score:', score);
  
  const stats = await getUserStats();
  console.log('Current stats:', stats);
  
  stats.totalReflections += 1;
  stats.totalScore += score;
  
  // Update streak
  const today = new Date().toDateString();
  const lastDate = stats.lastReflectionDate ? new Date(stats.lastReflectionDate).toDateString() : null;
  
  console.log('Streak check - Today:', today, 'Last reflection:', lastDate);
  
  if (lastDate === today) {
    // Same day, don't update streak
    console.log('⚠️  Already reflected today, streak not incremented');
  } else if (lastDate) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toDateString();
    
    if (lastDate === yesterdayStr) {
      // Consecutive day
      stats.currentStreak += 1;
      stats.longestStreak = Math.max(stats.longestStreak, stats.currentStreak);
      console.log('🔥 Streak incremented!', stats.currentStreak);
    } else {
      // Streak broken
      stats.currentStreak = 1;
      console.log('💔 Streak broken, reset to 1');
    }
  } else {
    // First reflection
    stats.currentStreak = 1;
    stats.longestStreak = 1;
    console.log('🎉 First reflection! Streak started.');
  }
  
  stats.lastReflectionDate = new Date().toISOString();
  
  console.log('New stats:', stats);
  await saveUserStats(stats);
  
  // Clear any streak warnings since reflection is complete
  try {
    const { clearStreakWarnings } = await import('./streakManager');
    await clearStreakWarnings();
  } catch (error) {
    console.log('Could not clear streak warnings:', error);
  }
  
  console.log('✅ Stats updated successfully');
  return stats;
}

/**
 * Toggle bookmark for a hadith (cloud + local)
 */
export async function toggleBookmark(hadithReference: string): Promise<boolean> {
  const stats = await getUserStats();
  const index = stats.bookmarkedHadiths.indexOf(hadithReference);
  
  let isBookmarked: boolean;
  
  if (index > -1) {
    stats.bookmarkedHadiths.splice(index, 1);
    isBookmarked = false;
  } else {
    stats.bookmarkedHadiths.push(hadithReference);
    isBookmarked = true;
  }
  
  // Save locally
  await saveLocalStats(stats);
  
  // Sync to cloud if enabled
  const syncEnabled = await isSyncEnabled();
  if (syncEnabled) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        if (isBookmarked) {
          // Add bookmark
          await supabase.from('bookmarks').insert({
            user_id: session.user.id,
            hadith_reference: hadithReference,
          });
        } else {
          // Remove bookmark
          await supabase
            .from('bookmarks')
            .delete()
            .eq('user_id', session.user.id)
            .eq('hadith_reference', hadithReference);
        }
      }
    } catch (error) {
      console.log('Bookmark sync failed, saved locally:', error);
    }
  }
  
  return isBookmarked;
}

/**
 * Check if hadith is bookmarked
 */
export async function isBookmarked(hadithReference: string): Promise<boolean> {
  const stats = await getUserStats();
  return stats.bookmarkedHadiths.includes(hadithReference);
}

/**
 * Enable cloud sync (user opt-in)
 */
export async function enableSync(): Promise<void> {
  await AsyncStorage.setItem(SYNC_ENABLED_KEY, 'true');
  
  // Upload local data to cloud
  await syncLocalToCloud();
}

/**
 * Disable cloud sync
 */
export async function disableSync(): Promise<void> {
  await AsyncStorage.setItem(SYNC_ENABLED_KEY, 'false');
}

/**
 * Upload local data to cloud
 */
export async function syncLocalToCloud(): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      return { success: false, error: 'Not signed in' };
    }
    
    const localStats = await getLocalStats();
    
    // Upload stats
    await supabase
      .from('user_stats')
      .upsert({
        user_id: session.user.id,
        current_streak: localStats.currentStreak,
        longest_streak: localStats.longestStreak,
        total_score: localStats.totalScore,
        total_reflections: localStats.totalReflections,
        last_reflection_date: localStats.lastReflectionDate,
      });
    
    // Upload bookmarks
    if (localStats.bookmarkedHadiths.length > 0) {
      const bookmarksToInsert = localStats.bookmarkedHadiths.map(ref => ({
        user_id: session.user.id,
        hadith_reference: ref,
      }));
      
      // Delete existing and insert fresh
      await supabase
        .from('bookmarks')
        .delete()
        .eq('user_id', session.user.id);
      
      await supabase
        .from('bookmarks')
        .insert(bookmarksToInsert);
    }
    
    console.log('✅ Local data synced to cloud');
    return { success: true };
  } catch (error: any) {
    console.error('Sync error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Download cloud data to replace local
 */
export async function syncCloudToLocal(): Promise<{ success: boolean; error?: string }> {
  try {
    const cloudStats = await getUserStats();
    await saveLocalStats(cloudStats);
    
    console.log('✅ Cloud data synced to local');
    return { success: true };
  } catch (error: any) {
    console.error('Sync error:', error);
    return { success: false, error: error.message };
  }
}

