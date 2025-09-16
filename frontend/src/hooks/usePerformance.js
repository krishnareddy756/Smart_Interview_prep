import { useEffect, useRef, useCallback, useState } from 'react'

/**
 * Hook for performance monitoring and optimization
 */
export function usePerformance(componentName) {
  const renderCount = useRef(0)
  const mountTime = useRef(null)
  const lastRenderTime = useRef(null)

  useEffect(() => {
    mountTime.current = performance.now()
    
    return () => {
      if (process.env.NODE_ENV === 'development') {
        const unmountTime = performance.now()
        const lifespan = unmountTime - mountTime.current
        console.log(`${componentName} lifespan: ${lifespan.toFixed(2)}ms, renders: ${renderCount.current}`)
      }
    }
  }, [componentName])

  useEffect(() => {
    renderCount.current++
    lastRenderTime.current = performance.now()
    
    if (process.env.NODE_ENV === 'development' && renderCount.current > 10) {
      console.warn(`${componentName} has rendered ${renderCount.current} times - consider optimization`)
    }
  })

  const measureOperation = useCallback((operationName, operation) => {
    const start = performance.now()
    const result = operation()
    const end = performance.now()
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`${componentName} - ${operationName}: ${(end - start).toFixed(2)}ms`)
    }
    
    return result
  }, [componentName])

  const measureAsyncOperation = useCallback(async (operationName, operation) => {
    const start = performance.now()
    const result = await operation()
    const end = performance.now()
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`${componentName} - ${operationName}: ${(end - start).toFixed(2)}ms`)
    }
    
    return result
  }, [componentName])

  return {
    renderCount: renderCount.current,
    measureOperation,
    measureAsyncOperation
  }
}

/**
 * Hook for debouncing values
 */
export function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

/**
 * Hook for throttling callbacks
 */
export function useThrottle(callback, delay) {
  const throttledCallback = useRef(null)
  const lastRan = useRef(null)

  useEffect(() => {
    throttledCallback.current = callback
  }, [callback])

  return useCallback((...args) => {
    if (lastRan.current === null || Date.now() - lastRan.current >= delay) {
      throttledCallback.current(...args)
      lastRan.current = Date.now()
    }
  }, [delay])
}

/**
 * Hook for intersection observer (lazy loading)
 */
export function useIntersectionObserver(options = {}) {
  const [isIntersecting, setIsIntersecting] = useState(false)
  const [hasIntersected, setHasIntersected] = useState(false)
  const elementRef = useRef(null)

  useEffect(() => {
    const element = elementRef.current
    if (!element) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting)
        if (entry.isIntersecting && !hasIntersected) {
          setHasIntersected(true)
        }
      },
      {
        threshold: 0.1,
        rootMargin: '50px',
        ...options
      }
    )

    observer.observe(element)

    return () => {
      observer.unobserve(element)
    }
  }, [hasIntersected, options])

  return { elementRef, isIntersecting, hasIntersected }
}

/**
 * Hook for measuring component render performance
 */
export function useRenderPerformance(componentName, dependencies = []) {
  const renderTimes = useRef([])
  const startTime = useRef(null)

  // Measure render start
  startTime.current = performance.now()

  useEffect(() => {
    // Measure render end
    const endTime = performance.now()
    const renderTime = endTime - startTime.current
    
    renderTimes.current.push(renderTime)
    
    // Keep only last 10 render times
    if (renderTimes.current.length > 10) {
      renderTimes.current.shift()
    }

    if (process.env.NODE_ENV === 'development') {
      const avgRenderTime = renderTimes.current.reduce((a, b) => a + b, 0) / renderTimes.current.length
      
      if (avgRenderTime > 16) { // 60fps threshold
        console.warn(`${componentName} average render time: ${avgRenderTime.toFixed(2)}ms (>16ms)`)
      }
    }
  }, dependencies)

  return {
    averageRenderTime: renderTimes.current.length > 0 
      ? renderTimes.current.reduce((a, b) => a + b, 0) / renderTimes.current.length 
      : 0,
    lastRenderTime: renderTimes.current[renderTimes.current.length - 1] || 0
  }
}

/**
 * Hook for preloading resources
 */
export function usePreload() {
  const preloadedResources = useRef(new Set())

  const preloadImage = useCallback((src) => {
    if (preloadedResources.current.has(src)) {
      return Promise.resolve()
    }

    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => {
        preloadedResources.current.add(src)
        resolve()
      }
      img.onerror = reject
      img.src = src
    })
  }, [])

  const preloadScript = useCallback((src) => {
    if (preloadedResources.current.has(src)) {
      return Promise.resolve()
    }

    return new Promise((resolve, reject) => {
      const script = document.createElement('script')
      script.onload = () => {
        preloadedResources.current.add(src)
        resolve()
      }
      script.onerror = reject
      script.src = src
      document.head.appendChild(script)
    })
  }, [])

  return { preloadImage, preloadScript }
}