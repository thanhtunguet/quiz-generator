export interface UploadResponse {
  success: boolean;
  id?: string;
  filename?: string;
  content?: string;
  error?: string;
}