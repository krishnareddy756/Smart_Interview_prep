/**
 * Clipboard utilities for copying text and handling clipboard operations
 */

/**
 * Copy text to clipboard using modern Clipboard API with fallback
 * @param {string} text - Text to copy
 * @returns {Promise<boolean>} Success status
 */
export async function copyToClipboard(text) {
  try {
    // Modern Clipboard API (preferred)
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text)
      return true
    }
    
    // Fallback for older browsers or non-secure contexts
    return fallbackCopyToClipboard(text)
  } catch (error) {
    console.error('Failed to copy to clipboard:', error)
    return fallbackCopyToClipboard(text)
  }
}

/**
 * Fallback clipboard copy using document.execCommand
 * @param {string} text - Text to copy
 * @returns {boolean} Success status
 */
function fallbackCopyToClipboard(text) {
  try {
    // Create a temporary textarea element
    const textArea = document.createElement('textarea')
    textArea.value = text
    
    // Make it invisible but still selectable
    textArea.style.position = 'fixed'
    textArea.style.left = '-999999px'
    textArea.style.top = '-999999px'
    textArea.setAttribute('readonly', '')
    textArea.style.opacity = '0'
    
    document.body.appendChild(textArea)
    
    // Select and copy the text
    textArea.focus()
    textArea.select()
    textArea.setSelectionRange(0, 99999) // For mobile devices
    
    const successful = document.execCommand('copy')
    document.body.removeChild(textArea)
    
    return successful
  } catch (error) {
    console.error('Fallback copy failed:', error)
    return false
  }
}

/**
 * Copy interview questions with formatting
 * @param {Array} questions - Array of question objects
 * @param {Object} options - Formatting options
 * @returns {Promise<boolean>} Success status
 */
export async function copyInterviewQuestions(questions, options = {}) {
  const {
    includeTypes = true,
    numbered = true,
    includeTimestamp = true
  } = options
  
  let formattedText = 'Interview Questions\n'
  formattedText += '='.repeat(20) + '\n\n'
  
  questions.forEach((question, index) => {
    const number = numbered ? `${index + 1}. ` : ''
    const type = includeTypes && question.type ? ` [${question.type.toUpperCase()}]` : ''
    
    formattedText += `${number}${question.text}${type}\n\n`
  })
  
  if (includeTimestamp) {
    formattedText += `\nGenerated on: ${new Date().toLocaleString()}`
  }
  
  return copyToClipboard(formattedText)
}