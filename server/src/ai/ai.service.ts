import { Inject, Injectable } from '@nestjs/common';
import { LlmProvider } from './llm-provider.interface';
import { QuizQuestion } from '../models/quiz-question.interface';

@Injectable()
export class AiService {
  constructor(
    @Inject('LLM_PROVIDER') private llmProvider: LlmProvider,
  ) {}

  /**
   * Check if the AI service is properly configured and available
   * @returns Promise resolving to boolean indicating availability
   */
  async isAvailable(): Promise<boolean> {
    return await this.llmProvider.isAvailable();
  }

  /**
   * Generate a quiz based on the provided content
   * @param content Document content to base the quiz on
   * @param numberOfQuestions Number of questions to generate
   * @param difficulty Difficulty level for the questions
   * @param additionalInstructions Additional instructions for the AI
   * @returns Array of QuizQuestion objects
   */
  async generateQuiz(
    content: string,
    numberOfQuestions: number = 5,
    difficulty: string = 'medium',
    additionalInstructions: string = '',
  ): Promise<QuizQuestion[]> {
    try {
      // Check content length and give appropriate error if empty
      if (!content || content.trim().length === 0) {
        throw new Error('Cannot generate quiz from empty content');
      }

      // Generate raw questions from LLM provider
      const rawQuestions = await this.llmProvider.generateQuiz(
        content,
        numberOfQuestions,
        difficulty,
        additionalInstructions,
      );

      // Transform and validate the questions
      const questions: QuizQuestion[] = this.processAndValidateQuestions(rawQuestions);

      return questions;
    } catch (error) {
      console.error('Quiz generation error:', error);
      throw new Error(`Failed to generate quiz: ${error.message}`);
    }
  }

  /**
   * Process and validate quiz questions from the AI
   * @param rawQuestions Raw questions from the AI
   * @returns Validated and processed QuizQuestion array
   */
  private processAndValidateQuestions(rawQuestions: any[]): QuizQuestion[] {
    if (!Array.isArray(rawQuestions)) {
      throw new Error('Expected an array of questions from AI');
    }

    return rawQuestions.map((q, index) => {
      // Ensure all required fields exist
      if (!q.question || !q.options || !q.correctAnswer) {
        throw new Error(`Question ${index + 1} is missing required fields`);
      }

      // Ensure options is an array
      if (!Array.isArray(q.options)) {
        throw new Error(`Options for question ${index + 1} should be an array`);
      }

      // Ensure the correct answer is one of the options
      if (!q.options.includes(q.correctAnswer)) {
        throw new Error(`Correct answer for question ${index + 1} is not among the options`);
      }

      return {
        id: q.id || `q${index + 1}`,
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation || 'No explanation provided.',
        difficulty: q.difficulty || 'medium',
        category: q.category || 'general',
      };
    });
  }
}