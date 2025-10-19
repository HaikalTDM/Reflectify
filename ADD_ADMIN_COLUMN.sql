-- ============================================
-- Add is_admin column to existing users table
-- ============================================
-- Run this in Supabase Dashboard > SQL Editor
-- ============================================

-- Add the is_admin column
ALTER TABLE users 
ADD COLUMN is_admin BOOLEAN DEFAULT false;

-- Verify the column was added
SELECT * FROM users LIMIT 5;

-- ============================================
-- Now you can make yourself admin:
-- ============================================
-- Replace 'YOUR_EMAIL_HERE' with your actual email

-- UPDATE users 
-- SET is_admin = true 
-- WHERE email = 'YOUR_EMAIL_HERE';

-- Example:
-- UPDATE users 
-- SET is_admin = true 
-- WHERE email = 'admin@reflectify.com';
-- ============================================

