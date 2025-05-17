import { Injectable, BadRequestException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";
import { UploadResponse } from "../models/upload-response.interface";
import * as mammoth from "mammoth";
import * as pdfParse from "pdf-parse";
import * as Express from "express";

@Injectable()
export class UploadService {
  private uploadPath: string;
  private documentCache: Map<string, string> = new Map();
  private readonly supportedExtensions = [
    ".pdf",
    ".doc",
    ".docx",
    ".txt",
    ".md",
  ];

  constructor(private configService: ConfigService) {
    this.uploadPath = path.join(
      process.cwd(),
      this.configService.get<string>("UPLOADS_DIR") || "uploads"
    );

    // Ensure upload directory exists
    if (!fs.existsSync(this.uploadPath)) {
      fs.mkdirSync(this.uploadPath, { recursive: true });
    }
  }

  async processUploadedFile(
    file: Express.Multer.File,
    documentType: string
  ): Promise<UploadResponse> {
    if (!file || !file.buffer) {
      throw new BadRequestException("Invalid file data");
    }

    try {
      const fileExtension = path.extname(file.originalname).toLowerCase();

      // Validate file extension
      if (!this.supportedExtensions.includes(fileExtension)) {
        throw new BadRequestException(
          `Unsupported file type: ${fileExtension}. Supported types are: ${this.supportedExtensions.join(
            ", "
          )}`
        );
      }

      // Generate unique ID and save file
      const fileId = crypto.randomUUID();
      const destinationPath = path.join(
        this.uploadPath,
        `${fileId}${fileExtension}`
      );

      try {
        fs.writeFileSync(destinationPath, file.buffer);
      } catch (writeError) {
        console.error("Error writing file:", writeError);
        throw new BadRequestException("Failed to save file");
      }

      // Extract text content based on file type
      let textContent = "";
      try {
        if (fileExtension === ".pdf") {
          const pdfData = await pdfParse(file.buffer);
          textContent = pdfData.text;
        } else if ([".doc", ".docx"].includes(fileExtension)) {
          const result = await mammoth.extractRawText({ buffer: file.buffer });
          textContent = result.value;
        } else if ([".txt", ".md"].includes(fileExtension)) {
          textContent = file.buffer.toString("utf-8");
        }

        if (!textContent.trim()) {
          throw new Error("No text content could be extracted from the file");
        }
      } catch (extractError) {
        // If text extraction fails, clean up the saved file
        try {
          fs.unlinkSync(destinationPath);
        } catch (unlinkError) {
          console.error(
            "Error cleaning up file after failed extraction:",
            unlinkError
          );
        }
        throw new BadRequestException(
          `Failed to extract text: ${extractError.message}`
        );
      }

      // Store in cache
      this.documentCache.set(fileId, textContent);

      return {
        success: true,
        id: fileId,
        filename: file.originalname,
        content: textContent,
      };
    } catch (error) {
      console.error("Upload processing error:", error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      return {
        success: false,
        error: `Failed to process file: ${error.message}`,
      };
    }
  }

  async getDocumentContent(id: string): Promise<UploadResponse> {
    // Check if document exists in cache
    if (this.documentCache.has(id)) {
      return {
        success: true,
        id: id,
        content: this.documentCache.get(id),
      };
    }

    // If not in cache, try to load from filesystem
    try {
      const files = fs.readdirSync(this.uploadPath);
      const fileMatch = files.find((file) => file.startsWith(id));

      if (!fileMatch) {
        return {
          success: false,
          error: `Document with ID ${id} not found`,
        };
      }

      const filePath = path.join(this.uploadPath, fileMatch);
      const fileExtension = path.extname(fileMatch).toLowerCase();
      const fileBuffer = fs.readFileSync(filePath);

      let textContent = "";

      if (fileExtension === ".pdf") {
        const pdfData = await pdfParse(fileBuffer);
        textContent = pdfData.text;
      } else if ([".doc", ".docx"].includes(fileExtension)) {
        const result = await mammoth.extractRawText({ path: filePath });
        textContent = result.value;
      } else if ([".txt", ".md"].includes(fileExtension)) {
        textContent = fileBuffer.toString("utf-8");
      } else {
        return {
          success: false,
          error: `Unsupported file type: ${fileExtension}`,
        };
      }

      // Store in cache for future use
      this.documentCache.set(id, textContent);

      return {
        success: true,
        id: id,
        content: textContent,
      };
    } catch (error) {
      console.error("Error retrieving document:", error);
      return {
        success: false,
        error: `Failed to retrieve document: ${error.message}`,
      };
    }
  }

  async getOriginalFile(
    id: string
  ): Promise<{ buffer: Buffer; filename: string; mimeType: string }> {
    const files = fs.readdirSync(this.uploadPath);
    const fileMatch = files.find((file) => file.startsWith(id));

    if (!fileMatch) {
      throw new Error(`File with ID ${id} not found`);
    }

    const filePath = path.join(this.uploadPath, fileMatch);
    const fileExtension = path.extname(fileMatch).toLowerCase();
    const buffer = fs.readFileSync(filePath);

    let mimeType = "application/octet-stream"; // default

    // Determine MIME type based on extension
    if (fileExtension === ".pdf") {
      mimeType = "application/pdf";
    } else if (fileExtension === ".docx") {
      mimeType =
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    } else if (fileExtension === ".doc") {
      mimeType = "application/msword";
    } else if (fileExtension === ".txt") {
      mimeType = "text/plain";
    } else if (fileExtension === ".md") {
      mimeType = "text/markdown";
    }

    return {
      buffer,
      filename: fileMatch,
      mimeType,
    };
  }
}
