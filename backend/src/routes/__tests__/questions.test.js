const request = require('supertest')
const express = require('express')
const questionsRouter = require('../questions')
const openaiService = require('../../services/openai')

// Mock the OpenAI service
jest.mock('../../services/openai')

const app = express()
app.use(express.json())
app.use('/api/questions', questionsRouter)

describe('Questions API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('POST /api/questions', () => {
    const validRequestBody = {
      role: 'Frontend Developer',
      level: 'intermediate',
      resumeSummary: {
        skills: ['JavaScript', 'React', 'Node.js'],
        experience: '3 years',
        projects: [{ title: 'E-commerce App' }]
      }
    }

    const mockQuestions = {
      intro: 'Tell me about yourself',
      roleQuestions: [
        'What is React?',
        'Explain JavaScript closures'
      ],
      openEnded: [
        'Describe a challenging project',
        'How do you handle deadlines?'
      ]
    }

    it('should generate questions successfully', async () => {
      openaiService.generateQuestions.mockResolvedValue(mockQuestions)

      const response = await request(app)
        .post('/api/questions')
        .send(validRequestBody)

      expect(response.status).toBe(200)
      expect(response.body).toEqual({
        success: true,
        data: mockQuestions
      })
      expect(openaiService.generateQuestions).toHaveBeenCalledWith(
        validRequestBody.role,
        validRequestBody.level,
        validRequestBody.resumeSummary
      )
    })

    it('should return 400 for missing role', async () => {
      const invalidBody = { ...validRequestBody }
      delete invalidBody.role

      const response = await request(app)
        .post('/api/questions')
        .send(invalidBody)

      expect(response.status).toBe(400)
      expect(response.body.success).toBe(false)
      expect(response.body.error.message).toContain('Role is required')
    })

    it('should return 400 for missing level', async () => {
      const invalidBody = { ...validRequestBody }
      delete invalidBody.level

      const response = await request(app)
        .post('/api/questions')
        .send(invalidBody)

      expect(response.status).toBe(400)
      expect(response.body.success).toBe(false)
      expect(response.body.error.message).toContain('Level is required')
    })

    it('should return 400 for invalid level', async () => {
      const invalidBody = { ...validRequestBody, level: 'invalid' }

      const response = await request(app)
        .post('/api/questions')
        .send(invalidBody)

      expect(response.status).toBe(400)
      expect(response.body.success).toBe(false)
      expect(response.body.error.message).toContain('Invalid level')
    })

    it('should return 400 for missing resume summary', async () => {
      const invalidBody = { ...validRequestBody }
      delete invalidBody.resumeSummary

      const response = await request(app)
        .post('/api/questions')
        .send(invalidBody)

      expect(response.status).toBe(400)
      expect(response.body.success).toBe(false)
      expect(response.body.error.message).toContain('Resume summary is required')
    })

    it('should handle OpenAI service errors', async () => {
      const error = new Error('OpenAI API error')
      openaiService.generateQuestions.mockRejectedValue(error)

      const response = await request(app)
        .post('/api/questions')
        .send(validRequestBody)

      expect(response.status).toBe(500)
      expect(response.body.success).toBe(false)
      expect(response.body.error.message).toContain('Failed to generate questions')
    })

    it('should handle malformed resume summary', async () => {
      const invalidBody = {
        ...validRequestBody,
        resumeSummary: 'invalid string instead of object'
      }

      const response = await request(app)
        .post('/api/questions')
        .send(invalidBody)

      expect(response.status).toBe(400)
      expect(response.body.success).toBe(false)
    })

    it('should validate role against allowed values', async () => {
      const invalidBody = {
        ...validRequestBody,
        role: 'Invalid Role That Does Not Exist'
      }

      const response = await request(app)
        .post('/api/questions')
        .send(invalidBody)

      expect(response.status).toBe(400)
      expect(response.body.success).toBe(false)
      expect(response.body.error.message).toContain('Invalid role')
    })

    it('should handle empty request body', async () => {
      const response = await request(app)
        .post('/api/questions')
        .send({})

      expect(response.status).toBe(400)
      expect(response.body.success).toBe(false)
    })

    it('should handle timeout from OpenAI service', async () => {
      const timeoutError = new Error('Request timeout')
      timeoutError.code = 'ECONNABORTED'
      openaiService.generateQuestions.mockRejectedValue(timeoutError)

      const response = await request(app)
        .post('/api/questions')
        .send(validRequestBody)

      expect(response.status).toBe(500)
      expect(response.body.success).toBe(false)
      expect(response.body.error.message).toContain('Failed to generate questions')
    })
  })
})