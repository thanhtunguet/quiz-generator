export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
  explanation?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  category?: string;
}