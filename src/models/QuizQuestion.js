/**
 * Represents a quiz question structure
 */
class QuizQuestion {
  /**
   * Create a new QuizQuestion
   * @param {number} id - Unique identifier
   * @param {string} question - The question text
   * @param {string[]} options - Array of possible answers
   * @param {string} answer - The correct answer (must be included in options)
   */
  constructor(id, question, options, answer) {
    this.id = id;
    this.question = question;
    this.options = options;
    this.answer = answer;
  }

  /**
   * Check if an answer is correct
   * @param {string} selectedAnswer - The answer to check
   * @returns {boolean} True if the answer is correct
   */
  isCorrect(selectedAnswer) {
    return selectedAnswer === this.answer;
  }

  /**
   * Create a QuizQuestion from a plain object
   * @param {Object} object - The object to convert
   * @returns {QuizQuestion} A new QuizQuestion instance
   */
  static fromObject(object) {
    return new QuizQuestion(
      object.id || Math.floor(Math.random() * 1000),
      object.question,
      object.options,
      object.answer
    );
  }
}

export default QuizQuestion;