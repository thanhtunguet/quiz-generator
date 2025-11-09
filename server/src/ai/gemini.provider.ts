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
import { QuizDifficulty } from "src/models/quiz-difficulty";

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
    numberOfQuestions: number = 10,
    difficultyDistribution?: { easy: number; medium: number; hard: number } | string,
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

FORMAT REQUIREMENTS:
You MUST respond with ONLY valid JSON. NO markdown, NO code blocks, NO comments.

Exact JSON structure:
{
  "questions": [
    {
      "id": "1",
      "question": "Your question here?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "Option A",
      "explanation": "Brief explanation here",
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

VALIDATION RULES:
1. correctAnswer MUST exactly match one of the options (case sensitive)
2. Use same language as source content
3. NO trailing commas in JSON
4. All strings must be properly escaped
5. Start your response with { and end with }

${additionalInstructions ? `Additional instructions: ${additionalInstructions}` : ''}

SOURCE CONTENT:
${truncatedContent}

RESPOND WITH ONLY THE JSON OBJECT (no other text):`;

      const result = await this.model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: options?.temperature ?? 0.7,
          maxOutputTokens: options?.maxTokens ?? 4000,
        },
      });

      const response = await result.response;
      let text = response.text().trim();

      // Clean up common formatting issues
      text = text
        .replace(/^```json\s*/i, "")
        .replace(/\s*```$/i, "")
        .replace(/^```\s*/i, "")
        .replace(/^\s*json\s*/i, "")
        .trim();

      // Find JSON object boundaries
      const firstBrace = text.indexOf('{');
      const lastBrace = text.lastIndexOf('}');
      
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        text = text.substring(firstBrace, lastBrace + 1);
      }

      // Remove comments that might cause parsing issues
      text = text.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');

      let jsonResponse;
      try {
        jsonResponse = JSON.parse(text);
      } catch (parseError) {
        console.error("Gemini JSON Parse Error:", parseError.message);
        console.error("Raw response text:", response.text());
        console.error("Cleaned text:", text);
        throw new Error(`Failed to parse Gemini response as JSON: ${parseError.message}`);
      }

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
