export interface LlmProvider {
  /**
   * Generate quiz questions from the provided text content
   * @param content The text content to base the quiz on
   * @param numberOfQuestions Number of questions to generate
   * @param difficulty Difficulty level of the questions
   * @returns Promise resolving to an array of quiz questions in JSON format
   */
  generateQuiz(
    content: string,
    numberOfQuestions: number,
    difficulty?: string,
    additionalInstructions?: string,
  ): Promise<any>;

  /**
   * Check if the provider is properly configured and available
   * @returns Promise resolving to a boolean indicating availability
   */
  isAvailable(): Promise<boolean>;
}