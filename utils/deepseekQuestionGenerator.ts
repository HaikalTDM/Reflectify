/**
 * DeepSeek AI-powered question generator for hadiths
 * Generates highly contextual questions based on hadith content
 */

import { QuizQuestion } from './hadithQuestions';
import AsyncStorage from '@react-native-async-storage/async-storage';

// DeepSeek API configuration
// Try to import from @env (React Native), fallback to process.env (Node scripts)
let DEEPSEEK_API_KEY = '';
try {
  const envModule = require('@env');
  DEEPSEEK_API_KEY = envModule.DEEPSEEK_API_KEY || '';
} catch {
  // @env not available (running in Node script), use process.env
  // This works because dotenv.config() is called in the script before importing this module
}

// Final fallback to process.env (for Node scripts using dotenv)
if (!DEEPSEEK_API_KEY) {
  DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || '';
}
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

interface DeepSeekResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

/**
 * Generate questions using DeepSeek AI (with retry logic)
 */
export async function generateQuestionsWithDeepSeek(
  hadithText: string,
  hadithReference: string,
  theme: string,
  language: 'en' | 'ms' | 'ar' = 'en',
  retryCount: number = 0
): Promise<QuizQuestion[]> {
  const MAX_RETRIES = 2;
  const TIMEOUT_MS = 30000; // 30 seconds
  
  try {
    const prompt = buildPrompt(hadithText, hadithReference, theme, language);
    
    // Create manual timeout for React Native compatibility
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
      console.log(`⏱️ API call timeout after ${TIMEOUT_MS/1000}s`);
    }, TIMEOUT_MS);
    
    try {
      const response = await fetch(DEEPSEEK_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            {
              role: 'system',
              content: 'You are an Islamic education expert who creates engaging quiz questions about hadiths. You understand Islamic teachings deeply and create questions that help users reflect and understand hadiths better.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.3, // Lower = faster, more consistent
          max_tokens: 800, // Reduced from 2000 (we only need 3 questions)
          stream: false,
        }),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        throw new Error(`DeepSeek API error ${response.status}: ${errorText}`);
      }

      const data: DeepSeekResponse = await response.json();
      const content = data.choices[0].message.content;
      
      // Parse the AI response into structured questions
      return parseAIResponse(content);
    } catch (fetchError) {
      clearTimeout(timeoutId);
      
      // Retry on timeout or network errors
      const error = fetchError as any;
      if (retryCount < MAX_RETRIES && 
          (error?.name === 'AbortError' || error?.message?.includes('network'))) {
        console.log(`🔄 Retrying DeepSeek API call (attempt ${retryCount + 1}/${MAX_RETRIES})...`);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1s before retry
        return generateQuestionsWithDeepSeek(hadithText, hadithReference, theme, language, retryCount + 1);
      }
      
      throw fetchError;
    }
  } catch (error) {
    console.error('Error generating questions with DeepSeek:', error);
    throw error;
  }
}

/**
 * Build the prompt for DeepSeek
 */
function buildPrompt(
  hadithText: string,
  hadithReference: string,
  theme: string,
  language: 'en' | 'ms' | 'ar'
): string {
  const languageInstructions = {
    en: 'in English',
    ms: 'in Malay (Bahasa Melayu)',
    ar: 'in Arabic',
  };

  return `
Generate exactly 3 quiz questions ${languageInstructions[language]} for this hadith:

Hadith: "${hadithText}"
Reference: ${hadithReference}
Theme: ${theme}

Requirements:
1. Question 1: Multiple choice (4 options) - Test understanding of the main message
2. Question 2: True/False - Test practical application
3. Question 3: Multiple choice (4 options) - Test personal reflection and commitment

Format your response as a JSON array with this exact structure:
[
  {
    "id": "q1",
    "type": "multiple-choice",
    "question": "Your question here?",
    "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
    "correctAnswer": 0,
    "explanation": "Why this answer is correct",
    "points": 10
  },
  {
    "id": "q2",
    "type": "true-false",
    "question": "Your statement here",
    "options": ["True", "False"],
    "correctAnswer": 0,
    "explanation": "Explanation here",
    "points": 10
  },
  {
    "id": "q3",
    "type": "reflection",
    "question": "How will you apply this?",
    "options": ["I will do X", "I will do Y", "I will do Z", "All of the above"],
    "correctAnswer": 0,
    "explanation": "Encouragement here",
    "points": 10
  }
]

Important:
- Make questions SPECIFIC to this hadith's content
- Ensure correct answer is always index 0 (first option)
- Keep questions clear and concise
- Make them educational and thought-provoking
- For Q3, "All of the above" or similar comprehensive option should be the correct answer
- Return ONLY valid JSON, no additional text
`;
}

/**
 * Shuffle array and return new shuffled array with the new index of the target element
 */
function shuffleOptionsWithCorrectAnswer(
  options: string[], 
  correctIndex: number
): { shuffledOptions: string[]; newCorrectIndex: number } {
  const correctAnswer = options[correctIndex];
  
  // Fisher-Yates shuffle algorithm
  const shuffled = [...options];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  
  // Find new index of correct answer
  const newCorrectIndex = shuffled.indexOf(correctAnswer);
  
  return { shuffledOptions: shuffled, newCorrectIndex };
}

/**
 * Parse AI response into QuizQuestion array and shuffle options
 */
function parseAIResponse(content: string): QuizQuestion[] {
  try {
    // Extract JSON from the response (in case AI adds extra text)
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('No JSON array found in response');
    }

    const questions = JSON.parse(jsonMatch[0]);
    
    // Validate, shuffle options, and ensure correct structure
    return questions.map((q: any, index: number) => {
      const options = q.options || [];
      const correctAnswer = q.correctAnswer || 0;
      
      // Shuffle options and update correct answer index
      const { shuffledOptions, newCorrectIndex } = shuffleOptionsWithCorrectAnswer(
        options, 
        correctAnswer
      );
      
      // Also shuffle bilingual options if they exist
      let shuffledOptionsBilingual: { [key: string]: string[] } = {};
      if (q.options_ms) {
        const { shuffledOptions: shuffledMs } = shuffleOptionsWithCorrectAnswer(
          q.options_ms,
          correctAnswer
        );
        shuffledOptionsBilingual.options_ms = shuffledMs;
      }
      
      return {
        id: q.id || `deepseek_q${index + 1}`,
        type: q.type || 'multiple-choice',
        question: q.question || '',
        question_ms: q.question_ms,
        options: shuffledOptions,
        ...shuffledOptionsBilingual,
        correctAnswer: newCorrectIndex,
        explanation: q.explanation || '',
        explanation_ms: q.explanation_ms,
        points: q.points || 10,
      };
    });
  } catch (error) {
    console.error('Error parsing AI response:', error);
    throw new Error('Failed to parse AI-generated questions');
  }
}

/**
 * Generate bilingual questions (English + Malay) - OPTIMIZED with single API call
 */
export async function generateBilingualQuestions(
  hadithText: string,
  hadithReference: string,
  theme: string
): Promise<QuizQuestion[]> {
  try {
    // OPTIMIZATION: Generate both languages in ONE API call instead of two
    const bilingualPrompt = `
Generate exactly 3 quiz questions in BOTH English and Malay for this hadith:

Hadith: "${hadithText}"
Reference: ${hadithReference}
Theme: ${theme}

Format as JSON with BOTH languages:
[
  {
    "id": "q1",
    "type": "multiple-choice",
    "question": "English question?",
    "question_ms": "Soalan Melayu?",
    "options": ["English opt 1", "English opt 2", "English opt 3", "English opt 4"],
    "options_ms": ["Pilihan 1", "Pilihan 2", "Pilihan 3", "Pilihan 4"],
    "correctAnswer": 0,
    "explanation": "English explanation",
    "explanation_ms": "Penjelasan Melayu",
    "points": 10
  }
]

Rules:
- Q1: Multiple choice (4 options) - Understanding
- Q2: True/False - Application
- Q3: Multiple choice (4 options) - Reflection
- Correct answer always at index 0
- Return ONLY valid JSON
`;

    // Create manual timeout for React Native compatibility
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
    
    try {
      const response = await fetch(DEEPSEEK_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            {
              role: 'system',
              content: 'You are an Islamic education expert fluent in English and Malay. Generate bilingual quiz questions.',
            },
            {
              role: 'user',
              content: bilingualPrompt,
            },
          ],
          temperature: 0.3,
          max_tokens: 1200, // Slightly more for bilingual
          stream: false,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`DeepSeek API error: ${response.status}`);
      }

      const data: DeepSeekResponse = await response.json();
      const content = data.choices[0].message.content;
      
      return parseAIResponse(content);
    } catch (fetchError) {
      clearTimeout(timeoutId);
      throw fetchError;
    }
  } catch (error) {
    console.error('Error generating bilingual questions:', error);
    // Fallback to English only
    return generateQuestionsWithDeepSeek(hadithText, hadithReference, theme, 'en');
  }
}

/**
 * Cached question generation with shared cache (benefits ALL users!)
 */
const questionCache = new Map<string, QuizQuestion[]>();
const CACHE_PREFIX = 'hadith_questions_';

// Get cache expiry from config (7-30 days based on mode)
function getCacheExpiryDuration(): number {
  try {
    const { getCacheExpiry } = require('./questionConfig');
    return getCacheExpiry();
  } catch {
    return 7 * 24 * 60 * 60 * 1000; // Default 7 days fallback
  }
}

export async function generateQuestionsWithCache(
  hadithText: string,
  hadithReference: string,
  theme: string,
  useBilingual: boolean = false
): Promise<QuizQuestion[]> {
  const cacheKey = `${hadithReference}_${useBilingual ? 'bilingual' : 'en'}`;
  const language = useBilingual ? 'bilingual' : 'en';
  
  // Priority 1: Check memory cache first (fastest - this session only)
  if (questionCache.has(cacheKey)) {
    console.log('⚡ Using memory cache for:', hadithReference);
    return questionCache.get(cacheKey)!;
  }

  // Priority 2: Check SHARED cache (benefits ALL users!)
  try {
    const { loadFromSharedCache } = await import('./sharedQuestionCache');
    const sharedQuestions = await loadFromSharedCache(hadithReference, language);
    
    if (sharedQuestions) {
      questionCache.set(cacheKey, sharedQuestions); // Cache in memory too
      return sharedQuestions;
    }
  } catch (error) {
    console.log('Shared cache not available:', error);
  }

  // Priority 3: Check user's local cache (backwards compatibility)
  const storageKey = `${CACHE_PREFIX}${cacheKey}`;
  try {
    const stored = await AsyncStorage.getItem(storageKey);
    if (stored) {
      const { questions, timestamp } = JSON.parse(stored);
      const age = Date.now() - timestamp;
      const cacheExpiry = getCacheExpiryDuration();
      
      if (age < cacheExpiry) {
        const daysOld = Math.round(age / (24 * 60 * 60 * 1000));
        console.log(`💾 Using local cache (${daysOld}d old) for:`, hadithReference);
        questionCache.set(cacheKey, questions);
        
        // Migrate to shared cache for other users to benefit
        try {
          const { saveToSharedCache } = await import('./sharedQuestionCache');
          await saveToSharedCache(hadithReference, questions, language, 'deepseek');
          console.log('📤 Migrated to shared cache');
        } catch (e) {
          // Non-critical
        }
        
        return questions;
      } else {
        await AsyncStorage.removeItem(storageKey);
      }
    }
  } catch (error) {
    console.log('Local cache read error:', error);
  }

  // Priority 4: Generate new questions
  console.log('🤖 Generating NEW questions for:', hadithReference);
  const questions = useBilingual
    ? await generateBilingualQuestions(hadithText, hadithReference, theme)
    : await generateQuestionsWithDeepSeek(hadithText, hadithReference, theme);

  // Cache in memory
  questionCache.set(cacheKey, questions);
  
  // Save to SHARED cache (benefits ALL future users!)
  try {
    const { saveToSharedCache } = await import('./sharedQuestionCache');
    await saveToSharedCache(hadithReference, questions, language, 'deepseek');
  } catch (error) {
    console.log('Shared cache write error (non-critical):', error);
  }
  
  // Also save to local cache (backwards compatibility)
  try {
    await AsyncStorage.setItem(
      storageKey,
      JSON.stringify({ questions, timestamp: Date.now() })
    );
  } catch (error) {
    console.log('Local cache write error (non-critical):', error);
  }
  
  return questions;
}

/**
 * Check if DeepSeek API is configured
 */
export function isDeepSeekConfigured(): boolean {
  const hasKey = !!(DEEPSEEK_API_KEY && DEEPSEEK_API_KEY.length > 0 && DEEPSEEK_API_KEY !== 'YOUR_DEEPSEEK_API_KEY_HERE');
  if (hasKey) {
    console.log('✅ DeepSeek API key found and configured');
    console.log('   Key length:', DEEPSEEK_API_KEY.length, 'chars');
    console.log('   Key prefix:', DEEPSEEK_API_KEY.substring(0, 10) + '...');
  } else {
    console.log('⚠️ DeepSeek API key not configured - using fallback generator');
  }
  return hasKey;
}

/**
 * Test DeepSeek API connection (diagnostic)
 */
export async function testDeepSeekConnection(): Promise<boolean> {
  try {
    console.log('🔍 Testing DeepSeek API connection...');
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    const response = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'user', content: 'Say "OK"' }
        ],
        max_tokens: 10,
      }),
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    if (response.ok) {
      console.log('✅ DeepSeek API connection successful!');
      return true;
    } else {
      console.error('❌ DeepSeek API error:', response.status, await response.text());
      return false;
    }
  } catch (error: any) {
    console.error('❌ DeepSeek API connection failed:', error?.message || error);
    return false;
  }
}

