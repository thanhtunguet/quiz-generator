export enum LlmProviderType {
  OPENAI = "openai",
  ANTHROPIC = "anthropic",
  GEMINI = "gemini",
  DEEPSEEK = "deepseek",
  GROK = "grok",
}

export interface LlmProviderOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface LlmProvider {
  /**
   * Get the type of LLM provider
   */
  readonly providerType: LlmProviderType;

  /**
   * Generate quiz questions from the provided text content
   * @param content The text content to base the quiz on
   * @param numberOfQuestions Number of questions to generate
   * @param difficultyDistribution Difficulty distribution for the questions or single difficulty for backward compatibility
   * @param additionalInstructions Optional additional instructions for quiz generation
   * @param options Optional provider-specific options
   * @returns Promise resolving to an array of quiz questions in JSON format
   */
  generateQuiz(
    content: string,
    numberOfQuestions: number,
    difficultyDistribution?: { easy: number; medium: number; hard: number } | string,
    additionalInstructions?: string,
    options?: LlmProviderOptions
  ): Promise<any>;

  /**
   * Check if the provider is properly configured and available
   * @returns Promise resolving to a boolean indicating availability
   */
  isAvailable(): Promise<boolean>;
}
