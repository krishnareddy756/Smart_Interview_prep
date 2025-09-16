// Core data types for the application

export const ExperienceLevel = {
  FRESHER: 'fresher',
  INTERMEDIATE: 'intermediate',
  EXPERIENCED: 'experienced'
}

export const QuestionType = {
  INTRO: 'intro',
  ROLE: 'role',
  OPEN_ENDED: 'openEnded'
}

// Type definitions (using JSDoc for better IDE support)

/**
 * @typedef {Object} ResumeData
 * @property {string} text - Full extracted text
 * @property {string[]} skills - Identified skills
 * @property {string} experience - Experience level/duration
 * @property {string[]} education - Education information
 * @property {Project[]} projects - Project information
 * @property {Object} [raw] - Raw parsing data
 */

/**
 * @typedef {Object} Project
 * @property {string} title - Project title
 * @property {string} summary - Project description
 * @property {string[]} [technologies] - Technologies used
 */

/**
 * @typedef {Object} Question
 * @property {string} id - Unique question ID
 * @property {string} type - Question type (intro|role|openEnded)
 * @property {string} text - Question text
 * @property {number} order - Question order
 */

/**
 * @typedef {Object} Answer
 * @property {string} questionId - Associated question ID
 * @property {string} transcription - Transcribed answer text
 * @property {Blob} [audioBlob] - Audio recording blob
 * @property {Date} timestamp - Answer timestamp
 */

/**
 * @typedef {Object} InterviewSession
 * @property {string} id - Session ID
 * @property {Question[]} questions - Session questions
 * @property {Answer[]} answers - User answers
 * @property {string} role - Target role
 * @property {string} level - Experience level
 * @property {Date} startTime - Session start time
 * @property {Date} [endTime] - Session end time
 */

/**
 * @typedef {Object} QuestionFeedback
 * @property {string} questionId - Question ID
 * @property {number} score - Score (1-10)
 * @property {string} feedback - Feedback text
 * @property {string[]} suggestions - Improvement suggestions
 * @property {string[]} keyPoints - Key points covered
 */

/**
 * @typedef {Object} SpeechSupport
 * @property {boolean} synthesis - Text-to-speech support
 * @property {boolean} recognition - Speech recognition support
 * @property {boolean} mediaRecorder - Media recorder support
 */