/**
 * Helper functions for working with files
 */

/**
 * Get the file type from a File object
 * @param {File} file - The file to inspect
 * @returns {string} The file type (pdf, docx, pptx, or unknown)
 */
export const getFileType = (file) => {
  if (!file) return 'unknown';

  const extension = file.name.split('.').pop().toLowerCase();
  
  switch (extension) {
    case 'pdf':
      return 'pdf';
    case 'docx':
      return 'docx';
    case 'pptx':
      return 'pptx';
    default:
      return 'unknown';
  }
};

/**
 * Format file size to human readable format
 * @param {number} bytes - File size in bytes
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted file size
 */
export const formatFileSize = (bytes, decimals = 2) => {
  if (!bytes || bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

/**
 * Check if a file type is supported
 * @param {File} file - The file to check
 * @returns {boolean} True if the file type is supported
 */
export const isSupportedFileType = (file) => {
  if (!file) return false;
  
  const supportedTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  ];
  
  return supportedTypes.includes(file.type);
};