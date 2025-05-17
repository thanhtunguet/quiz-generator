import React, { useState } from 'react';

const QuizDisplay = ({ questions }) => {
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);

  const handleAnswerSelect = (questionId, answer) => {
    setSelectedAnswers({
      ...selectedAnswers,
      [questionId]: answer
    });
  };

  const checkAnswers = () => {
    let correct = 0;
    questions.forEach(q => {
      if (selectedAnswers[q.id] === q.correctAnswer) {
        correct++;
      }
    });

    setScore(correct);
    setShowResults(true);
  };

  const resetQuiz = () => {
    setSelectedAnswers({});
    setShowResults(false);
    setScore(0);
  };

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Quiz Questions</h2>
        {showResults ? (
          <div className="text-lg">
            Score: <span className="font-bold">{score}/{questions.length}</span>
          </div>
        ) : null}
      </div>

      <div className="space-y-8">
        {questions.map((question, index) => (
          <div
            key={question.id}
            className="bg-white rounded-lg shadow-md p-6 border border-gray-200"
          >
            <h3 className="text-lg font-medium mb-4">
              {index + 1}. {question.question}
            </h3>

            <div className="space-y-2">
              {question.options.map((option) => {
                const isSelected = selectedAnswers[question.id] === option;
                const isCorrect = showResults && option === question.correctAnswer;
                const isWrong = showResults && isSelected && option !== question.correctAnswer;

                let optionClass = "border rounded-md p-3 cursor-pointer transition-colors";

                if (showResults) {
                  if (isCorrect) {
                    optionClass += " bg-green-100 border-green-500";
                  } else if (isWrong) {
                    optionClass += " bg-red-100 border-red-500";
                  } else {
                    optionClass += " border-gray-200";
                  }
                } else {
                  optionClass += isSelected
                    ? " bg-blue-100 border-blue-500"
                    : " hover:bg-gray-50 border-gray-200";
                }

                return (
                  <div
                    key={option}
                    className={optionClass}
                    onClick={() => {
                      if (!showResults) {
                        handleAnswerSelect(question.id, option);
                      }
                    }}
                  >
                    {option}

                    {showResults && isCorrect && (
                      <span className="ml-2 text-green-600">✓</span>
                    )}
                    {showResults && isWrong && (
                      <span className="ml-2 text-red-600">✗</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 flex justify-center">
        {!showResults ? (
          <button
            onClick={checkAnswers}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow-sm"
            disabled={Object.keys(selectedAnswers).length !== questions.length}
          >
            Check Answers
          </button>
        ) : (
          <button
            onClick={resetQuiz}
            className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md shadow-sm"
          >
            Try Again
          </button>
        )}
      </div>
    </div>
  );
};

export default QuizDisplay;