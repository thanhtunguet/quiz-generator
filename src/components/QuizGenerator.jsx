import React, { useState } from 'react';
import { generateQuiz } from '../services/api';

const DIFFICULTY_LEVELS = ['easy', 'medium', 'hard'];

const AI_PROVIDERS = [
  {
    id: 'gemini', name: 'Google', models: [
      { id: "gemini-2.0-flash", name: "Gemini 2.0 Flash" },
      { id: "gemini-2.0-pro", name: "Gemini 2.0 Pro" },
      { id: "gemini-1.5-flash", name: "Gemini 1.5 Flash" },
      { id: "gemini-1.5-pro", name: "Gemini 1.5 Pro" },
      { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash" },
      { id: "gemini-2.5-pro", name: "Gemini 2.5 Pro" },
    ],
  },
  {
    id: 'openai', name: 'OpenAI', models: [
      { id: 'qwen3-8b', name: 'Qwen3 8B' },
      { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo' },
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini' },
      { id: 'gpt-4o', name: 'GPT-4o' },
    ]
  },
  {
    id: 'anthropic', name: 'Anthropic', models: [
      { id: 'claude-3-sonnet-20240229', name: 'Claude 3 Sonnet' },
      { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus' },
    ]
  },
];

const QuizGenerator = ({ text, onQuizGenerated, setIsLoading, setErrorMessage }) => {
  const [numberOfQuestions, setNumberOfQuestions] = useState(5);
  const [difficulty, setDifficulty] = useState('medium');
  const [additionalInstructions, setAdditionalInstructions] = useState('');
  const [selectedProvider, setSelectedProvider] = useState(AI_PROVIDERS[0]);
  const [selectedModel, setSelectedModel] = useState(AI_PROVIDERS[0].models[0]);

  const handleProviderChange = (providerId) => {
    const provider = AI_PROVIDERS.find(p => p.id === providerId);
    setSelectedProvider(provider);
    setSelectedModel(provider.models[0]); // Reset to first model of selected provider
  };

  const handleModelChange = (modelId) => {
    const model = selectedProvider.models.find(m => m.id === modelId);
    setSelectedModel(model);
  };

  const handleGenerateQuiz = async () => {
    if (!text || text.trim() === '') {
      setErrorMessage('Please provide some text to generate questions from.');
      return;
    }

    try {
      setIsLoading(true);
      const response = await generateQuiz(text, {
        numberOfQuestions,
        difficulty,
        additionalInstructions: additionalInstructions.trim(),
        provider: selectedProvider.id,
        model: selectedModel.id,
      });

      if (response.success && response.questions) {
        onQuizGenerated(response.questions);
      } else {
        setErrorMessage(response.message || 'Failed to generate quiz');
      }
    } catch (error) {
      setErrorMessage(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      <h2 className="text-xl font-semibold mb-4">Generate Quiz</h2>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            AI Provider
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <select
              value={selectedProvider.id}
              onChange={(e) => handleProviderChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {AI_PROVIDERS.map((provider) => (
                <option key={provider.id} value={provider.id}>
                  {provider.name}
                </option>
              ))}
            </select>

            <select
              value={selectedModel.id}
              onChange={(e) => handleModelChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {selectedProvider.models.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Number of Questions
          </label>
          <div className="flex items-center">
            <input
              type="range"
              min="1"
              max="20"
              value={numberOfQuestions}
              onChange={(e) => setNumberOfQuestions(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <span className="ml-3 text-gray-700 font-medium">{numberOfQuestions}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-500 mt-1">
            <span>1</span>
            <span>20</span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Difficulty Level
          </label>
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {DIFFICULTY_LEVELS.map((level) => (
              <option key={level} value={level}>
                {level.charAt(0).toUpperCase() + level.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Additional Instructions (Optional)
          </label>
          <textarea
            value={additionalInstructions}
            onChange={(e) => setAdditionalInstructions(e.target.value)}
            placeholder="Enter any specific instructions for quiz generation..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 h-24 resize-none"
          />
        </div>

        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                The AI will analyze the document content and generate multiple-choice questions based on your settings.
                This process may take a few moments.
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleGenerateQuiz}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow-sm"
          >
            Generate Quiz
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuizGenerator;