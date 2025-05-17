import { Injectable } from '@nestjs/common';
import { QuizResponse } from '../models/quiz-response.interface';
import { UploadResponse } from '../models/upload-response.interface';
import { QuizQuestion } from '../models/quiz-question.interface';

@Injectable()
export class ResponseFormatterService {
  /**
   * Format a successful quiz response
   * @param quizId ID of the quiz
   * @param questions Array of quiz questions
   * @returns Formatted quiz response
   */
  formatQuizResponse(quizId: string, questions: QuizQuestion[]): QuizResponse {
    return {
      success: true,
      quizId,
      questions,
    };
  }

  /**
   * Format an error response for quiz generation
   * @param error Error message or object
   * @returns Formatted error response
   */
  formatQuizError(error: string | Error): QuizResponse {
    const errorMessage = error instanceof Error ? error.message : error;
    return {
      success: false,
      error: errorMessage,
    };
  }

  /**
   * Format a successful upload response
   * @param id Document ID
   * @param filename Original filename
   * @param content Extracted text content
   * @returns Formatted upload response
   */
  formatUploadResponse(id: string, filename: string, content: string): UploadResponse {
    return {
      success: true,
      id,
      filename,
      content,
    };
  }

  /**
   * Format an error response for document upload
   * @param error Error message or object
   * @returns Formatted error response
   */
  formatUploadError(error: string | Error): UploadResponse {
    const errorMessage = error instanceof Error ? error.message : error;
    return {
      success: false,
      error: errorMessage,
    };
  }

  /**
   * Format quiz data for export formats
   * @param format Export format ('json', 'text', 'html')
   * @param questions Quiz questions
   * @param quizTitle Optional quiz title
   * @returns Formatted quiz content for export
   */
  formatForExport(format: string, questions: QuizQuestion[], quizTitle?: string): string {
    const title = quizTitle || 'Generated Quiz';
    
    switch (format.toLowerCase()) {
      case 'json':
        return JSON.stringify(questions, null, 2);
      
      case 'text':
        return this.formatAsText(title, questions);
      
      case 'html':
        return this.formatAsHTML(title, questions);
      
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  /**
   * Format quiz as plain text
   * @param title Quiz title
   * @param questions Array of quiz questions
   * @returns Text-formatted quiz
   */
  private formatAsText(title: string, questions: QuizQuestion[]): string {
    let output = `${title}\n\n`;
    
    questions.forEach((q, index) => {
      output += `Question ${index + 1}: ${q.question}\n`;
      q.options.forEach((option, optIndex) => {
        const optionLabel = String.fromCharCode(65 + optIndex); // A, B, C, D...
        output += `${optionLabel}) ${option}\n`;
      });
      output += `\nCorrect Answer: ${q.correctAnswer}\n`;
      output += `Explanation: ${q.explanation}\n\n`;
    });
    
    return output;
  }

  /**
   * Format quiz as HTML
   * @param title Quiz title
   * @param questions Array of quiz questions
   * @returns HTML-formatted quiz
   */
  private formatAsHTML(title: string, questions: QuizQuestion[]): string {
    let html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
    h1 { text-align: center; }
    .question { margin-bottom: 20px; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
    .options { margin-left: 20px; }
    .explanation { margin-top: 10px; padding: 10px; background-color: #f5f5f5; border-radius: 5px; }
    .correct { color: green; font-weight: bold; }
  </style>
</head>
<body>
  <h1>${title}</h1>
`;

    questions.forEach((q, index) => {
      html += `<div class="question">
    <h3>Question ${index + 1}: ${q.question}</h3>
    <div class="options">
`;

      q.options.forEach((option, optIndex) => {
        const optionLabel = String.fromCharCode(65 + optIndex); // A, B, C, D...
        const isCorrect = option === q.correctAnswer;
        html += `      <div${isCorrect ? ' class="correct"' : ''}>
        ${optionLabel}) ${option}${isCorrect ? ' ✓' : ''}
      </div>
`;
      });

      html += `    </div>
    <div class="explanation">
      <strong>Explanation:</strong> ${q.explanation}
    </div>
  </div>
`;
    });

    html += `</body>
</html>`;

    return html;
  }
}