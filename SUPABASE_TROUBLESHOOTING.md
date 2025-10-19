# Supabase Troubleshooting Guide

## Problem: "User not appearing in Supabase after registration"

### Root Cause
By default, Supabase requires **email confirmation** before the user account is fully active.

---

## Solution 1: Disable Email Confirmation (Quickest - For Development)

### Steps:
1. Go to **Supabase Dashboard** → **Authentication** → **Providers**
2. Click on **Email** provider
3. Scroll down to **"Confirm email"** setting
4. **Uncheck** "Enable email confirmations"
5. Click **Save**
6. Now try registering a new account

✅ **Users will now appear in the database immediately after sign up!**

---

## Solution 2: Verify Email (For Production)

### Steps:
1. After signing up, check the email inbox you used
2. You should receive a confirmation email from Supabase
3. Click the verification link in the email
4. User will now appear in the `auth.users` table
5. Our app code will automatically create the `users` table entry

---

## How to Check if It's Working

### 1. Check Auth Users Table
Go to **Supabase Dashboard** → **Authentication** → **Users**

You should see your registered users here. If not:
- Email confirmation might be required
- Check for errors in the app console

### 2. Check Custom Users Table
Go to **Supabase Dashboard** → **Table Editor** → **users**

You should see:
- `id` (matching auth.users id)
- `email`
- `is_anonymous` (false)
- `is_admin` (false by default)

### 3. Check User Stats Table
Go to **Supabase Dashboard** → **Table Editor** → **user_stats**

You should see an entry with:
- `user_id` (matching the user's id)
- All stats initialized to 0

---

## Common Errors

### Error: "New row violates row-level security policy"
**Cause:** RLS policy preventing insert

**Fix:** Make sure your RLS policies allow insert with `auth.uid() = id`:
```sql
CREATE POLICY "Users can insert own data"
  ON users FOR INSERT
  WITH CHECK (auth.uid() = id);
```

### Error: "column is_admin does not exist"
**Cause:** Missing `is_admin` column in users table

**Fix:** Run this SQL:
```sql
ALTER TABLE users 
ADD COLUMN is_admin BOOLEAN DEFAULT false;
```

### Error: "duplicate key value violates unique constraint"
**Cause:** User already exists in the table

**Fix:** This is normal if you're trying to sign up again. Use a different email or sign in instead.

---

## Debug Mode: View Console Logs

### In Expo Dev Tools:
1. Open your app in development mode
2. Watch the terminal output
3. You should see logs like:
   ```
   Creating user record for: your@email.com
   ✅ User record created successfully
   Initializing fresh user stats...
   ✅ User stats created successfully
   ```

### If you see errors:
- Check the error message
- Verify your Supabase URL and ANON_KEY in `.env`
- Check RLS policies in Supabase Dashboard
- Make sure the tables exist (run `supabase_schema.sql`)

---

## Still Not Working?

### Verify Supabase Configuration:

1. **Check `.env` file:**
   ```
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=your-anon-key-here
   ```

2. **Restart Expo:**
   ```bash
   # Kill the Expo server
   # Then restart:
   npx expo start --clear
   ```

3. **Check Supabase Connection:**
   - Go to Supabase Dashboard → Settings → API
   - Verify your URL and anon key match your `.env`

4. **Check Table Structure:**
   - Go to Table Editor
   - Make sure `users`, `user_stats`, and `bookmarks` tables exist
   - If not, run `supabase_schema.sql` in SQL Editor

---

## Manual Workaround (Last Resort)

If automatic user creation isn't working, you can manually create records:

### 1. Get User ID
After sign up, check **Authentication** → **Users** for the user ID

### 2. Manually Insert User Record
```sql
INSERT INTO users (id, email, is_anonymous, is_admin)
VALUES ('user-id-from-auth', 'user@email.com', false, false);
```

### 3. Manually Insert Stats Record
```sql
INSERT INTO user_stats (user_id, current_streak, total_score, total_reflections)
VALUES ('user-id-from-auth', 0, 0, 0);
```

---

## Contact Support

If none of these solutions work:
1. Check the console logs for specific error messages
2. Share the error logs
3. Verify all steps in `SUPABASE_SETUP.md` were completed

