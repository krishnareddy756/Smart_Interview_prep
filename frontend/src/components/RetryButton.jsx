import React from 'react'
import { Button, CircularProgress } from '@mui/material'
import { Refresh } from '@mui/icons-material'

/**
 * Reusable retry button component with loading state
 */
function RetryButton({ 
  onRetry, 
  loading = false, 
  disabled = false,
  maxRetries = 3,
  currentRetries = 0,
  variant = 'outlined',
  size = 'medium',
  children,
  ...props 
}) {
  const isMaxRetriesReached = currentRetries >= maxRetries
  const buttonDisabled = disabled || loading || isMaxRetriesReached

  const getButtonText = () => {
    if (loading) return 'Retrying...'
    if (isMaxRetriesReached) return 'Max retries reached'
    if (children) return children
    return currentRetries > 0 ? `Retry (${currentRetries}/${maxRetries})` : 'Retry'
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={onRetry}
      disabled={buttonDisabled}
      startIcon={loading ? <CircularProgress size={16} /> : <Refresh />}
      {...props}
    >
      {getButtonText()}
    </Button>
  )
}

export default RetryButton