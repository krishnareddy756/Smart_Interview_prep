import { useState, useCallback } from 'react'
import { useApp } from '../context/AppContext'

/**
 * Custom hook for centralized error handling
 */
export function useErrorHandler() {
  const { setError } = useApp()
  const [retryAttempts, setRetryAttempts] = useState({})

  const handleError = useCallback((error, context = 'Unknown') => {
    console.error(`Error in ${context}:`, error)
    
    let userMessage = 'An unexpected error occurred'
    
    // Handle different types of errors
    if (error.name === 'NetworkError' || error.code === 'NETWORK_ERROR') {
      userMessage = 'Network connection failed. Please check your internet connection and try again.'
    } else if (error.name === 'TimeoutError') {
      userMessage = 'Request timed out. Please try again.'
    } else if (error.response) {
      // HTTP error responses
      const status = error.response.status
      switch (status) {
        case 400:
          userMessage = error.response.data?.error?.message || 'Invalid request. Please check your input.'
          break
        case 401:
          userMessage = 'Authentication required. Please refresh the page.'
          break
        case 403:
          userMessage = 'Access denied. You don\'t have permission to perform this action.'
          break
        case 404:
          userMessage = 'The requested resource was not found.'
          break
        case 413:
          userMessage = 'File too large. Please upload a smaller file (max 10MB).'
          break
        case 429:
          userMessage = 'Too many requests. Please wait a moment and try again.'
          break
        case 500:
          userMessage = 'Server error. Please try again later.'
          break
        case 502:
        case 503:
        case 504:
          userMessage = 'Service temporarily unavailable. Please try again later.'
          break
        default:
          userMessage = `Server error (${status}). Please try again.`
      }
    } else if (error.message) {
      // Use the error message if it's user-friendly
      if (error.message.includes('fetch')) {
        userMessage = 'Network connection failed. Please check your internet connection.'
      } else if (error.message.includes('timeout')) {
        userMessage = 'Request timed out. Please try again.'
      } else if (error.message.length < 100 && !error.message.includes('stack')) {
        userMessage = error.message
      }
    }

    setError(userMessage)
  }, [setError])

  const withErrorHandling = useCallback((asyncFunction, context = 'Operation') => {
    return async (...args) => {
      try {
        return await asyncFunction(...args)
      } catch (error) {
        handleError(error, context)
        throw error // Re-throw so calling code can handle if needed
      }
    }
  }, [handleError])

  const retryWithBackoff = useCallback(async (
    asyncFunction, 
    maxRetries = 3, 
    baseDelay = 1000,
    context = 'Operation'
  ) => {
    const key = context
    const currentAttempts = retryAttempts[key] || 0
    
    for (let attempt = currentAttempts; attempt < maxRetries; attempt++) {
      try {
        setRetryAttempts(prev => ({ ...prev, [key]: attempt + 1 }))
        const result = await asyncFunction()
        
        // Reset retry count on success
        setRetryAttempts(prev => ({ ...prev, [key]: 0 }))
        return result
        
      } catch (error) {
        const isLastAttempt = attempt === maxRetries - 1
        
        if (isLastAttempt) {
          handleError(error, `${context} (after ${maxRetries} attempts)`)
          throw error
        }
        
        // Wait before retrying with exponential backoff
        const delay = baseDelay * Math.pow(2, attempt)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }, [retryAttempts, handleError])

  const clearRetryAttempts = useCallback((context) => {
    setRetryAttempts(prev => ({ ...prev, [context]: 0 }))
  }, [])

  return {
    handleError,
    withErrorHandling,
    retryWithBackoff,
    clearRetryAttempts,
    retryAttempts
  }
}

/**
 * Hook for handling API errors specifically
 */
export function useApiErrorHandler() {
  const { handleError } = useErrorHandler()

  const handleApiError = useCallback((error, endpoint = 'API') => {
    // Add API-specific error handling
    if (error.code === 'ECONNABORTED') {
      handleError(new Error('Request timeout. The server is taking too long to respond.'), endpoint)
    } else if (error.response?.status === 413) {
      handleError(new Error('File too large. Please upload a file smaller than 10MB.'), endpoint)
    } else if (error.response?.status === 415) {
      handleError(new Error('Unsupported file format. Please upload a PDF or DOCX file.'), endpoint)
    } else if (error.response?.data?.error?.message) {
      handleError(new Error(error.response.data.error.message), endpoint)
    } else {
      handleError(error, endpoint)
    }
  }, [handleError])

  return { handleApiError }
}

/**
 * Hook for handling speech-related errors
 */
export function useSpeechErrorHandler() {
  const { handleError } = useErrorHandler()

  const handleSpeechError = useCallback((error, operation = 'Speech') => {
    let userMessage = 'Speech feature encountered an error'
    
    if (error.message.includes('not supported')) {
      userMessage = 'Speech features are not supported in this browser. Please use manual input.'
    } else if (error.message.includes('permission')) {
      userMessage = 'Microphone permission is required. Please enable it in your browser settings.'
    } else if (error.message.includes('network')) {
      userMessage = 'Speech recognition requires an internet connection.'
    } else if (error.message.includes('no-speech')) {
      userMessage = 'No speech detected. Please try speaking again.'
    } else if (error.message.includes('audio-capture')) {
      userMessage = 'Microphone not available. Please check your device settings.'
    } else if (error.message.includes('not-allowed')) {
      userMessage = 'Microphone access denied. Please enable microphone permissions.'
    }
    
    handleError(new Error(userMessage), operation)
  }, [handleError])

  return { handleSpeechError }
}