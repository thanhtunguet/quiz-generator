import { Injectable, Inject } from "@nestjs/common";
import { LlmProviderFactory } from "./llm-provider.factory";
import { LlmProviderType } from "./llm-provider.interface";
import { QuizQuestion } from "../models/quiz-question.interface";
import { LlmProviderOptions } from "./llm-provider.interface";

@Injectable()
export class AiService {
  constructor(private readonly providerFactory: LlmProviderFactory) {}

  /**
   * Check if the AI service is properly configured and available
   * @returns Promise resolving to boolean indicating availability
   */
  async isAvailable(): Promise<boolean> {
    const provider = await this.providerFactory.getFirstAvailableProvider();
    return provider ? await provider.isAvailable() : false;
  }

  /**
   * Generate a quiz based on the provided content
   * @param content Document content to base the quiz on
   * @param numberOfQuestions Number of questions to generate
   * @param difficulty Difficulty level for the questions
   * @param additionalInstructions Additional instructions for the AI
   * @param providerType Optional provider type to use
   * @param options Optional provider-specific options
   * @returns Array of QuizQuestion objects
   */
  async generateQuiz(
    content: string,
    numberOfQuestions: number = 5,
    difficulty: string = "medium",
    additionalInstructions: string = "",
    providerType?: LlmProviderType,
    options?: LlmProviderOptions
  ): Promise<QuizQuestion[]> {
    // Get the specified provider or fall back to the first available one
    const provider = providerType
      ? this.providerFactory.getProvider(providerType)
      : await this.providerFactory.getFirstAvailableProvider();

    if (!provider) {
      throw new Error("No LLM provider is available");
    }

    if (!(await provider.isAvailable())) {
      throw new Error(`LLM provider ${provider.providerType} is not available`);
    }

    const questions = await provider.generateQuiz(
      content,
      numberOfQuestions,
      difficulty,
      additionalInstructions,
      options
    );

    return this.processAndValidateQuestions(questions);
  }

  /**
   * Process and validate quiz questions from the AI
   * @param rawQuestions Raw questions from the AI
   * @returns Validated and processed QuizQuestion array
   */
  private processAndValidateQuestions(rawQuestions: any[]): QuizQuestion[] {
    if (!Array.isArray(rawQuestions)) {
      throw new Error("Invalid response format: questions must be an array");
    }

    return rawQuestions.map((q, index) => {
      // Validate required fields
      if (!q.question || !Array.isArray(q.options) || !q.correctAnswer) {
        throw new Error(`Question ${index + 1} is missing required fields`);
      }

      // Ensure options is an array
      if (!Array.isArray(q.options)) {
        throw new Error(`Question ${index + 1} options must be an array`);
      }

      // Validate that correct answer is among options
      if (!q.options.includes(q.correctAnswer)) {
        throw new Error(
          `Question ${index + 1} correct answer is not among the options`
        );
      }

      return {
        id: (index + 1).toString(),
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation || "",
        difficulty: q.difficulty || "medium",
        category: q.category || "general",
      };
    });
  }
}
