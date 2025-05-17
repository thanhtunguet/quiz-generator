import { QuizQuestion } from './quiz-question.interface';

export interface QuizResponse {
  success: boolean;
  quizId?: string;
  questions?: QuizQuestion[];
  error?: string;
}