import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LlmProvider } from './llm-provider.interface';
import { OpenAI } from 'openai';

@Injectable()
export class OpenAIProvider implements LlmProvider {
  private openai: OpenAI;
  private isInitialized = false;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    
    if (apiKey) {
      this.openai = new OpenAI({
        apiKey,
        baseURL: this.configService.get<string>('LM_STUDIO_BASE_URL'),
      });
      this.isInitialized = true;
    } else {
      console.warn('OpenAI API key not found. Some features will be unavailable.');
    }
  }

  async isAvailable(): Promise<boolean> {
    return this.isInitialized;
  }

  async generateQuiz(
    content: string,
    numberOfQuestions: number = 5,
    difficulty: string = 'medium',
    additionalInstructions: string = '',
  ): Promise<any> {
    if (!this.isInitialized) {
      throw new Error('OpenAI provider is not properly initialized');
    }

    // Truncate content if it's too long (OpenAI has token limits)
    const truncatedContent = content.length > 20000 
      ? content.substring(0, 20000) + '...(truncated)'
      : content;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'qwen3-8b', // Using GPT-4 for better quiz generation
        messages: [
          {
            role: 'system',
            content: `You are an expert quiz creator who creates high-quality multiple-choice questions based on provided content.
            
Generate ${numberOfQuestions} ${difficulty}-level multiple-choice questions based on the provided text content.

Follow these requirements:
1. Each question must have 4 options (A, B, C, D)
2. Only ONE option should be correct
3. Include a brief explanation for the correct answer
4. Return the quiz questions in valid JSON format with the following structure:
[
  {
    "id": "1",
    "question": "What is...",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": "Option A",
    "explanation": "This is correct because...",
    "difficulty": "${difficulty}"
  }
]

${additionalInstructions}`,
          },
          {
            role: 'user',
            content: `Create a quiz based on this content: \n\n${truncatedContent}`,
          },
        ],
        temperature: 0.7,
        max_tokens: 4000,
        response_format: { type: 'json_schema', json_schema: {
          name: 'quiz',
          schema: {
            type: 'object',
            properties: {
              questions: { type: 'array' },
              metadata: { type: 'object', properties: {
                title: { type: 'string' },
                description: { type: 'string' },
                difficulty: { type: 'string' },
                numberOfQuestions: { type: 'number' },
                
              } 
            },
            },
          },
        } },
      });

      const jsonResponse = JSON.parse(response.choices[0].message.content);
      
      // Ensure we have expected "questions" array in the response
      const questions = jsonResponse.questions || jsonResponse;
      
      return Array.isArray(questions) ? questions : [];
    } catch (error) {
      console.error('OpenAI API error:', error);
      throw new Error(`Failed to generate quiz: ${error.message}`);
    }
  }
}