import type { QuizDifficulty } from "./quiz-difficulty";

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
  explanation?: string;
  difficulty?: QuizDifficulty;
  category?: string;
}
