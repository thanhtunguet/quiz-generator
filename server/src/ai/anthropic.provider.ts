import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  LlmProvider,
  LlmProviderType,
  LlmProviderOptions,
} from "./llm-provider.interface";
import Anthropic from "@anthropic-ai/sdk";

@Injectable()
export class AnthropicProvider implements LlmProvider {
  private anthropic: Anthropic;
  private isInitialized = false;
  private readonly defaultModel = "claude-3-sonnet-20240229";
  readonly providerType: LlmProviderType = LlmProviderType.ANTHROPIC;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>("ANTHROPIC_API_KEY");

    if (apiKey) {
      this.anthropic = new Anthropic({
        apiKey,
      });
      this.isInitialized = true;
    } else {
      console.warn(
        "Anthropic API key not found. Some features will be unavailable."
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
      throw new Error("Anthropic provider is not properly initialized");
    }

    // Truncate content if it's too long
    const truncatedContent =
      content.length > 20000
        ? content.substring(0, 20000) + "...(truncated)"
        : content;

    try {
      const systemPrompt = `You are an expert quiz creator who creates high-quality multiple-choice questions based on provided content.
You MUST return your response in valid JSON format with the following structure:
{
  "questions": [
    {
      "id": "1",
      "question": "What is...",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "Option A",  // MUST be exactly one of the options above
      "explanation": "This is correct because...",
      "difficulty": "medium"
    }
  ],
  "metadata": {
    "title": "Quiz Title",
    "description": "Quiz Description",
    "difficulty": "medium",
    "numberOfQuestions": 5
  }
}

CRITICAL REQUIREMENTS:
1. Each question MUST have EXACTLY 4 options (A, B, C, D)
2. The correctAnswer MUST BE EXACTLY ONE of the options provided in the options array
3. Keep the questions and answers in the SAME LANGUAGE as the source document text
4. Include a brief explanation for the correct answer in the same language as the question
5. Return ONLY the JSON object, no other text or explanation
6. Validate that each correctAnswer exactly matches one of its options before returning`;

      const userPrompt = `Generate ${numberOfQuestions} ${difficulty}-level multiple-choice questions based on the provided text content.

${additionalInstructions}

Content to generate quiz from:
${truncatedContent}`;

      const message = await this.anthropic.messages.create({
        model: options?.model || this.defaultModel,
        max_tokens: options?.maxTokens ?? 4000,
        temperature: options?.temperature ?? 0.7,
        system: systemPrompt,
        messages: [
          {
            role: "user",
            content: userPrompt,
          },
        ],
      });

      // Get the text content from the first content block
      const response =
        message.content[0].type === "text" ? message.content[0].text : "";

      if (!response) {
        throw new Error("Failed to get text response from Claude");
      }

      // Parse the JSON response
      const jsonResponse = JSON.parse(response);

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
      console.error("Anthropic API error:", error);
      throw new Error(`Failed to generate quiz: ${error.message}`);
    }
  }
}
