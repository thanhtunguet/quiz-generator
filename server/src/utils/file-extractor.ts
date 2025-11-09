import * as fs from "fs";
import * as mammoth from "mammoth";
import pdfParse from "pdf-parse";

export async function extractTextFromFile(filePath: string): Promise<string> {
  const fileExtension = filePath.split(".").pop()?.toLowerCase();
  const fileBuffer = await fs.promises.readFile(filePath);

  switch (fileExtension) {
    case "docx":
      const result = await mammoth.extractRawText({ buffer: fileBuffer });
      return result.value;

    case "pdf":
      const pdfData = await pdfParse(fileBuffer);
      return pdfData.text;

    case "txt":
      return fileBuffer.toString("utf-8");

    default:
      throw new Error(`Unsupported file type: ${fileExtension}`);
  }
}
