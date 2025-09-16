import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import App from '../../App'
import { AppProvider } from '../../context/AppContext'
import { NotificationProvider } from '../../components/NotificationSystem'
import * as resumeApi from '../../api/resume'
import * as questionsApi from '../../api/questions'

// Mock APIs
jest.mock('../../api/resume')
jest.mock('../../api/questions')
jest.mock('../../api/analyze')

// Mock speech APIs
Object.defineProperty(window, 'speechSynthesis', {
  writable: true,
  value: {
    speak: jest.fn(),
    cancel: jest.fn(),
    getVoices: jest.fn(() => []),
    addEventListener: jest.fn()
  }
})

Object.defineProperty(window, 'SpeechSynthesisUtterance', {
  writable: true,
  value: jest.fn().mockImplementation(() => ({
    addEventListener: jest.fn(),
    removeEventListener: jest.fn()
  }))
})

const theme = createTheme()

const TestWrapper = ({ children }) => (
  <ThemeProvider theme={theme}>
    <NotificationProvider>
      <AppProvider>
        {children}
      </AppProvider>
    </NotificationProvider>
  </ThemeProvider>
)

describe('Interview Flow Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const mockResumeData = {
    skills: ['JavaScript', 'React', 'Node.js'],
    experience: '3 years of frontend development',
    projects: [
      { title: 'E-commerce Platform' },
      { title: 'Task Management App' }
    ]
  }

  const mockQuestions = {
    intro: 'Tell me about yourself and your background',
    roleQuestions: [
      'What is React and why would you use it?',
      'Explain the concept of closures in JavaScript'
    ],
    openEnded: [
      'Describe a challenging project you worked on',
      'How do you handle tight deadlines?'
    ]
  }

  const mockAnalysis = {
    overallScore: 85,
    feedback: 'Good overall performance with room for improvement',
    questionAnalysis: [
      {
        questionId: '0',
        score: 90,
        feedback: 'Excellent introduction',
        strengths: ['Clear communication', 'Relevant experience'],
        improvements: ['Could mention specific achievements']
      }
    ],
    recommendations: [
      'Practice explaining technical concepts with examples',
      'Prepare specific metrics from your projects'
    ]
  }

  it('should complete full interview flow from upload to results', async () => {
    resumeApi.uploadResume.mockResolvedValue(mockResumeData)
    questionsApi.generateQuestions.mockResolvedValue(mockQuestions)
    questionsApi.analyzeAnswers.mockResolvedValue(mockAnalysis)

    render(
      <TestWrapper>
        <App />
      </TestWrapper>
    )

    // Step 1: Upload resume
    expect(screen.getByText(/upload your resume/i)).toBeInTheDocument()
    
    const fileInput = screen.getByLabelText(/choose file/i)
    const file = new File(['resume content'], 'resume.pdf', { type: 'application/pdf' })
    
    fireEvent.change(fileInput, { target: { files: [file] } })
    
    const uploadButton = screen.getByRole('button', { name: /upload resume/i })
    fireEvent.click(uploadButton)

    // Wait for resume processing
    await waitFor(() => {
      expect(resumeApi.uploadResume).toHaveBeenCalledWith(file)
    })

    // Step 2: Configure interview
    await waitFor(() => {
      expect(screen.getByText(/interview configuration/i)).toBeInTheDocument()
    })

    // Select role and level
    const roleSelect = screen.getByLabelText(/target role/i)
    fireEvent.mouseDown(roleSelect)
    fireEvent.click(screen.getByText('Frontend Developer'))

    const levelSelect = screen.getByLabelText(/experience level/i)
    fireEvent.mouseDown(levelSelect)
    fireEvent.click(screen.getByText('Intermediate (2-5 years)'))

    // Generate questions
    const generateButton = screen.getByRole('button', { name: /generate questions/i })
    fireEvent.click(generateButton)

    await waitFor(() => {
      expect(questionsApi.generateQuestions).toHaveBeenCalledWith({
        role: 'Frontend Developer',
        level: 'intermediate',
        resumeSummary: mockResumeData
      })
    })

    // Step 3: Start interview
    await waitFor(() => {
      expect(screen.getByText(/generated questions/i)).toBeInTheDocument()
    })

    const startButton = screen.getByRole('button', { name: /start interview/i })
    fireEvent.click(startButton)

    // Select text-only mode
    await waitFor(() => {
      expect(screen.getByText(/choose your interview mode/i)).toBeInTheDocument()
    })

    const textModeButton = screen.getByRole('button', { name: /start text-only mode/i })
    fireEvent.click(textModeButton)

    // Step 4: Answer questions
    await waitFor(() => {
      expect(screen.getByText(/tell me about yourself/i)).toBeInTheDocument()
    })

    // Answer first question
    const answerInput = screen.getByLabelText(/your answer/i)
    fireEvent.change(answerInput, { 
      target: { value: 'I am a frontend developer with 3 years of experience...' } 
    })

    const nextButton = screen.getByRole('button', { name: /next question/i })
    fireEvent.click(nextButton)

    // Continue through questions (simplified for test)
    // In real test, would iterate through all questions

    // Step 5: Complete interview and view results
    const finishButton = screen.getByRole('button', { name: /finish interview/i })
    fireEvent.click(finishButton)

    await waitFor(() => {
      expect(questionsApi.analyzeAnswers).toHaveBeenCalled()
    })

    // Verify results page
    await waitFor(() => {
      expect(screen.getByText(/interview results/i)).toBeInTheDocument()
      expect(screen.getByText(/overall score/i)).toBeInTheDocument()
      expect(screen.getByText('85')).toBeInTheDocument()
    })
  })

  it('should handle resume upload errors gracefully', async () => {
    const uploadError = new Error('File too large')
    resumeApi.uploadResume.mockRejectedValue(uploadError)

    render(
      <TestWrapper>
        <App />
      </TestWrapper>
    )

    const fileInput = screen.getByLabelText(/choose file/i)
    const file = new File(['resume content'], 'resume.pdf', { type: 'application/pdf' })
    
    fireEvent.change(fileInput, { target: { files: [file] } })
    
    const uploadButton = screen.getByRole('button', { name: /upload resume/i })
    fireEvent.click(uploadButton)

    await waitFor(() => {
      expect(screen.getByText(/file too large/i)).toBeInTheDocument()
    })

    // Should still be on upload page
    expect(screen.getByText(/upload your resume/i)).toBeInTheDocument()
  })

  it('should handle question generation errors', async () => {
    resumeApi.uploadResume.mockResolvedValue(mockResumeData)
    questionsApi.generateQuestions.mockRejectedValue(new Error('API rate limit exceeded'))

    render(
      <TestWrapper>
        <App />
      </TestWrapper>
    )

    // Upload resume first
    const fileInput = screen.getByLabelText(/choose file/i)
    const file = new File(['resume content'], 'resume.pdf', { type: 'application/pdf' })
    
    fireEvent.change(fileInput, { target: { files: [file] } })
    fireEvent.click(screen.getByRole('button', { name: /upload resume/i }))

    await waitFor(() => {
      expect(screen.getByText(/interview configuration/i)).toBeInTheDocument()
    })

    // Try to generate questions
    const roleSelect = screen.getByLabelText(/target role/i)
    fireEvent.mouseDown(roleSelect)
    fireEvent.click(screen.getByText('Frontend Developer'))

    const levelSelect = screen.getByLabelText(/experience level/i)
    fireEvent.mouseDown(levelSelect)
    fireEvent.click(screen.getByText('Intermediate (2-5 years)'))

    const generateButton = screen.getByRole('button', { name: /generate questions/i })
    fireEvent.click(generateButton)

    await waitFor(() => {
      expect(screen.getByText(/api rate limit exceeded/i)).toBeInTheDocument()
    })
  })

  it('should allow restarting interview process', async () => {
    resumeApi.uploadResume.mockResolvedValue(mockResumeData)
    questionsApi.generateQuestions.mockResolvedValue(mockQuestions)

    render(
      <TestWrapper>
        <App />
      </TestWrapper>
    )

    // Complete initial setup
    const fileInput = screen.getByLabelText(/choose file/i)
    const file = new File(['resume content'], 'resume.pdf', { type: 'application/pdf' })
    
    fireEvent.change(fileInput, { target: { files: [file] } })
    fireEvent.click(screen.getByRole('button', { name: /upload resume/i }))

    await waitFor(() => {
      expect(screen.getByText(/interview configuration/i)).toBeInTheDocument()
    })

    // Click "Upload New Resume" to restart
    const newResumeButton = screen.getByRole('button', { name: /upload new resume/i })
    fireEvent.click(newResumeButton)

    // Should return to upload page
    await waitFor(() => {
      expect(screen.getByText(/upload your resume/i)).toBeInTheDocument()
    })
  })

  it('should handle network connectivity issues', async () => {
    // Simulate network error
    resumeApi.uploadResume.mockRejectedValue(new Error('Network Error'))

    render(
      <TestWrapper>
        <App />
      </TestWrapper>
    )

    const fileInput = screen.getByLabelText(/choose file/i)
    const file = new File(['resume content'], 'resume.pdf', { type: 'application/pdf' })
    
    fireEvent.change(fileInput, { target: { files: [file] } })
    fireEvent.click(screen.getByRole('button', { name: /upload resume/i }))

    await waitFor(() => {
      expect(screen.getByText(/network error/i)).toBeInTheDocument()
    })

    // Should show retry option
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument()
  })

  it('should preserve state during navigation', async () => {
    resumeApi.uploadResume.mockResolvedValue(mockResumeData)
    questionsApi.generateQuestions.mockResolvedValue(mockQuestions)

    render(
      <TestWrapper>
        <App />
      </TestWrapper>
    )

    // Upload and configure
    const fileInput = screen.getByLabelText(/choose file/i)
    const file = new File(['resume content'], 'resume.pdf', { type: 'application/pdf' })
    
    fireEvent.change(fileInput, { target: { files: [file] } })
    fireEvent.click(screen.getByRole('button', { name: /upload resume/i }))

    await waitFor(() => {
      expect(screen.getByText(/interview configuration/i)).toBeInTheDocument()
    })

    // Verify resume data is preserved
    expect(screen.getByText('JavaScript')).toBeInTheDocument()
    expect(screen.getByText('React')).toBeInTheDocument()
    expect(screen.getByText('Node.js')).toBeInTheDocument()
  })
})