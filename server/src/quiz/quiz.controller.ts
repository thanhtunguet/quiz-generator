import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Query,
  BadRequestException,
} from "@nestjs/common";
import { QuizService } from "./quiz.service";
import { QuizResponse } from "../models/quiz-response.interface";
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from "@nestjs/swagger";
import { LlmProviderType } from "../models/llm-provider.type";

@ApiTags("Quiz")
@Controller("/api/quiz")
export class QuizController {
  constructor(private readonly quizService: QuizService) {}

  /**
   * Generate a quiz based on document content
   * @param body Request body containing document text and generation parameters
   * @returns Quiz response object
   */
  @Post("generate")
  @ApiOperation({ summary: "Generate a quiz from document text" })
  @ApiBody({
    schema: {
      type: "object",
      required: ["text"],
      properties: {
        documentText: {
          type: "string",
          description: "The text content of the document to generate quiz from",
        },
        numberOfQuestions: {
          type: "number",
          description: "Number of questions to generate (default: 5)",
          minimum: 1,
          maximum: 20,
        },
        difficulty: {
          type: "string",
          description: "Difficulty level (easy, medium, hard)",
          enum: ["easy", "medium", "hard"],
        },
        additionalInstructions: {
          type: "string",
          description: "Additional instructions for quiz generation",
        },
        provider: {
          type: "string",
          description: "AI provider to use (openai, anthropic, gemini)",
          enum: ["openai", "anthropic", "gemini"],
        },
        model: {
          type: "string",
          description: "Specific model to use with the provider",
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: "Quiz generated successfully" })
  @ApiResponse({ status: 400, description: "Invalid input parameters" })
  async generateQuiz(
    @Body()
    body: {
      documentText: string;
      numberOfQuestions?: number;
      difficulty?: string;
      additionalInstructions?: string;
      provider?: string;
      model?: string;
    }
  ): Promise<QuizResponse> {
    // Validate required fields
    if (!body.documentText?.trim()) {
      throw new BadRequestException("Document text is required");
    }

    // Validate and sanitize input
    const numberOfQuestions = body.numberOfQuestions
      ? Math.min(Math.max(1, body.numberOfQuestions), 20) // Limit between 1 and 20
      : 5;

    const difficulty = body.difficulty?.toLowerCase();
    if (difficulty && !["easy", "medium", "hard"].includes(difficulty)) {
      throw new BadRequestException(
        "Difficulty must be one of: easy, medium, hard"
      );
    }

    // Validate provider if specified
    if (
      body.provider &&
      !["openai", "anthropic", "gemini"].includes(body.provider)
    ) {
      throw new BadRequestException(
        "Provider must be one of: openai, anthropic, gemini"
      );
    }

    try {
      return await this.quizService.generateQuiz(
        body.documentText,
        numberOfQuestions,
        difficulty || "medium",
        body.additionalInstructions || "",
        body.provider as LlmProviderType,
        body.model
      );
    } catch (error) {
      console.error("Quiz generation error:", error);
      return {
        success: false,
        error:
          error instanceof BadRequestException
            ? error.message
            : `Quiz generation failed: ${error.message}`,
      };
    }
  }

  /**
   * Get details of a previously generated quiz
   * @param id Quiz ID
   * @returns Quiz response object
   */
  @Get(":id")
  @ApiOperation({ summary: "Get a previously generated quiz" })
  @ApiResponse({ status: 200, description: "Quiz retrieved successfully" })
  @ApiResponse({ status: 404, description: "Quiz not found" })
  async getQuiz(@Param("id") id: string): Promise<QuizResponse> {
    if (!id) {
      throw new BadRequestException("Quiz ID is required");
    }

    try {
      return await this.quizService.getQuiz(id);
    } catch (error) {
      console.error("Error retrieving quiz:", error);
      return {
        success: false,
        error: `Failed to retrieve quiz: ${error.message}`,
      };
    }
  }

  /**
   * Export quiz in different formats (JSON, HTML, text)
   * @param id Quiz ID
   * @param format Export format
   * @returns Formatted quiz content
   */
  @Get(":id/export")
  @ApiOperation({ summary: "Export quiz in different formats" })
  @ApiResponse({ status: 200, description: "Quiz exported successfully" })
  @ApiResponse({ status: 400, description: "Invalid format" })
  @ApiResponse({ status: 404, description: "Quiz not found" })
  async exportQuiz(
    @Param("id") id: string,
    @Query("format") format: string = "json"
  ): Promise<string> {
    if (!id) {
      throw new BadRequestException("Quiz ID is required");
    }

    const validFormats = ["json", "text", "html"];
    if (!validFormats.includes(format.toLowerCase())) {
      throw new BadRequestException(
        `Invalid format. Supported formats: ${validFormats.join(", ")}`
      );
    }

    try {
      return await this.quizService.exportQuiz(id, format.toLowerCase());
    } catch (error) {
      console.error("Error exporting quiz:", error);
      throw new BadRequestException(`Failed to export quiz: ${error.message}`);
    }
  }

  /**
   * Verify if AI service is available
   * @returns Status of AI service
   */
  @Get("status/ai")
  @ApiOperation({ summary: "Check AI service availability" })
  @ApiResponse({ status: 200, description: "AI status retrieved successfully" })
  async checkAiStatus(): Promise<{ available: boolean }> {
    try {
      const available = await this.quizService.isAiAvailable();
      return { available };
    } catch (error) {
      console.error("Error checking AI status:", error);
      return { available: false };
    }
  }
}
