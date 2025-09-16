/**
 * Performance optimization utilities
 */
import React from 'react'

// Lazy loading utility for components
export const lazyLoad = (importFunc, fallback = null) => {
  const LazyComponent = React.lazy(importFunc)
  
  return (props) => (
    <React.Suspense fallback={fallback}>
      <LazyComponent {...props} />
    </React.Suspense>
  )
}

// Debounce utility for expensive operations
export const debounce = (func, wait, immediate = false) => {
  let timeout
  
  return function executedFunction(...args) {
    const later = () => {
      timeout = null
      if (!immediate) func(...args)
    }
    
    const callNow = immediate && !timeout
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
    
    if (callNow) func(...args)
  }
}

// Throttle utility for frequent events
export const throttle = (func, limit) => {
  let inThrottle
  
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

// Memoization utility for expensive calculations
export const memoize = (fn, getKey = (...args) => JSON.stringify(args)) => {
  const cache = new Map()
  
  return (...args) => {
    const key = getKey(...args)
    
    if (cache.has(key)) {
      return cache.get(key)
    }
    
    const result = fn(...args)
    cache.set(key, result)
    
    // Limit cache size to prevent memory leaks
    if (cache.size > 100) {
      const firstKey = cache.keys().next().value
      cache.delete(firstKey)
    }
    
    return result
  }
}

// Image lazy loading utility
export const createImageLoader = () => {
  const imageCache = new Set()
  
  return {
    preloadImage: (src) => {
      if (imageCache.has(src)) return Promise.resolve()
      
      return new Promise((resolve, reject) => {
        const img = new Image()
        img.onload = () => {
          imageCache.add(src)
          resolve()
        }
        img.onerror = reject
        img.src = src
      })
    },
    
    isImageCached: (src) => imageCache.has(src)
  }
}

// Bundle size analyzer (development only)
export const analyzeBundleSize = () => {
  if (process.env.NODE_ENV !== 'development') return
  
  const scripts = Array.from(document.querySelectorAll('script[src]'))
  const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
  
  console.group('Bundle Analysis')
  
  scripts.forEach(script => {
    console.log(`Script: ${script.src}`)
  })
  
  styles.forEach(style => {
    console.log(`Style: ${style.href}`)
  })
  
  console.groupEnd()
}

// Performance monitoring
export class PerformanceMonitor {
  constructor() {
    this.metrics = {
      pageLoad: null,
      firstContentfulPaint: null,
      largestContentfulPaint: null,
      firstInputDelay: null,
      cumulativeLayoutShift: null
    }
    
    this.init()
  }
  
  init() {
    // Page load time
    window.addEventListener('load', () => {
      this.metrics.pageLoad = performance.now()
    })
    
    // Web Vitals
    if ('PerformanceObserver' in window) {
      // First Contentful Paint
      new PerformanceObserver((list) => {
        const entries = list.getEntries()
        entries.forEach(entry => {
          if (entry.name === 'first-contentful-paint') {
            this.metrics.firstContentfulPaint = entry.startTime
          }
        })
      }).observe({ entryTypes: ['paint'] })
      
      // Largest Contentful Paint
      new PerformanceObserver((list) => {
        const entries = list.getEntries()
        const lastEntry = entries[entries.length - 1]
        this.metrics.largestContentfulPaint = lastEntry.startTime
      }).observe({ entryTypes: ['largest-contentful-paint'] })
      
      // First Input Delay
      new PerformanceObserver((list) => {
        const entries = list.getEntries()
        entries.forEach(entry => {
          this.metrics.firstInputDelay = entry.processingStart - entry.startTime
        })
      }).observe({ entryTypes: ['first-input'] })
      
      // Cumulative Layout Shift
      let clsValue = 0
      new PerformanceObserver((list) => {
        const entries = list.getEntries()
        entries.forEach(entry => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value
            this.metrics.cumulativeLayoutShift = clsValue
          }
        })
      }).observe({ entryTypes: ['layout-shift'] })
    }
  }
  
  getMetrics() {
    return { ...this.metrics }
  }
  
  logMetrics() {
    console.group('Performance Metrics')
    Object.entries(this.metrics).forEach(([key, value]) => {
      if (value !== null) {
        console.log(`${key}: ${value}ms`)
      }
    })
    console.groupEnd()
  }
}

// Resource loading optimization
export const optimizeResourceLoading = () => {
  // Preload critical resources
  const preloadResource = (href, as, type = null) => {
    const link = document.createElement('link')
    link.rel = 'preload'
    link.href = href
    link.as = as
    if (type) link.type = type
    document.head.appendChild(link)
  }
  
  // Prefetch likely next resources
  const prefetchResource = (href) => {
    const link = document.createElement('link')
    link.rel = 'prefetch'
    link.href = href
    document.head.appendChild(link)
  }
  
  return { preloadResource, prefetchResource }
}

// Memory usage monitoring
export const monitorMemoryUsage = () => {
  if (!('memory' in performance)) {
    console.warn('Memory API not supported')
    return null
  }
  
  const logMemoryUsage = () => {
    const memory = performance.memory
    console.log('Memory Usage:', {
      used: `${Math.round(memory.usedJSHeapSize / 1024 / 1024)} MB`,
      total: `${Math.round(memory.totalJSHeapSize / 1024 / 1024)} MB`,
      limit: `${Math.round(memory.jsHeapSizeLimit / 1024 / 1024)} MB`
    })
  }
  
  // Log memory usage every 30 seconds in development
  if (process.env.NODE_ENV === 'development') {
    setInterval(logMemoryUsage, 30000)
  }
  
  return { logMemoryUsage }
}

// Initialize performance monitoring
export const initPerformanceMonitoring = () => {
  const monitor = new PerformanceMonitor()
  
  // Log metrics after page load
  window.addEventListener('load', () => {
    setTimeout(() => {
      monitor.logMetrics()
      analyzeBundleSize()
    }, 2000)
  })
  
  // Monitor memory usage
  monitorMemoryUsage()
  
  return monitor
}