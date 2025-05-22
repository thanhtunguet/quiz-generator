export enum QuizDifficulty {
  EASY = "easy",
  MEDIUM = "medium",
  HARD = "hard",
}

export const QuizDifficultyLabels: Record<QuizDifficulty, string> = {
  [QuizDifficulty.EASY]: "Easy",
  [QuizDifficulty.MEDIUM]: "Medium",
  [QuizDifficulty.HARD]: "Hard",
};
