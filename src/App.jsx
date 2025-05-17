import React, { useState } from 'react';
import { AppProvider } from './context/AppContext';
import DocumentUploader from './components/DocumentUploader';
import TextPreview from './components/TextPreview';
import QuizGenerator from './components/QuizGenerator';
import QuizDisplay from './components/QuizDisplay';
import QuizExport from './components/QuizExport';

function App() {
  const [activeTab, setActiveTab] = useState('upload');
  const [documentText, setDocumentText] = useState('');
  const [quizQuestions, setQuizQuestions] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const renderActiveComponent = () => {
    switch (activeTab) {
      case 'upload':
        return (
          <div className="flex flex-col gap-6">
            <DocumentUploader
              onTextExtracted={(text) => {
                setDocumentText(text);
                setActiveTab('preview');
              }}
              setIsLoading={setIsLoading}
              setErrorMessage={setErrorMessage}
            />
          </div>
        );
      case 'preview':
        return (
          <div className="flex flex-col gap-6">
            <TextPreview
              text={documentText}
              onTextChange={setDocumentText}
            />
            <QuizGenerator
              text={documentText}
              onQuizGenerated={(questions) => {
                setQuizQuestions(questions);
                setActiveTab('quiz');
              }}
              setIsLoading={setIsLoading}
              setErrorMessage={setErrorMessage}
            />
          </div>
        );
      case 'quiz':
        return quizQuestions ? (
          <div className="flex flex-col gap-6">
            <QuizDisplay questions={quizQuestions} />
            <QuizExport questions={quizQuestions} />
            <button
              onClick={() => setActiveTab('upload')}
              className="mt-4 px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
            >
              Start Over
            </button>
          </div>
        ) : (
          <div className="text-center py-10">
            <p>No quiz questions available. Please generate a quiz first.</p>
            <button
              onClick={() => setActiveTab('upload')}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Go to Upload
            </button>
          </div>
        );
      default:
        return <div>Unknown tab</div>;
    }
  };

  return (
    <AppProvider value={{
      documentText,
      setDocumentText,
      quizQuestions,
      setQuizQuestions,
      isLoading,
      setIsLoading,
      errorMessage,
      setErrorMessage
    }}>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <header className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-gray-800">AI Quiz Generator</h1>
            <p className="text-gray-600 mt-2">
              Upload training documents and automatically generate quizzes using AI
            </p>
          </header>

          {/* Progress indicator */}
          <div className="mb-8">
            <div className="flex justify-center mb-4">
              <ol className="flex items-center w-full max-w-3xl">
                <li className={`flex items-center ${activeTab === 'upload' ? 'text-blue-600' : 'text-gray-500'}`}>
                  <span className={`flex items-center justify-center w-8 h-8 rounded-full ${activeTab === 'upload' ? 'bg-blue-100' : 'bg-gray-100'}`}>1</span>
                  <span className="ml-2">Upload</span>
                </li>
                <li className="flex items-center flex-1 ml-2">
                  <div className={`h-0.5 w-full ${activeTab !== 'upload' ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
                </li>
                <li className={`flex items-center ${activeTab === 'preview' ? 'text-blue-600' : 'text-gray-500'}`}>
                  <span className={`flex items-center justify-center w-8 h-8 rounded-full ${activeTab === 'preview' ? 'bg-blue-100' : 'bg-gray-100'}`}>2</span>
                  <span className="ml-2">Preview</span>
                </li>
                <li className="flex items-center flex-1 ml-2">
                  <div className={`h-0.5 w-full ${activeTab === 'quiz' ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
                </li>
                <li className={`flex items-center ${activeTab === 'quiz' ? 'text-blue-600' : 'text-gray-500'}`}>
                  <span className={`flex items-center justify-center w-8 h-8 rounded-full ${activeTab === 'quiz' ? 'bg-blue-100' : 'bg-gray-100'}`}>3</span>
                  <span className="ml-2">Quiz</span>
                </li>
              </ol>
            </div>
          </div>

          {/* Loading and error states */}
          {isLoading && (
            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
              <div className="bg-white p-6 rounded-lg shadow-lg flex flex-col items-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
                <p>Processing your request...</p>
              </div>
            </div>
          )}

          {errorMessage && (
            <div className="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
              <strong className="font-bold">Error: </strong>
              <span className="block sm:inline">{errorMessage}</span>
              <button
                className="absolute top-0 bottom-0 right-0 px-4 py-3"
                onClick={() => setErrorMessage(null)}
              >
                <span className="text-xl">&times;</span>
              </button>
            </div>
          )}

          {/* Main content */}
          <div className="bg-white rounded-lg shadow-md p-6">
            {renderActiveComponent()}
          </div>

          <footer className="mt-8 text-center text-sm text-gray-500">
            <p>© 2023 AI Quiz Generator | Powered by OpenAI</p>
          </footer>
        </div>
      </div>
    </AppProvider>
  );
}

export default App;