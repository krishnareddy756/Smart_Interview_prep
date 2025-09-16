const openaiService = require('../openai')
const OpenAI = require('openai')

// Mock OpenAI
jest.mock('openai')

describe('OpenAI Service', () => {
  let mockOpenAI
  let mockCompletion

  beforeEach(() => {
    jest.clearAllMocks()
    
    mockCompletion = {
      choices: [{
        message: {
          content: JSON.stringify({
            intro: 'Tell me about yourself',
            roleQuestions: ['What is React?', 'Explain closures'],
            openEnded: ['Describe a challenge', 'How do you handle stress?']
          })
        }
      }]
    }

    mockOpenAI = {
      chat: {
        completions: {
          create: jest.fn().mockResolvedValue(mockCompletion)
        }
      }
    }

    OpenAI.mockImplementation(() => mockOpenAI)
  })

  describe('generateQuestions', () => {
    const resumeSummary = {
      skills: ['JavaScript', 'React', 'Node.js'],
      experience: '3 years',
      projects: [{ title: 'E-commerce App' }]
    }

    it('should generate questions successfully', async () => {
      const result = await openaiService.generateQuestions(
        'Frontend Developer',
        'intermediate',
        resumeSummary
      )

      expect(result).toEqual({
        intro: 'Tell me about yourself',
        roleQuestions: ['What is React?', 'Explain closures'],
        openEnded: ['Describe a challenge', 'How do you handle stress?']
      })

      expect(mockOpenAI.chat.completions.create).toHaveBeenCalledWith({
        model: 'gpt-3.5-turbo',
        messages: expect.arrayContaining([
          expect.objectContaining({
            role: 'system',
            content: expect.stringContaining('interview questions')
          }),
          expect.objectContaining({
            role: 'user',
            content: expect.stringContaining('Frontend Developer')
          })
        ]),
        temperature: 0.7,
        max_tokens: 2000
      })
    })

    it('should handle different experience levels', async () => {
      await openaiService.generateQuestions('Backend Developer', 'fresher', resumeSummary)
      
      const callArgs = mockOpenAI.chat.completions.create.mock.calls[0][0]
      expect(callArgs.messages[1].content).toContain('fresher')
      expect(callArgs.messages[1].content).toContain('Backend Developer')
    })

    it('should handle experienced level', async () => {
      await openaiService.generateQuestions('Full Stack Developer', 'experienced', resumeSummary)
      
      const callArgs = mockOpenAI.chat.completions.create.mock.calls[0][0]
      expect(callArgs.messages[1].content).toContain('experienced')
      expect(callArgs.messages[1].content).toContain('Full Stack Developer')
    })

    it('should include resume skills in prompt', async () => {
      await openaiService.generateQuestions('Frontend Developer', 'intermediate', resumeSummary)
      
      const callArgs = mockOpenAI.chat.completions.create.mock.calls[0][0]
      expect(callArgs.messages[1].content).toContain('JavaScript')
      expect(callArgs.messages[1].content).toContain('React')
      expect(callArgs.messages[1].content).toContain('Node.js')
    })

    it('should handle malformed JSON response', async () => {
      mockCompletion.choices[0].message.content = 'Invalid JSON response'

      await expect(
        openaiService.generateQuestions('Frontend Developer', 'intermediate', resumeSummary)
      ).rejects.toThrow('Failed to parse OpenAI response')
    })

    it('should handle OpenAI API errors', async () => {
      const apiError = new Error('OpenAI API Error')
      apiError.status = 429
      mockOpenAI.chat.completions.create.mockRejectedValue(apiError)

      await expect(
        openaiService.generateQuestions('Frontend Developer', 'intermediate', resumeSummary)
      ).rejects.toThrow('OpenAI API Error')
    })

    it('should handle empty response', async () => {
      mockCompletion.choices = []

      await expect(
        openaiService.generateQuestions('Frontend Developer', 'intermediate', resumeSummary)
      ).rejects.toThrow('No response from OpenAI')
    })

    it('should validate response structure', async () => {
      mockCompletion.choices[0].message.content = JSON.stringify({
        intro: 'Tell me about yourself'
        // Missing roleQuestions and openEnded
      })

      await expect(
        openaiService.generateQuestions('Frontend Developer', 'intermediate', resumeSummary)
      ).rejects.toThrow('Invalid response structure')
    })
  })

  describe('analyzeAnswers', () => {
    const questions = [
      { id: '1', text: 'Tell me about yourself', type: 'intro' },
      { id: '2', text: 'What is React?', type: 'technical' }
    ]

    const answers = [
      { questionId: '1', transcription: 'I am a frontend developer' },
      { questionId: '2', transcription: 'React is a JavaScript library' }
    ]

    const mockAnalysisResponse = {
      overallScore: 85,
      feedback: 'Good performance',
      questionAnalysis: [
        {
          questionId: '1',
          score: 90,
          feedback: 'Great introduction',
          strengths: ['Clear communication'],
          improvements: ['More specific examples']
        }
      ],
      recommendations: ['Practice technical explanations']
    }

    beforeEach(() => {
      mockCompletion.choices[0].message.content = JSON.stringify(mockAnalysisResponse)
    })

    it('should analyze answers successfully', async () => {
      const result = await openaiService.analyzeAnswers(
        questions,
        answers,
        'Frontend Developer',
        'intermediate'
      )

      expect(result).toEqual(mockAnalysisResponse)
      expect(mockOpenAI.chat.completions.create).toHaveBeenCalledWith({
        model: 'gpt-3.5-turbo',
        messages: expect.arrayContaining([
          expect.objectContaining({
            role: 'system',
            content: expect.stringContaining('analyze interview answers')
          }),
          expect.objectContaining({
            role: 'user',
            content: expect.stringContaining('Frontend Developer')
          })
        ]),
        temperature: 0.3,
        max_tokens: 3000
      })
    })

    it('should include questions and answers in prompt', async () => {
      await openaiService.analyzeAnswers(questions, answers, 'Frontend Developer', 'intermediate')
      
      const callArgs = mockOpenAI.chat.completions.create.mock.calls[0][0]
      expect(callArgs.messages[1].content).toContain('Tell me about yourself')
      expect(callArgs.messages[1].content).toContain('I am a frontend developer')
      expect(callArgs.messages[1].content).toContain('What is React?')
      expect(callArgs.messages[1].content).toContain('React is a JavaScript library')
    })

    it('should handle analysis API errors', async () => {
      const apiError = new Error('Analysis failed')
      mockOpenAI.chat.completions.create.mockRejectedValue(apiError)

      await expect(
        openaiService.analyzeAnswers(questions, answers, 'Frontend Developer', 'intermediate')
      ).rejects.toThrow('Analysis failed')
    })

    it('should handle malformed analysis response', async () => {
      mockCompletion.choices[0].message.content = 'Invalid JSON'

      await expect(
        openaiService.analyzeAnswers(questions, answers, 'Frontend Developer', 'intermediate')
      ).rejects.toThrow('Failed to parse analysis response')
    })

    it('should validate analysis response structure', async () => {
      mockCompletion.choices[0].message.content = JSON.stringify({
        overallScore: 85
        // Missing required fields
      })

      await expect(
        openaiService.analyzeAnswers(questions, answers, 'Frontend Developer', 'intermediate')
      ).rejects.toThrow('Invalid analysis response structure')
    })
  })

  describe('error handling', () => {
    it('should handle network timeouts', async () => {
      const timeoutError = new Error('Request timeout')
      timeoutError.code = 'ECONNABORTED'
      mockOpenAI.chat.completions.create.mockRejectedValue(timeoutError)

      await expect(
        openaiService.generateQuestions('Frontend Developer', 'intermediate', {})
      ).rejects.toThrow('Request timeout')
    })

    it('should handle rate limiting', async () => {
      const rateLimitError = new Error('Rate limit exceeded')
      rateLimitError.status = 429
      mockOpenAI.chat.completions.create.mockRejectedValue(rateLimitError)

      await expect(
        openaiService.generateQuestions('Frontend Developer', 'intermediate', {})
      ).rejects.toThrow('Rate limit exceeded')
    })

    it('should handle authentication errors', async () => {
      const authError = new Error('Invalid API key')
      authError.status = 401
      mockOpenAI.chat.completions.create.mockRejectedValue(authError)

      await expect(
        openaiService.generateQuestions('Frontend Developer', 'intermediate', {})
      ).rejects.toThrow('Invalid API key')
    })
  })
})