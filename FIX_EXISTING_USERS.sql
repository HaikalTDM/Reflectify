-- ============================================
-- Fix Existing Users (Create Missing Records)
-- ============================================
-- This creates user records for anyone who signed up BEFORE the trigger was set up
-- Run this once to fix all existing auth users
-- ============================================

-- ============================================
-- STEP 1: Create user records for all auth users that don't have them yet
-- ============================================      
INSERT INTO public.users (id, email, is_anonymous, is_admin)
SELECT 
  au.id,
  au.email,
  COALESCE((au.raw_user_meta_data->>'is_anonymous')::boolean, false) as is_anonymous,
  false as is_admin  -- Default to non-admin
FROM auth.users au
LEFT JOIN public.users u ON au.id = u.id
WHERE u.id IS NULL  -- Only insert if user record doesn't exist
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- STEP 2: Create user_stats for all users that don't have them yet
-- ============================================
INSERT INTO public.user_stats (user_id)
SELECT u.id
FROM public.users u
LEFT JOIN public.user_stats us ON u.id = us.user_id
WHERE us.user_id IS NULL  -- Only insert if stats don't exist
ON CONFLICT (user_id) DO NOTHING;

-- ============================================
-- STEP 3: Make specific user(s) admin
-- ============================================
-- Replace 'your@email.com' with your actual email address
UPDATE public.users 
SET is_admin = true 
WHERE email = 'your@email.com';

-- ============================================
-- STEP 4: Verify the results
-- ============================================

-- Check all users
SELECT 
  u.id, 
  u.email, 
  u.is_anonymous, 
  u.is_admin,
  CASE WHEN us.user_id IS NOT NULL THEN '✅' ELSE '❌' END as has_stats
FROM public.users u
LEFT JOIN public.user_stats us ON u.id = us.user_id
ORDER BY u.created_at DESC;

-- Check admin users specifically
SELECT email, is_admin FROM public.users WHERE is_admin = true;

-- ============================================
-- SUCCESS!
-- ============================================
-- All existing users now have:
-- ✅ User record in 'users' table
-- ✅ Stats record in 'user_stats' table
-- ✅ Admin status set for specified email
--
-- From now on, the trigger will automatically create records for new sign-ups!
-- ============================================

