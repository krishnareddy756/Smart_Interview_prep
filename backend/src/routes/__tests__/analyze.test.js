const request = require('supertest')
const express = require('express')
const analyzeRouter = require('../analyze')
const openaiService = require('../../services/openai')

// Mock the OpenAI service
jest.mock('../../services/openai')

const app = express()
app.use(express.json())
app.use('/api/analyze', analyzeRouter)

describe('Analyze API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('POST /api/analyze', () => {
    const validRequestBody = {
      questions: [
        { id: '1', text: 'Tell me about yourself', type: 'intro' },
        { id: '2', text: 'What is React?', type: 'technical' }
      ],
      answers: [
        { questionId: '1', transcription: 'I am a frontend developer with 3 years experience' },
        { questionId: '2', transcription: 'React is a JavaScript library for building user interfaces' }
      ],
      role: 'Frontend Developer',
      level: 'intermediate'
    }

    const mockAnalysis = {
      overallScore: 85,
      feedback: 'Good overall performance with room for improvement',
      questionAnalysis: [
        {
          questionId: '1',
          score: 90,
          feedback: 'Great introduction, well structured',
          strengths: ['Clear communication', 'Relevant experience'],
          improvements: ['Could mention specific technologies']
        },
        {
          questionId: '2',
          score: 80,
          feedback: 'Correct but could be more detailed',
          strengths: ['Accurate definition'],
          improvements: ['Could explain key features', 'Mention virtual DOM']
        }
      ],
      recommendations: [
        'Practice explaining technical concepts in more detail',
        'Prepare specific examples from your experience'
      ]
    }

    it('should analyze answers successfully', async () => {
      openaiService.analyzeAnswers.mockResolvedValue(mockAnalysis)

      const response = await request(app)
        .post('/api/analyze')
        .send(validRequestBody)

      expect(response.status).toBe(200)
      expect(response.body).toEqual({
        success: true,
        data: mockAnalysis
      })
      expect(openaiService.analyzeAnswers).toHaveBeenCalledWith(
        validRequestBody.questions,
        validRequestBody.answers,
        validRequestBody.role,
        validRequestBody.level
      )
    })

    it('should return 400 for missing questions', async () => {
      const invalidBody = { ...validRequestBody }
      delete invalidBody.questions

      const response = await request(app)
        .post('/api/analyze')
        .send(invalidBody)

      expect(response.status).toBe(400)
      expect(response.body.success).toBe(false)
      expect(response.body.error.message).toContain('Questions are required')
    })

    it('should return 400 for missing answers', async () => {
      const invalidBody = { ...validRequestBody }
      delete invalidBody.answers

      const response = await request(app)
        .post('/api/analyze')
        .send(invalidBody)

      expect(response.status).toBe(400)
      expect(response.body.success).toBe(false)
      expect(response.body.error.message).toContain('Answers are required')
    })

    it('should return 400 for empty questions array', async () => {
      const invalidBody = { ...validRequestBody, questions: [] }

      const response = await request(app)
        .post('/api/analyze')
        .send(invalidBody)

      expect(response.status).toBe(400)
      expect(response.body.success).toBe(false)
      expect(response.body.error.message).toContain('At least one question is required')
    })

    it('should return 400 for empty answers array', async () => {
      const invalidBody = { ...validRequestBody, answers: [] }

      const response = await request(app)
        .post('/api/analyze')
        .send(invalidBody)

      expect(response.status).toBe(400)
      expect(response.body.success).toBe(false)
      expect(response.body.error.message).toContain('At least one answer is required')
    })

    it('should return 400 for mismatched questions and answers', async () => {
      const invalidBody = {
        ...validRequestBody,
        answers: [
          { questionId: '999', transcription: 'Answer to non-existent question' }
        ]
      }

      const response = await request(app)
        .post('/api/analyze')
        .send(invalidBody)

      expect(response.status).toBe(400)
      expect(response.body.success).toBe(false)
      expect(response.body.error.message).toContain('Answer provided for non-existent question')
    })

    it('should handle OpenAI service errors', async () => {
      const error = new Error('OpenAI analysis failed')
      openaiService.analyzeAnswers.mockRejectedValue(error)

      const response = await request(app)
        .post('/api/analyze')
        .send(validRequestBody)

      expect(response.status).toBe(500)
      expect(response.body.success).toBe(false)
      expect(response.body.error.message).toContain('Failed to analyze answers')
    })

    it('should validate question structure', async () => {
      const invalidBody = {
        ...validRequestBody,
        questions: [
          { id: '1' }, // missing text
          { text: 'What is React?' } // missing id
        ]
      }

      const response = await request(app)
        .post('/api/analyze')
        .send(invalidBody)

      expect(response.status).toBe(400)
      expect(response.body.success).toBe(false)
    })

    it('should validate answer structure', async () => {
      const invalidBody = {
        ...validRequestBody,
        answers: [
          { questionId: '1' }, // missing transcription
          { transcription: 'Some answer' } // missing questionId
        ]
      }

      const response = await request(app)
        .post('/api/analyze')
        .send(invalidBody)

      expect(response.status).toBe(400)
      expect(response.body.success).toBe(false)
    })

    it('should handle empty transcriptions', async () => {
      const bodyWithEmptyAnswer = {
        ...validRequestBody,
        answers: [
          { questionId: '1', transcription: '' },
          { questionId: '2', transcription: 'Valid answer' }
        ]
      }

      openaiService.analyzeAnswers.mockResolvedValue(mockAnalysis)

      const response = await request(app)
        .post('/api/analyze')
        .send(bodyWithEmptyAnswer)

      expect(response.status).toBe(200)
      expect(openaiService.analyzeAnswers).toHaveBeenCalled()
    })

    it('should handle very long transcriptions', async () => {
      const longTranscription = 'a'.repeat(10000)
      const bodyWithLongAnswer = {
        ...validRequestBody,
        answers: [
          { questionId: '1', transcription: longTranscription },
          { questionId: '2', transcription: 'Normal answer' }
        ]
      }

      openaiService.analyzeAnswers.mockResolvedValue(mockAnalysis)

      const response = await request(app)
        .post('/api/analyze')
        .send(bodyWithLongAnswer)

      expect(response.status).toBe(200)
      expect(openaiService.analyzeAnswers).toHaveBeenCalled()
    })
  })
})