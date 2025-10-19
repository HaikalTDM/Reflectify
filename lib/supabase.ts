import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@env';

// Supabase credentials loaded from .env file via @env
// Make sure to add these to your .env:
// SUPABASE_URL=https://your-project.supabase.co
// SUPABASE_ANON_KEY=your-anon-key-here

// Debug: Log if Supabase is configured
if (!SUPABASE_URL || !SUPABASE_ANON_KEY || SUPABASE_URL === '' || SUPABASE_ANON_KEY === '') {
  console.warn('⚠️ Supabase credentials not configured! Add SUPABASE_URL and SUPABASE_ANON_KEY to your .env file');
  console.log('Current SUPABASE_URL:', SUPABASE_URL || '(empty)');
  console.log('Current SUPABASE_ANON_KEY:', SUPABASE_ANON_KEY ? '(present but hidden)' : '(empty)');
} else {
  console.log('✅ Supabase configured successfully!');
  console.log('Supabase URL:', SUPABASE_URL);
}

// Create Supabase client with AsyncStorage for session persistence
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Database Types
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string | null;
          is_anonymous: boolean;
          created_at: string;
          last_seen: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          is_anonymous?: boolean;
          created_at?: string;
          last_seen?: string;
        };
        Update: {
          id?: string;
          email?: string | null;
          is_anonymous?: boolean;
          created_at?: string;
          last_seen?: string;
        };
      };
      user_stats: {
        Row: {
          id: string;
          user_id: string;
          current_streak: number;
          longest_streak: number;
          total_score: number;
          total_reflections: number;
          last_reflection_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          current_streak?: number;
          longest_streak?: number;
          total_score?: number;
          total_reflections?: number;
          last_reflection_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          current_streak?: number;
          longest_streak?: number;
          total_score?: number;
          total_reflections?: number;
          last_reflection_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      bookmarks: {
        Row: {
          id: string;
          user_id: string;
          hadith_reference: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          hadith_reference: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          hadith_reference?: string;
          created_at?: string;
        };
      };
    };
  };
}

