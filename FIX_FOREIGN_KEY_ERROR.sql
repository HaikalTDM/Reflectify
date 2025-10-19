-- ============================================
-- FIX: Foreign Key Constraint Error
-- ============================================
-- Error: "Key (id)=(...) is not present in table \"users\""
-- Cause: Trying to insert into users table before auth.users is fully committed
-- Solution: Use database triggers to auto-create records
-- ============================================

-- ============================================
-- STEP 1: Drop existing tables and recreate without FK constraint
-- ============================================

-- Drop existing tables (this will delete data!)
-- If you have important data, skip this and go to STEP 2
DROP TABLE IF EXISTS bookmarks CASCADE;
DROP TABLE IF EXISTS user_stats CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Recreate users table WITHOUT foreign key to auth.users
CREATE TABLE users (
  id UUID PRIMARY KEY,  -- No REFERENCES auth.users constraint
  email TEXT,
  is_anonymous BOOLEAN DEFAULT false,
  is_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_seen TIMESTAMPTZ DEFAULT NOW()
);

-- Recreate user_stats table
CREATE TABLE user_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  total_score INTEGER DEFAULT 0,
  total_reflections INTEGER DEFAULT 0,
  last_reflection_date TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Recreate bookmarks table
CREATE TABLE bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  hadith_reference TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, hadith_reference)
);

-- ============================================
-- STEP 2: Disable RLS (for easier testing)
-- ============================================

ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_stats DISABLE ROW LEVEL SECURITY;
ALTER TABLE bookmarks DISABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 3: Create trigger to auto-create user records
-- ============================================

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert into users table
  INSERT INTO public.users (id, email, is_anonymous)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE((NEW.raw_user_meta_data->>'is_anonymous')::boolean, false)
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    last_seen = NOW();
  
  -- Insert into user_stats table
  INSERT INTO public.user_stats (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- STEP 4: Grant necessary permissions
-- ============================================

-- Allow anon and authenticated users to access tables
GRANT ALL ON users TO anon, authenticated;
GRANT ALL ON user_stats TO anon, authenticated;
GRANT ALL ON bookmarks TO anon, authenticated;

-- ============================================
-- VERIFICATION
-- ============================================

-- Check if tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('users', 'user_stats', 'bookmarks');

-- Check if trigger exists
SELECT trigger_name, event_object_table, action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- ============================================
-- TEST IT
-- ============================================
-- Now try registering a new user in your app!
-- The trigger will automatically create the user record.
-- ============================================

-- You can also manually test by creating an auth user:
-- INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
-- VALUES (
--   gen_random_uuid(),
--   'test@example.com',
--   crypt('password123', gen_salt('bf')),
--   now(),
--   now(),
--   now()
-- );
-- The trigger should automatically create records in users and user_stats!
-- ============================================

