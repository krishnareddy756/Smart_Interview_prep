import { useState, useEffect } from 'react'
import { useTheme } from '@mui/material/styles'
import { useMediaQuery } from '@mui/material'

/**
 * Custom hook for mobile device detection and responsive behavior
 */
export function useMobile() {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'))
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'))

  const [touchSupport, setTouchSupport] = useState(false)
  const [orientation, setOrientation] = useState('portrait')

  useEffect(() => {
    // Check for touch support
    const hasTouchSupport = 'ontouchstart' in window || navigator.maxTouchPoints > 0
    setTouchSupport(hasTouchSupport)

    // Handle orientation changes
    const handleOrientationChange = () => {
      setOrientation(window.innerHeight > window.innerWidth ? 'portrait' : 'landscape')
    }

    handleOrientationChange()
    window.addEventListener('resize', handleOrientationChange)
    window.addEventListener('orientationchange', handleOrientationChange)

    return () => {
      window.removeEventListener('resize', handleOrientationChange)
      window.removeEventListener('orientationchange', handleOrientationChange)
    }
  }, [])

  return {
    isMobile,
    isTablet,
    isDesktop,
    touchSupport,
    orientation,
    // Utility functions
    getResponsiveSpacing: (mobile, tablet, desktop) => {
      if (isMobile) return mobile
      if (isTablet) return tablet || mobile
      return desktop || tablet || mobile
    },
    getResponsiveFontSize: (mobile, desktop) => {
      return isMobile ? mobile : desktop
    }
  }
}

/**
 * Hook for handling touch gestures
 */
export function useTouch() {
  const [touchStart, setTouchStart] = useState(null)
  const [touchEnd, setTouchEnd] = useState(null)

  const minSwipeDistance = 50

  const onTouchStart = (e) => {
    setTouchEnd(null)
    setTouchStart(e.targetTouches[0].clientX)
  }

  const onTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return
    
    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > minSwipeDistance
    const isRightSwipe = distance < -minSwipeDistance

    return {
      isLeftSwipe,
      isRightSwipe,
      distance: Math.abs(distance)
    }
  }

  return {
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    touchHandlers: {
      onTouchStart,
      onTouchMove,
      onTouchEnd
    }
  }
}

/**
 * Hook for managing mobile-specific UI states
 */
export function useMobileUI() {
  const { isMobile } = useMobile()
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false)

  useEffect(() => {
    if (!isMobile) return

    const handleResize = () => {
      // Detect virtual keyboard on mobile
      const heightDifference = window.screen.height - window.innerHeight
      setIsKeyboardOpen(heightDifference > 150) // Threshold for keyboard detection
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [isMobile])

  return {
    isKeyboardOpen,
    // Mobile-specific styling helpers
    getMobileStyles: () => ({
      // Prevent zoom on input focus
      fontSize: isMobile ? '16px' : 'inherit',
      // Better touch targets
      minHeight: isMobile ? '48px' : 'auto',
      // Prevent text selection on touch
      userSelect: isMobile ? 'none' : 'auto',
      // Better tap highlighting
      WebkitTapHighlightColor: 'transparent'
    }),
    // Viewport meta tag helpers
    preventZoom: () => {
      if (isMobile) {
        const viewport = document.querySelector('meta[name=viewport]')
        if (viewport) {
          viewport.setAttribute('content', 
            'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no'
          )
        }
      }
    },
    allowZoom: () => {
      if (isMobile) {
        const viewport = document.querySelector('meta[name=viewport]')
        if (viewport) {
          viewport.setAttribute('content', 
            'width=device-width, initial-scale=1.0'
          )
        }
      }
    }
  }
}