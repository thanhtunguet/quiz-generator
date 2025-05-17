import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as mammoth from 'mammoth';
import * as pdfParse from 'pdf-parse';

@Injectable()
export class DocumentParserService {
  /**
   * Extract text content from a document file
   * @param filePath Path to the file
   * @returns Extracted text content
   */
  async parseDocumentFromPath(filePath: string): Promise<string> {
    try {
      if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
      }

      const fileExtension = path.extname(filePath).toLowerCase();
      return await this.extractTextByExtension(filePath, fileExtension);
    } catch (error) {
      console.error('Document parsing error:', error);
      throw new Error(`Failed to parse document: ${error.message}`);
    }
  }

  /**
   * Extract text content from a file buffer
   * @param buffer File buffer
   * @param fileExtension File extension (e.g., '.pdf', '.docx')
   * @returns Extracted text content
   */
  async parseDocumentFromBuffer(buffer: Buffer, fileExtension: string): Promise<string> {
    try {
      return await this.extractTextFromBuffer(buffer, fileExtension);
    } catch (error) {
      console.error('Document parsing error:', error);
      throw new Error(`Failed to parse document buffer: ${error.message}`);
    }
  }

  /**
   * Extract text from a file based on its extension
   * @param filePath Path to the file
   * @param fileExtension File extension
   * @returns Extracted text
   */
  private async extractTextByExtension(filePath: string, fileExtension: string): Promise<string> {
    switch (fileExtension) {
      case '.pdf':
        return await this.extractPdfText(filePath);
      case '.docx':
      case '.doc':
        return await this.extractWordText(filePath);
      case '.txt':
      case '.md':
        return this.extractPlainText(filePath);
      default:
        throw new Error(`Unsupported file type: ${fileExtension}`);
    }
  }

  /**
   * Extract text from a buffer based on file extension
   * @param buffer File buffer
   * @param fileExtension File extension
   * @returns Extracted text
   */
  private async extractTextFromBuffer(buffer: Buffer, fileExtension: string): Promise<string> {
    switch (fileExtension) {
      case '.pdf':
        const pdfData = await pdfParse(buffer);
        return pdfData.text;
      case '.docx':
      case '.doc':
        const result = await mammoth.extractRawText({ buffer });
        return result.value;
      case '.txt':
      case '.md':
        return buffer.toString('utf-8');
      default:
        throw new Error(`Unsupported file type: ${fileExtension}`);
    }
  }

  /**
   * Extract text from a PDF file
   * @param filePath Path to the PDF file
   * @returns Extracted text
   */
  private async extractPdfText(filePath: string): Promise<string> {
    const dataBuffer = fs.readFileSync(filePath);
    const pdfData = await pdfParse(dataBuffer);
    return pdfData.text;
  }

  /**
   * Extract text from a Word document
   * @param filePath Path to the Word document
   * @returns Extracted text
   */
  private async extractWordText(filePath: string): Promise<string> {
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value;
  }

  /**
   * Extract text from a plain text file
   * @param filePath Path to the text file
   * @returns File content
   */
  private extractPlainText(filePath: string): string {
    return fs.readFileSync(filePath, 'utf-8');
  }

  /**
   * Clean and normalize text content
   * @param text Raw text content
   * @returns Cleaned text
   */
  cleanText(text: string): string {
    if (!text) return '';
    
    // Remove extra whitespace
    let cleaned = text.replace(/\s+/g, ' ');
    
    // Remove non-printable characters
    cleaned = cleaned.replace(/[^\x20-\x7E\n\t]/g, '');
    
    // Normalize line breaks
    cleaned = cleaned.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    
    // Trim leading/trailing whitespace
    cleaned = cleaned.trim();
    
    return cleaned;
  }
}