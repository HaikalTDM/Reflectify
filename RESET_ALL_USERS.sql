-- ============================================
-- RESET ALL USERS - Complete Database Wipe
-- ============================================
-- ⚠️ WARNING: This will DELETE ALL USERS and their data!
-- Use this ONLY for testing/development
-- ============================================

-- Step 1: Delete all bookmarks
DELETE FROM public.bookmarks;

-- Step 2: Delete all user stats
DELETE FROM public.user_stats;

-- Step 3: Delete all custom users
DELETE FROM public.users;

-- Step 4: Delete all auth users (this is the master table)
-- Note: This might require service_role key, not anon key
DELETE FROM auth.users;

-- ============================================
-- Verify everything is empty
-- ============================================

-- Check bookmarks (should return 0)
SELECT COUNT(*) as bookmarks_count FROM public.bookmarks;

-- Check user_stats (should return 0)
SELECT COUNT(*) as stats_count FROM public.user_stats;

-- Check users (should return 0)
SELECT COUNT(*) as users_count FROM public.users;

-- Check auth.users (should return 0)
SELECT COUNT(*) as auth_users_count FROM auth.users;

-- ============================================
-- Expected Output:
-- bookmarks_count: 0
-- stats_count: 0
-- users_count: 0
-- auth_users_count: 0
-- ============================================

-- ✅ All clear! Ready for fresh testing!

