/**
 * Pregenerated Questions Loader
 * 
 * Loads questions from bundled JSON files (pregenerated offline)
 * This is the FASTEST option - no network calls needed!
 */

import { QuizQuestion } from './hadithQuestions';

// Import pregenerated questions (will be created by script)
// For now, these will be null until you run the pregeneration script
let PREGENERATED_QUESTIONS: Map<string, QuizQuestion[]> | null = null;

interface PregeneratedEntry {
  hadithReference: string;
  hadithText: string;
  theme: string;
  questions: QuizQuestion[];
  generatedAt: string;
  generatedBy: string;
}

/**
 * Load pregenerated questions from JSON files
 * Call this once at app startup
 */
export async function loadPregeneratedQuestions(): Promise<void> {
  try {
    console.log('📦 Loading pregenerated questions...');
    
    // Check if questions already loaded
    if (PREGENERATED_QUESTIONS !== null) {
      console.log('✅ Questions already loaded');
      return;
    }
    
    PREGENERATED_QUESTIONS = new Map();
    
    // Try to load from bundled files
    try {
      // Option 1: Load combined file (easier)
      const allQuestions = require('../scripts/pregenerated/questions_all.json') as PregeneratedEntry[];
      
      for (const entry of allQuestions) {
        // Store with both English and bilingual keys
        PREGENERATED_QUESTIONS.set(
          `${entry.hadithReference}_en`,
          entry.questions
        );
        PREGENERATED_QUESTIONS.set(
          `${entry.hadithReference}_bilingual`,
          entry.questions
        );
      }
      
      console.log(`✅ Loaded ${allQuestions.length} pregenerated hadiths`);
      console.log(`   ${PREGENERATED_QUESTIONS.size / 2} unique hadiths available`);
      
    } catch (error) {
      // Option 2: Load separate files (fallback)
      try {
        const bukhari = require('../scripts/pregenerated/questions_bukhari.json') as PregeneratedEntry[];
        const muslim = require('../scripts/pregenerated/questions_muslim.json') as PregeneratedEntry[];
        
        const combined = [...bukhari, ...muslim];
        
        for (const entry of combined) {
          PREGENERATED_QUESTIONS.set(
            `${entry.hadithReference}_en`,
            entry.questions
          );
          PREGENERATED_QUESTIONS.set(
            `${entry.hadithReference}_bilingual`,
            entry.questions
          );
        }
        
        console.log(`✅ Loaded ${combined.length} pregenerated hadiths`);
        
      } catch (innerError) {
        console.log('⚠️ No pregenerated questions found');
        console.log('   Run: npx ts-node scripts/pregenerateToFile.ts');
        PREGENERATED_QUESTIONS = new Map(); // Empty map
      }
    }
    
  } catch (error) {
    console.error('Error loading pregenerated questions:', error);
    PREGENERATED_QUESTIONS = new Map(); // Empty map on error
  }
}

/**
 * Get pregenerated questions for a hadith
 * Returns null if not found
 */
export function getPregeneratedQuestions(
  hadithReference: string,
  language: 'en' | 'bilingual' = 'bilingual'
): QuizQuestion[] | null {
  if (!PREGENERATED_QUESTIONS) {
    return null;
  }
  
  const key = `${hadithReference}_${language}`;
  const questions = PREGENERATED_QUESTIONS.get(key);
  
  if (questions) {
    console.log(`📦 Using pregenerated questions for: ${hadithReference}`);
  }
  
  return questions || null;
}

/**
 * Check if questions are pregenerated for a hadith
 */
export function hasPregeneratedQuestions(
  hadithReference: string,
  language: 'en' | 'bilingual' = 'bilingual'
): boolean {
  if (!PREGENERATED_QUESTIONS) {
    return false;
  }
  
  const key = `${hadithReference}_${language}`;
  return PREGENERATED_QUESTIONS.has(key);
}

/**
 * Get statistics about pregenerated questions
 */
export function getPregeneratedStats() {
  if (!PREGENERATED_QUESTIONS) {
    return {
      loaded: false,
      total: 0,
      bukhari: 0,
      muslim: 0,
    };
  }
  
  const total = PREGENERATED_QUESTIONS.size / 2; // Divided by 2 because we store en + bilingual
  
  let bukhari = 0;
  let muslim = 0;
  
  for (const key of PREGENERATED_QUESTIONS.keys()) {
    if (key.includes('Bukhari')) bukhari++;
    if (key.includes('Muslim')) muslim++;
  }
  
  return {
    loaded: true,
    total,
    bukhari: bukhari / 2,
    muslim: muslim / 2,
  };
}

