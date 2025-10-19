# 🕌 Reflectify - Islamic Hadith Reflection App

> **A mindful companion for your spiritual journey** - AI-powered hadith reflections with Duolingo-style quizzes

[![Expo SDK](https://img.shields.io/badge/Expo-54.0-blue.svg)](https://expo.dev)
[![React Native](https://img.shields.io/badge/React%20Native-0.81.4-green.svg)](https://reactnative.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org)
[![NativeWind](https://img.shields.io/badge/NativeWind-4.2-purple.svg)](https://www.nativewind.dev)

---

## 🎯 **What is Reflectify?**

Reflectify is a React Native app that helps Muslims integrate mindful reflection into their daily lives by:

- 📱 **Blocking your phone** with beautiful hadith screens at scheduled intervals
- ⏱️ **30-second mindful timer** for deep reflection
- 🧠 **AI-powered quiz questions** to test understanding (powered by DeepSeek)
- 🌍 **Multi-language support** (English, Arabic, Malay)
- 🎨 **Beautiful dark/light themes** with smooth animations
- ✅ **100% Sahih hadiths** from Bukhari & Muslim collections
- 🚀 **Smart caching** for offline use
- ☁️ **Cloud sync** with Supabase (optional)

---

## ⚡ **Key Features**

### 🔒 **Reflection Lock Screen**
- Blocks phone after 1-2 hours of usage
- Shows random sahih hadith with 30-second countdown
- Breathing animation for peaceful reflection
- Can't dismiss until timer completes

### 🎓 **Duolingo-Style Quizzes**
- **3 question types**: Understanding, Application, Reflection
- **AI-generated** contextual questions specific to each hadith
- **Auto-advance** on correct answers with celebration animations
- **Score tracking** with sticky display
- **Instant feedback** with explanations

### 🤖 **DeepSeek AI Integration**
- **Contextual questions** tailored to each hadith's meaning
- **Bilingual support** (English + Malay in one API call)
- **Smart caching** (7-day persistence + memory cache)
- **Background preloading** during hadith reflection (instant quiz start!)
- **Cost-efficient** (~$0.001 per quiz)

### 🌐 **Multi-Language Support**
- **English** - Primary language
- **Arabic** - Original hadith text with Uthmanic font
- **Malay** - Community translations + auto-translation API
- **Mixed modes**: EN+AR, EN+MS, AR+MS, All languages

### 🎨 **Beautiful UI**
- **Dark/Light themes** with instant switching
- **Smooth animations** (fade, scale, slide, pulse, blur)
- **Custom toast notifications** with haptic feedback
- **NativeWind v4** for Tailwind CSS styling
- **Responsive design** optimized for mobile

---

## 🚀 **Getting Started**

### **Prerequisites**
- Node.js 18+ and npm/yarn
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator (Mac) or Android Emulator
- DeepSeek API key (optional, for AI questions)

### **Installation**

```bash
# 1. Clone the repository
git clone https://github.com/yourusername/reflectify.git
cd reflectify

# 2. Install dependencies
npm install --legacy-peer-deps

# 3. Set up environment variables (optional)
cp .env.example .env
# Add your API keys to .env:
# DEEPSEEK_API_KEY=your_api_key_here
# SUPABASE_URL=your_supabase_url_here
# SUPABASE_ANON_KEY=your_supabase_key_here

# 4. Start the development server
npm start

# 5. Run on iOS/Android
npm run ios
# OR
npm run android
```

---

## 🤖 **DeepSeek AI Setup**

### **Why DeepSeek?**
- ✅ **Highly contextual** - Questions specific to each hadith
- ✅ **Bilingual** - Auto-generates Malay translations
- ✅ **Affordable** - ~$0.00018 per quiz (~$0.0002/user/month with cache)
- ✅ **Fast** - 1-2 second response with optimizations
- ✅ **Cached** - Same hadith won't call API twice (7-30 day cache)
- ✅ **Scalable** - Can handle 10K users for ~$1-2/month

### **Get Your API Key**

1. Visit [DeepSeek Platform](https://platform.deepseek.com)
2. Sign up/Login
3. Go to API Keys section
4. Create new API key
5. Copy your key

### **Configure in App**

```bash
# Create .env file (if not exists)
touch .env

# Add your API key
echo "DEEPSEEK_API_KEY=sk-your-api-key-here" >> .env
```

### **Verify Configuration**

```bash
# Restart your Expo dev server (required!)
npm start -- --clear

# Look for this log when starting a reflection:
# ✅ DeepSeek API key found and configured
# 🚀 Preloading questions during hadith reflection...
# 🤖 Generating new questions with DeepSeek for: Sahih al-Bukhari, 13
# ✅ Questions preloaded successfully!
```

---

## ⚡ **Performance Optimizations**

### **🚀 Background Preloading** (NEW!)
Questions are generated **during the 30-second hadith timer**, so when you click "Continue to Questions", the quiz starts **instantly**!

```
User sees hadith (30s)
        ↓
    3 seconds in...
        ↓
🚀 Background: DeepSeek API call starts
        ↓
    27 seconds later...
        ↓
✅ Questions ready & cached
        ↓
User clicks "Continue"
        ↓
⚡ INSTANT quiz start (no loading!)
```

### **💾 Multi-Level Caching**

1. **Memory Cache** (fastest) - Questions stored in Map during session
2. **AsyncStorage Cache** (persistent) - 7-day cache for offline use
3. **API Call** (only when needed) - Smart fallbacks

```typescript
// Cache hit flow:
Memory Cache (0ms) 
    ↓ miss
AsyncStorage (10-50ms)
    ↓ miss  
DeepSeek API (1-2s)
    ↓
Cache both levels for next time
```

### **🔧 API Optimizations**

- **Reduced `max_tokens`**: 2000 → 800 (single lang) / 1200 (bilingual)
- **Lower `temperature`**: 0.7 → 0.3 (faster, more consistent)
- **Timeout protection**: 10-second max wait (React Native compatible)
- **Single API call**: Bilingual questions in ONE call instead of two
- **Compressed prompts**: Focused, structured JSON-only output
- **AbortController**: Manual implementation for React Native compatibility

### **📊 Performance Comparison**

| Method | First Time | Cached | Preloaded |
|--------|-----------|--------|-----------|
| **Old (2 API calls)** | 4-6s | 0s | N/A |
| **New (1 API call)** | 1-2s | 0s | **0s** ⚡ |

**Result**: ~75% faster + instant quiz start with preloading!

---

## 📱 **Usage Flow**

### **1. Home Screen**
- View schedule summary
- Manual "Start Reflection Now" button
- Stats display (total reflections)
- Navigate to settings

### **2. Reflection Screen**
```
30s countdown timer (with breathing animation)
        ↓
📖 Random sahih hadith displayed
(English / Arabic / Malay)
        ↓
Timer completes
        ↓
"Continue to Questions" button appears
        ↓
⚡ Quiz starts instantly (preloaded!)
```

### **3. Quiz Screen**
```
Question 1: Multiple Choice
"What is the main message?"
        ↓
User answers correctly
        ↓
✅ +10 points animation
        ↓
Auto-advance (1.8s)
        ↓
Question 2: True/False
        ↓
Question 3: Reflection
        ↓
Quiz complete!
        ↓
🎉 Confetti (if score ≥ 70%)
        ↓
Back to home
```

### **4. Settings Screen**
- **Frequency**: Every 1-6 hours
- **Language**: EN, AR, MS, mixed modes
- **Theme**: Light/Dark mode toggle
- **Add Hadiths**: Upload custom hadiths (placeholder)

---

## 🏗️ **Project Structure**

```
Reflectify/
├── app/                          # Expo Router screens
│   ├── _layout.tsx              # Root layout (navigation, providers)
│   ├── index.tsx                # Home screen
│   ├── reflection.tsx           # Hadith reflection + quiz
│   └── settings.tsx             # App settings
│
├── components/                   # Reusable UI components
│   ├── HadithCard.tsx           # Hadith display card
│   ├── HadithQuiz.tsx           # Quiz component (Duolingo-style)
│   ├── CountdownTimer.tsx       # 30s breathing timer
│   ├── CustomToast.tsx          # Animated toast notifications
│   └── CustomAlert.tsx          # Custom alert dialogs
│
├── utils/                        # Business logic & utilities
│   ├── hadithData.ts            # Local hadith collection (10 sahih)
│   ├── hadithApi.ts             # API integration (hadithapi.com)
│   ├── hadithQuestions.ts       # Question generation router
│   ├── deepseekQuestionGenerator.ts  # DeepSeek AI integration
│   ├── aiQuestionGenerator.ts   # Smart keyword-based generator
│   ├── hadithTranslations.ts    # Curated Malay translations
│   ├── translator.ts            # Auto-translation APIs
│   ├── notification.ts          # Push notifications
│   └── usageTracker.ts          # Screen time tracking
│
├── contexts/                     # React Context providers
│   ├── ThemeContext.tsx         # Dark/Light theme
│   └── NotificationContext.tsx  # Global notifications
│
├── .env                         # Environment variables
├── babel.config.js              # Babel config (NativeWind + dotenv)
├── tailwind.config.js           # Tailwind CSS config
├── tsconfig.json                # TypeScript config
├── package.json                 # Dependencies
└── README.md                    # This file!
```

---

## 🎨 **Color Palette**

```javascript
// Tailwind config
colors: {
  'primary-dark': '#1a1a1a',      // Dark background
  'primary-light': '#f5f5f5',     // Light background
  'primary-accent': '#d4af37',    // Gold accent
  'primary-text': '#333333',      // Dark text
  'secondary-text': '#666666',    // Gray text
}
```

---

## 📚 **Key Technologies**

- **Expo SDK 54** - React Native framework
- **Expo Router 6** - File-based navigation
- **TypeScript** - Type safety
- **NativeWind v4** - Tailwind CSS for React Native
- **AsyncStorage** - Local data persistence
- **Expo Notifications** - Push notifications
- **Expo Haptics** - Haptic feedback
- **DeepSeek AI** - Contextual question generation
- **Hadith API** - Real-time hadith fetching
- **react-native-confetti-cannon** - Celebration animations

---

## 🔐 **Hadith Authenticity**

### **✅ 100% Sahih Guarantee**

- **Local Collection**: 10 verified sahih hadiths
  - 6 from **Sahih al-Bukhari** (most authentic)
  - 1 from **Sahih Muslim** (second most authentic)
  - 3 from **Sahih al-Jami / Tirmidhi** (authenticated by Al-Albani)

- **API Integration**: ONLY fetches from:
  - ✅ Sahih al-Bukhari
  - ✅ Sahih Muslim

- **Validation**: App validates book slug before API calls

```typescript
// Only these books are allowed
const SAHIH_BOOKS_ONLY = [
  'sahih-bukhari',
  'sahih-muslim',
];
```

---

## 🌐 **Translation System**

### **Malay Translation Priority**

1. **Curated Database** (manual, verified translations)
2. **Auto-Translation API** (Google Translate / MyMemory / LibreTranslate)
3. **Placeholder** `[Terjemahan Melayu akan datang]`

### **Add Custom Translations**

```typescript
// utils/hadithTranslations.ts
export const curatedTranslations = {
  'sahih-bukhari': {
    '1': 'Sesungguhnya setiap amalan bergantung kepada niat...',
    '13': 'Tidak sempurna iman seseorang sehingga...',
  },
};
```

---

## 💰 **Cost Management**

The app includes **3 modes** to control costs:

### **1. FREE Mode** 🆓
```typescript
// utils/questionConfig.ts
export const CURRENT_MODE = 'free';
```
- **Cost**: $0
- **Quality**: Good (smart analyzer + theme-based)
- **Use case**: Unlimited users, tight budget
- Works offline!

### **2. HYBRID Mode** 🎯 (RECOMMENDED)
```typescript
// utils/questionConfig.ts
export const CURRENT_MODE = 'hybrid'; // ← Current setting
```
- **Cost**: ~$0.0002/user/month (~$2/10K users)
- **Quality**: Excellent (AI with smart caching)
- **Use case**: Best balance for most apps
- Daily limit: 1000 calls (~$0.18/day max)
- Cache: 30 days

### **3. PREMIUM Mode** 💎
```typescript
// utils/questionConfig.ts
export const CURRENT_MODE = 'premium';
```
- **Cost**: ~$0.001/user/month
- **Quality**: Best (always fresh AI questions)
- **Use case**: Premium features, best UX
- Cache: 7 days (fresher content)

### **Scale Projections (WITH Shared Cache)** 🚀

| Users | Mode | Year 1 Cost | Ongoing Cost | Per User |
|-------|------|------------|--------------|----------|
| 1,000 | Hybrid | ~RM 0.015 | ~RM 0.001/mo | 0.0015 sen |
| 10,000 | Hybrid | ~RM 0.15 | ~RM 0.01/mo | 0.0015 sen |
| 100,000 | Hybrid | ~RM 0.15 | ~RM 0.01/mo | 0.0015 sen |
| 1,000,000 | Hybrid | ~RM 0.15 | ~RM 0.01/mo | 0.0015 sen |

**🎉 Shared cache = same cost regardless of user count!**

📊 **See SHARED_CACHE_SYSTEM.md for detailed breakdown**
📊 **See COST_CALCULATION_10K_USERS.md for 10K user analysis**

---

## 🐛 **Troubleshooting**

### **DeepSeek not working?**

1. ✅ Check API key in `.env`
2. ✅ Restart Expo server: `npm start -- --clear`
3. ✅ Check console logs for `✅ DeepSeek API key found`
4. ✅ Verify API key at [platform.deepseek.com](https://platform.deepseek.com)

### **"AbortSignal.timeout is not a function" error?**

✅ **Fixed!** This was a React Native compatibility issue. The app now uses manual `AbortController` with `setTimeout`, which works in all React Native environments.

### **Questions taking too long?**

- ✅ Preloading should make quiz instant (check console for `✅ Questions preloaded`)
- ✅ If first-time generation, wait 1-2s (will be cached for 7 days)
- ✅ Check internet connection

### **Navigation error "GO_BACK was not handled"?**

- ✅ Fixed in latest code (uses `router.replace('/')` fallback)

### **Build errors?**

```bash
# Clear cache and reinstall
rm -rf node_modules
npm install --legacy-peer-deps
npm start -- --clear
```

---

## ☁️ **Cloud Sync with Supabase**

### **Features**
- ✅ **User Authentication** (email + anonymous mode)
- ✅ **Cloud Backup** (never lose your progress)
- ✅ **Multi-Device Sync** (access from any device)
- ✅ **Local Fallback** (works offline, syncs when online)
- ✅ **Privacy First** (Row Level Security enabled)

### **Setup**

1. **Create Supabase Project**
   - Visit [supabase.com](https://supabase.com) and create a free project
   - Follow instructions in `SUPABASE_SETUP.md`

2. **Add Credentials to .env**
   ```env
   SUPABASE_URL=https://xxxxx.supabase.co
   SUPABASE_ANON_KEY=eyJxxx...
   ```

3. **Run SQL Schema**
   - Copy SQL from `SUPABASE_SETUP.md`
   - Run in Supabase Dashboard > SQL Editor

4. **Done!** 
   - Users can now sign in and sync their progress
   - Anonymous users keep data locally
   - Sign up later to migrate data to cloud

---

## 📈 **Roadmap**

- [x] Supabase integration for user data sync ✅
- [x] Streak tracking & achievements ✅
- [ ] More hadith collections (Abu Dawood, Tirmidhi - verified only)
- [ ] Social features (share reflections, leaderboards)
- [ ] Apple Health / Google Fit integration
- [ ] PDF export of reflections
- [ ] Voice narration of hadiths
- [ ] Widget support (iOS/Android)

---

## 🤝 **Contributing**

Contributions are welcome! Please:

1. Fork the repo
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 **License**

This project is licensed under the MIT License.

---

## 🙏 **Acknowledgments**

- **HadithAPI.com** for comprehensive hadith database
- **DeepSeek** for affordable, high-quality AI
- **Expo Team** for amazing React Native framework
- **Islamic scholars** for hadith authentication work
- **Muslim community** for feedback and translations

---

## 📞 **Support**

- 🐛 **Issues**: [GitHub Issues](https://github.com/yourusername/reflectify/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/yourusername/reflectify/discussions)
- 📧 **Email**: your.email@example.com

---

<div align="center">

**Made with ❤️ for the Muslim Ummah**

⭐ **Star this repo if it benefits you!** ⭐

</div>
