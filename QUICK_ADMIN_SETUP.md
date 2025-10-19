# 🚀 Quick Admin Setup (2 Minutes)

## Problem:
You're logged in, but the app says "User record not found yet". This is because your user record doesn't exist in the `users` table.

---

## ✅ QUICK FIX (Choose One):

### **Option A: Use Your Email (Easiest)**

1. Go to **Supabase SQL Editor**: https://supabase.com/dashboard/project/kobfprchlfbfkicrcxjd/sql/new

2. Replace `your@email.com` below with your actual email, then run:

```sql
-- Get user from auth.users and create admin record
WITH auth_user AS (
  SELECT id, email FROM auth.users WHERE email = 'your@email.com'
)
INSERT INTO users (id, email, is_anonymous, is_admin)
SELECT id, email, false, true
FROM auth_user
ON CONFLICT (id) DO UPDATE SET is_admin = true;

-- Create stats record
WITH auth_user AS (
  SELECT id FROM auth.users WHERE email = 'your@email.com'
)
INSERT INTO user_stats (user_id)
SELECT id FROM auth_user
ON CONFLICT (user_id) DO NOTHING;
```

3. **Restart your app** (close and reopen)
4. **Go to Settings** → You should see the "Admin Panel" button! ✅

---

### **Option B: Find Your User ID First**

If Option A doesn't work:

1. **Find your user ID:**
```sql
SELECT id, email FROM auth.users ORDER BY created_at DESC LIMIT 5;
```

2. **Copy your user ID** (long UUID like `67a2d0f9-41cf-4c3e-83d8-...`)

3. **Run this** (replace the UUID and email):
```sql
-- Replace with your actual values:
INSERT INTO users (id, email, is_anonymous, is_admin)
VALUES (
  '67a2d0f9-41cf-4c3e-83d8-53199d72ad58'::uuid,  -- Your user ID
  'your@email.com',                                -- Your email
  false,
  true  -- Makes you admin
)
ON CONFLICT (id) DO UPDATE SET is_admin = true;

-- Create stats
INSERT INTO user_stats (user_id)
VALUES ('67a2d0f9-41cf-4c3e-83d8-53199d72ad58'::uuid)  -- Same user ID
ON CONFLICT (user_id) DO NOTHING;
```

4. **Restart your app**

---

## 🧪 Verify It Worked:

Run this to check:
```sql
SELECT u.id, u.email, u.is_admin 
FROM users u
WHERE u.is_admin = true;
```

Should return your email with `is_admin = true` ✅

---

## 📱 In Your App:

After running the SQL and restarting:

1. **Open the app**
2. **Go to Settings**
3. **Scroll down** - you should see:
   ```
   🛡️ Admin Panel - Review Questions
   ```
4. **Click it** - you're now an admin! 🎉

---

## ⚠️ Why This Happened:

The `users` table is empty because:
1. You signed up before the database trigger was set up
2. The manual insert code in `AuthContext` failed due to foreign key errors
3. So your auth user exists, but not your `users` table record

This SQL manually creates your user record and makes you admin.

---

## 🚀 Long-Term Fix:

After you've made yourself admin, run `FIX_FOREIGN_KEY_ERROR.sql` to set up the database trigger. This will automatically create user records for all future sign-ups!

---

## 💡 Quick Copy-Paste:

Just replace `your@email.com` with your actual email:

```sql
WITH auth_user AS (
  SELECT id, email FROM auth.users WHERE email = 'your@email.com'
)
INSERT INTO users (id, email, is_anonymous, is_admin)
SELECT id, email, false, true
FROM auth_user
ON CONFLICT (id) DO UPDATE SET is_admin = true;

WITH auth_user AS (
  SELECT id FROM auth.users WHERE email = 'your@email.com'
)
INSERT INTO user_stats (user_id)
SELECT id FROM auth_user
ON CONFLICT (user_id) DO NOTHING;
```

**That's it! Restart your app and you're admin!** 🎉

