-- ============================================
-- FIX: RLS Policies for User Registration
-- ============================================
-- Problem: RLS blocking inserts during signup
-- Solution: Allow inserts during auth session creation
-- ============================================

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can insert own data" ON users;
DROP POLICY IF EXISTS "Users can create their own stats." ON user_stats;

-- ============================================
-- NEW POLICIES: Allow authenticated users to insert
-- ============================================

-- Policy: Allow authenticated users to insert their own user record
CREATE POLICY "Allow authenticated insert"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Policy: Allow anonymous sign-ups to insert their user record
CREATE POLICY "Allow anon insert"
  ON users FOR INSERT
  TO anon
  WITH CHECK (auth.uid() = id);

-- Policy: Allow authenticated users to insert their own stats
CREATE POLICY "Allow authenticated stats insert"
  ON user_stats FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy: Allow anonymous users to insert their stats (during signup)
CREATE POLICY "Allow anon stats insert"
  ON user_stats FOR INSERT
  TO anon
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- VERIFICATION
-- ============================================
-- Check if policies are created correctly:
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename IN ('users', 'user_stats')
ORDER BY tablename, policyname;

-- ============================================
-- Now try registering a new user in your app!
-- ============================================

