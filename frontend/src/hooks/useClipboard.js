import { useState, useCallback } from 'react'

/**
 * Custom hook for clipboard operations
 */
export function useClipboard() {
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState(null)

  const copyToClipboard = useCallback(async (text) => {
    try {
      setError(null)
      
      if (navigator.clipboard && window.isSecureContext) {
        // Use modern clipboard API
        await navigator.clipboard.writeText(text)
      } else {
        // Fallback for older browsers or non-secure contexts
        const textArea = document.createElement('textarea')
        textArea.value = text
        textArea.style.position = 'fixed'
        textArea.style.left = '-999999px'
        textArea.style.top = '-999999px'
        document.body.appendChild(textArea)
        textArea.focus()
        textArea.select()
        
        const successful = document.execCommand('copy')
        document.body.removeChild(textArea)
        
        if (!successful) {
          throw new Error('Copy command failed')
        }
      }
      
      setCopied(true)
      
      // Reset copied state after 2 seconds
      setTimeout(() => setCopied(false), 2000)
      
      return true
    } catch (err) {
      console.error('Failed to copy text:', err)
      setError('Failed to copy to clipboard')
      return false
    }
  }, [])

  const resetState = useCallback(() => {
    setCopied(false)
    setError(null)
  }, [])

  return {
    copyToClipboard,
    copied,
    error,
    resetState,
    isSupported: !!(navigator.clipboard || document.execCommand)
  }
}