/**
 * Caching middleware for API responses
 */

const cache = new Map()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes default TTL

/**
 * Simple in-memory cache implementation
 * In production, consider using Redis or similar
 */
class SimpleCache {
  constructor() {
    this.cache = new Map()
    this.timers = new Map()
  }

  set(key, value, ttl = CACHE_TTL) {
    // Clear existing timer if any
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key))
    }

    // Set the value
    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      ttl
    })

    // Set expiration timer
    const timer = setTimeout(() => {
      this.delete(key)
    }, ttl)

    this.timers.set(key, timer)
  }

  get(key) {
    const item = this.cache.get(key)
    if (!item) return null

    // Check if expired
    if (Date.now() - item.timestamp > item.ttl) {
      this.delete(key)
      return null
    }

    return item.value
  }

  delete(key) {
    this.cache.delete(key)
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key))
      this.timers.delete(key)
    }
  }

  clear() {
    // Clear all timers
    for (const timer of this.timers.values()) {
      clearTimeout(timer)
    }
    this.cache.clear()
    this.timers.clear()
  }

  size() {
    return this.cache.size
  }

  // Get cache statistics
  getStats() {
    const now = Date.now()
    let expired = 0
    let active = 0

    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        expired++
      } else {
        active++
      }
    }

    return {
      total: this.cache.size,
      active,
      expired,
      memoryUsage: process.memoryUsage()
    }
  }
}

const apiCache = new SimpleCache()

/**
 * Generate cache key from request
 */
const generateCacheKey = (req) => {
  const { method, path, query, body } = req
  
  // Create a deterministic key
  const keyData = {
    method,
    path,
    query: JSON.stringify(query || {}),
    body: method === 'POST' ? JSON.stringify(body || {}) : ''
  }
  
  return Buffer.from(JSON.stringify(keyData)).toString('base64')
}

/**
 * Cache middleware factory
 */
const createCacheMiddleware = (options = {}) => {
  const {
    ttl = CACHE_TTL,
    keyGenerator = generateCacheKey,
    shouldCache = () => true,
    varyBy = []
  } = options

  return (req, res, next) => {
    // Skip caching for non-GET requests by default
    if (req.method !== 'GET' && !options.cacheAllMethods) {
      return next()
    }

    // Check if this request should be cached
    if (!shouldCache(req)) {
      return next()
    }

    // Generate cache key
    let cacheKey = keyGenerator(req)
    
    // Add vary-by parameters to cache key
    if (varyBy.length > 0) {
      const varyData = varyBy.map(field => {
        if (field.startsWith('header:')) {
          const headerName = field.substring(7)
          return req.get(headerName) || ''
        }
        return req[field] || ''
      }).join('|')
      
      cacheKey += `|${varyData}`
    }

    // Try to get from cache
    const cachedResponse = apiCache.get(cacheKey)
    if (cachedResponse) {
      res.set('X-Cache', 'HIT')
      res.set('X-Cache-Key', cacheKey.substring(0, 16) + '...')
      return res.json(cachedResponse)
    }

    // Override res.json to cache the response
    const originalJson = res.json
    res.json = function(data) {
      // Only cache successful responses
      if (res.statusCode >= 200 && res.statusCode < 300) {
        apiCache.set(cacheKey, data, ttl)
        res.set('X-Cache', 'MISS')
        res.set('X-Cache-Key', cacheKey.substring(0, 16) + '...')
      }
      
      return originalJson.call(this, data)
    }

    next()
  }
}

/**
 * Cache middleware for question generation
 * Cache based on role, level, and resume summary hash
 */
const questionsCacheMiddleware = createCacheMiddleware({
  ttl: 30 * 60 * 1000, // 30 minutes
  keyGenerator: (req) => {
    const { role, level, resumeSummary } = req.body
    
    // Create a hash of the resume summary for consistent caching
    const resumeHash = Buffer.from(JSON.stringify(resumeSummary)).toString('base64')
    
    return `questions:${role}:${level}:${resumeHash}`
  },
  shouldCache: (req) => {
    // Only cache if we have all required fields
    const { role, level, resumeSummary } = req.body
    return !!(role && level && resumeSummary)
  }
})

/**
 * Cache middleware for analysis results
 * Cache based on questions and answers hash
 */
const analysisCacheMiddleware = createCacheMiddleware({
  ttl: 60 * 60 * 1000, // 1 hour
  keyGenerator: (req) => {
    const { questions, answers, role, level } = req.body
    
    // Create hash of questions and answers
    const dataHash = Buffer.from(JSON.stringify({ questions, answers, role, level })).toString('base64')
    
    return `analysis:${dataHash}`
  },
  shouldCache: (req) => {
    const { questions, answers } = req.body
    return !!(questions?.length && answers?.length)
  }
})

/**
 * Cache invalidation middleware
 */
const invalidateCache = (pattern) => {
  return (req, res, next) => {
    // Clear cache entries matching pattern
    for (const key of apiCache.cache.keys()) {
      if (key.includes(pattern)) {
        apiCache.delete(key)
      }
    }
    next()
  }
}

/**
 * Cache statistics endpoint
 */
const getCacheStats = (req, res) => {
  const stats = apiCache.getStats()
  res.json({
    success: true,
    data: {
      cache: stats,
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    }
  })
}

/**
 * Clear cache endpoint (for admin use)
 */
const clearCache = (req, res) => {
  const sizeBefore = apiCache.size()
  apiCache.clear()
  
  res.json({
    success: true,
    data: {
      message: 'Cache cleared successfully',
      entriesCleared: sizeBefore,
      timestamp: new Date().toISOString()
    }
  })
}

/**
 * Cache warming function
 * Pre-populate cache with common requests
 */
const warmCache = async () => {
  // This could be implemented to pre-load common question sets
  console.log('Cache warming not implemented yet')
}

module.exports = {
  SimpleCache,
  apiCache,
  createCacheMiddleware,
  questionsCacheMiddleware,
  analysisCacheMiddleware,
  invalidateCache,
  getCacheStats,
  clearCache,
  warmCache
}