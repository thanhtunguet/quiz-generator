import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  LlmProvider,
  LlmProviderType,
  LlmProviderOptions,
} from "./llm-provider.interface";

@Injectable()
export class GrokProvider implements LlmProvider {
  private isInitialized = false;
  readonly providerType: LlmProviderType = LlmProviderType.GROK;
  private apiKey: string;
  private baseUrl: string;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>("GROK_API_KEY");
    const baseUrl = this.configService.get<string>("GROK_BASE_URL");

    if (apiKey) {
      this.apiKey = apiKey;
      this.baseUrl = baseUrl || "https://api.grok.ai/v1"; // Default base URL if not provided
      this.isInitialized = true;
    } else {
      console.warn(
        "Grok API key not found. Some features will be unavailable."
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
      throw new Error("Grok provider is not properly initialized");
    }

    // Truncate content if it's too long
    const truncatedContent =
      content.length > 20000
        ? content.substring(0, 20000) + "...(truncated)"
        : content;

    // Handle difficulty distribution (simplified for now)
    let difficultyText = "mixed difficulty";
    if (typeof difficultyDistribution === 'string') {
      difficultyText = difficultyDistribution;
    }

    try {
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

      // Make API call to Grok
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: options?.model || "grok-1",
          messages: [{ role: "user", content: prompt }],
          temperature: options?.temperature ?? 0.7,
          max_tokens: options?.maxTokens ?? 4000,
          response_format: { type: "json_object" },
        }),
      });

      if (!response.ok) {
        throw new Error(`Grok API error: ${response.statusText}`);
      }

      const data = await response.json();
      const text = data.choices[0].message.content.trim();

      // Parse the JSON response
      const jsonResponse = JSON.parse(text);

      // Validate the response structure
      if (!jsonResponse.questions || !Array.isArray(jsonResponse.questions)) {
        throw new Error(
          "Invalid response format: missing or invalid questions array"
        );
      }

      if (!jsonResponse.metadata || typeof jsonResponse.metadata !== "object") {
        throw new Error("Invalid response format: missing or invalid metadata");
      }

      // Validate each question
      jsonResponse.questions.forEach((q: any, index: number) => {
        if (!q.question || !Array.isArray(q.options) || !q.correctAnswer) {
          throw new Error(`Question ${index + 1} is missing required fields`);
        }
        if (q.options.length !== 4) {
          throw new Error(`Question ${index + 1} must have exactly 4 options`);
        }
        if (!q.options.includes(q.correctAnswer)) {
          throw new Error(
            `Question ${index + 1} correct answer is not among the options`
          );
        }
      });

      return jsonResponse.questions;
    } catch (error) {
      console.error("Grok API error:", error);
      throw new Error(`Failed to generate quiz: ${error.message}`);
    }
  }
} 