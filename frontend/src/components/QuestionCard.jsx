import React from 'react'
import {
  Card,
  CardContent,
  Typography,
  IconButton,
  Chip,
  Box,
  Tooltip,
  Snackbar,
  Alert
} from '@mui/material'
import {
  ContentCopy,
  VolumeUp,
  CheckCircle
} from '@mui/icons-material'
import { useClipboard } from '../hooks/useClipboard'
import speechService from '../services/speechService'

/**
 * Enhanced question card component with copy and speech features
 */
function QuestionCard({ 
  question, 
  index, 
  total,
  showActions = true,
  variant = 'outlined',
  elevation = 0
}) {
  const { copyToClipboard, copied, error } = useClipboard()

  const getQuestionTypeInfo = (type) => {
    switch (type) {
      case 'intro':
        return { label: 'Introduction', color: 'info' }
      case 'role':
        return { label: 'Technical', color: 'primary' }
      case 'openEnded':
        return { label: 'Behavioral', color: 'secondary' }
      default:
        return { label: 'Question', color: 'default' }
    }
  }

  const handleCopyQuestion = async () => {
    const success = await copyToClipboard(question.text)
    if (!success && error) {
      console.error('Copy failed:', error)
    }
  }

  const handleSpeakQuestion = async () => {
    try {
      await speechService.speak(question.text, {
        rate: 0.9,
        pitch: 1,
        volume: 1
      })
    } catch (error) {
      console.error('Speech failed:', error)
    }
  }

  const typeInfo = getQuestionTypeInfo(question.type)

  return (
    <>
      <Card variant={variant} elevation={elevation} sx={{ mb: 2 }}>
        <CardContent>
          {/* Header with question type and number */}
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            mb: 2
          }}>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <Chip 
                label={typeInfo.label}
                color={typeInfo.color}
                size="small"
              />
              {total && (
                <Typography variant="caption" color="text.secondary">
                  {index + 1} of {total}
                </Typography>
              )}
            </Box>
            
            {showActions && (
              <Box>
                <Tooltip title={copied ? "Copied!" : "Copy question"}>
                  <IconButton 
                    onClick={handleCopyQuestion}
                    size="small"
                    color={copied ? "success" : "default"}
                  >
                    {copied ? <CheckCircle /> : <ContentCopy />}
                  </IconButton>
                </Tooltip>
                
                <Tooltip title="Read question aloud">
                  <IconButton 
                    onClick={handleSpeakQuestion}
                    size="small"
                    color="primary"
                  >
                    <VolumeUp />
                  </IconButton>
                </Tooltip>
              </Box>
            )}
          </Box>
          
          {/* Question text */}
          <Typography 
            variant="h6" 
            sx={{ 
              lineHeight: 1.6,
              fontSize: { xs: '1.1rem', sm: '1.25rem' }
            }}
          >
            {question.text}
          </Typography>
        </CardContent>
      </Card>

      {/* Copy error snackbar */}
      <Snackbar
        open={!!error}
        autoHideDuration={3000}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="error" onClose={() => {}}>
          {error}
        </Alert>
      </Snackbar>
    </>
  )
}

export default QuestionCard