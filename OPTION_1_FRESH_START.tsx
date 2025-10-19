// ============================================
// OPTION 1: Fresh Start When Signing Up from Anonymous
// ============================================
// This replaces the signUpWithEmail function in contexts/AuthContext.tsx
// Anonymous users start fresh with 0 stats when they create an account
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
    
    // Check if user was previously anonymous
    const wasAnonymous = await AsyncStorage.getItem('userMode');
    
    if (wasAnonymous === 'anonymous') {
      console.log('🧹 User was anonymous, clearing local data for fresh start...');
      
      // Clear ALL anonymous data from local storage
      await AsyncStorage.multiRemove([
        'userStats',
        'bookmarkedHadiths',
        'lastReflectionDate',
        'userMode',
        'anonymousUserId',
      ]);
      
      console.log('✅ Anonymous data cleared - starting fresh!');
    }
    
    // Database trigger will automatically create user record and stats
    if (data.user) {
      console.log('✅ Account created:', data.user.email);
      console.log('📊 Starting with fresh stats (0 streak, 0 score)');
    }
    
    return { error: null };
  } catch (error) {
    console.error('Email sign up error:', error);
    return { error };
  }
};

// ============================================
// Also update signInWithEmail to handle anonymous → signed in transition
// ============================================

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
      console.log('🧹 User was anonymous, clearing local data...');
      
      // Clear anonymous data
      await AsyncStorage.multiRemove([
        'userStats',
        'bookmarkedHadiths',
        'lastReflectionDate',
        'userMode',
        'anonymousUserId',
      ]);
      
      console.log('✅ Switched from anonymous to signed-in account');
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
// ✅ Simple and clean
// ✅ No data conflicts
// ✅ No migration errors
// ✅ Clear separation between anonymous and signed-in users
// ✅ Users understand they're starting fresh when creating an account
//
// TRADE-OFFS:
// ❌ Users lose their anonymous progress (streak, bookmarks)
// ❌ Might discourage sign-ups if they have significant progress
//
// WHEN TO USE:
// - Anonymous mode is just for "trying out the app"
// - Users don't build significant progress before signing up
// - You want simple, conflict-free code
// ============================================

