/**
 * A File with app constants
 */

/**
 * Quiz api constants
 */
const QUIZ_API = `https://quizapi.io/api/v1/questions`;
const API_KEY = 'Nc3yFSmvQkjBMhSY95E9FfX9No9C0ttqjHie2Ekg';

/**
 * Filter arrays
 */
const difficulties = ['Easy', 'Medium', 'Hard'];
const categories = ['bash', 'CMS', 'Code', 'DevOps', 'Docker', 'Linux', 'SQL'];
const amountOfQuestions = { min: 1, max: 20 }
const defaultLimit = { limit: 10 }

export { QUIZ_API, API_KEY, difficulties, categories, amountOfQuestions, defaultLimit }
