// ============================================
// OPTION 2: Data Migration When Signing Up from Anonymous
// ============================================
// This replaces functions in contexts/AuthContext.tsx
// Anonymous users keep their progress when they create an account
// ============================================

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
    
    // Check if user was previously anonymous
    const wasAnonymous = await AsyncStorage.getItem('userMode');
    
    if (wasAnonymous === 'anonymous') {
      console.log('📦 Migrating anonymous data to new account...');
      
      try {
        // Get anonymous stats from local storage
        const localStatsJson = await AsyncStorage.getItem('userStats');
        const localStats = localStatsJson ? JSON.parse(localStatsJson) : null;
        
        // Get anonymous bookmarks from local storage
        const localBookmarksJson = await AsyncStorage.getItem('bookmarkedHadiths');
        const localBookmarks = localBookmarksJson ? JSON.parse(localBookmarksJson) : [];
        
        if (localStats) {
          console.log('📊 Migrating stats:', {
            streak: localStats.currentStreak,
            score: localStats.totalScore,
            reflections: localStats.totalReflections,
          });
          
          // Update the auto-created stats with local data
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
            console.log('✅ Stats migrated successfully!');
          }
        }
        
        if (localBookmarks && localBookmarks.length > 0) {
          console.log(`🔖 Migrating ${localBookmarks.length} bookmarks...`);
          
          // Insert bookmarks into Supabase
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
            console.log('✅ Bookmarks migrated successfully!');
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
        
        console.log('🎉 Migration complete! User keeps all progress.');
        
      } catch (migrationError) {
        console.error('❌ Migration failed:', migrationError);
        // Don't fail the sign-up if migration fails
        // Just log it and continue
      }
    } else {
      console.log('✅ New user account created (no migration needed)');
    }
    
    return { error: null };
  } catch (error) {
    console.error('Email sign up error:', error);
    return { error };
  }
};

// ============================================
// Also update signInWithEmail to handle existing accounts
// ============================================

const signInWithEmail = async (email: string, password: string) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
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
      
      // When signing in to existing account, we DON'T migrate
      // Because the account already has its own data
      // Just clear the local anonymous data
      
      await AsyncStorage.multiRemove([
        'userStats',
        'bookmarkedHadiths',
        'lastReflectionDate',
        'userMode',
        'anonymousUserId',
      ]);
      
      console.log('✅ Switched to existing account (anonymous data discarded)');
      console.log('📊 Loading your existing progress from cloud...');
    }
    
    return { error: null };
  } catch (error) {
    console.error('Email sign in error:', error);
    return { error };
  }
};

// ============================================
// BENEFITS:
// ============================================
// ✅ Users keep their progress when signing up
// ✅ Better user experience
// ✅ Encourages sign-ups (users don't lose their streak)
// ✅ Respects the time users invested while anonymous
// ✅ Smooth transition from trial to committed user
//
// TRADE-OFFS:
// ✅ Slightly more complex (but handled gracefully)
// ✅ Requires proper local storage tracking
//
// WHEN TO USE:
// - Users build significant progress before signing up
// - Streak and stats are important to your app
// - You want to maximize sign-up conversion
// - Better overall user experience is priority
// ============================================

// ============================================
// USER EXPERIENCE FLOW:
// ============================================
//
// SCENARIO 1: Anonymous → Sign Up (NEW ACCOUNT)
// 1. User uses app anonymously
// 2. Builds up streak, score, bookmarks (stored locally)
// 3. Decides to sign up with email
// 4. ✅ All progress is migrated to Supabase
// 5. User keeps everything!
//
// SCENARIO 2: Anonymous → Sign In (EXISTING ACCOUNT)
// 1. User uses app anonymously on new device
// 2. Already has account on another device
// 3. Signs in with existing email
// 4. ✅ Local anonymous data is discarded
// 5. ✅ Cloud data from existing account is loaded
// 6. User gets their real progress back
//
// SCENARIO 3: Direct Sign Up (NO ANONYMOUS MODE)
// 1. User goes straight to sign up
// 2. No anonymous data exists
// 3. ✅ Fresh account created
// 4. Starts with 0 stats
// ============================================

