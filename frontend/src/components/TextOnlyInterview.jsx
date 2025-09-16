import React, { useState } from 'react'
import {
  Paper,
  Typography,
  Box,
  Button,
  TextField,
  LinearProgress,
  Chip,
  Alert,
  Divider
} from '@mui/material'
import {
  NavigateNext,
  NavigateBefore,
  Save,
  CheckCircle
} from '@mui/icons-material'
import { useApp } from '../context/AppContext'
import QuestionCard from './QuestionCard'
import { useMobile } from '../hooks/useMobile'

/**
 * Text-only interview mode for users who prefer typing or don't have speech support
 */
function TextOnlyInterview() {
  const { state, addAnswer, completeInterview, setError, setLoading } = useApp()
  const { interviewSession } = state
  const { isMobile } = useMobile()
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState({})
  const [currentAnswer, setCurrentAnswer] = useState('')

  if (!interviewSession) {
    return (
      <Alert severity="error">
        No interview session found. Please generate questions first.
      </Alert>
    )
  }

  const currentQuestion = interviewSession.questions[currentQuestionIndex]
  const totalQuestions = interviewSession.questions.length
  const progress = ((currentQuestionIndex + 1) / totalQuestions) * 100
  const isLastQuestion = currentQuestionIndex >= totalQuestions - 1
  const answeredQuestions = Object.keys(answers).length

  const handleSaveAnswer = () => {
    if (!currentAnswer.trim()) {
      setError('Please provide an answer before continuing')
      return
    }

    // Save answer to local state
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: currentAnswer.trim()
    }))

    // Add to app state
    const answer = {
      questionId: currentQuestion.id,
      transcription: currentAnswer.trim(),
      timestamp: new Date(),
      mode: 'text-only'
    }
    addAnswer(answer)

    // Clear current answer
    setCurrentAnswer('')

    // Move to next question or complete
    if (isLastQuestion) {
      handleCompleteInterview()
    } else {
      setCurrentQuestionIndex(prev => prev + 1)
    }
  }

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      // Save current answer if any
      if (currentAnswer.trim()) {
        setAnswers(prev => ({
          ...prev,
          [currentQuestion.id]: currentAnswer.trim()
        }))
      }
      
      setCurrentQuestionIndex(prev => prev - 1)
      
      // Load previous answer if exists
      const prevQuestion = interviewSession.questions[currentQuestionIndex - 1]
      setCurrentAnswer(answers[prevQuestion.id] || '')
    }
  }

  const handleNextQuestion = () => {
    if (currentQuestionIndex < totalQuestions - 1) {
      // Save current answer if any
      if (currentAnswer.trim()) {
        setAnswers(prev => ({
          ...prev,
          [currentQuestion.id]: currentAnswer.trim()
        }))
      }
      
      setCurrentQuestionIndex(prev => prev + 1)
      
      // Load next answer if exists
      const nextQuestion = interviewSession.questions[currentQuestionIndex + 1]
      setCurrentAnswer(answers[nextQuestion.id] || '')
    }
  }

  const handleCompleteInterview = async () => {
    setLoading(true)
    
    try {
      // Ensure all answers are saved
      const allAnswers = { ...answers }
      if (currentAnswer.trim()) {
        allAnswers[currentQuestion.id] = currentAnswer.trim()
      }

      // Convert to the expected format
      const questions = interviewSession.questions.map(q => q.text)
      const answerTexts = interviewSession.questions.map(q => allAnswers[q.id] || '')

      // For now, complete without AI analysis in text-only mode
      // You could add AI analysis here if needed
      completeInterview({
        questions: questions,
        answers: answerTexts,
        mode: 'text-only',
        completedAt: new Date()
      })
      
    } catch (error) {
      setError('Failed to complete interview. Your answers have been saved.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box>
      {/* Progress Header */}
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5">
            Text-Only Interview
          </Typography>
          <Chip 
            label={`${answeredQuestions}/${totalQuestions} answered`}
            color={answeredQuestions === totalQuestions ? "success" : "primary"}
            icon={answeredQuestions === totalQuestions ? <CheckCircle /> : undefined}
          />
        </Box>
        
        <LinearProgress 
          variant="determinate" 
          value={progress} 
          sx={{ height: 8, borderRadius: 4, mb: 1 }}
        />
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant="body2" color="text.secondary">
            Question {currentQuestionIndex + 1} of {totalQuestions}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {Math.round(progress)}% Complete
          </Typography>
        </Box>
      </Paper>

      {/* Current Question */}
      <QuestionCard
        question={currentQuestion}
        index={currentQuestionIndex}
        total={totalQuestions}
        showActions={false}
        elevation={2}
      />

      {/* Answer Input */}
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Your Answer
        </Typography>
        
        <TextField
          multiline
          rows={isMobile ? 6 : 4}
          fullWidth
          variant="outlined"
          placeholder="Type your answer here..."
          value={currentAnswer}
          onChange={(e) => setCurrentAnswer(e.target.value)}
          sx={{ 
            mb: 2,
            '& .MuiInputBase-root': {
              fontSize: isMobile ? '16px' : '14px' // Prevent zoom on iOS
            }
          }}
        />
        
        <Typography variant="caption" color="text.secondary">
          Characters: {currentAnswer.length} | Words: {currentAnswer.trim().split(/\s+/).filter(w => w).length}
        </Typography>
      </Paper>

      {/* Navigation */}
      <Paper elevation={2} sx={{ p: 3 }}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center',
          flexDirection: { xs: 'column', sm: 'row' },
          gap: 2
        }}>
          {/* Previous Button */}
          <Button
            variant="outlined"
            startIcon={<NavigateBefore />}
            onClick={handlePreviousQuestion}
            disabled={currentQuestionIndex === 0}
            sx={{ 
              width: { xs: '100%', sm: 'auto' },
              order: { xs: 2, sm: 1 }
            }}
          >
            Previous
          </Button>

          {/* Save & Continue / Complete */}
          <Button
            variant="contained"
            onClick={handleSaveAnswer}
            disabled={!currentAnswer.trim()}
            startIcon={isLastQuestion ? <Save /> : <NavigateNext />}
            size="large"
            sx={{ 
              width: { xs: '100%', sm: 'auto' },
              order: { xs: 1, sm: 2 }
            }}
          >
            {isLastQuestion ? 'Complete Interview' : 'Save & Continue'}
          </Button>

          {/* Next Button (for navigation without saving) */}
          {!isLastQuestion && (
            <Button
              variant="text"
              endIcon={<NavigateNext />}
              onClick={handleNextQuestion}
              sx={{ 
                width: { xs: '100%', sm: 'auto' },
                order: { xs: 3, sm: 3 }
              }}
            >
              Skip for now
            </Button>
          )}
        </Box>

        {/* Progress Summary */}
        <Divider sx={{ my: 2 }} />
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            You can navigate between questions and come back to edit your answers
          </Typography>
        </Box>
      </Paper>
    </Box>
  )
}

export default TextOnlyInterview