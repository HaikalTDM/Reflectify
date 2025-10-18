/**
 * Utility for shuffling quiz question options
 * Ensures correct answer tracking after shuffle
 */

import { QuizQuestion } from './hadithQuestions';

/**
 * Shuffle array using Fisher-Yates algorithm
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Shuffle question options and update correct answer index
 */
export function shuffleQuestionOptions(question: QuizQuestion): QuizQuestion {
  // Don't shuffle if no options or only 2 options (True/False)
  if (!question.options || question.options.length <= 2) {
    return question;
  }

  const correctAnswerText = question.options[question.correctAnswer];
  const shuffledOptions = shuffleArray(question.options);
  const newCorrectIndex = shuffledOptions.indexOf(correctAnswerText);

  // Also shuffle bilingual options if they exist
  let shuffledMalayOptions: string[] | undefined;
  if (question.options_ms && question.options_ms.length > 2) {
    const correctMalayText = question.options_ms[question.correctAnswer];
    shuffledMalayOptions = shuffleArray(question.options_ms);
    
    // Ensure Malay options are shuffled in the same order as English
    // by finding correct Malay answer and rearranging
    const malayCorrectIndex = shuffledMalayOptions.indexOf(correctMalayText);
    if (malayCorrectIndex !== newCorrectIndex) {
      // Swap to match English shuffle order
      const temp = shuffledMalayOptions[newCorrectIndex];
      shuffledMalayOptions[newCorrectIndex] = shuffledMalayOptions[malayCorrectIndex];
      shuffledMalayOptions[malayCorrectIndex] = temp;
    }
  }

  return {
    ...question,
    options: shuffledOptions,
    options_ms: shuffledMalayOptions,
    correctAnswer: newCorrectIndex,
  };
}

/**
 * Shuffle all questions in an array
 */
export function shuffleAllQuestions(questions: QuizQuestion[]): QuizQuestion[] {
  return questions.map(q => shuffleQuestionOptions(q));
}

