# 🤖 DeepSeek AI Integration Guide

## How to Add Your DeepSeek API Key

### Step 1: Get Your API Key

1. Go to [DeepSeek Platform](https://platform.deepseek.com/)
2. Sign in or create an account
3. Navigate to API Keys section
4. Copy your API key

### Step 2: Add to Your Project

#### Option A: Environment Variable (Recommended)

1. Create a `.env` file in the project root:
```bash
cp .env.example .env
```

2. Edit `.env` and add your key:
```
DEEPSEEK_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

3. Install `react-native-dotenv` (if not already):
```bash
npm install react-native-dotenv
```

4. Update `babel.config.js`:
```javascript
module.exports = {
  presets: [
    ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
    'nativewind/babel',
  ],
  plugins: [
    ['module:react-native-dotenv', {
      moduleName: '@env',
      path: '.env',
    }]
  ],
};
```

5. Update `utils/deepseekQuestionGenerator.ts`:
```typescript
import { DEEPSEEK_API_KEY } from '@env';
```

#### Option B: Direct in Code (Quick Test)

1. Open `utils/deepseekQuestionGenerator.ts`
2. Find this line:
```typescript
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || 'YOUR_DEEPSEEK_API_KEY_HERE';
```

3. Replace with your key:
```typescript
const DEEPSEEK_API_KEY = 'sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';
```

⚠️ **Warning**: Don't commit your API key to Git! Add `.env` to `.gitignore`

### Step 3: Test It

1. Run the app:
```bash
npm start
```

2. Complete a hadith reflection
3. Click "Continue to Questions"
4. Watch the console for:
```
🤖 Generating questions with DeepSeek AI...
```

### How It Works

```
User clicks "Continue to Questions"
         ↓
App checks for DeepSeek API key
         ↓
    ┌────┴────┐
    │         │
  Has key   No key
    │         │
    ↓         ↓
DeepSeek   Smart
  AI       Generator
    │         │
    └────┬────┘
         ↓
  Quiz Questions
```

### Question Generation Priority

1. **Manual Questions** (if hardcoded for this hadith)
2. **DeepSeek AI** (if API key configured) ← 🤖 Best quality!
3. **Smart Generator** (keyword analysis)
4. **Theme-based** (generic questions)

### API Costs

DeepSeek is very affordable:
- ~$0.001 per request (3 questions)
- 1000 quizzes ≈ $1 USD

Cache is enabled, so same hadith won't call API twice!

### Benefits of DeepSeek

✅ **Highly Contextual** - Questions specific to hadith content
✅ **Bilingual** - Auto-generates English + Malay
✅ **Smart** - Understands Islamic teachings
✅ **Fast** - Responses in 1-2 seconds
✅ **Affordable** - Cheaper than GPT-4
✅ **Cached** - Reuses questions for same hadith

### Troubleshooting

**"Questions not generating with DeepSeek"**
- Check API key is correct
- Check internet connection
- Look at console logs for errors
- App will fallback to smart generator automatically

**"API call failed"**
- Verify API key is active
- Check DeepSeek account has credits
- Ensure no firewall blocking API calls

**"Questions in English only"**
- Bilingual mode is automatic
- First request might be slower (generates both)
- Subsequent requests use cache

### Example Output

**Without DeepSeek:**
```
📚 Using theme-based questions
Generic questions about "Character"
```

**With DeepSeek:**
```
🤖 Generating questions with DeepSeek AI...
✅ Generated 3 contextual questions specific to:
"The strong person is the one who controls their anger"

Q1: Who is truly strong according to this hadith?
Q2: When angry, I should control myself rather than react
Q3: How will you handle anger from now on?
```

### Privacy & Security

- API calls are made over HTTPS
- No hadith data is stored by DeepSeek
- Questions are cached locally
- API key stays on your device

---

**DeepSeek makes your quiz questions incredibly specific and educational!** 🤖✨

