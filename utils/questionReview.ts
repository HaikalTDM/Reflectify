/**
 * Question Review and Quality Control System
 * Allows manual review and correction of AI-generated questions
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { QuizQuestion } from './hadithQuestions';

const REVIEW_KEY = 'questionReviews';
const REPORTED_KEY = 'reportedQuestions';

export interface QuestionReview {
  hadithReference: string;
  questionId: string;
  isCorrect: boolean;
  userFeedback?: string;
  timestamp: string;
}

export interface ReportedQuestion {
  hadithReference: string;
  questionId: string;
  question: string;
  reportedAnswer: number;
  correctAnswer: number;
  userSuggestion?: string;
  timestamp: string;
}

/**
 * Report an incorrect question/answer
 */
export async function reportIncorrectQuestion(
  hadithReference: string,
  questionId: string,
  question: string,
  reportedAnswer: number,
  correctAnswer: number,
  userSuggestion?: string
): Promise<void> {
  try {
    const reportsString = await AsyncStorage.getItem(REPORTED_KEY);
    const reports: ReportedQuestion[] = reportsString ? JSON.parse(reportsString) : [];

    const newReport: ReportedQuestion = {
      hadithReference,
      questionId,
      question,
      reportedAnswer,
      correctAnswer,
      userSuggestion,
      timestamp: new Date().toISOString(),
    };

    reports.push(newReport);
    await AsyncStorage.setItem(REPORTED_KEY, JSON.stringify(reports));

    console.log('📝 Question reported for review:', hadithReference, questionId);
  } catch (error) {
    console.error('Error reporting question:', error);
  }
}

/**
 * Get all reported questions
 */
export async function getReportedQuestions(): Promise<ReportedQuestion[]> {
  try {
    const reportsString = await AsyncStorage.getItem(REPORTED_KEY);
    return reportsString ? JSON.parse(reportsString) : [];
  } catch (error) {
    console.error('Error getting reported questions:', error);
    return [];
  }
}

/**
 * Clear reported questions (after admin review)
 */
export async function clearReportedQuestions(): Promise<void> {
  try {
    await AsyncStorage.removeItem(REPORTED_KEY);
    console.log('✅ Reported questions cleared');
  } catch (error) {
    console.error('Error clearing reported questions:', error);
  }
}

/**
 * Export reported questions for review (as JSON string for copying)
 */
export async function exportReportedQuestions(): Promise<string> {
  const reports = await getReportedQuestions();
  return JSON.stringify(reports, null, 2);
}

/**
 * Manual question corrections (override AI-generated answers)
 * These take highest priority
 */
export const MANUAL_CORRECTIONS: Record<string, {
  hadithReference: string;
  corrections: Array<{
    questionIndex: number;
    correctAnswer: number;
    explanation?: string;
  }>;
}> = {
  // Example format - add corrections here as you find them:
  // 'Sahih al-Bukhari, 1': {
  //   hadithReference: 'Sahih al-Bukhari, 1',
  //   corrections: [
  //     {
  //       questionIndex: 0,
  //       correctAnswer: 2, // The correct answer index
  //       explanation: 'Corrected explanation here'
  //     }
  //   ]
  // },
};

/**
 * Apply manual corrections to questions
 */
export function applyCorrections(
  hadithReference: string,
  questions: QuizQuestion[]
): QuizQuestion[] {
  const corrections = MANUAL_CORRECTIONS[hadithReference];
  
  if (!corrections) {
    return questions;
  }

  const correctedQuestions = [...questions];
  
  corrections.corrections.forEach(correction => {
    if (correction.questionIndex < correctedQuestions.length) {
      correctedQuestions[correction.questionIndex] = {
        ...correctedQuestions[correction.questionIndex],
        correctAnswer: correction.correctAnswer,
        explanation: correction.explanation || correctedQuestions[correction.questionIndex].explanation,
      };
      
      console.log(`✅ Applied manual correction for ${hadithReference} Q${correction.questionIndex + 1}`);
    }
  });

  return correctedQuestions;
}

/**
 * Validation rules for questions
 */
export function validateQuestion(question: QuizQuestion): {
  isValid: boolean;
  issues: string[];
} {
  const issues: string[] = [];

  // Check if question text exists
  if (!question.question || question.question.trim().length === 0) {
    issues.push('Question text is empty');
  }

  // Check if options exist for multiple choice/true-false
  if ((question.type === 'multiple-choice' || question.type === 'true-false') && !question.options) {
    issues.push('Options missing for choice-based question');
  }

  // Check if correct answer is valid
  if (question.options && typeof question.correctAnswer === 'number') {
    if (question.correctAnswer < 0 || question.correctAnswer >= question.options.length) {
      issues.push(`Correct answer index ${question.correctAnswer} is out of range (0-${question.options.length - 1})`);
    }
  }

  // Check if explanation exists
  if (!question.explanation || question.explanation.trim().length === 0) {
    issues.push('Explanation is empty');
  }

  return {
    isValid: issues.length === 0,
    issues,
  };
}

/**
 * Validate all questions in a quiz
 */
export function validateQuiz(questions: QuizQuestion[]): {
  isValid: boolean;
  questionIssues: Array<{ index: number; issues: string[] }>;
} {
  const questionIssues: Array<{ index: number; issues: string[] }> = [];

  questions.forEach((question, index) => {
    const validation = validateQuestion(question);
    if (!validation.isValid) {
      questionIssues.push({
        index,
        issues: validation.issues,
      });
    }
  });

  return {
    isValid: questionIssues.length === 0,
    questionIssues,
  };
}

