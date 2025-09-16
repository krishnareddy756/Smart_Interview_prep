import React, { useState } from 'react'
import {
  Button,
  IconButton,
  Tooltip,
  Box,
  Typography
} from '@mui/material'
import {
  ContentCopy,
  Check,
  Error as ErrorIcon
} from '@mui/icons-material'

/**
 * Copy button component with feedback
 */
function CopyButton({ 
  text, 
  variant = 'icon', 
  size = 'medium',
  label = 'Copy',
  successMessage = 'Copied to clipboard!',
  errorMessage = 'Failed to copy',
  disabled = false,
  ...props 
}) {
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState(false)

  const handleCopy = async () => {
    if (!text || disabled) return

    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setError(false)
      
      // Reset copied state after 2 seconds
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Copy failed:', err)
      setError(true)
      setCopied(false)
      
      // Reset error state after 2 seconds
      setTimeout(() => setError(false), 2000)
    }
  }

  const getIcon = () => {
    if (error) return <ErrorIcon color="error" />
    if (copied) return <Check color="success" />
    return <ContentCopy />
  }

  const getTooltipTitle = () => {
    if (error) return 'Copy failed'
    if (copied) return 'Copied!'
    return 'Copy to clipboard'
  }

  if (variant === 'icon') {
    return (
      <Tooltip title={getTooltipTitle()}>
        <IconButton
          onClick={handleCopy}
          disabled={disabled || !text}
          size={size}
          color={copied ? 'success' : error ? 'error' : 'default'}
          {...props}
        >
          {getIcon()}
        </IconButton>
      </Tooltip>
    )
  }

  return (
    <Button
      onClick={handleCopy}
      disabled={disabled || !text}
      startIcon={getIcon()}
      size={size}
      color={copied ? 'success' : error ? 'error' : 'primary'}
      {...props}
    >
      {copied ? 'Copied!' : error ? 'Failed' : label}
    </Button>
  )
}

/**
 * Copy text area component with copy button
 */
export function CopyTextArea({ 
  text, 
  label, 
  maxHeight = 200,
  ...props 
}) {
  return (
    <Box sx={{ position: 'relative', ...props.sx }}>
      {label && (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="subtitle2" color="text.secondary">
            {label}
          </Typography>
          <CopyButton text={text} size="small" />
        </Box>
      )}
      
      <Box
        sx={{
          p: 2,
          bgcolor: 'grey.50',
          border: 1,
          borderColor: 'grey.300',
          borderRadius: 1,
          maxHeight,
          overflow: 'auto',
          fontFamily: 'monospace',
          fontSize: '0.875rem',
          lineHeight: 1.5,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word'
        }}
      >
        <Typography variant="body2">{text}</Typography>
      </Box>
    </Box>
  )
}

/**
 * Copy list component with individual copy buttons
 */
export function CopyList({ 
  items, 
  title,
  showIndividualCopy = true,
  showCopyAll = true,
  numbered = false,
  ...props 
}) {
  const allText = items.map((item, index) => 
    numbered ? `${index + 1}. ${item}` : `• ${item}`
  ).join('\n')

  return (
    <Box {...props}>
      {title && (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">{title}</Typography>
          {showCopyAll && (
            <CopyButton 
              text={allText} 
              label="Copy All" 
              variant="button"
              size="small"
            />
          )}
        </Box>
      )}
      
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {items.map((item, index) => (
          <Box 
            key={index}
            sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'flex-start',
              p: 1,
              bgcolor: 'grey.50',
              borderRadius: 1,
              '&:hover': {
                bgcolor: 'grey.100'
              }
            }}
          >
            <Typography variant="body2" sx={{ flexGrow: 1, mr: 1 }}>
              {numbered && `${index + 1}. `}{item}
            </Typography>
            
            {showIndividualCopy && (
              <CopyButton 
                text={item} 
                size="small"
                successMessage={`Question ${index + 1} copied!`}
              />
            )}
          </Box>
        ))}
      </Box>
    </Box>
  )
}

export default CopyButton