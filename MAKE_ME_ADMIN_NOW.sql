-- ============================================
-- QUICK FIX: Make Yourself Admin NOW
-- ============================================
-- This manually creates your user record and makes you admin
-- Run this in Supabase SQL Editor if you haven't run FIX_FOREIGN_KEY_ERROR.sql yet
-- ============================================

-- ============================================
-- STEP 1: Find Your User ID
-- ============================================
-- First, let's see all auth users to find your ID
SELECT id, email, created_at 
FROM auth.users 
ORDER BY created_at DESC;

-- Copy your user ID from the results above

-- ============================================
-- STEP 2: Create Your User Record (Replace the UUID and email)
-- ============================================
-- Replace 'YOUR_USER_ID_HERE' with your actual user ID from Step 1
-- Replace 'your@email.com' with your actual email

INSERT INTO users (id, email, is_anonymous, is_admin)
VALUES (
  'YOUR_USER_ID_HERE'::uuid,  -- Replace with your user ID
  'your@email.com',            -- Replace with your email
  false,
  true  -- This makes you admin!
)
ON CONFLICT (id) DO UPDATE SET
  is_admin = true,
  email = EXCLUDED.email;

-- ============================================
-- STEP 3: Create Your User Stats
-- ============================================
INSERT INTO user_stats (user_id)
VALUES ('YOUR_USER_ID_HERE'::uuid)  -- Same user ID as above
ON CONFLICT (user_id) DO NOTHING;

-- ============================================
-- STEP 4: Verify You're Admin
-- ============================================
SELECT id, email, is_admin 
FROM users 
WHERE is_admin = true;

-- You should see your email with is_admin = true ✅

-- ============================================
-- ALTERNATIVE: If you know your email, use this shortcut
-- ============================================
-- This will automatically get your user ID from auth.users

-- Replace 'your@email.com' with your actual email:
WITH auth_user AS (
  SELECT id, email FROM auth.users WHERE email = 'your@email.com'
)
INSERT INTO users (id, email, is_anonymous, is_admin)
SELECT id, email, false, true
FROM auth_user
ON CONFLICT (id) DO UPDATE SET
  is_admin = true;

-- Create stats record
WITH auth_user AS (
  SELECT id FROM auth.users WHERE email = 'your@email.com'
)
INSERT INTO user_stats (user_id)
SELECT id FROM auth_user
ON CONFLICT (user_id) DO NOTHING;

-- Verify
SELECT u.id, u.email, u.is_admin 
FROM users u
JOIN auth.users au ON u.id = au.id
WHERE au.email = 'your@email.com';

-- ============================================
-- After running this, restart your app!
-- ============================================
-- Close the app completely and reopen it
-- You should now see the Admin Panel button in Settings ✅
-- ============================================

