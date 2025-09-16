import apiClient from './client'

/**
 * Generate interview questions based on resume and role
 * @param {Object} data - Question generation data
 * @param {string} data.role - Target job role
 * @param {string} data.level - Experience level
 * @param {Object} data.resumeSummary - Resume data
 * @returns {Promise<Object>} Generated questions
 */
export async function generateQuestions(data) {
  try {
    const response = await apiClient.post('/api/questions', data)
    
    // Check if this is a fallback response
    if (response.data.fallback) {
      console.log('Using fallback questions:', response.data.message)
      // You could show a notification here if needed
    }
    
    return response.data.data
  } catch (error) {
    const message = error.response?.data?.error?.message || 'Failed to generate questions'
    throw new Error(message)
  }
}

/**
 * Analyze user answers and get feedback
 * @param {Object} data - Analysis data
 * @param {string[]} data.questions - Interview questions
 * @param {string[]} data.answers - User answers
 * @param {string} data.role - Target role
 * @param {string} data.level - Experience level
 * @returns {Promise<Object>} Analysis results
 */
export async function analyzeAnswers(data) {
  try {
    const response = await apiClient.post('/api/analyze-answers', data)
    return response.data.data
  } catch (error) {
    const message = error.response?.data?.error?.message || 'Failed to analyze answers'
    throw new Error(message)
  }
}

/**
 * Analyze a single question-answer pair
 * @param {string} question - Single interview question
 * @param {string} answer - User's answer
 * @param {string} role - Target role
 * @param {string} level - Experience level
 * @returns {Promise<Object>} Individual analysis result
 */
export async function analyzeIndividualAnswer(question, answer, role, level) {
  try {
    const response = await apiClient.post('/api/analyze-individual', {
      question,
      answer,
      role,
      level
    })
    return response.data.data
  } catch (error) {
    const message = error.response?.data?.error?.message || 'Failed to analyze answer'
    throw new Error(message)
  }
}