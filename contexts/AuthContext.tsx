import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Session, User } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signInAnonymously: () => Promise<{ error: any }>;
  signInWithEmail: (email: string, password: string) => Promise<{ error: any }>;
  signUpWithEmail: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  isAnonymous: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Check for existing session (gracefully handle if Supabase not configured)
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        setSession(session);
        setUser(session?.user ?? null);
        checkIfAnonymous(session?.user ?? null);
        checkIfAdmin(session?.user ?? null);
        setLoading(false);
      })
      .catch((error) => {
        console.log('Supabase not configured, running in local mode:', error.message);
        setLoading(false);
      });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      checkIfAnonymous(session?.user ?? null);
      checkIfAdmin(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkIfAnonymous = async (user: User | null) => {
    if (!user) {
      setIsAnonymous(false);
      return;
    }
    
    // Check if user is anonymous (no email)
    const anon = !user.email;
    setIsAnonymous(anon);
    
    // Also store in AsyncStorage for quick access
    await AsyncStorage.setItem('isAnonymous', anon.toString());
  };

  const checkIfAdmin = async (user: User | null) => {
    if (!user) {
      setIsAdmin(false);
      return;
    }
    
    try {
      // Check admin status from users table
      const { data, error } = await supabase
        .from('users')
        .select('is_admin')
        .eq('id', user.id)
        .maybeSingle(); // Use maybeSingle() instead of single() to handle 0 rows gracefully
      
      if (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
        return;
      }
      
      // If no user record exists yet (trigger hasn't run), default to false
      if (!data) {
        console.log('🔐 User record not found yet, defaulting to non-admin');
        setIsAdmin(false);
        return;
      }
      
      const adminStatus = data.is_admin || false;
      setIsAdmin(adminStatus);
      console.log(`🔐 Admin status: ${adminStatus}`);
    } catch (error) {
      console.error('Error checking admin:', error);
      setIsAdmin(false);
    }
  };

  const signInAnonymously = async () => {
    try {
      // Create anonymous session using UUID
      const { data, error } = await supabase.auth.signInAnonymously();
      
      if (error) return { error };
      
      // Create user record
      if (data.user) {
        await supabase.from('users').insert({
          id: data.user.id,
          is_anonymous: true,
        });
        
        // Initialize stats
        await supabase.from('user_stats').insert({
          user_id: data.user.id,
        });
      }
      
      return { error: null };
    } catch (error) {
      console.error('Anonymous sign in error:', error);
      return { error };
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        console.error('Sign in error:', error);
        return { error };
      }
      
      // Check if user was previously anonymous
      const wasAnonymous = await AsyncStorage.getItem('userMode');
      
      if (wasAnonymous === 'anonymous') {
        console.log('🔄 Switching from anonymous to existing account...');
        console.log('⚠️  Note: Anonymous data will be discarded (signing in to existing account)');
        
        // When signing in to EXISTING account, discard anonymous data
        // The account already has its own data in the cloud
        await AsyncStorage.multiRemove([
          'userStats',
          'bookmarkedHadiths',
          'lastReflectionDate',
          'userMode',
          'anonymousUserId',
        ]);
        
        console.log('✅ Switched to existing account');
        console.log('📊 Loading your saved progress from cloud...');
      }
      
      // Enable auto-sync for signed-in users
      await AsyncStorage.setItem('sync_enabled', 'true');
      console.log('☁️ Cloud sync enabled');
      
      return { error: null };
    } catch (error) {
      console.error('Email sign in error:', error);
      return { error };
    }
  };

  const signUpWithEmail = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
      
      if (error) {
        console.error('Sign up error:', error);
        return { error };
      }
      
      if (!data.user) {
        return { error: new Error('No user data returned') };
      }
      
      // Database trigger will create user record and stats automatically
      console.log('✅ Account created:', data.user.email);
      
      // Check if user was previously anonymous and has local data
      const wasAnonymous = await AsyncStorage.getItem('userMode');
      
      if (wasAnonymous === 'anonymous') {
        console.log('📦 User was anonymous, checking for data to migrate...');
        
        // Get anonymous stats from local storage
        const localStatsJson = await AsyncStorage.getItem('userStats');
        const localStats = localStatsJson ? JSON.parse(localStatsJson) : null;
        
        // Get anonymous bookmarks from local storage
        const localBookmarksJson = await AsyncStorage.getItem('bookmarkedHadiths');
        const localBookmarks = localBookmarksJson ? JSON.parse(localBookmarksJson) : [];
        
        if (localStats || localBookmarks.length > 0) {
          console.log('📊 Migrating anonymous data to new account...');
          
          // Migrate stats if they exist
          if (localStats) {
            console.log('  Stats:', {
              streak: localStats.currentStreak || 0,
              score: localStats.totalScore || 0,
              reflections: localStats.totalReflections || 0,
            });
            
            // Wait a bit for trigger to create the record
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            const { error: statsError } = await supabase
              .from('user_stats')
              .update({
                current_streak: localStats.currentStreak || 0,
                longest_streak: localStats.longestStreak || 0,
                total_score: localStats.totalScore || 0,
                total_reflections: localStats.totalReflections || 0,
                last_reflection_date: localStats.lastReflectionDate || null,
              })
              .eq('user_id', data.user.id);
            
            if (statsError) {
              console.error('⚠️  Stats migration error:', statsError);
            } else {
              console.log('  ✅ Stats migrated!');
            }
          }
          
          // Migrate bookmarks if they exist
          if (localBookmarks.length > 0) {
            console.log(`  🔖 Migrating ${localBookmarks.length} bookmarks...`);
            
            const bookmarksToInsert = localBookmarks.map((hadithRef: string) => ({
              user_id: data.user.id,
              hadith_reference: hadithRef,
            }));
            
            const { error: bookmarksError } = await supabase
              .from('bookmarks')
              .insert(bookmarksToInsert);
            
            if (bookmarksError) {
              console.error('⚠️  Bookmarks migration error:', bookmarksError);
            } else {
              console.log('  ✅ Bookmarks migrated!');
            }
          }
          
          // Clear local storage after successful migration
          await AsyncStorage.multiRemove([
            'userStats',
            'bookmarkedHadiths',
            'lastReflectionDate',
            'userMode',
            'anonymousUserId',
          ]);
          
          console.log('🎉 Migration complete! All progress saved to your account.');
        } else {
          console.log('ℹ️  No anonymous data to migrate.');
          // Still clear the anonymous flag
          await AsyncStorage.removeItem('userMode');
        }
      } else {
        console.log('✅ New user - no migration needed');
      }
      
      // Enable auto-sync for signed-in users
      await AsyncStorage.setItem('sync_enabled', 'true');
      console.log('☁️ Cloud sync enabled');
      
      return { error: null };
    } catch (error) {
      console.error('Email sign up error:', error);
      return { error };
    }
  };

  const migrateAnonymousData = async (fromUserId: string, toUserId: string) => {
    try {
      // Copy stats
      const { data: stats } = await supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', fromUserId)
        .single();
      
      if (stats) {
        await supabase.from('user_stats').insert({
          user_id: toUserId,
          current_streak: stats.current_streak,
          longest_streak: stats.longest_streak,
          total_score: stats.total_score,
          total_reflections: stats.total_reflections,
          last_reflection_date: stats.last_reflection_date,
        });
      }
      
      // Copy bookmarks
      const { data: bookmarks } = await supabase
        .from('bookmarks')
        .select('hadith_reference')
        .eq('user_id', fromUserId);
      
      if (bookmarks && bookmarks.length > 0) {
        const newBookmarks = bookmarks.map(b => ({
          user_id: toUserId,
          hadith_reference: b.hadith_reference,
        }));
        await supabase.from('bookmarks').insert(newBookmarks);
      }
      
      // Clear anonymous user ID
      await AsyncStorage.removeItem('anonymousUserId');
    } catch (error) {
      console.error('Migration error:', error);
    }
  };

  const signOut = async () => {
    try {
      // Clear stats cache before signing out
      const { clearStatsCache } = await import('../utils/userStatsSupabase');
      clearStatsCache();
      
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      setIsAnonymous(false);
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const value = {
    user,
    session,
    loading,
    signInAnonymously,
    signInWithEmail,
    signUpWithEmail,
    signOut,
    isAnonymous,
    isAdmin,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

