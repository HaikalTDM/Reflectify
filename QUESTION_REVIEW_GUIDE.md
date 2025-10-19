# Question Review & Correction System

## 🎯 Purpose
Ensure all quiz questions have **100% accurate answers**, especially for Islamic content.

## 📱 How to Use

### For Users (Testing):
1. **Take the quiz** as normal
2. When you get a wrong answer, **pay attention** to whether YOUR answer was actually correct
3. If the app marked you wrong but you believe you were right, or marked you correct when you were wrong - **that's a bug!**

### For Admins (You):
1. Go to **Settings** → **Admin Panel** button (red button at bottom)
2. You'll see all reported questions grouped by hadith
3. For each report, you'll see:
   - The question text
   - What answer the system thinks is correct
   - What the user selected
   - Optional user feedback

## 🔧 How to Fix Incorrect Questions

### Step 1: Identify the Issue
- Review the reported question in the Admin Panel
- Verify which answer is actually correct (check the hadith source)

### Step 2: Add Manual Correction
Open `utils/questionReview.ts` and add to the `MANUAL_CORRECTIONS` object:

```typescript
export const MANUAL_CORRECTIONS: Record<string, {
  hadithReference: string;
  corrections: Array<{
    questionIndex: number;
    correctAnswer: number;
    explanation?: string;
  }>;
}> = {
  'Sahih al-Bukhari, 1': {
    hadithReference: 'Sahih al-Bukhari, 1',
    corrections: [
      {
        questionIndex: 0,  // First question (0-indexed)
        correctAnswer: 2,   // Index of correct answer (0 = first option, 1 = second, etc.)
        explanation: 'The Prophet (ﷺ) emphasized...'  // Optional better explanation
      }
    ]
  },
  'Sahih Muslim, 42': {
    hadithReference: 'Sahih Muslim, 42',
    corrections: [
      {
        questionIndex: 1,  // Second question
        correctAnswer: 0,
        explanation: 'According to Islamic scholars...'
      },
      {
        questionIndex: 2,  // Third question
        correctAnswer: 3,
      }
    ]
  },
};
```

### Step 3: Apply Corrections
The corrections are automatically applied when questions are loaded. They take **highest priority** over AI-generated answers.

### Step 4: Test & Clear
1. Test the hadith again to confirm the fix
2. Go back to Admin Panel
3. Click **"Clear"** to remove the reports
4. Click **"Share"** to backup the reports before clearing (optional)

## 📊 Export & Share Reports

You can export reports to:
- Share with other reviewers
- Keep a backup record
- Analyze common AI mistakes

Click **"Share"** in Admin Panel to send via email, WhatsApp, etc.

## 🎯 Question Index Reference

Questions are numbered starting from 0:
- Question 1 = index `0`
- Question 2 = index `1`
- Question 3 = index `2`

Answer options are also indexed from 0:
- First option (A) = index `0`
- Second option (B) = index `1`
- Third option (C) = index `2`
- Fourth option (D) = index `3`

## ⚠️ Important Notes

1. **Manual corrections override everything** - They take priority over:
   - AI-generated questions (DeepSeek)
   - Smart generator questions
   - Theme-based questions

2. **Pre-generated questions** from `scripts/pregenerated/` are already reviewed, but can still be corrected if needed

3. **Always verify** against authentic Islamic sources before correcting

4. **Save corrections** to prevent the same mistakes from recurring

## 🔄 Future Improvements

- Add a UI to correct questions directly in the app
- Automatically flag suspicious AI answers for review
- Crowd-source corrections from trusted users
- Integrate with Islamic scholars for verification

## 📞 Questions?

If you're unsure about a correction:
1. Check multiple authentic hadith sources
2. Consult Islamic scholars
3. When in doubt, disable the question entirely by setting `correctAnswer: -1`

