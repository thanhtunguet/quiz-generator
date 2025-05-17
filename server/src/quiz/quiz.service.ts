import { Injectable } from "@nestjs/common";
import { AiService } from "../ai/ai.service";
import { ResponseFormatterService } from "../formatters/response-formatter.service";
import { QuizQuestion } from "../models/quiz-question.interface";
import { QuizResponse } from "../models/quiz-response.interface";
import { UploadService } from "../upload/upload.service";
import * as crypto from "crypto";

@Injectable()
export class QuizService {
  private quizCache: Map<string, QuizQuestion[]> = new Map();

  constructor(
    private aiService: AiService,
    private uploadService: UploadService,
    private formatterService: ResponseFormatterService
  ) {}

  /**
   * Check if AI service is available
   * @returns Boolean indicating availability
   */
  async isAiAvailable(): Promise<boolean> {
    return this.aiService.isAvailable();
  }

  /**
   * Generate a quiz from document text
   * @param documentText The text content to generate quiz from
   * @param numberOfQuestions Number of questions to generate
   * @param difficulty Difficulty level for questions
   * @param additionalInstructions Additional instructions for the AI
   * @returns Quiz response
   */
  async generateQuiz(
    documentText: string,
    numberOfQuestions: number = 5,
    difficulty: string = "medium",
    additionalInstructions: string = ""
  ): Promise<QuizResponse> {
    try {
      if (!documentText?.trim()) {
        throw new Error("Document text is required");
      }

      // Generate quiz
      const questions = await this.aiService.generateQuiz(
        documentText,
        numberOfQuestions,
        difficulty,
        additionalInstructions
      );

      // Store quiz in cache with unique ID
      const quizId = crypto.randomUUID();
      this.quizCache.set(quizId, questions);

      return this.formatterService.formatQuizResponse(quizId, questions);
    } catch (error) {
      console.error("Quiz generation error:", error);
      return this.formatterService.formatQuizError(error);
    }
  }

  /**
   * Get a previously generated quiz
   * @param quizId Quiz ID
   * @returns Quiz response
   */
  async getQuiz(quizId: string): Promise<QuizResponse> {
    if (this.quizCache.has(quizId)) {
      const questions = this.quizCache.get(quizId);
      return this.formatterService.formatQuizResponse(quizId, questions);
    } else {
      return this.formatterService.formatQuizError(`Quiz not found: ${quizId}`);
    }
  }

  /**
   * Export quiz in specified format
   * @param quizId Quiz ID
   * @param format Export format ('json', 'text', 'html')
   * @returns Formatted quiz content
   */
  async exportQuiz(quizId: string, format: string = "json"): Promise<string> {
    if (!this.quizCache.has(quizId)) {
      throw new Error(`Quiz not found: ${quizId}`);
    }

    const questions = this.quizCache.get(quizId);
    return this.formatterService.formatForExport(
      format,
      questions,
      `Quiz ${quizId}`
    );
  }
}
