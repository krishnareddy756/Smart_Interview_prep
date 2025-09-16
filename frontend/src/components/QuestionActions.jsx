import React, { useState } from 'react'
import {
  Box,
  Button,
  ButtonGroup,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Chip,
  IconButton,
  Tooltip
} from '@mui/material'
import {
  Refresh,
  ContentCopy,
  Download,
  Share,
  MoreVert,
  CheckCircle,
  RadioButtonUnchecked
} from '@mui/icons-material'

/**
 * Question actions component with regenerate, copy, and practice tracking
 */
function QuestionActions({ 
  questions = [],
  onRegenerate,
  onMarkPracticed,
  practicedQuestions = [],
  role,
  level,
  loading = false
}) {
  const [anchorEl, setAnchorEl] = useState(null)
  const [showCopyDialog, setShowCopyDialog] = useState(false)

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
  }

  const handleCopyAll = async () => {
    try {
      const questionsText = questions.map((q, index) => 
        `${index + 1}. ${q.text} [${q.type?.toUpperCase()}]`
      ).join('\n\n')
      
      const content = `Interview Questions - ${role} (${level})\n${'='.repeat(50)}\n\n${questionsText}\n\nGenerated on: ${new Date().toLocaleString()}`
      
      await navigator.clipboard.writeText(content)
      console.log('All questions copied to clipboard!')
    } catch (error) {
      console.error('Failed to copy questions:', error)
    }
    handleMenuClose()
  }

  const handleExport = () => {
    const questionsText = questions.map((q, index) => 
      `${index + 1}. ${q.text} [${q.type?.toUpperCase()}]`
    ).join('\n\n')
    
    const content = `Interview Questions - ${role} (${level})\n${'='.repeat(50)}\n\n${questionsText}\n\nGenerated on: ${new Date().toLocaleString()}`
    
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `interview-questions-${role.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    console.log('Questions exported successfully!')
    handleMenuClose()
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Interview Questions - ${role}`,
          text: `Practice questions for ${role} position (${level} level)`,
          url: window.location.href
        })
        console.log('Questions shared successfully!')
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('Failed to share questions:', error)
        }
      }
    } else {
      // Fallback to copying URL
      try {
        await navigator.clipboard.writeText(window.location.href)
        console.log('Link copied to clipboard!')
      } catch (error) {
        console.error('Sharing not supported on this device:', error)
      }
    }
    handleMenuClose()
  }

  const getPracticedCount = () => {
    return questions.filter(q => practicedQuestions.includes(q.id)).length
  }

  return (
    <Box>
      {/* Main Actions */}
      <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
        <Button
          variant="contained"
          startIcon={<Refresh />}
          onClick={onRegenerate}
          disabled={loading}
        >
          Regenerate Questions
        </Button>
        
        <ButtonGroup variant="outlined">
          <Button
            startIcon={<ContentCopy />}
            onClick={handleCopyAll}
          >
            Copy All
          </Button>
          
          <Button
            onClick={handleMenuOpen}
            size="small"
            sx={{ minWidth: 'auto', px: 1 }}
          >
            <MoreVert />
          </Button>
        </ButtonGroup>
      </Box>

      {/* Progress Indicator */}
      {questions.length > 0 && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Practice Progress:
          </Typography>
          <Chip
            label={`${getPracticedCount()}/${questions.length} completed`}
            color={getPracticedCount() === questions.length ? 'success' : 'default'}
            size="small"
          />
        </Box>
      )}

      {/* Questions List with Practice Tracking */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {questions.map((question, index) => {
          const isPracticed = practicedQuestions.includes(question.id)
          
          return (
            <Box
              key={question.id || index}
              sx={{
                display: 'flex',
                alignItems: 'flex-start',
                p: 2,
                bgcolor: isPracticed ? 'success.50' : 'grey.50',
                borderRadius: 1,
                border: 1,
                borderColor: isPracticed ? 'success.200' : 'grey.200',
                '&:hover': {
                  bgcolor: isPracticed ? 'success.100' : 'grey.100'
                }
              }}
            >
              <Tooltip title={isPracticed ? 'Mark as not practiced' : 'Mark as practiced'}>
                <IconButton
                  onClick={() => onMarkPracticed?.(question.id, !isPracticed)}
                  sx={{ 
                    mr: 2,
                    color: isPracticed ? 'success.main' : 'text.disabled'
                  }}
                >
                  {isPracticed ? <CheckCircle /> : <RadioButtonUnchecked />}
                </IconButton>
              </Tooltip>
              
              <Box sx={{ flexGrow: 1, mr: 1 }}>
                <Typography variant="body1" sx={{ mb: 0.5 }}>
                  <strong>Q{index + 1}:</strong> {question.text}
                </Typography>
                
                {question.type && (
                  <Chip
                    label={question.type.replace(/([A-Z])/g, ' $1').trim()}
                    size="small"
                    variant="outlined"
                    sx={{ fontSize: '0.75rem' }}
                  />
                )}
              </Box>
              
              <Tooltip title="Copy question">
                <IconButton
                  onClick={() => navigator.clipboard.writeText(question.text)}
                  size="small"
                >
                  <ContentCopy fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          )
        })}
      </Box>

      {/* More Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem onClick={() => setShowCopyDialog(true)}>
          <ListItemIcon>
            <ContentCopy fontSize="small" />
          </ListItemIcon>
          <ListItemText>Copy Options</ListItemText>
        </MenuItem>
        
        <MenuItem onClick={handleExport}>
          <ListItemIcon>
            <Download fontSize="small" />
          </ListItemIcon>
          <ListItemText>Export as Text</ListItemText>
        </MenuItem>
        
        <MenuItem onClick={handleShare}>
          <ListItemIcon>
            <Share fontSize="small" />
          </ListItemIcon>
          <ListItemText>Share</ListItemText>
        </MenuItem>
      </Menu>

      {/* Copy Options Dialog */}
      <Dialog
        open={showCopyDialog}
        onClose={() => setShowCopyDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Copy Questions</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Choose how you want to copy the questions:
          </Typography>
          {questions.map((question, index) => (
            <Box key={index} sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
              <Typography variant="body2" sx={{ flexGrow: 1 }}>
                {index + 1}. {question.text.substring(0, 50)}...
              </Typography>
              <Button
                size="small"
                onClick={() => navigator.clipboard.writeText(question.text)}
              >
                Copy
              </Button>
            </Box>
          ))}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCopyDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default QuestionActions