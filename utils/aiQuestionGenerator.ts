/**
 * AI-powered question generator for hadiths
 * Generates contextual questions based on actual hadith content
 */

import { QuizQuestion } from './hadithQuestions';

/**
 * Analyze hadith content and extract key concepts
 */
function analyzeHadithContent(hadithText: string): {
  mainConcept: string;
  keywords: string[];
  actionItems: string[];
} {
  const text = hadithText.toLowerCase();
  
  // Extract main concept based on keywords
  const conceptMap = {
    'intention': ['intention', 'intend', 'niyyah', 'purpose'],
    'speech': ['speak', 'word', 'say', 'talk', 'silent', 'tongue'],
    'anger': ['anger', 'angry', 'rage', 'temper'],
    'charity': ['charity', 'give', 'spend', 'sadaqah'],
    'kindness': ['kind', 'gentle', 'soft', 'merciful', 'compassion'],
    'knowledge': ['knowledge', 'learn', 'teach', 'understand', 'wisdom'],
    'faith': ['believe', 'faith', 'iman', 'allah'],
    'patience': ['patient', 'sabr', 'endure', 'persevere'],
    'brotherhood': ['brother', 'love', 'neighbor', 'friend'],
    'good deeds': ['deed', 'action', 'work', 'reward'],
  };
  
  let mainConcept = 'character';
  let maxMatches = 0;
  
  for (const [concept, keywords] of Object.entries(conceptMap)) {
    const matches = keywords.filter(keyword => text.includes(keyword)).length;
    if (matches > maxMatches) {
      maxMatches = matches;
      mainConcept = concept;
    }
  }
  
  // Extract keywords (important words)
  const keywords: string[] = [];
  Object.values(conceptMap).flat().forEach(keyword => {
    if (text.includes(keyword)) {
      keywords.push(keyword);
    }
  });
  
  // Extract action items (verbs)
  const actionVerbs = ['speak', 'say', 'give', 'help', 'love', 'believe', 'do', 'act', 'avoid', 'seek'];
  const actionItems = actionVerbs.filter(verb => text.includes(verb));
  
  return { mainConcept, keywords, actionItems };
}

/**
 * Generate specific Q1: Understanding question based on hadith content
 */
function generateUnderstandingQuestion(
  hadithText: string,
  analysis: ReturnType<typeof analyzeHadithContent>
): QuizQuestion {
  const { mainConcept, keywords } = analysis;
  
  // Generate question based on main concept
  const questionTemplates = {
    intention: {
      question: 'According to this hadith, what determines the value of our actions?',
      options: [
        'The intention behind them',
        'The quantity of actions',
        'Recognition from others',
        'Material rewards'
      ],
      explanation: 'The Prophet ﷺ taught that actions are judged by intentions.',
    },
    speech: {
      question: 'What does this hadith teach about our words?',
      options: [
        'Speak good or remain silent',
        'Always express your opinion',
        'Talk as much as possible',
        'Argue to prove you\'re right'
      ],
      explanation: 'Words have power - we should speak wisely or stay silent.',
    },
    anger: {
      question: 'Who is truly strong according to this hadith?',
      options: [
        'One who controls their anger',
        'One who wins physical fights',
        'One who never gets angry',
        'One who expresses anger freely'
      ],
      explanation: 'True strength is in self-control, especially when angry.',
    },
    charity: {
      question: 'What does this hadith teach about giving?',
      options: [
        'Give sincerely for Allah\'s sake',
        'Only give when you have excess',
        'Give publicly for recognition',
        'Only give to the wealthy'
      ],
      explanation: 'Charity should be given sincerely, seeking Allah\'s pleasure.',
    },
    kindness: {
      question: 'What is the importance of kindness in this hadith?',
      options: [
        'Kindness beautifies everything',
        'Kindness shows weakness',
        'Only be kind to family',
        'Kindness is optional'
      ],
      explanation: 'The Prophet ﷺ emphasized gentleness in all matters.',
    },
    knowledge: {
      question: 'What does this hadith say about seeking knowledge?',
      options: [
        'Seek beneficial knowledge continuously',
        'Knowledge is only for scholars',
        'Memorize without understanding',
        'Keep knowledge to yourself'
      ],
      explanation: 'Islam encourages the pursuit of beneficial knowledge.',
    },
    faith: {
      question: 'What is essential for faith according to this hadith?',
      options: [
        'Believing and acting accordingly',
        'Belief alone without action',
        'Following traditions blindly',
        'Faith is innate and needs no effort'
      ],
      explanation: 'True faith combines belief with righteous action.',
    },
    patience: {
      question: 'What does this hadith teach about patience?',
      options: [
        'Patience brings great reward',
        'Patience means giving up',
        'Only prophets need patience',
        'Impatience shows passion'
      ],
      explanation: 'Patience (sabr) is a virtue rewarded by Allah.',
    },
    brotherhood: {
      question: 'What defines true brotherhood in this hadith?',
      options: [
        'Loving for others what you love for yourself',
        'Competing with your brothers',
        'Only caring for your own family',
        'Avoiding community involvement'
      ],
      explanation: 'Brotherhood means wanting good for others as for yourself.',
    },
    'good deeds': {
      question: 'What makes a deed valuable according to this hadith?',
      options: [
        'Sincerity and consistency',
        'Public recognition',
        'Large quantity',
        'Material cost'
      ],
      explanation: 'The best deeds are those done sincerely and consistently.',
    },
  };
  
  const template = questionTemplates[mainConcept as keyof typeof questionTemplates] 
    || questionTemplates['good deeds'];
  
  return {
    id: 'specific_understanding',
    type: 'multiple-choice',
    question: template.question,
    options: template.options,
    correctAnswer: 0, // First option is always correct
    explanation: template.explanation,
    points: 10,
  };
}

/**
 * Generate specific Q2: Application question based on hadith content
 */
function generateApplicationQuestion(
  hadithText: string,
  analysis: ReturnType<typeof analyzeHadithContent>
): QuizQuestion {
  const { mainConcept, actionItems } = analysis;
  
  const applicationTemplates = {
    intention: {
      question: 'Before doing good deeds today, I should check my intention to ensure it\'s purely for Allah.',
      explanation: 'Pure intention (ikhlas) is crucial for actions to be accepted by Allah.',
    },
    speech: {
      question: 'I should think carefully before speaking and avoid words that might hurt others.',
      explanation: 'Guarding our tongue is a sign of strong faith and good character.',
    },
    anger: {
      question: 'When I feel angry, I should try to control myself rather than reacting immediately.',
      explanation: 'Self-control during anger shows true strength and earns Allah\'s pleasure.',
    },
    charity: {
      question: 'I can give charity through kind words, smiles, and small acts of kindness.',
      explanation: 'Charity isn\'t limited to money - even a smile is charity.',
    },
    kindness: {
      question: 'Being gentle and kind in my interactions will bring blessings to my life.',
      explanation: 'Kindness beautifies every situation and brings Allah\'s mercy.',
    },
    knowledge: {
      question: 'I should seek beneficial knowledge and apply it in my daily life.',
      explanation: 'Knowledge that leads to good action is a pathway to Paradise.',
    },
    faith: {
      question: 'My faith should be reflected in both my beliefs and my daily actions.',
      explanation: 'True faith is demonstrated through righteous deeds.',
    },
    patience: {
      question: 'When facing difficulties, I should remain patient and trust in Allah\'s plan.',
      explanation: 'Patience during trials earns immense reward from Allah.',
    },
    brotherhood: {
      question: 'I should treat others the way I want to be treated myself.',
      explanation: 'This golden rule of Islam strengthens community bonds.',
    },
    'good deeds': {
      question: 'Small consistent good deeds are better than large inconsistent ones.',
      explanation: 'The most beloved deeds to Allah are those done regularly.',
    },
  };
  
  const template = applicationTemplates[mainConcept as keyof typeof applicationTemplates]
    || applicationTemplates['good deeds'];
  
  return {
    id: 'specific_application',
    type: 'true-false',
    question: template.question,
    options: ['True / Benar', 'False / Salah'],
    correctAnswer: 0, // Always true for application questions
    explanation: template.explanation,
    points: 10,
  };
}

/**
 * Generate specific Q3: Personal reflection question
 */
function generateReflectionQuestion(
  hadithText: string,
  analysis: ReturnType<typeof analyzeHadithContent>
): QuizQuestion {
  const { mainConcept } = analysis;
  
  const reflectionTemplates = {
    intention: {
      question: 'How will you ensure your intentions are pure in your daily actions?',
      options: [
        'I will pause and check my intentions before acting',
        'I will seek praise from others',
        'I will only do what benefits me',
        'I don\'t need to think about intentions'
      ],
    },
    speech: {
      question: 'How will you improve your speech after learning this hadith?',
      options: [
        'I will speak less and only say good things',
        'I will talk more to prove my point',
        'I will gossip less but not stop',
        'My speech doesn\'t need improvement'
      ],
    },
    anger: {
      question: 'What will you do when you feel angry from now on?',
      options: [
        'I will take a deep breath and try to control myself',
        'I will express my anger immediately',
        'I will bottle up my feelings',
        'I will blame others'
      ],
    },
    charity: {
      question: 'How will you practice charity after this reflection?',
      options: [
        'I will give regularly, even small amounts',
        'I will only give when I have extra',
        'I will wait for special occasions',
        'I will give only if people notice'
      ],
    },
    kindness: {
      question: 'How will you show kindness to others today?',
      options: [
        'I will be gentle and patient with everyone',
        'I will only be kind to those who are kind to me',
        'I will be kind when it\'s convenient',
        'Kindness isn\'t my priority'
      ],
    },
  };
  
  const template = reflectionTemplates[mainConcept as keyof typeof reflectionTemplates] || {
    question: 'How will you apply this teaching in your life starting today?',
    options: [
      'I will practice it daily and make it a habit',
      'I will try it only when convenient',
      'I will think about it but not act',
      'I don\'t plan to apply it'
    ],
  };
  
  return {
    id: 'specific_reflection',
    type: 'reflection',
    question: template.question,
    options: template.options,
    correctAnswer: 0, // First option (best commitment) is correct
    explanation: 'Making a sincere commitment to apply Islamic teachings transforms our character.',
    points: 10,
  };
}

/**
 * Main function: Generate 3 contextual questions based on hadith content
 */
export function generateSpecificQuestions(hadithText: string, theme: string): QuizQuestion[] {
  // Analyze the hadith content
  const analysis = analyzeHadithContent(hadithText);
  
  // Generate 3 specific questions
  return [
    generateUnderstandingQuestion(hadithText, analysis),
    generateApplicationQuestion(hadithText, analysis),
    generateReflectionQuestion(hadithText, analysis),
  ];
}

/**
 * Enhanced version with Malay translations
 */
export function generateSpecificQuestionsWithTranslations(
  hadithText: string,
  theme: string
): QuizQuestion[] {
  const questions = generateSpecificQuestions(hadithText, theme);
  
  // Add Malay translations (you can expand this)
  const malayTranslations = {
    'True / Benar': 'Benar',
    'False / Salah': 'Salah',
  };
  
  return questions.map(q => ({
    ...q,
    question_ms: translateToMalay(q.question),
    options_ms: q.options?.map(opt => malayTranslations[opt as keyof typeof malayTranslations] || translateOptionToMalay(opt)),
    explanation_ms: translateToMalay(q.explanation),
  }));
}

// Simple translation helpers (you can enhance these)
function translateToMalay(text: string): string {
  // This is a placeholder - you can integrate with your existing translator
  // For now, return the English text
  return text;
}

function translateOptionToMalay(option: string): string {
  // Placeholder for option translation
  return option;
}

