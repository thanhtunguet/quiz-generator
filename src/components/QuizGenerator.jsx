import React, { useState } from 'react';
import { generateQuiz } from '../services/api';


const AI_PROVIDERS = [
  {
    id: 'gemini', name: 'Google', models: [
      /// Gemini 2.0 family
      { id: "gemini-2.0-flash", name: "Gemini 2.0 Flash" },
      { id: "gemini-2.0-pro", name: "Gemini 2.0 Pro" },
      /// Gemini 1.5 family
      { id: "gemini-1.5-flash", name: "Gemini 1.5 Flash" },
      { id: "gemini-1.5-pro", name: "Gemini 1.5 Pro" },
      /// Gemini 2.5 family
      { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash" },
      { id: "gemini-2.5-pro", name: "Gemini 2.5 Pro" },
    ],
  },
  {
    id: 'openai', name: 'OpenAI', models: [
      { id: 'qwen3-8b', name: 'Qwen3 8B' },
      /// Legacy GPT 3.5 family
      { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo' },
      /// GPT 4o family
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini' },
      { id: 'gpt-4o', name: 'GPT-4o' },
      /// GPT 4.1 family
      { id: 'gpt-4.1-nano', name: 'GPT-4.1 Nano' },
      { id: 'gpt-4.1-mini', name: 'GPT-4.1 Mini' },
      { id: 'gpt-4.1', name: 'GPT-4.1' },
    ]
  },
  {
    id: 'anthropic', name: 'Anthropic', models: [
      { id: 'claude-3-sonnet-20240229', name: 'Claude 3 Sonnet' },
      { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus' },
    ]
  },
  {
    id: 'deepseek', name: 'DeepSeek', models: [
      { id: 'deepseek-chat', name: 'DeepSeek Chat' },
      { id: 'deepseek-reasoner', name: 'DeepSeek Reasoner' },
    ]
  },
  {
    id: 'grok', name: 'Grok', models: [
      { id: 'grok-1', name: 'Grok-1' },
      { id: 'grok-1.5', name: 'Grok-1.5' },
      { id: 'grok-2', name: 'Grok-2' },
    ]
  },
];

const QuizGenerator = ({ text, onQuizGenerated, setIsLoading, setErrorMessage }) => {
  const [numberOfQuestions, setNumberOfQuestions] = useState(10);
  const [difficultyDistribution, setDifficultyDistribution] = useState({
    easy: 40,
    medium: 30,
    hard: 30
  });
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

  const handleInputChange = (e) => {
    const value = e.target.value;
    // Allow any numeric input while typing (including empty and partial values)
    if (value === '' || (!isNaN(value) && value >= 0)) {
      setNumberOfQuestions(value === '' ? '' : parseInt(value, 10));
    }
  };

  const handleInputBlur = (e) => {
    const value = e.target.value;
    const numValue = parseInt(value, 10);
    
    // Validate and correct the value when user finishes editing
    if (value === '' || isNaN(numValue) || numValue < 10) {
      setNumberOfQuestions(10);
    } else if (numValue > 100) {
      setNumberOfQuestions(100);
    }
  };

  const handleSliderChange = (e) => {
    const numValue = parseInt(e.target.value, 10);
    setNumberOfQuestions(numValue);
  };

  // Calculate progress percentage for slider styling
  const getSliderProgress = () => {
    const value = numberOfQuestions || 10;
    const min = 10;
    const max = 100;
    return ((value - min) / (max - min)) * 100;
  };

  // Handle difficulty percentage changes
  const handleDifficultyChange = (level, value) => {
    const numValue = parseInt(value, 10);
    if (isNaN(numValue) || numValue < 0 || numValue > 100) return;

    setDifficultyDistribution(prev => {
      const newDistribution = { ...prev, [level]: numValue };
      
      // Auto-adjust other values to maintain 100% total
      const total = Object.values(newDistribution).reduce((sum, val) => sum + val, 0);
      if (total !== 100) {
        const otherLevels = Object.keys(newDistribution).filter(key => key !== level);
        const remaining = 100 - numValue;
        const otherTotal = otherLevels.reduce((sum, key) => sum + prev[key], 0);
        
        if (otherTotal > 0) {
          otherLevels.forEach(key => {
            newDistribution[key] = Math.round((prev[key] / otherTotal) * remaining);
          });
        } else {
          // If other values are 0, distribute evenly
          const perLevel = Math.floor(remaining / otherLevels.length);
          otherLevels.forEach((key, index) => {
            newDistribution[key] = index === otherLevels.length - 1 
              ? remaining - (perLevel * (otherLevels.length - 1))
              : perLevel;
          });
        }
      }
      
      return newDistribution;
    });
  };

  // Get total percentage (should always be 100 with auto-adjustment)
  const getTotalPercentage = () => {
    return Object.values(difficultyDistribution).reduce((sum, val) => sum + val, 0);
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
        difficultyDistribution,
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
          <div className="space-y-3">
            {/* Number Input Field */}
            <div className="flex items-center space-x-3">
              <input
                type="number"
                min="10"
                max="100"
                value={numberOfQuestions}
                onChange={handleInputChange}
                onBlur={handleInputBlur}
                className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
                placeholder="10"
              />
              <span className="text-sm text-gray-600">questions (10-100)</span>
            </div>
            
            {/* Slider */}
            <div className="flex items-center">
              <input
                type="range"
                min="10"
                max="100"
                value={numberOfQuestions || 10}
                onChange={handleSliderChange}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                style={{
                  '--progress': `${getSliderProgress()}%`
                }}
              />
            </div>
            <div className="flex justify-between text-sm text-gray-500">
              <span>10</span>
              <span>100</span>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Difficulty Distribution
          </label>
          <div className="space-y-4">
            {/* Easy Questions */}
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-green-800">Easy Questions</span>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={difficultyDistribution.easy}
                    onChange={(e) => handleDifficultyChange('easy', e.target.value)}
                    className="w-16 px-2 py-1 text-sm border border-green-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-center"
                  />
                  <span className="text-sm text-green-700">%</span>
                </div>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={difficultyDistribution.easy}
                onChange={(e) => handleDifficultyChange('easy', e.target.value)}
                className="w-full h-2 bg-green-200 rounded-lg appearance-none cursor-pointer slider-green"
                style={{
                  '--progress': `${difficultyDistribution.easy}%`,
                  '--color': '#22c55e'
                }}
              />
            </div>

            {/* Medium Questions */}
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-yellow-800">Medium Questions</span>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={difficultyDistribution.medium}
                    onChange={(e) => handleDifficultyChange('medium', e.target.value)}
                    className="w-16 px-2 py-1 text-sm border border-yellow-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 text-center"
                  />
                  <span className="text-sm text-yellow-700">%</span>
                </div>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={difficultyDistribution.medium}
                onChange={(e) => handleDifficultyChange('medium', e.target.value)}
                className="w-full h-2 bg-yellow-200 rounded-lg appearance-none cursor-pointer slider-yellow"
                style={{
                  '--progress': `${difficultyDistribution.medium}%`,
                  '--color': '#eab308'
                }}
              />
            </div>

            {/* Hard Questions */}
            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-red-800">Hard Questions</span>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={difficultyDistribution.hard}
                    onChange={(e) => handleDifficultyChange('hard', e.target.value)}
                    className="w-16 px-2 py-1 text-sm border border-red-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 text-center"
                  />
                  <span className="text-sm text-red-700">%</span>
                </div>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={difficultyDistribution.hard}
                onChange={(e) => handleDifficultyChange('hard', e.target.value)}
                className="w-full h-2 bg-red-200 rounded-lg appearance-none cursor-pointer slider-red"
                style={{
                  '--progress': `${difficultyDistribution.hard}%`,
                  '--color': '#ef4444'
                }}
              />
            </div>

            {/* Total indicator */}
            <div className="text-center">
              <span className={`text-sm font-medium ${getTotalPercentage() === 100 ? 'text-green-600' : 'text-red-600'}`}>
                Total: {getTotalPercentage()}%
              </span>
            </div>
          </div>
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