import { QuizQuestion } from '../models/quiz-question.interface';
import { QuizDifficulty } from '../models/quiz-difficulty';

interface ParsedTableRow {
  [key: string]: string;
}

/**
 * Utility class for parsing quiz questions from markdown tables
 */
export class MarkdownQuizParser {
  /**
   * Parse quiz questions from markdown table format
   * Expected format:
   * | Question | Option A | Option B | Option C | Option D | Correct Answer | Explanation | Difficulty |
   * |----------|----------|----------|----------|----------|----------------|-------------|------------|
   * | What is...? | Answer A | Answer B | Answer C | Answer D | Answer A | Because... | easy |
   * 
   * @param markdownText The markdown text containing the quiz table
   * @returns Array of QuizQuestion objects
   */
  static parseQuizTable(markdownText: string): QuizQuestion[] {
    try {
      // Clean up the markdown text
      const cleanText = markdownText.trim();
      
      // Find table content
      const lines = cleanText.split('\n');
      const tableLines: string[] = [];
      let inTable = false;
      
      for (const line of lines) {
        const trimmedLine = line.trim();
        if (trimmedLine.startsWith('|') && trimmedLine.endsWith('|')) {
          inTable = true;
          tableLines.push(trimmedLine);
        } else if (inTable && trimmedLine === '') {
          break; // End of table
        }
      }
      
      if (tableLines.length < 3) { // Header + separator + at least one data row
        throw new Error('Invalid table format: need at least header, separator, and one data row');
      }
      
      // Parse header row
      const headerLine = tableLines[0];
      const headers = this.parseTableRow(headerLine);
      
      // Validate expected headers
      const expectedHeaders = ['question', 'option a', 'option b', 'option c', 'option d', 'correct answer', 'explanation', 'difficulty'];
      const normalizedHeaders = headers.map(h => h.toLowerCase().trim());
      
      const headerMap: { [key: string]: number } = {};
      expectedHeaders.forEach(expectedHeader => {
        const index = normalizedHeaders.findIndex(h => h.includes(expectedHeader) || expectedHeader.includes(h));
        if (index !== -1) {
          headerMap[expectedHeader] = index;
        }
      });
      
      // Skip separator row (index 1) and parse data rows
      const questions: QuizQuestion[] = [];
      
      for (let i = 2; i < tableLines.length; i++) {
        const dataRow = this.parseTableRow(tableLines[i]);
        
        if (dataRow.length < 6) continue; // Skip incomplete rows
        
        try {
          const question: QuizQuestion = {
            id: (i - 1).toString(),
            question: this.getColumnValue(dataRow, headerMap, 'question'),
            options: [
              this.getColumnValue(dataRow, headerMap, 'option a'),
              this.getColumnValue(dataRow, headerMap, 'option b'), 
              this.getColumnValue(dataRow, headerMap, 'option c'),
              this.getColumnValue(dataRow, headerMap, 'option d')
            ],
            correctAnswer: this.getColumnValue(dataRow, headerMap, 'correct answer'),
            explanation: this.getColumnValue(dataRow, headerMap, 'explanation') || '',
            difficulty: this.normalizeDifficulty(this.getColumnValue(dataRow, headerMap, 'difficulty')),
            category: 'general'
          };
          
          // Validate that correct answer is among options
          if (!question.options.includes(question.correctAnswer)) {
            console.warn(`Question ${question.id}: Correct answer "${question.correctAnswer}" not found in options. Attempting to match...`);
            
            // Try to find a close match
            const match = question.options.find(option => 
              option.toLowerCase().trim() === question.correctAnswer.toLowerCase().trim()
            );
            
            if (match) {
              question.correctAnswer = match;
            } else {
              console.error(`Question ${question.id}: Could not match correct answer to any option`);
              continue; // Skip this question
            }
          }
          
          questions.push(question);
        } catch (error) {
          console.error(`Error parsing question row ${i}:`, error.message);
          continue; // Skip this row and continue
        }
      }
      
      return questions;
    } catch (error) {
      console.error('Error parsing markdown quiz table:', error.message);
      throw new Error(`Failed to parse quiz table: ${error.message}`);
    }
  }
  
  /**
   * Parse a table row into array of cell values
   */
  private static parseTableRow(line: string): string[] {
    return line
      .split('|')
      .slice(1, -1) // Remove empty elements from start and end
      .map(cell => cell.trim());
  }
  
  /**
   * Get column value using header mapping
   */
  private static getColumnValue(row: string[], headerMap: { [key: string]: number }, columnKey: string): string {
    const index = headerMap[columnKey];
    if (index === undefined || index >= row.length) {
      throw new Error(`Column "${columnKey}" not found in table`);
    }
    return row[index].trim();
  }
  
  /**
   * Normalize difficulty to enum values
   */
  private static normalizeDifficulty(difficulty: string): QuizDifficulty {
    const normalized = difficulty.toLowerCase().trim();
    switch (normalized) {
      case 'easy':
      case 'beginner':
      case 'basic':
        return QuizDifficulty.EASY;
      case 'medium':
      case 'intermediate':
      case 'moderate':
        return QuizDifficulty.MEDIUM;
      case 'hard':
      case 'advanced':
      case 'difficult':
        return QuizDifficulty.HARD;
      default:
        console.warn(`Unknown difficulty "${difficulty}", defaulting to medium`);
        return QuizDifficulty.MEDIUM;
    }
  }
}