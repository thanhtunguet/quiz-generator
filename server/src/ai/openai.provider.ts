import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  LlmProvider,
  LlmProviderType,
  LlmProviderOptions,
} from "./llm-provider.interface";
import { OpenAI } from "openai";
import { QuizDifficulty } from "src/models/quiz-difficulty";

@Injectable()
export class OpenAIProvider implements LlmProvider {
  private openai: OpenAI;
  private isInitialized = false;
  readonly providerType: LlmProviderType = LlmProviderType.OPENAI;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>("OPENAI_API_KEY");

    if (apiKey) {
      this.openai = new OpenAI({
        apiKey,
        baseURL: this.configService.get<string>("OPENAI_BASE_URL"),
      });
      this.isInitialized = true;
    } else {
      console.warn(
        "OpenAI API key not found. Some features will be unavailable."
      );
    }
  }

  async isAvailable(): Promise<boolean> {
    return this.isInitialized;
  }

  async generateQuiz(
    content: string,
    numberOfQuestions: number = 10,
    difficultyDistribution?: { easy: number; medium: number; hard: number } | string,
    additionalInstructions: string = "",
    options?: LlmProviderOptions
  ): Promise<any> {
    if (!this.isInitialized) {
      throw new Error("OpenAI provider is not properly initialized");
    }

    // Truncate content if it's too long (OpenAI has token limits)
    const truncatedContent =
      content.length > 20000
        ? content.substring(0, 20000) + "...(truncated)"
        : content;

    // Handle difficulty distribution or convert single difficulty to distribution
    let distribution: { easy: number; medium: number; hard: number };
    if (typeof difficultyDistribution === 'string') {
      // Backward compatibility: convert single difficulty to 100% of that level
      distribution = {
        easy: difficultyDistribution === 'easy' ? 100 : 0,
        medium: difficultyDistribution === 'medium' ? 100 : 0,
        hard: difficultyDistribution === 'hard' ? 100 : 0,
      };
    } else if (difficultyDistribution) {
      distribution = difficultyDistribution;
    } else {
      // Default distribution
      distribution = { easy: 40, medium: 30, hard: 30 };
    }

    // Calculate approximate number of questions for each difficulty
    const easyCount = Math.round((numberOfQuestions * distribution.easy) / 100);
    const mediumCount = Math.round((numberOfQuestions * distribution.medium) / 100);
    const hardCount = numberOfQuestions - easyCount - mediumCount; // Ensure total adds up

    // Create difficulty instruction
    let difficultyInstruction = "";
    if (easyCount > 0 || mediumCount > 0 || hardCount > 0) {
      const parts = [];
      if (easyCount > 0) parts.push(`${easyCount} easy questions`);
      if (mediumCount > 0) parts.push(`${mediumCount} medium questions`);
      if (hardCount > 0) parts.push(`${hardCount} hard questions`);
      difficultyInstruction = `Create exactly ${parts.join(', ')}.`;
    } else {
      difficultyInstruction = `Create ${numberOfQuestions} medium-level questions.`;
    }

    try {
      const response = await this.openai.chat.completions.create({
        model: options?.model || "gpt-4-turbo-preview",
        messages: [
          {
            role: "system",
            content: `You are an expert quiz creator who creates high-quality multiple-choice questions based on provided content.
            
Generate ${numberOfQuestions} multiple-choice questions based on the provided text content.

DIFFICULTY DISTRIBUTION REQUIREMENTS:
${difficultyInstruction}

DIFFICULTY LEVEL DEFINITIONS:
- Easy: Basic recall, simple facts, definitions (straightforward questions about main concepts)
- Medium: Application, analysis, understanding relationships (questions requiring some interpretation)
- Hard: Synthesis, evaluation, complex analysis (questions requiring critical thinking and deep understanding)

CRITICAL REQUIREMENTS:
1. Each question must have EXACTLY 4 options (A, B, C, D)
2. The correctAnswer MUST BE EXACTLY ONE of the options provided in the options array
3. Keep the questions and answers in the SAME LANGUAGE as the source document text
4. Include a brief explanation for the correct answer in the same language as the question
5. STRICTLY FOLLOW the difficulty distribution specified above

Format Requirements:
- Return the quiz questions in valid JSON format with the following structure:
{
  "questions": [
    {
      "id": "1",
      "question": "What is...",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "Option A",
      "explanation": "This is correct because...",
      "difficulty": "easy|medium|hard"
    }
  ],
  "metadata": {
    "title": "Quiz Title",
    "description": "Quiz Description", 
    "difficultyDistribution": {
      "easy": ${distribution.easy},
      "medium": ${distribution.medium}, 
      "hard": ${distribution.hard}
    },
    "numberOfQuestions": ${numberOfQuestions}
  }
}

Validation Rules:
1. The correctAnswer MUST be an exact match of one of the options
2. Do not translate the content unless specifically requested
3. Maintain consistent language throughout each question (question, options, explanation)
4. Each option should be distinct and plausible

${additionalInstructions}

IMPORTANT: Double-check that each correctAnswer exactly matches one of its options before returning the response.`,
          },
          {
            role: "user",
            content: `Create a quiz based on this content. Maintain the original language of the text: \n\n${truncatedContent}`,
          },
        ],
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.maxTokens ?? 4000,
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "quiz",
            schema: {
              type: "object",
              properties: {
                questions: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      id: { type: "string" },
                      question: { type: "string" },
                      options: {
                        type: "array",
                        items: { type: "string" },
                        minItems: 4,
                        maxItems: 4,
                      },
                      correctAnswer: { type: "string" },
                      explanation: { type: "string" },
                      difficulty: { type: "string" },
                    },
                    required: [
                      "id",
                      "question",
                      "options",
                      "correctAnswer",
                      "explanation",
                      "difficulty",
                    ],
                  },
                },
                metadata: {
                  type: "object",
                  properties: {
                    title: { type: "string" },
                    description: { type: "string" },
                    difficultyDistribution: {
                      type: "object",
                      properties: {
                        easy: { type: "number" },
                        medium: { type: "number" },
                        hard: { type: "number" },
                      },
                      required: ["easy", "medium", "hard"],
                    },
                    numberOfQuestions: { type: "number" },
                  },
                  required: [
                    "title", 
                    "description",
                    "difficultyDistribution",
                    "numberOfQuestions",
                  ],
                },
              },
              required: ["questions", "metadata"],
            },
          },
        },
      });

      const jsonResponse = JSON.parse(response.choices[0].message.content);
      return jsonResponse.questions;
    } catch (error) {
      console.error("OpenAI API error:", error);
      throw new Error(`Failed to generate quiz: ${error.message}`);
    }
  }
}
