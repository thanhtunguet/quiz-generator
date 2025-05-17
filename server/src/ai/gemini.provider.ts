import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  LlmProvider,
  LlmProviderType,
  LlmProviderOptions,
} from "./llm-provider.interface";
import {
  GoogleGenerativeAI,
  GenerativeModel,
  HarmCategory,
  HarmBlockThreshold,
} from "@google/generative-ai";

@Injectable()
export class GeminiProvider implements LlmProvider {
  private genAI: GoogleGenerativeAI;
  private model: GenerativeModel;
  private isInitialized = false;
  readonly providerType: LlmProviderType = LlmProviderType.GEMINI;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>("GEMINI_API_KEY");

    if (apiKey) {
      this.genAI = new GoogleGenerativeAI(apiKey);
      this.model = this.genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
      });
      this.isInitialized = true;
    } else {
      console.warn(
        "Gemini API key not found. Some features will be unavailable."
      );
    }
  }

  async isAvailable(): Promise<boolean> {
    return this.isInitialized;
  }

  async generateQuiz(
    content: string,
    numberOfQuestions: number = 5,
    difficulty: string = "medium",
    additionalInstructions: string = "",
    options?: LlmProviderOptions
  ): Promise<any> {
    if (!this.isInitialized) {
      throw new Error("Gemini provider is not properly initialized");
    }

    // Update model if specified in options
    if (options?.model) {
      this.model = this.genAI.getGenerativeModel({
        model: options.model,
      });
    }

    // Truncate content if it's too long
    const truncatedContent =
      content.length > 20000
        ? content.substring(0, 20000) + "...(truncated)"
        : content;

    try {
      const prompt = `You are an expert quiz creator who creates high-quality multiple-choice questions based on provided content.
            
Generate ${numberOfQuestions} ${difficulty}-level multiple-choice questions based on the provided text content.

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
      "correctAnswer": "Option A",  // MUST be exactly one of the options above
      "explanation": "This is correct because...",
      "difficulty": "${difficulty}"
    }
  ],
  "metadata": {
    "title": "Quiz Title",
    "description": "Quiz Description",
    "difficulty": "${difficulty}",
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

      const result = await this.model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: options?.temperature ?? 0.7,
          maxOutputTokens: options?.maxTokens ?? 4000,
        },
      });

      const response = await result.response;
      const text = response
        .text()
        .trim()
        .replace(/^```json\n/, "")
        .replace(/\n```$/, "");

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
      console.error("Gemini API error:", error);
      throw new Error(`Failed to generate quiz: ${error.message}`);
    }
  }
}
