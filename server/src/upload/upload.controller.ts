import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  Body,
  Param,
  Get,
  Res,
  BadRequestException,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { Express } from "express";
import { UploadService } from "./upload.service";
import { UploadResponse } from "../models/upload-response.interface";
import { Response } from "express";
import { ApiTags, ApiConsumes, ApiBody } from "@nestjs/swagger";

@ApiTags("Upload")
@Controller("/api/upload")
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post()
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        file: {
          type: "string",
          format: "binary",
        },
        type: {
          type: "string",
          description: "Document type (optional)",
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor("file"))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { type?: string }
  ): Promise<UploadResponse> {
    if (!file) {
      throw new BadRequestException("No file uploaded");
    }

    if (!file.buffer) {
      throw new BadRequestException("Invalid file data");
    }

    try {
      const documentType = body.type || "unknown";
      return await this.uploadService.processUploadedFile(file, documentType);
    } catch (error) {
      return {
        success: false,
        error: `Upload failed: ${error.message}`,
      };
    }
  }

  @Get(":id")
  async getDocumentContent(@Param("id") id: string): Promise<UploadResponse> {
    try {
      return await this.uploadService.getDocumentContent(id);
    } catch (error) {
      return {
        success: false,
        error: `Failed to retrieve document: ${error.message}`,
      };
    }
  }

  @Get("file/:id")
  async getOriginalFile(
    @Param("id") id: string,
    @Res() res: Response
  ): Promise<void> {
    try {
      const fileDetails = await this.uploadService.getOriginalFile(id);
      res.setHeader("Content-Type", fileDetails.mimeType);
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${fileDetails.filename}"`
      );
      res.send(fileDetails.buffer);
    } catch (error) {
      res.status(404).json({
        success: false,
        error: `File not found: ${error.message}`,
      });
    }
  }
}
