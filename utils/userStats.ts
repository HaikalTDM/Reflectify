/**
 * User statistics and progress tracking
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

export interface UserStats {
  totalReflections: number;
  totalScore: number;
  currentStreak: number;
  longestStreak: number;
  lastReflectionDate: string | null;
  bookmarkedHadiths: string[];
}

const STATS_KEY = 'user_stats';

/**
 * Get user statistics
 */
export async function getUserStats(): Promise<UserStats> {
  try {
    const stored = await AsyncStorage.getItem(STATS_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error loading stats:', error);
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
 * Save user statistics
 */
export async function saveUserStats(stats: UserStats): Promise<void> {
  try {
    await AsyncStorage.setItem(STATS_KEY, JSON.stringify(stats));
  } catch (error) {
    console.error('Error saving stats:', error);
  }
}

/**
 * Update stats after completing a reflection
 */
export async function updateStatsAfterReflection(score: number): Promise<UserStats> {
  const stats = await getUserStats();
  
  stats.totalReflections += 1;
  stats.totalScore += score;
  
  // Update streak
  const today = new Date().toDateString();
  const lastDate = stats.lastReflectionDate ? new Date(stats.lastReflectionDate).toDateString() : null;
  
  if (lastDate === today) {
    // Same day, don't update streak
  } else if (lastDate) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toDateString();
    
    if (lastDate === yesterdayStr) {
      // Consecutive day
      stats.currentStreak += 1;
      stats.longestStreak = Math.max(stats.longestStreak, stats.currentStreak);
    } else {
      // Streak broken
      stats.currentStreak = 1;
    }
  } else {
    // First reflection
    stats.currentStreak = 1;
    stats.longestStreak = 1;
  }
  
  stats.lastReflectionDate = new Date().toISOString();
  
  await saveUserStats(stats);
  return stats;
}

/**
 * Toggle bookmark for a hadith
 */
export async function toggleBookmark(hadithReference: string): Promise<boolean> {
  const stats = await getUserStats();
  const index = stats.bookmarkedHadiths.indexOf(hadithReference);
  
  if (index > -1) {
    stats.bookmarkedHadiths.splice(index, 1);
    await saveUserStats(stats);
    return false; // Unbookmarked
  } else {
    stats.bookmarkedHadiths.push(hadithReference);
    await saveUserStats(stats);
    return true; // Bookmarked
  }
}

/**
 * Check if hadith is bookmarked
 */
export async function isBookmarked(hadithReference: string): Promise<boolean> {
  const stats = await getUserStats();
  return stats.bookmarkedHadiths.includes(hadithReference);
}

