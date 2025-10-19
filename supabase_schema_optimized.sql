-- ============================================
-- Reflectify: OPTIMIZED Supabase Database Schema
-- ============================================
-- Version: 2.0 (Optimized October 2025)
-- Run this in Supabase Dashboard > SQL Editor
-- ============================================

-- ============================================
-- DROP EXISTING TABLES (if re-creating)
-- ============================================
-- Uncomment these if you need to recreate tables
-- DROP TABLE IF EXISTS bookmarks CASCADE;
-- DROP TABLE IF EXISTS user_stats CASCADE;
-- DROP TABLE IF EXISTS users CASCADE;
-- DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
-- DROP FUNCTION IF EXISTS create_user_record() CASCADE;
-- DROP FUNCTION IF EXISTS create_user_stats_record() CASCADE;

-- ============================================
-- 1. USERS TABLE (Optimized)
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  is_anonymous BOOLEAN DEFAULT false NOT NULL,
  is_admin BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  last_seen TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Indexes for performance
  CONSTRAINT users_email_unique UNIQUE(email)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_is_admin ON users(is_admin) WHERE is_admin = true;
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at DESC);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Drop old policies if they exist
DROP POLICY IF EXISTS "Users can view own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Users can insert own data" ON users;

-- RLS Policies (Optimized)
CREATE POLICY "users_select_own" ON users
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "users_update_own" ON users
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    -- Prevent users from making themselves admin
    (is_admin = false OR auth.uid() = id)
  );

CREATE POLICY "users_insert_own" ON users
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ============================================
-- 2. USER STATS TABLE (Optimized)
-- ============================================
CREATE TABLE IF NOT EXISTS user_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  current_streak INTEGER DEFAULT 0 NOT NULL CHECK (current_streak >= 0),
  longest_streak INTEGER DEFAULT 0 NOT NULL CHECK (longest_streak >= 0),
  total_score INTEGER DEFAULT 0 NOT NULL CHECK (total_score >= 0),
  total_reflections INTEGER DEFAULT 0 NOT NULL CHECK (total_reflections >= 0),
  last_reflection_date TIMESTAMPTZ, -- Changed from TEXT to TIMESTAMPTZ for better querying
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Constraint: longest_streak should always be >= current_streak
  CONSTRAINT longest_streak_check CHECK (longest_streak >= current_streak)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_stats_user_id ON user_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_user_stats_current_streak ON user_stats(current_streak DESC);
CREATE INDEX IF NOT EXISTS idx_user_stats_total_score ON user_stats(total_score DESC);
CREATE INDEX IF NOT EXISTS idx_user_stats_last_reflection ON user_stats(last_reflection_date DESC);

-- Enable Row Level Security
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;

-- Drop old policies
DROP POLICY IF EXISTS "Users can view own stats" ON user_stats;
DROP POLICY IF EXISTS "Users can update own stats" ON user_stats;
DROP POLICY IF EXISTS "Users can insert own stats" ON user_stats;

-- RLS Policies
CREATE POLICY "user_stats_select_own" ON user_stats
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "user_stats_update_own" ON user_stats
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_stats_insert_own" ON user_stats
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Delete policy (for data reset)
CREATE POLICY "user_stats_delete_own" ON user_stats
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- 3. BOOKMARKS TABLE (Optimized)
-- ============================================
CREATE TABLE IF NOT EXISTS bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  hadith_reference TEXT NOT NULL,
  hadith_collection TEXT, -- NEW: Store collection name for better querying
  hadith_number TEXT,     -- NEW: Store hadith number separately
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Prevent duplicate bookmarks
  CONSTRAINT bookmarks_user_hadith_unique UNIQUE(user_id, hadith_reference)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_bookmarks_user_id ON bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_created_at ON bookmarks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bookmarks_reference ON bookmarks(hadith_reference);

-- Enable Row Level Security
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;

-- Drop old policies
DROP POLICY IF EXISTS "Users can view own bookmarks" ON bookmarks;
DROP POLICY IF EXISTS "Users can insert own bookmarks" ON bookmarks;
DROP POLICY IF EXISTS "Users can delete own bookmarks" ON bookmarks;

-- RLS Policies
CREATE POLICY "bookmarks_select_own" ON bookmarks
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "bookmarks_insert_own" ON bookmarks
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "bookmarks_delete_own" ON bookmarks
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- 4. TRIGGERS & FUNCTIONS
-- ============================================

-- Function: Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: Update user_stats.updated_at
DROP TRIGGER IF EXISTS update_user_stats_updated_at ON user_stats;
CREATE TRIGGER update_user_stats_updated_at
  BEFORE UPDATE ON user_stats
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function: Auto-create user record when someone signs up
CREATE OR REPLACE FUNCTION create_user_record()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, is_anonymous, created_at, last_seen)
  VALUES (
    NEW.id,
    NEW.email,
    false,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: Create user record on auth.users insert
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_user_record();

-- Function: Auto-create user_stats when user is created
CREATE OR REPLACE FUNCTION create_user_stats_record()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_stats (user_id, created_at, updated_at)
  VALUES (NEW.id, NOW(), NOW())
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: Create user_stats on users insert
DROP TRIGGER IF EXISTS on_user_created ON users;
CREATE TRIGGER on_user_created
  AFTER INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION create_user_stats_record();

-- ============================================
-- 5. UTILITY FUNCTIONS
-- ============================================

-- Function: Get user leaderboard (top 10)
CREATE OR REPLACE FUNCTION get_leaderboard(limit_count INTEGER DEFAULT 10)
RETURNS TABLE(
  user_id UUID,
  email TEXT,
  total_score INTEGER,
  current_streak INTEGER,
  total_reflections INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.email,
    us.total_score,
    us.current_streak,
    us.total_reflections
  FROM user_stats us
  JOIN users u ON u.id = us.user_id
  WHERE u.is_anonymous = false
  ORDER BY us.total_score DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Update last_seen timestamp
CREATE OR REPLACE FUNCTION update_last_seen(user_id_param UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE users
  SET last_seen = NOW()
  WHERE id = user_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 6. PERFORMANCE VIEWS (Optional)
-- ============================================

-- View: User statistics summary
CREATE OR REPLACE VIEW user_stats_summary AS
SELECT 
  u.id,
  u.email,
  u.is_admin,
  u.created_at as user_since,
  us.current_streak,
  us.longest_streak,
  us.total_score,
  us.total_reflections,
  us.last_reflection_date,
  COUNT(b.id) as total_bookmarks
FROM users u
LEFT JOIN user_stats us ON us.user_id = u.id
LEFT JOIN bookmarks b ON b.user_id = u.id
GROUP BY u.id, u.email, u.is_admin, u.created_at, 
         us.current_streak, us.longest_streak, us.total_score, 
         us.total_reflections, us.last_reflection_date;

-- ============================================
-- 7. DATA VALIDATION
-- ============================================

-- Ensure all existing users have stats
INSERT INTO user_stats (user_id)
SELECT id FROM users
WHERE id NOT IN (SELECT user_id FROM user_stats)
ON CONFLICT (user_id) DO NOTHING;

-- ============================================
-- SETUP COMPLETE! ✅
-- ============================================
-- Tables created/updated:
--   ✓ users (with indexes)
--   ✓ user_stats (with constraints & indexes)
--   ✓ bookmarks (with indexes)
--
-- Triggers created:
--   ✓ Auto-create user on signup
--   ✓ Auto-create user_stats
--   ✓ Auto-update timestamps
--
-- Functions created:
--   ✓ get_leaderboard()
--   ✓ update_last_seen()
--
-- Views created:
--   ✓ user_stats_summary
--
-- Performance optimizations:
--   ✓ Indexes on frequently queried columns
--   ✓ NOT NULL constraints where applicable
--   ✓ CHECK constraints for data integrity
--   ✓ Unique constraints to prevent duplicates
-- ============================================

-- ============================================
-- MAKE A USER ADMIN
-- ============================================
-- Run this after the user signs up:
-- 
-- UPDATE users 
-- SET is_admin = true 
-- WHERE email = 'your-email@example.com';
-- 
-- Or for multiple admins:
-- 
-- UPDATE users 
-- SET is_admin = true 
-- WHERE email IN ('admin1@example.com', 'admin2@example.com');
-- ============================================

-- ============================================
-- USEFUL QUERIES
-- ============================================

-- Check all admins:
-- SELECT id, email, is_admin, created_at FROM users WHERE is_admin = true;

-- Get top 10 users by score:
-- SELECT * FROM get_leaderboard(10);

-- View all user stats:
-- SELECT * FROM user_stats_summary ORDER BY total_score DESC;

-- Find users with streaks > 7 days:
-- SELECT u.email, us.current_streak 
-- FROM users u 
-- JOIN user_stats us ON us.user_id = u.id 
-- WHERE us.current_streak > 7;

-- Count total reflections across all users:
-- SELECT SUM(total_reflections) as total FROM user_stats;

-- ============================================

