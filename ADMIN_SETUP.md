# Admin User Setup Guide

## ⚠️ IMPORTANT: Email Verification

By default, Supabase requires email confirmation. You have two options:

### Option A: Disable Email Confirmation (Recommended for Development)
1. Go to **Supabase Dashboard** → **Authentication** → **Providers** → **Email**
2. Scroll down to **"Confirm email"**
3. **Uncheck** "Enable email confirmations"
4. Click **Save**

### Option B: Verify Email (For Production)
1. After sign up, check your email inbox
2. Click the verification link
3. Then proceed with admin setup

---

# Admin User Setup Guide

## How to Make Yourself Admin

### Step 1: Update Database Schema
If you haven't already, run the updated schema in Supabase:

1. Go to **Supabase Dashboard** → **SQL Editor**
2. Run the updated `supabase_schema.sql` file
3. This adds the `is_admin` column to the `users` table

### Step 2: Sign Up/Sign In
1. Open your app
2. Sign up with your email or sign in if you already have an account
3. **Remember your email address!**

### Step 3: Make Your Account Admin
1. Go to **Supabase Dashboard** → **SQL Editor**
2. Run this SQL command (replace with your email):

```sql
UPDATE users 
SET is_admin = true 
WHERE email = 'your-email@example.com';
```

Example:
```sql
UPDATE users 
SET is_admin = true 
WHERE email = 'admin@reflectify.com';
```

3. Click **Run**

### Step 4: Verify Admin Status
1. **Restart your app** (fully close and reopen)
2. Sign in with your admin account
3. Go to **Settings**
4. You should now see **"Admin Panel - Review Questions"** button
5. Check the console logs for: `🔐 Admin status: true`

## Features for Admin Users

✅ **Admin Panel Access** - Review and manage reported quiz questions
✅ **Question Review** - View all reported incorrect answers
✅ **Export Reports** - Share question issues with your team
✅ **Clear Reports** - Remove reviewed questions from the list

## Troubleshooting

### Admin Panel Button Not Showing?
1. Make sure you ran the SQL UPDATE command
2. Fully restart the app (close and reopen)
3. Check console for `🔐 Admin status: true`
4. Verify in Supabase Table Editor that `is_admin = true` for your user

### Still Not Working?
1. Check Supabase connection (make sure `.env` has correct values)
2. Verify the `users` table has the `is_admin` column
3. Check that RLS (Row Level Security) policies allow reading `is_admin`

## Security Notes

- Admin status is stored in Supabase database
- Only authenticated users can be admins (not anonymous)
- Admin status persists across devices
- Be careful who you give admin access to!
- Regular users cannot see the Admin Panel button

## Removing Admin Status

To remove admin status from a user:

```sql
UPDATE users 
SET is_admin = false 
WHERE email = 'user@example.com';
```

---

**That's it! You're now an admin!** 🎉

