/**
 * Question Generation Configuration
 * Control cost vs quality tradeoff
 */

export type QuestionGenerationMode = 'free' | 'hybrid' | 'premium';

interface QuestionConfig {
  mode: QuestionGenerationMode;
  useDeepSeek: boolean;
  cacheExpiry: number; // milliseconds
  maxDeepSeekCallsPerDay?: number;
  preloadQuestions: boolean;
  description: string;
}

/**
 * Question generation modes
 */
export const QUESTION_CONFIGS: Record<QuestionGenerationMode, QuestionConfig> = {
  /**
   * FREE MODE - $0 cost
   * Uses only local generators (smart analyzer + theme-based)
   * Good quality, works offline
   */
  free: {
    mode: 'free',
    useDeepSeek: false,
    cacheExpiry: 30 * 24 * 60 * 60 * 1000, // 30 days
    preloadQuestions: true,
    description: '100% free, uses smart analyzer (good quality)',
  },

  /**
   * HYBRID MODE - Minimal cost (~$0.0002/user/month)
   * Uses DeepSeek with aggressive caching
   * Best quality-to-cost ratio (RECOMMENDED)
   */
  hybrid: {
    mode: 'hybrid',
    useDeepSeek: true,
    cacheExpiry: 30 * 24 * 60 * 60 * 1000, // 30 days
    maxDeepSeekCallsPerDay: 1000, // ~$0.18/day max
    preloadQuestions: true,
    description: 'Best balance - uses AI with smart caching',
  },

  /**
   * PREMIUM MODE - Best quality, higher cost
   * Always uses DeepSeek, shorter cache
   * Fresh questions more often
   */
  premium: {
    mode: 'premium',
    useDeepSeek: true,
    cacheExpiry: 7 * 24 * 60 * 60 * 1000, // 7 days
    preloadQuestions: true,
    description: 'Best quality - AI for all questions',
  },
};

/**
 * CURRENT MODE - Change this to switch modes
 * 
 * Recommendations by scale:
 * - 0-1K users: 'hybrid' (best experience, ~$0-2/month)
 * - 1K-10K users: 'hybrid' (scales well, ~$2-5/month)
 * - 10K-100K users: 'hybrid' or 'free' (~$5-20/month or $0)
 * - 100K+ users: 'free' + pre-generation ($0 ongoing)
 * 
 * CURRENT: FREE MODE - Using 200 pre-generated questions only
 * DeepSeek AI is DISABLED to save costs while testing
 */
export const CURRENT_MODE: QuestionGenerationMode = 'free';

/**
 * Get current configuration
 */
export function getQuestionConfig(): QuestionConfig {
  return QUESTION_CONFIGS[CURRENT_MODE];
}

/**
 * Check if DeepSeek should be used based on mode
 */
export function shouldUseDeepSeek(): boolean {
  const config = getQuestionConfig();
  return config.useDeepSeek;
}

/**
 * Get cache expiry time
 */
export function getCacheExpiry(): number {
  const config = getQuestionConfig();
  return config.cacheExpiry;
}

/**
 * Check if daily limit reached (optional rate limiting)
 */
const dailyUsage = {
  date: new Date().toDateString(),
  count: 0,
};

export function canUseDeepSeekToday(): boolean {
  const config = getQuestionConfig();
  
  // No limit for premium
  if (config.mode === 'premium' || !config.maxDeepSeekCallsPerDay) {
    return true;
  }

  // Reset counter if new day
  const today = new Date().toDateString();
  if (dailyUsage.date !== today) {
    dailyUsage.date = today;
    dailyUsage.count = 0;
  }

  // Check limit
  return dailyUsage.count < config.maxDeepSeekCallsPerDay;
}

/**
 * Increment usage counter
 */
export function trackDeepSeekUsage(): void {
  const today = new Date().toDateString();
  if (dailyUsage.date !== today) {
    dailyUsage.date = today;
    dailyUsage.count = 0;
  }
  dailyUsage.count++;
}

/**
 * Get usage stats
 */
export function getUsageStats() {
  return {
    mode: CURRENT_MODE,
    today: dailyUsage.date,
    calls: dailyUsage.count,
    limit: QUESTION_CONFIGS[CURRENT_MODE].maxDeepSeekCallsPerDay || 'unlimited',
    estimatedCost: (dailyUsage.count * 0.00018).toFixed(4),
  };
}

/**
 * Log configuration on startup
 */
export function logQuestionConfig(): void {
  const config = getQuestionConfig();
  console.log('📚 Question Generation Mode:', config.mode.toUpperCase());
  console.log('   Description:', config.description);
  console.log('   DeepSeek:', config.useDeepSeek ? 'ENABLED ✅' : 'DISABLED ⛔');
  console.log('   Cache:', Math.round(config.cacheExpiry / (24 * 60 * 60 * 1000)), 'days');
  
  if (config.maxDeepSeekCallsPerDay) {
    console.log('   Daily limit:', config.maxDeepSeekCallsPerDay, 'calls');
  }
}

