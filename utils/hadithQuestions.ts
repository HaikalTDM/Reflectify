/**
 * Quiz questions for hadiths (Duolingo-style)
 * Helps users reflect and understand the hadith better
 */

import { shuffleAllQuestions } from './questionShuffler';

export type QuestionType = 'multiple-choice' | 'true-false' | 'fill-blank' | 'reflection';

export interface QuizQuestion {
  id: string;
  type: QuestionType;
  question: string;
  question_ms?: string; // Malay translation
  options?: string[]; // For multiple choice
  options_ms?: string[]; // Malay options
  correctAnswer: string | number;
  explanation: string;
  explanation_ms?: string;
  points: number;
}

export interface HadithQuiz {
  hadithId?: number;
  hadithReference?: string;
  questions: QuizQuestion[];
}

/**
 * Generate contextual questions based on hadith theme
 */
export function generateQuestionsForTheme(theme: string, hadithText: string): QuizQuestion[] {
  const questions: QuizQuestion[] = [];
  
  // Question 1: Understanding (Multiple Choice)
  questions.push({
    id: `${theme}_understanding`,
    type: 'multiple-choice',
    question: 'What is the main message of this hadith?',
    question_ms: 'Apakah mesej utama hadis ini?',
    options: getThemeOptions(theme),
    options_ms: getThemeOptionsMalay(theme),
    correctAnswer: 0,
    explanation: 'This hadith teaches us about ' + theme.toLowerCase(),
    explanation_ms: 'Hadis ini mengajar kita tentang ' + getThemeMalay(theme),
    points: 10,
  });
  
  // Question 2: Application (True/False)
  questions.push({
    id: `${theme}_application`,
    type: 'true-false',
    question: getApplicationQuestion(theme),
    question_ms: getApplicationQuestionMalay(theme),
    options: ['True / Benar', 'False / Salah'],
    correctAnswer: 0,
    explanation: 'Applying this hadith in daily life strengthens our faith.',
    explanation_ms: 'Mengamalkan hadis ini dalam kehidupan harian menguatkan iman kita.',
    points: 10,
  });
  
  // Question 3: Reflection (Open-ended style)
  questions.push({
    id: `${theme}_reflection`,
    type: 'reflection',
    question: 'How can you apply this teaching in your life today?',
    question_ms: 'Bagaimana anda boleh mengamalkan ajaran ini dalam kehidupan anda hari ini?',
    options: [
      'I will practice it daily',
      'I will share it with others',
      'I will reflect on it more',
      'All of the above',
    ],
    options_ms: [
      'Saya akan mengamalkannya setiap hari',
      'Saya akan berkongsi dengan orang lain',
      'Saya akan merenung lebih mendalam',
      'Semua di atas',
    ],
    correctAnswer: 3, // All answers are good!
    explanation: 'Any sincere effort to apply Islamic teachings is praiseworthy!',
    explanation_ms: 'Sebarang usaha ikhlas untuk mengamalkan ajaran Islam adalah terpuji!',
    points: 10,
  });
  
  return questions;
}

/**
 * Theme-specific questions
 */
function getThemeOptions(theme: string): string[] {
  const options: Record<string, string[]> = {
    'Character': [
      'Building good character and helping others',
      'Accumulating wealth',
      'Seeking fame',
      'Avoiding people',
    ],
    'Speech': [
      'Speaking good or remaining silent',
      'Talking as much as possible',
      'Arguing to win',
      'Gossiping about others',
    ],
    'Self-Control': [
      'Controlling anger and maintaining composure',
      'Showing physical strength',
      'Winning every argument',
      'Never backing down',
    ],
    'Patience': [
      'Enduring hardship with faith',
      'Complaining constantly',
      'Giving up quickly',
      'Avoiding challenges',
    ],
    'Knowledge': [
      'Seeking beneficial knowledge',
      'Memorizing without understanding',
      'Keeping knowledge to yourself',
      'Debating others',
    ],
    'Brotherhood': [
      'Loving for others what you love for yourself',
      'Competing with your brothers',
      'Being self-centered',
      'Avoiding community',
    ],
    'Kindness': [
      'Being gentle and kind in all matters',
      'Being harsh to correct others',
      'Showing toughness',
      'Ignoring others',
    ],
    'Mercy': [
      'Showing mercy to receive mercy from Allah',
      'Being strict with everyone',
      'Only helping family',
      'Expecting rewards from people',
    ],
    'Charity': [
      'Giving in ways that please Allah',
      'Only helping the rich',
      'Showing off your charity',
      'Giving to be praised',
    ],
  };
  
  return options[theme] || options['Character'];
}

function getThemeOptionsMalay(theme: string): string[] {
  const options: Record<string, string[]> = {
    'Character': [
      'Membina akhlak mulia dan membantu orang lain',
      'Mengumpul kekayaan',
      'Mencari kemasyhuran',
      'Menjauhkan diri daripada orang',
    ],
    'Speech': [
      'Berkata baik atau diam',
      'Bercakap sebanyak mungkin',
      'Berdebat untuk menang',
      'Mengumpat orang lain',
    ],
    'Self-Control': [
      'Mengawal kemarahan dan mengekalkan ketenangan',
      'Menunjukkan kekuatan fizikal',
      'Memenangi setiap hujah',
      'Tidak pernah mengalah',
    ],
    'Patience': [
      'Sabar menghadapi kesukaran dengan iman',
      'Merungut berterusan',
      'Mudah menyerah',
      'Mengelak cabaran',
    ],
    'Knowledge': [
      'Mencari ilmu yang bermanfaat',
      'Menghafal tanpa memahami',
      'Menyimpan ilmu untuk diri sendiri',
      'Berdebat dengan orang lain',
    ],
    'Brotherhood': [
      'Mencintai untuk orang lain apa yang kita cintai untuk diri sendiri',
      'Bersaing dengan saudara',
      'Mementingkan diri sendiri',
      'Menjauhkan diri daripada komuniti',
    ],
    'Kindness': [
      'Bersikap lembut dan baik dalam semua perkara',
      'Bersikap kasar untuk membetulkan orang lain',
      'Menunjukkan ketegasan',
      'Mengabaikan orang lain',
    ],
    'Mercy': [
      'Menunjukkan belas kasihan untuk menerima rahmat Allah',
      'Bersikap tegas dengan semua orang',
      'Hanya menolong keluarga',
      'Mengharap ganjaran daripada manusia',
    ],
    'Charity': [
      'Memberi dengan cara yang meredai Allah',
      'Hanya menolong orang kaya',
      'Menunjuk-nunjuk sedekah',
      'Memberi untuk dipuji',
    ],
  };
  
  return options[theme] || options['Character'];
}

function getApplicationQuestion(theme: string): string {
  const questions: Record<string, string> = {
    'Character': 'I can improve my character by helping someone in need today.',
    'Speech': 'I should think carefully before speaking and avoid harmful words.',
    'Self-Control': 'Controlling my anger makes me stronger than physical strength.',
    'Patience': 'Being patient during difficulties will be rewarded by Allah.',
    'Knowledge': 'Seeking beneficial knowledge is an act of worship.',
    'Brotherhood': 'I should treat others the way I want to be treated.',
    'Kindness': 'Being kind and gentle brings blessings to my life.',
    'Mercy': 'Showing mercy to others brings Allah\'s mercy to me.',
    'Charity': 'Even a kind word or smile is an act of charity.',
  };
  
  return questions[theme] || questions['Character'];
}

function getApplicationQuestionMalay(theme: string): string {
  const questions: Record<string, string> = {
    'Character': 'Saya boleh memperbaiki akhlak saya dengan menolong seseorang yang memerlukan hari ini.',
    'Speech': 'Saya harus berfikir dengan teliti sebelum bercakap dan mengelak kata-kata yang menyakitkan.',
    'Self-Control': 'Mengawal kemarahan saya menjadikan saya lebih kuat daripada kekuatan fizikal.',
    'Patience': 'Bersabar semasa kesukaran akan diberi ganjaran oleh Allah.',
    'Knowledge': 'Mencari ilmu yang bermanfaat adalah ibadah.',
    'Brotherhood': 'Saya harus melayan orang lain seperti saya mahu dilayan.',
    'Kindness': 'Bersikap baik dan lembut membawa berkat dalam hidup saya.',
    'Mercy': 'Menunjukkan belas kasihan kepada orang lain membawa rahmat Allah kepada saya.',
    'Charity': 'Walaupun kata-kata yang baik atau senyuman adalah sedekah.',
  };
  
  return questions[theme] || questions['Character'];
}

function getThemeMalay(theme: string): string {
  const themes: Record<string, string> = {
    'Character': 'akhlak',
    'Speech': 'pertuturan',
    'Self-Control': 'kawalan diri',
    'Patience': 'kesabaran',
    'Knowledge': 'ilmu',
    'Brotherhood': 'persaudaraan',
    'Kindness': 'kelembutan',
    'Mercy': 'belas kasihan',
    'Charity': 'sedekah',
    'Consistency': 'istiqamah',
    'Ease': 'kemudahan',
    'Faith': 'iman',
    'Family': 'keluarga',
    'Honesty': 'kejujuran',
    'Prayer': 'solat',
  };
  
  return themes[theme] || 'akhlak';
}

/**
 * Specific questions for well-known hadiths
 */
export const specificHadithQuestions: Record<string, HadithQuiz> = {
  'bukhari_1': {
    hadithReference: 'Sahih al-Bukhari, 1',
    questions: [
      {
        id: 'intentions_1',
        type: 'multiple-choice',
        question: 'According to this hadith, what determines the reward of our actions?',
        question_ms: 'Menurut hadis ini, apakah yang menentukan ganjaran amalan kita?',
        options: [
          'Our intentions',
          'How much we do',
          'What people think',
          'Our wealth',
        ],
        options_ms: [
          'Niat kita',
          'Berapa banyak yang kita lakukan',
          'Apa yang orang fikirkan',
          'Kekayaan kita',
        ],
        correctAnswer: 0,
        explanation: 'The Prophet ﷺ taught us that actions are judged by intentions.',
        explanation_ms: 'Nabi ﷺ mengajar kita bahawa amalan dinilai berdasarkan niat.',
        points: 10,
      },
      {
        id: 'intentions_2',
        type: 'true-false',
        question: 'A good action with bad intention will not be rewarded.',
        question_ms: 'Amalan baik dengan niat buruk tidak akan diberi ganjaran.',
        options: ['True / Benar', 'False / Salah'],
        correctAnswer: 0,
        explanation: 'Sincere intention is crucial for actions to be accepted.',
        explanation_ms: 'Niat yang ikhlas adalah penting untuk amalan diterima.',
        points: 10,
      },
      {
        id: 'intentions_3',
        type: 'reflection',
        question: 'Before doing good deeds today, I will:',
        question_ms: 'Sebelum melakukan amalan baik hari ini, saya akan:',
        options: [
          'Check my intention sincerely',
          'Think about rewards only',
          'Hope people notice',
          'Do it without thinking',
        ],
        options_ms: [
          'Memeriksa niat saya dengan ikhlas',
          'Hanya fikirkan ganjaran',
          'Berharap orang perasan',
          'Buat tanpa berfikir',
        ],
        correctAnswer: 0,
        explanation: 'Checking our intention ensures our actions are purely for Allah.',
        explanation_ms: 'Memeriksa niat kita memastikan amalan kita semata-mata untuk Allah.',
        points: 10,
      },
    ],
  },
};

/**
 * Get questions for a specific hadith or generate contextual ones
 * Priority: Manual → DeepSeek AI → Smart Generator → Theme-based
 */
export async function getQuestionsForHadith(
  hadithReference: string,
  theme: string,
  hadithText: string
): Promise<QuizQuestion[]> {
  // Priority 1: Check if we have manually-crafted specific questions
  const bookAndNumber = hadithReference.toLowerCase().replace(/[^a-z0-9]/g, '_');
  
  if (specificHadithQuestions[bookAndNumber]) {
    console.log('📖 Using manual questions for:', hadithReference);
    return shuffleAllQuestions(specificHadithQuestions[bookAndNumber].questions);
  }

  // Priority 2: Check pregenerated questions (bundled with app) - FASTEST!
  try {
    const { getPregeneratedQuestions } = await import('./pregeneratedQuestionsLoader');
    const pregenerated = getPregeneratedQuestions(hadithReference, 'bilingual');
    
    if (pregenerated) {
      console.log('📦 Using pregenerated questions for:', hadithReference);
      return shuffleAllQuestions(pregenerated);
    }
  } catch (error) {
    // Pregenerated questions not available, continue to next option
  }
  
  // Priority 3: Try DeepSeek AI (if enabled by config)
  try {
    const { shouldUseDeepSeek, canUseDeepSeekToday, trackDeepSeekUsage } = require('./questionConfig');
    const deepseekModule = require('./deepseekQuestionGenerator');
    
    if (shouldUseDeepSeek() && deepseekModule.isDeepSeekConfigured() && canUseDeepSeekToday()) {
      console.log('🤖 Generating questions with DeepSeek AI...');
      const questions = await deepseekModule.generateQuestionsWithCache(hadithText, hadithReference, theme, true);
      trackDeepSeekUsage();
      return shuffleAllQuestions(questions);
    } else if (!canUseDeepSeekToday()) {
      console.log('⚠️ Daily DeepSeek limit reached, using smart generator...');
    }
  } catch (error) {
    console.log('DeepSeek not available, trying smart generator...');
  }
  
  // Priority 3: Use smart content-based generator
  try {
    const aiModule = require('./aiQuestionGenerator');
    console.log('🧠 Generating questions with smart analyzer...');
    const questions = aiModule.generateSpecificQuestions(hadithText, theme);
    
    // Save to shared cache for other users to benefit
    try {
      const { saveToSharedCache } = await import('./sharedQuestionCache');
      await saveToSharedCache(hadithReference, questions, 'bilingual', 'smart');
    } catch (e) {
      // Non-critical
    }
    
    return shuffleAllQuestions(questions);
  } catch (error) {
    console.log('Smart generator failed, using theme-based questions...');
  }
  
  // Priority 4: Fallback to theme-based questions
  console.log('📚 Using theme-based questions');
  const themeQuestions = generateQuestionsForTheme(theme, hadithText);
  
  // Save theme-based questions to shared cache as well
  try {
    const { saveToSharedCache } = await import('./sharedQuestionCache');
    await saveToSharedCache(hadithReference, themeQuestions, 'bilingual', 'theme');
  } catch (e) {
    // Non-critical
  }
  
  return shuffleAllQuestions(themeQuestions);
}

/**
 * Synchronous version for when async is not possible
 */
export function getQuestionsForHadithSync(
  hadithReference: string,
  theme: string,
  hadithText: string
): QuizQuestion[] {
  // Check manual questions
  const bookAndNumber = hadithReference.toLowerCase().replace(/[^a-z0-9]/g, '_');
  
  if (specificHadithQuestions[bookAndNumber]) {
    return shuffleAllQuestions(specificHadithQuestions[bookAndNumber].questions);
  }
  
  // Check pregenerated questions (bundled with app)
  try {
    const { getPregeneratedQuestions } = require('./pregeneratedQuestionsLoader');
    const pregenerated = getPregeneratedQuestions(hadithReference, 'bilingual');
    if (pregenerated) {
      return shuffleAllQuestions(pregenerated);
    }
  } catch (error) {
    // Fallback if pregenerated not available
  }
  
  // Use smart generator (synchronous)
  try {
    const { generateSpecificQuestions } = require('./aiQuestionGenerator');
    const questions = generateSpecificQuestions(hadithText, theme);
    return shuffleAllQuestions(questions);
  } catch (error) {
    // Fallback to theme-based
    return shuffleAllQuestions(generateQuestionsForTheme(theme, hadithText));
  }
}

