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
import { MarkdownQuizParser } from "../utils/markdown-quiz-parser";

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

    // Handle difficulty distribution
    let distribution: { easy: number; medium: number; hard: number };
    let difficultyText = "mixed difficulty";
    let difficultyInstruction = "";
    
    if (typeof difficultyDistribution === 'string') {
      // Backward compatibility: convert single difficulty to 100% of that level
      difficultyText = difficultyDistribution;
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
      const prompt = `You are an expert quiz creator. Create ${numberOfQuestions} ${difficultyText}-level multiple-choice questions.

DIFFICULTY DISTRIBUTION:
${difficultyInstruction || `Create ${numberOfQuestions} ${difficultyText}-level questions.`}

DIFFICULTY DEFINITIONS:
- Easy: Basic recall, simple facts, definitions
- Medium: Application, analysis, understanding relationships  
- Hard: Synthesis, evaluation, complex analysis

FORMAT: Respond with ONLY a markdown table. No other text, explanations, or formatting.

Required table structure:
| Question | Option A | Option B | Option C | Option D | Correct Answer | Explanation | Difficulty |
|----------|----------|----------|----------|----------|----------------|-------------|------------|
| Your question here? | First option | Second option | Third option | Fourth option | First option | Brief explanation | easy |

REQUIREMENTS:
1. EXACTLY 4 options per question
2. Correct Answer must EXACTLY match one of the options (word-for-word)
3. Keep same language as source content
4. Brief explanations in same language
5. Difficulty must be: easy, medium, or hard
6. NO extra text outside the table
7. Start response with table header

${additionalInstructions ? `\nAdditional instructions: ${additionalInstructions}` : ''}

SOURCE CONTENT:
${truncatedContent}`;

      const result = await this.model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: options?.temperature ?? 0.7,
          maxOutputTokens: options?.maxTokens ?? 4000,
        },
      });

      const response = await result.response;
      let markdownText = response.text().trim();

      // Clean up markdown formatting issues
      markdownText = markdownText
        .replace(/^```markdown\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim();

      // Parse the markdown table
      try {
        const questions = MarkdownQuizParser.parseQuizTable(markdownText);
        
        if (questions.length === 0) {
          throw new Error("No valid questions found in the response");
        }
        
        console.log(`Gemini provider successfully parsed ${questions.length} questions`);
        return questions;
        
      } catch (parseError) {
        console.error("Gemini Markdown Parse Error:", parseError.message);
        console.error("Raw response text:", response.text());
        console.error("Cleaned markdown:", markdownText);
        throw new Error(`Failed to parse Gemini markdown response: ${parseError.message}`);
      }
    } catch (error) {
      console.error("Gemini API error:", error);
      throw new Error(`Failed to generate quiz: ${error.message}`);
    }
  }
}
