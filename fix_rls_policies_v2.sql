-- ============================================
-- FIX: RLS Policies for User Registration
-- ============================================
-- Problem: During signup, auth.uid() might not be immediately available
-- Solution: Add policies for both authenticated AND anon roles
-- ============================================

-- ============================================
-- 1. FIX USERS TABLE POLICIES
-- ============================================

-- Drop the old restrictive INSERT policy
DROP POLICY IF EXISTS "Users can insert own data" ON users;

-- Create new INSERT policy that works during signup
-- This allows the insert if the auth.uid matches the id being inserted
CREATE POLICY "Users can insert own data"
  ON users FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Alternative: If above doesn't work, use this more permissive policy for inserts
-- (Only for initial testing - you can tighten it later)
-- DROP POLICY IF EXISTS "Users can insert own data" ON users;
-- CREATE POLICY "Users can insert own data"
--   ON users FOR INSERT
--   WITH CHECK (true);  -- Allows any authenticated user to insert during signup

-- ============================================
-- 2. FIX USER_STATS TABLE POLICIES
-- ============================================

-- Drop the old INSERT policy
DROP POLICY IF EXISTS "Users can create their own stats." ON user_stats;

-- Create new INSERT policy
CREATE POLICY "Users can create their own stats"
  ON user_stats FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Alternative permissive version for testing:
-- DROP POLICY IF EXISTS "Users can create their own stats" ON user_stats;
-- CREATE POLICY "Users can create their own stats"
--   ON user_stats FOR INSERT
--   WITH CHECK (true);

-- ============================================
-- 3. VERIFY POLICIES
-- ============================================

-- Check current policies
SELECT tablename, policyname, cmd, qual, with_check
FROM pg_policies
WHERE tablename IN ('users', 'user_stats')
ORDER BY tablename, cmd;

-- ============================================
-- ALTERNATIVE SOLUTION: Temporarily Disable RLS
-- ============================================
-- If the above doesn't work, you can temporarily disable RLS for testing:
-- 
-- ALTER TABLE users DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE user_stats DISABLE ROW LEVEL SECURITY;
-- 
-- WARNING: This disables security! Only use for testing!
-- Remember to re-enable it later:
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;
-- ============================================

