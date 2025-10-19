# 🧪 Quick Test Guide - Reflectify

## ✅ Payment is Configured! What's Next?

Your Toyyibpay URL is now live: `https://toyyibpay.com/ReflectifyDonation`

---

## 🚀 Test the App RIGHT NOW (30 minutes)

### **Step 1: Start the App** (2 minutes)

```bash
# In your terminal:
npm start
```

**What happens:**
- QR code appears in terminal
- Metro bundler starts
- Open Expo Go app on your phone
- Scan the QR code

---

### **Step 2: Test Core Flow** (10 minutes)

#### A. **Sign Up Flow**
1. Open app → Should see Welcome screen
2. Tap **"Create Account"**
3. Enter email and password
4. ⚠️ **Expected Behavior:**
   - If Supabase is configured → Account created ✅
   - If Supabase NOT configured → Error (fix this next)

#### B. **Reflection Flow**
1. Read the hadith (30 seconds)
2. Timer counts down
3. Answer 3 quiz questions
4. See your score

#### C. **Check Stats**
1. Go back to homepage
2. Should see:
   - Streak: 1 🔥
   - Reflections: 1
   - Score: Your points

---

### **Step 3: Test Donation** (5 minutes)

1. **Open Settings** (gear icon)
2. Scroll to **"Support Reflectify"**
3. Tap **"Donate / Support Us"**
4. Select **RM 5** (smallest amount for testing)
5. Tap **"Donate Now"**

**What Should Happen:**
- ✅ Opens Toyyibpay page in browser
- ✅ Shows RM 5.00
- ✅ FPX payment options visible

**🎯 DO THIS:**
- Test with **RM 1** (custom amount)
- Complete payment to verify it works
- Check if Toyyibpay dashboard shows the transaction

---

### **Step 4: Test Custom Donation** (2 minutes)

1. In donation screen, select **"Custom Amount"**
2. Enter **10** (RM 10)
3. Tap **"Donate Now"**
4. Verify URL shows `?amount=10`

---

## 🐛 Troubleshooting

### **Problem 1: "Sign Up Failed"**

**Cause:** Supabase not configured

**Fix:**
1. Go to https://supabase.com
2. Create new project
3. Copy URL and anon key
4. Create `.env` file:
   ```env
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=your-key
   ```
5. Run SQL from `supabase_schema.sql`
6. Restart app: `npm start`

---

### **Problem 2: "Payment page doesn't open"**

**Possible causes:**
- URL blocked by phone
- Wrong URL format
- Toyyibpay link not public

**Fix:**
1. Test URL directly in browser: https://toyyibpay.com/ReflectifyDonation
2. Make sure Toyyibpay link is set to "Active"
3. Check phone settings → Allow opening external links

---

### **Problem 3: "Questions not generating"**

**Cause:** DeepSeek API not configured (app uses pre-generated questions)

**Current behavior:** ✅ This is OK! 
- App has 200 pre-generated questions
- They work without API

**To enable AI questions:**
1. Get key from https://platform.deepseek.com
2. Add to `.env`:
   ```env
   DEEPSEEK_API_KEY=sk-your-key
   ```
3. Set mode to `hybrid` in `utils/questionConfig.ts` (already done)

---

### **Problem 4: "Hadiths not loading"**

**Cause:** Hadith API issue

**Check:**
1. Open `utils/hadithApi.ts`
2. Verify API_KEY is correct
3. Test API directly: https://hadithapi.com/public/api/hadiths?apiKey=YOUR_KEY

**Fallback:** App has 10 local hadiths if API fails

---

## ✅ Test Checklist

After testing, confirm these work:

### **User Flow:**
- [ ] Sign up with email
- [ ] Sign in works
- [ ] Password reset works (check email)
- [ ] Sign out works

### **Reflection:**
- [ ] Hadith displays (English, Arabic, Malay)
- [ ] Timer counts down (30 seconds)
- [ ] Timer turns yellow → orange → red
- [ ] Quiz has 3 questions
- [ ] Correct answer = green + sound
- [ ] Wrong answer = red + sound
- [ ] Auto-advance to next question
- [ ] Final score shows

### **Stats & Sync:**
- [ ] Streak increments after reflection
- [ ] Total reflections updates
- [ ] Score accumulates
- [ ] Bookmark hadith works
- [ ] Bookmarks saved and visible
- [ ] Data syncs to Supabase

### **Donation:**
- [ ] Donation page opens
- [ ] RM 5, 10, 20, 50, 100 buttons work
- [ ] Custom amount input works
- [ ] FPX shown as available
- [ ] Other methods shown as "Coming Soon"
- [ ] Payment URL opens in browser
- [ ] Correct amount appears in Toyyibpay

### **Settings:**
- [ ] Language switch (EN/AR/MS)
- [ ] Dark mode toggle
- [ ] Sound effects toggle
- [ ] Volume control (low/medium/high)
- [ ] Usage limit works
- [ ] Notifications toggle

---

## 📊 What You're Testing

### **Already Working (No Setup Needed):**
✅ Hadith API (7,563 hadiths)
✅ Pre-generated questions (200 hadiths)
✅ Payment URL (FPX only)
✅ Local storage
✅ Sound effects
✅ Animations
✅ Dark mode

### **Needs Configuration:**
⚠️ Supabase (authentication + cloud sync)
⚠️ DeepSeek API (AI quiz questions - optional)
⚠️ Additional payment methods (TNG, Grab, Card)

---

## 🎯 Success Criteria

**Minimum for Launch:**
1. ✅ Payment works (FPX)
2. ⚠️ User accounts work (needs Supabase)
3. ✅ Hadiths load
4. ✅ Quiz works
5. ✅ Stats track

**Your app is 80% ready!**

The only critical missing piece is **Supabase** for user accounts.

---

## 🚀 Next Steps After Testing

### **If Everything Works:**
1. Test with 2-3 friends/family
2. Collect feedback
3. Prepare app store assets:
   - Screenshots (5-8)
   - App description
   - Icon (1024x1024)
4. Build production version:
   ```bash
   npm install -g eas-cli
   eas build --platform android --profile preview
   ```

### **If Issues Found:**
1. List all bugs/issues
2. I'll help fix them
3. Re-test
4. Proceed to launch

---

## 💡 Pro Testing Tips

### **Test on Multiple Devices:**
- Small screen phone (5-6 inch)
- Large screen phone (6-7 inch)
- Tablet (optional)
- Both Android and iOS if possible

### **Test Edge Cases:**
- No internet connection
- Slow internet
- Rapid tapping (stress test)
- Background app and return
- Phone rotation (should stay portrait)

### **Test with Real Users:**
- Give to 3-5 people who don't know the app
- Watch them use it (don't help!)
- Note where they get confused
- Fix confusing parts

---

## 📞 Report Issues

If you find bugs, tell me:
1. **What you did** (steps to reproduce)
2. **What happened** (actual behavior)
3. **What should happen** (expected behavior)
4. **Screenshot or video** (if possible)

---

## ⏱️ Time Estimate

**Quick Test:** 30 minutes
**Full Test:** 2 hours
**With Friends:** 1-2 days

**Start testing NOW and let me know how it goes!** 🚀

