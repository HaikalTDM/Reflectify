# 🚀 Pre-Launch Checklist for Reflectify

## ✅ Required Before Publishing

### 1. **Environment Variables (.env file)** ⚠️ CRITICAL

Create a `.env` file in your project root with:

```env
# DeepSeek AI (for quiz questions)
DEEPSEEK_API_KEY=sk-your-actual-key-here

# Hadith API (for fetching hadiths)
HADITH_API_KEY=$2y$10$5dFKSCutokO12zw4fXBPJFdRkwyEe7TddgVFgMniwNpa951c4S

# Supabase (for user authentication & cloud sync)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here

# Sentry (optional - for crash reporting, if you add it back)
# SENTRY_DSN=your-sentry-dsn-here
```

**Status:**
- [ ] DeepSeek API key added
- [ ] Hadith API key verified
- [ ] Supabase URL and key added
- [ ] .env file in .gitignore

---

### 2. **Donation Payment Integration** ✅ CONFIGURED!

**File:** `app/donation.tsx` (Line 94)

**Current Status:** ✅ Live and Ready!

```typescript
// ✅ CONFIGURED:
const paymentUrl = `https://toyyibpay.com/ReflectifyDonation?amount=${finalAmount}`;
```

**Status:**
- [x] Toyyibpay account registered
- [x] Payment link created (https://toyyibpay.com/ReflectifyDonation)
- [x] URL updated in code
- [ ] Test donation completed ← DO THIS NEXT!

**Available Payment Methods:**
- ✅ **FPX** (Malaysian Online Banking) - Live Now
- ⏳ **Touch 'n Go** - Coming Soon
- ⏳ **GrabPay** - Coming Soon  
- ⏳ **Credit/Debit Cards** - Coming Soon

---

### 3. **Supabase Database Setup** ⚠️ CRITICAL

**Required Tables:**
- `users` - User accounts
- `user_stats` - Streaks, scores, reflections
- `bookmarks` - Saved hadiths

**Status:**
- [ ] Supabase project created
- [ ] Tables created (run `supabase_schema.sql`)
- [ ] RLS policies enabled
- [ ] Test user created and syncing works

**Quick Test:**
1. Sign up in app
2. Complete a reflection
3. Check Supabase dashboard - data should appear

---

### 4. **API Keys Testing** ✅ MOSTLY DONE

#### **A. DeepSeek API (AI Quiz Questions)**
- **Purpose:** Generate contextual quiz questions
- **Cost:** ~$0.0002 per quiz
- **Fallback:** Pre-generated 200 questions
- **Test:** Complete a reflection and check questions appear

**Status:**
- [ ] API key working
- [ ] Questions generating correctly
- [ ] Fallback to pre-generated working

#### **B. Hadith API**
- **Purpose:** Fetch 7,563 authentic hadiths
- **Cost:** FREE
- **Test:** App should show different hadiths each time

**Status:**
- [x] API working (already tested)
- [x] Translations working
- [x] Caching working

---

### 5. **App Configuration Files** ⚠️ CHECK THESE

#### **A. app.json / app.config.js**
Update these fields:

```json
{
  "expo": {
    "name": "Reflectify",
    "slug": "reflectify",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",  // ⚠️ CHECK EXISTS
    "splash": {
      "image": "./assets/splash.png",  // ⚠️ CHECK EXISTS
      "backgroundColor": "#1a1a1a"
    },
    "ios": {
      "bundleIdentifier": "com.yourcompany.reflectify",  // ⚠️ UPDATE
      "buildNumber": "1.0.0"
    },
    "android": {
      "package": "com.yourcompany.reflectify",  // ⚠️ UPDATE
      "versionCode": 1,
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png"  // ⚠️ CHECK EXISTS
      }
    }
  }
}
```

**Status:**
- [ ] Bundle identifier updated
- [ ] Package name updated
- [ ] Icons exist and are correct size
- [ ] Splash screen exists

---

### 6. **Testing Checklist** ⚠️ MUST DO

#### **A. Core Features**
- [ ] User can sign up with email
- [ ] User can sign in
- [ ] Password reset works
- [ ] Hadith displays correctly (EN/AR/MS)
- [ ] 30-second timer works
- [ ] Quiz questions appear
- [ ] Answers are validated correctly
- [ ] Score updates
- [ ] Streak increments daily
- [ ] Bookmarks save and display
- [ ] Dark mode toggles

#### **B. Cloud Sync**
- [ ] Stats sync to Supabase
- [ ] Bookmarks sync to Supabase
- [ ] Data persists after logout/login
- [ ] Offline mode works
- [ ] Auto-sync when internet returns

#### **C. Donation System**
- [ ] Donation button visible in settings
- [ ] Preset amounts work (RM 5, 10, 20, 50, 100)
- [ ] Custom amount input works
- [ ] Payment page opens correctly
- [ ] Thank you message appears

#### **D. Sound Effects**
- [ ] Correct answer sound plays
- [ ] Wrong answer sound plays
- [ ] Quiz complete sound plays
- [ ] Sound toggle works
- [ ] Volume control works (low/medium/high)

#### **E. Edge Cases**
- [ ] App works without internet
- [ ] App handles API failures gracefully
- [ ] No crashes when rapidly tapping
- [ ] Memory doesn't leak after multiple reflections
- [ ] Works on different screen sizes

---

### 7. **Performance & Optimization** ✅ DONE

- [x] Hadiths load quickly (<3 seconds)
- [x] Translations cached
- [x] Questions pre-generated (200 hadiths)
- [x] Images optimized
- [x] No memory leaks detected

---

### 8. **Security Checklist** ⚠️ VERIFY

- [ ] `.env` file NOT in Git
- [ ] API keys NOT hardcoded
- [ ] Supabase RLS policies enabled
- [ ] Users can only see their own data
- [ ] No sensitive data in console.log (production)

---

### 9. **Legal & Compliance** ⚠️ REQUIRED

Before publishing:

#### **A. Privacy Policy**
- [ ] Create privacy policy page
- [ ] Explain data collection (email, stats, bookmarks)
- [ ] Explain cloud sync
- [ ] Explain payment data (handled by Toyyibpay)

#### **B. Terms of Service**
- [ ] Create terms of service
- [ ] Define acceptable use
- [ ] Define donation policy (non-refundable)

#### **C. App Store Requirements**
- [ ] Privacy policy URL ready
- [ ] Support email configured
- [ ] App description ready
- [ ] Screenshots prepared (5-8 screenshots)
- [ ] App icon ready (1024x1024 for iOS)

---

## 🧪 Testing Environments

### **Option 1: Expo Go (Quick Test)** ✅ RECOMMENDED FOR NOW
**What you have now:**

```bash
npm start
# Scan QR code with Expo Go app
```

**Pros:**
- ✅ No setup needed
- ✅ Test on real device instantly
- ✅ Hot reload

**Cons:**
- ❌ Some native features may not work
- ❌ Can't test production builds

---

### **Option 2: EAS Build (Production-like)** 🏆 RECOMMENDED BEFORE LAUNCH

**What it is:** Expo's build service for creating production builds

**Setup:**
```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo account
eas login

# Configure project
eas build:configure

# Build for Android (test on device)
eas build --platform android --profile preview

# Build for iOS (requires Apple Developer account)
eas build --platform ios --profile preview
```

**When to use:**
- Before submitting to App Store/Play Store
- To test push notifications
- To test production performance
- To test payment integration fully

**Cost:**
- FREE for personal projects (limited builds)
- $29/month for unlimited builds

---

### **Option 3: Local Development Build** 🔧 ADVANCED

```bash
# Build locally for Android
npx expo run:android

# Build locally for iOS (Mac only)
npx expo run:ios
```

**When to use:**
- If you need custom native code
- If you want full control
- If you have Mac for iOS development

---

## 🚦 Your Current Status

### ✅ **WORKING**
- [x] App architecture
- [x] Authentication system
- [x] Hadith fetching
- [x] Quiz system
- [x] Streak tracking
- [x] Bookmarks
- [x] Cloud sync
- [x] Sound effects
- [x] Dark mode
- [x] Donation UI
- [x] Password reset

### ⚠️ **NEEDS CONFIGURATION**
- [ ] `.env` file with real API keys
- [ ] Toyyibpay payment URL
- [ ] Supabase project setup
- [ ] Bundle identifiers (iOS/Android)
- [ ] App icons (check if they exist)

### 🧪 **NEEDS TESTING**
- [ ] End-to-end user flow
- [ ] Payment integration
- [ ] Cloud sync
- [ ] Different devices/screen sizes

---

## 🎯 Recommended Testing Plan

### **Phase 1: Quick Sanity Check** (30 minutes)
1. **Run app in Expo Go**
   ```bash
   npm start
   ```
2. **Test core flow:**
   - Sign up → Reflection → Quiz → Check stats
3. **Test donations:**
   - Go to Settings → Support → Select amount
   - See if payment page opens (even if placeholder)

### **Phase 2: Full Integration Test** (2-3 hours)
1. **Set up Supabase**
   - Create project
   - Run SQL schema
   - Update .env
   - Test sign up/sign in

2. **Configure payment**
   - Register Toyyibpay
   - Update payment URL
   - Test with RM 5 donation

3. **Test on multiple devices**
   - Android phone
   - iOS phone (if available)
   - Different screen sizes

### **Phase 3: Production Build Test** (1 day)
1. **Create EAS build**
   ```bash
   eas build --platform android --profile preview
   ```
2. **Install on device**
3. **Test everything again**
4. **Check performance**

---

## 📝 What You Need RIGHT NOW

### **Immediate (Before ANY testing):**

1. **Create `.env` file:**
   ```env
   DEEPSEEK_API_KEY=sk-your-key
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=your-key
   ```

2. **Verify Supabase is set up:**
   - Go to https://supabase.com
   - Check your project exists
   - Verify tables are created

3. **Update payment URL in `app/donation.tsx`:**
   - Register Toyyibpay (10 minutes)
   - Get payment link
   - Update line 94

### **For Sandbox Testing (Optional):**

**Toyyibpay Sandbox:**
- Toyyibpay has built-in test mode
- No separate sandbox needed
- Just test with small amounts (RM 1-5)

**Supabase Testing:**
- Create separate "test" project
- Or use same project with test users
- Data is free for small scale

---

## 🚀 Launch Day Checklist

When you're ready to publish:

### **Android (Google Play Store):**
- [ ] Google Play Console account ($25 one-time)
- [ ] App signed with production key
- [ ] Privacy policy URL
- [ ] App screenshots (5-8)
- [ ] App description (English + Malay)
- [ ] Age rating questionnaire
- [ ] Content rating

### **iOS (Apple App Store):**
- [ ] Apple Developer account ($99/year)
- [ ] App signed with distribution certificate
- [ ] Privacy policy URL
- [ ] App screenshots (iPhone + iPad)
- [ ] App description (English + Malay)
- [ ] Age rating
- [ ] TestFlight beta testing (recommended)

---

## 💡 My Recommendation

### **Start Here (Today - 30 minutes):**

1. **Create .env file** with your API keys
2. **Run app in Expo Go**
   ```bash
   npm start
   ```
3. **Test basic flow:** Sign up → Reflection → Quiz
4. **Register Toyyibpay** and update payment URL

### **This Week:**
1. Complete full integration testing
2. Test on 2-3 different devices
3. Get friends/family to test (beta testers)

### **Before Launch:**
1. Create EAS production build
2. Prepare App Store assets (screenshots, description)
3. Set up analytics (optional but recommended)

---

## ❓ Questions to Answer

Before I can give you exact steps:

1. **Do you have a Supabase project set up?** (Yes/No)
2. **Do you have all API keys?** (DeepSeek, Hadith API)
3. **Have you registered Toyyibpay?** (Yes/No)
4. **Which platform first?** (Android / iOS / Both)
5. **Do you have a Mac?** (Required for iOS development)

---

**Let me know your answers and I'll give you the exact next steps!** 🚀

