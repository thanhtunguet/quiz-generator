import React, { createContext } from 'react';

// Create a context with default values
export const AppContext = createContext({
  documentText: '',
  setDocumentText: () => {},
  quizQuestions: null,
  setQuizQuestions: () => {},
  isLoading: false,
  setIsLoading: () => {},
  errorMessage: null,
  setErrorMessage: () => {},
});

/**
 * Provider component that wraps the app and makes the app state available to child components
 */
export const AppProvider = ({ children, value }) => {
  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};