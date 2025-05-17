// Base API URL - configured from environment variable or default to localhost
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

/**
 * Send a file to the server for processing
 * @param {FormData} formData - FormData containing the file to upload
 * @returns {Promise<Object>} Response with extracted text
 */
export const uploadFile = async (formData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/upload`, {
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
 * @param {Object} options - Quiz generation options
 * @param {number} options.numberOfQuestions - Number of questions to generate
 * @param {string} options.difficulty - Difficulty level (easy, medium, hard)
 * @param {string} options.additionalInstructions - Additional instructions for quiz generation
 * @param {string} options.provider - AI provider to use (openai, anthropic, gemini)
 * @param {string} options.model - Specific model to use with the provider
 * @returns {Promise<Object>} Response with generated quiz questions
 */
export const generateQuiz = async (text, options = {}) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/quiz/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        documentText: text,
        numberOfQuestions: options.numberOfQuestions || 5,
        difficulty: options.difficulty || 'medium',
        additionalInstructions: options.additionalInstructions || '',
        provider: options.provider,
        model: options.model,
      }),
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