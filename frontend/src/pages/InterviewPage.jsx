import React, { useState, useEffect, useRef } from 'react'
import {
  Paper,
  Typography,
  Box,
  Button,
  LinearProgress,
  Card,
  CardContent,
  IconButton,
  Alert,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField
} from '@mui/material'
import {
  Stop,
  Mic,
  MicOff,
  VolumeUp,
  VolumeOff,
  SkipNext,
  Edit
} from '@mui/icons-material'
import { useApp } from '../context/AppContext'
import speechService from '../services/speechService'
import { analyzeAnswers } from '../api/questions'
import { useMobile, useMobileUI } from '../hooks/useMobile'
import TextOnlyInterview from '../components/TextOnlyInterview'

function InterviewPage() {
  const { state, addAnswer, completeInterview, setError, setLoading } = useApp()
  const { interviewSession } = state
  const { isMobile, getResponsiveSpacing } = useMobile()
  const { getMobileStyles } = useMobileUI()
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [currentAnswer, setCurrentAnswer] = useState('')
  const [recordingTime, setRecordingTime] = useState(0)
  const [speechSupport, setSpeechSupport] = useState(null)
  const [showManualInput, setShowManualInput] = useState(false)
  const [manualAnswer, setManualAnswer] = useState('')
  
  const recordingTimerRef = useRef(null)
  const recognitionTimeoutRef = useRef(null)

  useEffect(() => {
    // Check speech support on component mount
    const checkSupport = async () => {
      const support = speechService.checkBrowserSupport()
      setSpeechSupport(support)
      
      if (!support.synthesis && !support.recognition) {
        setError('Speech features not supported. You can still use text input mode.')
      }
    }
    
    checkSupport()
  }, [setError])

  useEffect(() => {
    // Auto-start first question
    if (interviewSession && currentQuestionIndex === 0) {
      setTimeout(() => {
        handlePlayQuestion()
      }, 1000)
    }
  }, [interviewSession])

  const currentQuestion = interviewSession?.questions[currentQuestionIndex]
  const isLastQuestion = currentQuestionIndex >= (interviewSession?.questions.length - 1)
  const progress = interviewSession ? ((currentQuestionIndex + 1) / interviewSession.questions.length) * 100 : 0

  const handlePlayQuestion = async () => {
    if (!currentQuestion || !speechSupport?.synthesis) {
      return
    }

    setIsPlaying(true)
    
    try {
      await speechService.speak(currentQuestion.text, {
        rate: 0.9,
        pitch: 1,
        volume: 1
      })
      
      // Auto-start recording after question is spoken
      setTimeout(() => {
        handleStartRecording()
      }, 500)
      
    } catch (error) {
      console.error('Speech error:', error)
      setError('Failed to play question. Please use manual controls.')
    } finally {
      setIsPlaying(false)
    }
  }

  const handleStopSpeaking = () => {
    speechService.stopSpeaking()
    setIsPlaying(false)
  }

  const handleStartRecording = async () => {
    if (!speechSupport?.recognition) {
      setShowManualInput(true)
      return
    }

    // Request microphone permission first with mobile-specific handling
    try {
      const hasPermission = await speechService.requestMicrophonePermission()
      if (!hasPermission) {
        setError(isMobile ? 
          'Please enable microphone access in your browser settings and try again.' :
          'Microphone permission required for voice recording'
        )
        setShowManualInput(true)
        return
      }
    } catch (error) {
      setError(error.message)
      setShowManualInput(true)
      return
    }

    setIsRecording(true)
    setCurrentAnswer('')
    setRecordingTime(0)
    
    // Start recording timer
    recordingTimerRef.current = setInterval(() => {
      setRecordingTime(prev => prev + 1)
    }, 1000)

    // Set timeout for recording (30 seconds max)
    recognitionTimeoutRef.current = setTimeout(() => {
      handleStopRecording()
    }, 30000)

    try {
      const transcript = await speechService.startRecognition({
        continuous: true,
        interimResults: true,
        onProgress: (result) => {
          setCurrentAnswer(result.final + (result.interim ? ` ${result.interim}` : ''))
        }
      })
      
      setCurrentAnswer(transcript)
      
    } catch (error) {
      console.error('Recognition error:', error)
      setError('Speech recognition failed. Please use manual input.')
      setShowManualInput(true)
    } finally {
      setIsRecording(false)
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current)
      }
      if (recognitionTimeoutRef.current) {
        clearTimeout(recognitionTimeoutRef.current)
      }
    }
  }

  const handleStopRecording = () => {
    speechService.stopRecognition()
    setIsRecording(false)
    
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current)
    }
    if (recognitionTimeoutRef.current) {
      clearTimeout(recognitionTimeoutRef.current)
    }
  }

  const handleSaveAnswer = () => {
    const answerText = currentAnswer.trim()
    if (!answerText) {
      setError('Please provide an answer before continuing')
      return
    }

    const answer = {
      questionId: currentQuestion.id,
      transcription: answerText,
      timestamp: new Date(),
      recordingTime: recordingTime
    }

    addAnswer(answer)
    
    // Move to next question or complete interview
    if (isLastQuestion) {
      handleCompleteInterview()
    } else {
      setCurrentQuestionIndex(prev => prev + 1)
      setCurrentAnswer('')
      setRecordingTime(0)
      
      // Auto-play next question after a short delay
      setTimeout(() => {
        handlePlayQuestion()
      }, 1500)
    }
  }

  const handleManualInput = () => {
    if (!manualAnswer.trim()) {
      setError('Please enter your answer')
      return
    }

    setCurrentAnswer(manualAnswer)
    setShowManualInput(false)
    setManualAnswer('')
  }

  const handleCompleteInterview = async () => {
    setLoading(true)
    
    try {
      const questions = interviewSession.questions.map(q => q.text)
      const answers = interviewSession.answers.map(a => a.transcription)
      
      const analysis = await analyzeAnswers({
        questions,
        answers,
        role: interviewSession.role,
        level: interviewSession.level
      })
      
      completeInterview(analysis)
      
    } catch (error) {
      setError('Failed to analyze answers. You can still view your responses.')
      completeInterview(null)
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (!interviewSession) {
    return (
      <Paper elevation={3} sx={{ p: 4 }}>
        <Alert severity="error">
          No interview session found. Please generate questions first.
        </Alert>
      </Paper>
    )
  }

  // Render text-only mode if specified
  if (interviewSession.mode === 'text-only') {
    return <TextOnlyInterview />
  }

  return (
    <Box>
      {/* Progress Header */}
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5">
            Interactive Interview
          </Typography>
          <Chip 
            label={`Question ${currentQuestionIndex + 1} of ${interviewSession.questions.length}`}
            color="primary"
          />
        </Box>
        
        <LinearProgress 
          variant="determinate" 
          value={progress} 
          sx={{ height: 8, borderRadius: 4 }}
        />
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
          <Typography variant="body2" color="text.secondary">
            {interviewSession.role} - {interviewSession.level}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {Math.round(progress)}% Complete
          </Typography>
        </Box>
      </Paper>

      {/* Current Question */}
      <Card elevation={2} sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Chip 
              label={currentQuestion?.type === 'intro' ? 'Introduction' : 
                    currentQuestion?.type === 'role' ? 'Technical' : 'Behavioral'}
              color={currentQuestion?.type === 'intro' ? 'info' : 
                    currentQuestion?.type === 'role' ? 'primary' : 'secondary'}
              size="small"
            />
            
            <Box>
              {speechSupport?.synthesis && (
                <>
                  <IconButton 
                    onClick={handlePlayQuestion}
                    disabled={isPlaying}
                    color="primary"
                  >
                    <VolumeUp />
                  </IconButton>
                  <IconButton 
                    onClick={handleStopSpeaking}
                    disabled={!isPlaying}
                  >
                    <VolumeOff />
                  </IconButton>
                </>
              )}
            </Box>
          </Box>
          
          <Typography variant="h6" sx={{ mb: 2, lineHeight: 1.6 }}>
            {currentQuestion?.text}
          </Typography>
          
          {isPlaying && (
            <Alert severity="info" sx={{ mb: 2 }}>
              🔊 Speaking question... Recording will start automatically when finished.
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Recording Section */}
      <Card elevation={2} sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Your Answer
          </Typography>
          
          {/* Recording Controls */}
          <Box sx={{ 
            display: 'flex', 
            gap: getResponsiveSpacing(1, 2, 2), 
            mb: 2, 
            alignItems: 'center',
            flexDirection: { xs: 'column', sm: 'row' },
            '& > *': { 
              width: { xs: '100%', sm: 'auto' },
              ...getMobileStyles()
            }
          }}>
            {speechSupport?.recognition ? (
              <>
                <Button
                  variant={isRecording ? "contained" : "outlined"}
                  color={isRecording ? "error" : "primary"}
                  startIcon={isRecording ? <MicOff /> : <Mic />}
                  onClick={isRecording ? handleStopRecording : handleStartRecording}
                  disabled={isPlaying}
                  size={isMobile ? "large" : "medium"}
                  sx={{ 
                    minHeight: isMobile ? '56px' : '40px',
                    fontSize: isMobile ? '1.1rem' : '0.875rem'
                  }}
                >
                  {isRecording ? 
                    (isMobile ? 'Stop' : 'Stop Recording') : 
                    (isMobile ? 'Record' : 'Start Recording')
                  }
                </Button>
                
                {isRecording && (
                  <Chip 
                    label={`${formatTime(recordingTime)}`}
                    color="error"
                    variant="outlined"
                    sx={{ 
                      fontSize: isMobile ? '0.9rem' : '0.75rem',
                      height: isMobile ? '40px' : '32px'
                    }}
                  />
                )}
              </>
            ) : (
              <Alert severity="warning" sx={{ flexGrow: 1 }}>
                {isMobile ? 
                  'Voice recording not available. Use text input.' :
                  'Speech recognition not available. Please use manual input.'
                }
              </Alert>
            )}
            
            <Button
              variant="outlined"
              startIcon={<Edit />}
              onClick={() => setShowManualInput(true)}
              size={isMobile ? "large" : "medium"}
              sx={{ 
                minHeight: isMobile ? '56px' : '40px',
                fontSize: isMobile ? '1.1rem' : '0.875rem'
              }}
            >
              {isMobile ? 'Type' : 'Manual Input'}
            </Button>
          </Box>
          
          {/* Answer Display */}
          {currentAnswer && (
            <Box sx={{ 
              p: 2, 
              bgcolor: 'background.paper', 
              border: 1, 
              borderColor: 'divider',
              borderRadius: 1,
              mb: 2
            }}>
              <Typography variant="body1">
                {currentAnswer}
              </Typography>
            </Box>
          )}
          
          {/* Action Buttons */}
          <Box sx={{ 
            display: 'flex', 
            gap: 2, 
            justifyContent: { xs: 'center', sm: 'flex-end' },
            mt: 2
          }}>
            <Button
              variant="contained"
              onClick={handleSaveAnswer}
              disabled={!currentAnswer.trim() || isRecording || isPlaying}
              startIcon={isLastQuestion ? <Stop /> : <SkipNext />}
              size={isMobile ? "large" : "medium"}
              sx={{ 
                minHeight: isMobile ? '56px' : '40px',
                fontSize: isMobile ? '1.1rem' : '0.875rem',
                px: isMobile ? 4 : 2,
                width: { xs: '100%', sm: 'auto' }
              }}
            >
              {isLastQuestion ? 
                (isMobile ? 'Finish' : 'Complete Interview') : 
                (isMobile ? 'Next' : 'Next Question')
              }
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Manual Input Dialog */}
      <Dialog 
        open={showManualInput} 
        onClose={() => setShowManualInput(false)}
        maxWidth="md"
        fullWidth
        fullScreen={isMobile}
        PaperProps={{
          sx: {
            ...(isMobile && {
              margin: 0,
              maxHeight: '100vh',
              borderRadius: 0
            })
          }
        }}
      >
        <DialogTitle sx={{ 
          fontSize: isMobile ? '1.25rem' : '1.5rem',
          pb: 1
        }}>
          Enter Your Answer
        </DialogTitle>
        <DialogContent sx={{ pb: 1 }}>
          <TextField
            autoFocus={!isMobile} // Prevent auto-focus on mobile to avoid keyboard issues
            multiline
            rows={isMobile ? 8 : 4}
            fullWidth
            variant="outlined"
            placeholder="Type your answer here..."
            value={manualAnswer}
            onChange={(e) => setManualAnswer(e.target.value)}
            sx={{ 
              mt: 1,
              '& .MuiInputBase-root': {
                fontSize: isMobile ? '16px' : '14px', // Prevent zoom on iOS
                lineHeight: 1.5
              }
            }}
          />
        </DialogContent>
        <DialogActions sx={{ 
          p: 2,
          gap: 1,
          flexDirection: { xs: 'column', sm: 'row' }
        }}>
          <Button 
            onClick={() => setShowManualInput(false)}
            size={isMobile ? "large" : "medium"}
            sx={{ 
              width: { xs: '100%', sm: 'auto' },
              order: { xs: 2, sm: 1 }
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleManualInput}
            variant="contained"
            disabled={!manualAnswer.trim()}
            size={isMobile ? "large" : "medium"}
            sx={{ 
              width: { xs: '100%', sm: 'auto' },
              order: { xs: 1, sm: 2 }
            }}
          >
            Use This Answer
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default InterviewPage