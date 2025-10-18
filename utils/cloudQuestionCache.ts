/**
 * Cloud-based Shared Question Cache (Supabase)
 * Questions are stored in the cloud and shared between ALL users globally!
 * 
 * Database Schema:
 * 
 * Table: hadith_questions
 * ┌──────────────────┬────────────┬─────────────────────────────┐
 * │ Column           │ Type       │ Description                 │
 * ├──────────────────┼────────────┼─────────────────────────────┤
 * │ id               │ uuid       │ Primary key                 │
 * │ hadith_reference │ text       │ e.g., "Sahih al-Bukhari, 13"│
 * │ language         │ text       │ "en", "bilingual"           │
 * │ questions        │ jsonb      │ Array of question objects   │
 * │ generated_by     │ text       │ "deepseek", "smart"         │
 * │ quality_score    │ float      │ User ratings (optional)     │
 * │ usage_count      │ integer    │ How many times used         │
 * │ created_at       │ timestamp  │ When created                │
 * │ updated_at       │ timestamp  │ Last updated                │
 * │ version          │ text       │ "v1" for cache invalidation │
 * └──────────────────┴────────────┴─────────────────────────────┘
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { QuizQuestion } from './hadithQuestions';

// Supabase will be initialized elsewhere (already in your codebase)
// For now, we'll create the functions that will use it

const CACHE_VERSION = 'v1';
const LOCAL_CACHE_PREFIX = 'cloud_cache_';

export interface CloudQuestionEntry {
  id?: string;
  hadith_reference: string;
  language: 'en' | 'bilingual';
  questions: QuizQuestion[];
  generated_by: 'deepseek' | 'smart' | 'manual';
  quality_score?: number;
  usage_count?: number;
  created_at?: string;
  updated_at?: string;
  version: string;
}

/**
 * Check if Supabase is available
 */
function isSupabaseAvailable(): boolean {
  // TODO: Check if Supabase client is initialized
  // For now, return false (will use local cache only)
  return false;
}

/**
 * Load questions from cloud (Supabase)
 * This fetches from the global database shared by ALL users
 */
export async function loadFromCloud(
  hadithReference: string,
  language: 'en' | 'bilingual'
): Promise<QuizQuestion[] | null> {
  try {
    // Check local cache first (faster)
    const localKey = `${LOCAL_CACHE_PREFIX}${hadithReference}_${language}`;
    const localCache = await AsyncStorage.getItem(localKey);
    
    if (localCache) {
      const cached = JSON.parse(localCache);
      const age = Date.now() - cached.timestamp;
      
      // Local cache valid for 7 days, then recheck cloud
      if (age < 7 * 24 * 60 * 60 * 1000) {
        console.log(`📦 Using local copy of cloud cache for: ${hadithReference}`);
        return cached.questions;
      }
    }

    // If Supabase not available, return null
    if (!isSupabaseAvailable()) {
      return null;
    }

    console.log(`☁️ Fetching from cloud for: ${hadithReference}`);

    // TODO: Actual Supabase query
    // const { data, error } = await supabase
    //   .from('hadith_questions')
    //   .select('*')
    //   .eq('hadith_reference', hadithReference)
    //   .eq('language', language)
    //   .eq('version', CACHE_VERSION)
    //   .single();
    //
    // if (error || !data) {
    //   return null;
    // }
    //
    // const questions = data.questions as QuizQuestion[];
    //
    // // Update usage count
    // await supabase
    //   .from('hadith_questions')
    //   .update({ usage_count: (data.usage_count || 0) + 1 })
    //   .eq('id', data.id);
    //
    // // Cache locally for faster subsequent access
    // await AsyncStorage.setItem(
    //   localKey,
    //   JSON.stringify({ questions, timestamp: Date.now() })
    // );
    //
    // console.log(`✅ Loaded from cloud (used ${data.usage_count} times)`);
    // return questions;

    return null; // Placeholder until Supabase is integrated
  } catch (error) {
    console.error('Error loading from cloud:', error);
    return null;
  }
}

/**
 * Save questions to cloud (Supabase)
 * This makes questions available to ALL users globally!
 */
export async function saveToCloud(
  hadithReference: string,
  questions: QuizQuestion[],
  language: 'en' | 'bilingual',
  generatedBy: 'deepseek' | 'smart' | 'manual'
): Promise<boolean> {
  try {
    if (!isSupabaseAvailable()) {
      console.log('⚠️ Supabase not available, skipping cloud save');
      return false;
    }

    console.log(`☁️ Saving to cloud for: ${hadithReference}`);

    // TODO: Actual Supabase insert/update
    // Check if entry exists
    // const { data: existing } = await supabase
    //   .from('hadith_questions')
    //   .select('id')
    //   .eq('hadith_reference', hadithReference)
    //   .eq('language', language)
    //   .eq('version', CACHE_VERSION)
    //   .single();
    //
    // const entry: CloudQuestionEntry = {
    //   hadith_reference: hadithReference,
    //   language,
    //   questions,
    //   generated_by: generatedBy,
    //   quality_score: 5.0, // Default
    //   usage_count: 1,
    //   version: CACHE_VERSION,
    //   updated_at: new Date().toISOString(),
    // };
    //
    // if (existing) {
    //   // Update existing
    //   const { error } = await supabase
    //     .from('hadith_questions')
    //     .update(entry)
    //     .eq('id', existing.id);
    //   
    //   if (error) throw error;
    //   console.log('✅ Updated in cloud database');
    // } else {
    //   // Insert new
    //   entry.created_at = new Date().toISOString();
    //   const { error } = await supabase
    //     .from('hadith_questions')
    //     .insert(entry);
    //   
    //   if (error) throw error;
    //   console.log('✅ Saved to cloud database (now available to ALL users!)');
    // }
    //
    // // Also cache locally
    // const localKey = `${LOCAL_CACHE_PREFIX}${hadithReference}_${language}`;
    // await AsyncStorage.setItem(
    //   localKey,
    //   JSON.stringify({ questions, timestamp: Date.now() })
    // );

    return true;
  } catch (error) {
    console.error('Error saving to cloud:', error);
    return false;
  }
}

/**
 * Get cloud cache statistics
 */
export async function getCloudStats() {
  try {
    if (!isSupabaseAvailable()) {
      return null;
    }

    // TODO: Actual Supabase query
    // const { data, error } = await supabase
    //   .from('hadith_questions')
    //   .select('generated_by, language, usage_count');
    //
    // if (error) throw error;
    //
    // const stats = {
    //   totalCached: data.length,
    //   totalUsage: data.reduce((sum, item) => sum + (item.usage_count || 0), 0),
    //   bilingualCount: data.filter(item => item.language === 'bilingual').length,
    //   deepseekCount: data.filter(item => item.generated_by === 'deepseek').length,
    // };
    //
    // return stats;

    return null;
  } catch (error) {
    console.error('Error getting cloud stats:', error);
    return null;
  }
}

/**
 * Setup instructions for Supabase
 */
export const SUPABASE_SETUP_SQL = `
-- Create hadith_questions table
CREATE TABLE hadith_questions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  hadith_reference TEXT NOT NULL,
  language TEXT NOT NULL,
  questions JSONB NOT NULL,
  generated_by TEXT NOT NULL,
  quality_score FLOAT DEFAULT 5.0,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  version TEXT DEFAULT 'v1',
  
  -- Unique constraint: one entry per hadith+language+version
  UNIQUE(hadith_reference, language, version)
);

-- Index for fast lookups
CREATE INDEX idx_hadith_reference ON hadith_questions(hadith_reference);
CREATE INDEX idx_language ON hadith_questions(language);
CREATE INDEX idx_version ON hadith_questions(version);

-- Row Level Security (RLS)
ALTER TABLE hadith_questions ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read (questions are public)
CREATE POLICY "Anyone can read questions"
  ON hadith_questions FOR SELECT
  USING (true);

-- Only authenticated users can insert/update
CREATE POLICY "Authenticated users can insert"
  ON hadith_questions FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update"
  ON hadith_questions FOR UPDATE
  USING (auth.role() = 'authenticated');

-- Function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_hadith_questions_updated_at
  BEFORE UPDATE ON hadith_questions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
`;

