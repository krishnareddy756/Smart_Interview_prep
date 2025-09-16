import { useEffect } from 'react'
import { useMobile } from '../hooks/useMobile'

/**
 * Component to manage mobile viewport settings
 */
function MobileViewport() {
  const { isMobile } = useMobile()

  useEffect(() => {
    if (!isMobile) return

    // Get or create viewport meta tag
    let viewport = document.querySelector('meta[name=viewport]')
    if (!viewport) {
      viewport = document.createElement('meta')
      viewport.name = 'viewport'
      document.head.appendChild(viewport)
    }

    // Set mobile-optimized viewport
    viewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes'

    // Prevent zoom on input focus for iOS
    const handleFocusIn = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        viewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no'
      }
    }

    const handleFocusOut = () => {
      viewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes'
    }

    // Add event listeners for iOS zoom prevention
    document.addEventListener('focusin', handleFocusIn)
    document.addEventListener('focusout', handleFocusOut)

    // Cleanup
    return () => {
      document.removeEventListener('focusin', handleFocusIn)
      document.removeEventListener('focusout', handleFocusOut)
    }
  }, [isMobile])

  return null // This component doesn't render anything
}

export default MobileViewport