import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';

// Placeholder configuration
// Replace these with your actual Supabase project credentials when ready
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: undefined, // Will use AsyncStorage when implemented
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Future database functions can be added here
// Example:
// export async function fetchHadithsFromDB() {
//   const { data, error } = await supabase
//     .from('hadiths')
//     .select('*')
//     .eq('is_sahih', true);
//   
//   if (error) throw error;
//   return data;
// }

// export async function addCustomHadith(hadith: any) {
//   const { data, error } = await supabase
//     .from('custom_hadiths')
//     .insert(hadith);
//   
//   if (error) throw error;
//   return data;
// }

