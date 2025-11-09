import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  LlmProvider,
  LlmProviderType,
  LlmProviderOptions,
} from "./llm-provider.interface";
import { QuizQuestion } from "../models/quiz-question.interface";
import axios from "axios";
import { QuizDifficulty } from "src/models/quiz-difficulty";

@Injectable()
export class DeepseekProvider implements LlmProvider {
  private readonly apiKey: string;

  private readonly apiUrl: string =
    "https://api.deepseek.com/v1/chat/completions";

  private readonly defaultModel: string = "deepseek-chat";

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>("DEEPSEEK_API_KEY");
    if (!this.apiKey) {
      console.warn(
        "DeepSeek API key not found. DeepSeek provider will be disabled."
      );
    }
  }

  get providerType(): LlmProviderType {
    return LlmProviderType.DEEPSEEK;
  }

  async isAvailable(): Promise<boolean> {
    return !!this.apiKey;
  }

  async generateQuiz(
    content: string,
    numberOfQuestions: number = 10,
    difficultyDistribution?: { easy: number; medium: number; hard: number } | string,
    additionalInstructions: string = "",
    options?: LlmProviderOptions
  ): Promise<QuizQuestion[]> {
    if (!this.apiKey) {
      throw new Error("DeepSeek API key not configured");
    }

    // Truncate content if too long (DeepSeek has a context window limit)
    const maxContentLength = 12000; // Adjust based on model's context window
    const truncatedContent =
      content.length > maxContentLength
        ? content.substring(0, maxContentLength) + "..."
        : content;

    const model = options?.model || this.defaultModel;
    
    // Handle difficulty distribution (simplified for now)
    let difficultyText = "mixed difficulty";
    if (typeof difficultyDistribution === 'string') {
      difficultyText = difficultyDistribution;
    }

    const prompt = `You are an expert quiz creator who creates high-quality multiple-choice questions based on provided content.
            
Generate ${numberOfQuestions} ${difficultyText}-level multiple-choice questions based on the provided text content.

CRITICAL REQUIREMENTS:
1. Each question must have EXACTLY 4 options (A, B, C, D)
2. The correctAnswer MUST BE EXACTLY ONE of the options provided in the options array
3. Keep the questions and answers in the SAME LANGUAGE as the source document text
4. Include a brief explanation for the correct answer in the same language as the question
5. Return ONLY a clean JSON string without any markdown formatting or code blocks

Format Requirements:
Return a valid JSON string with the following structure (DO NOT use markdown code blocks):
{
  "questions": [
    {
      "id": "1",
      "question": "What is...",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "Option A",
      "explanation": "This is correct because...",
      "difficulty": "${difficultyText}"
    }
  ],
  "metadata": {
    "title": "Quiz Title",
    "description": "Quiz Description",
    "difficulty": "${difficultyText}",
    "numberOfQuestions": ${numberOfQuestions}
  }
}

Validation Rules:
1. The correctAnswer MUST be an exact match of one of the options
2. Do not translate the content unless specifically requested
3. Maintain consistent language throughout each question (question, options, explanation)
4. Each option should be distinct and plausible
5. Return ONLY the raw JSON string, no markdown formatting or code blocks

${additionalInstructions}

IMPORTANT: 
1. Double-check that each correctAnswer exactly matches one of its options before returning the response
2. Return ONLY the raw JSON string without any markdown formatting or code blocks

Content to generate quiz from:
${truncatedContent}`;

    try {
      const response = await axios.post(
        this.apiUrl,
        {
          model: model,
          messages: [
            {
              role: "system",
              content:
                "You are a quiz generation assistant that returns only valid JSON.",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          temperature: 0.7,
          max_tokens: 2000,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.apiKey}`,
          },
        }
      );

      const responseContent = response.data.choices[0].message.content;
      const parsedResponse = JSON.parse(responseContent);
      return parsedResponse.questions;
    } catch (error) {
      console.error(
        "DeepSeek API error:",
        error.response?.data || error.message
      );
      throw new Error(
        `Failed to generate quiz with DeepSeek: ${
          error.response?.data?.error?.message || error.message
        }`
      );
    }
  }
}
