// Base API URL - configured from environment variable or default to localhost
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

/**
 * Send a file to the server for processing
 * @param {FormData} formData - FormData containing the file to upload
 * @returns {Promise<Object>} Response with extracted text
 */
export const uploadFile = async (formData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/upload`, {
      method: 'POST',
      body: formData,
      // Don't set Content-Type header when sending FormData
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to upload file');
    }

    return await response.json();
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
};

/**
 * Generate a quiz from the provided text
 * @param {string} text - Text content to create questions from
 * @returns {Promise<Object>} Response with generated quiz questions
 */
export const generateQuiz = async (text) => {
  try {
    const response = await fetch(`${API_BASE_URL}/quiz/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to generate quiz');
    }

    return await response.json();
  } catch (error) {
    console.error('Error generating quiz:', error);
    throw error;
  }
};