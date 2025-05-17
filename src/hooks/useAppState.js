import { useState } from 'react';

/**
 * Custom hook to manage application state
 */
const useAppState = () => {
  // Document state
  const [documentText, setDocumentText] = useState('');
  
  // Quiz state
  const [quizQuestions, setQuizQuestions] = useState(null);
  
  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  /**
   * Reset the entire application state
   */
  const resetState = () => {
    setDocumentText('');
    setQuizQuestions(null);
    setErrorMessage(null);
  };

  return {
    // State values
    documentText,
    quizQuestions,
    isLoading,
    errorMessage,
    
    // State setters
    setDocumentText,
    setQuizQuestions,
    setIsLoading,
    setErrorMessage,
    
    // Actions
    resetState,
  };
};

export default useAppState;