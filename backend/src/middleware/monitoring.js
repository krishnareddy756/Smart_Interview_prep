/**
 * Monitoring and health check middleware
 */

const os = require('os')
const { apiCache } = require('./cache')

// Metrics collection
const metrics = {
  requests: {
    total: 0,
    success: 0,
    errors: 0,
    byEndpoint: new Map(),
    byStatusCode: new Map()
  },
  uploads: {
    total: 0,
    success: 0,
    errors: 0,
    totalSize: 0
  },
  ai: {
    questionsGenerated: 0,
    analysisCompleted: 0,
    errors: 0,
    totalTokens: 0,
    averageResponseTime: 0
  },
  performance: {
    averageResponseTime: 0,
    responseTimeHistory: [],
    memoryUsage: [],
    cpuUsage: []
  }
}

// Request tracking middleware
const requestTracker = (req, res, next) => {
  const startTime = Date.now()
  
  // Track request
  metrics.requests.total++
  
  const endpoint = `${req.method} ${req.route?.path || req.path}`
  metrics.requests.byEndpoint.set(
    endpoint,
    (metrics.requests.byEndpoint.get(endpoint) || 0) + 1
  )

  // Override res.end to capture response metrics
  const originalEnd = res.end
  res.end = function(...args) {
    const responseTime = Date.now() - startTime
    
    // Update response time metrics
    metrics.performance.responseTimeHistory.push(responseTime)
    if (metrics.performance.responseTimeHistory.length > 100) {
      metrics.performance.responseTimeHistory.shift()
    }
    
    metrics.performance.averageResponseTime = 
      metrics.performance.responseTimeHistory.reduce((a, b) => a + b, 0) / 
      metrics.performance.responseTimeHistory.length

    // Track status codes
    const statusCode = res.statusCode
    metrics.requests.byStatusCode.set(
      statusCode,
      (metrics.requests.byStatusCode.get(statusCode) || 0) + 1
    )

    // Track success/error
    if (statusCode >= 200 && statusCode < 400) {
      metrics.requests.success++
    } else {
      metrics.requests.errors++
    }

    // Add response time header
    res.set('X-Response-Time', `${responseTime}ms`)
    
    originalEnd.apply(this, args)
  }

  next()
}

// Upload tracking middleware
const uploadTracker = (req, res, next) => {
  if (req.file) {
    metrics.uploads.total++
    metrics.uploads.totalSize += req.file.size
  }

  const originalJson = res.json
  res.json = function(data) {
    if (req.file) {
      if (res.statusCode >= 200 && res.statusCode < 400) {
        metrics.uploads.success++
      } else {
        metrics.uploads.errors++
      }
    }
    return originalJson.call(this, data)
  }

  next()
}

// AI operation tracking
const trackAIOperation = (operation, tokens = 0, responseTime = 0) => {
  switch (operation) {
    case 'questions':
      metrics.ai.questionsGenerated++
      break
    case 'analysis':
      metrics.ai.analysisCompleted++
      break
    case 'error':
      metrics.ai.errors++
      break
  }
  
  if (tokens > 0) {
    metrics.ai.totalTokens += tokens
  }
  
  if (responseTime > 0) {
    // Update average response time for AI operations
    const currentAvg = metrics.ai.averageResponseTime
    const totalOps = metrics.ai.questionsGenerated + metrics.ai.analysisCompleted
    metrics.ai.averageResponseTime = ((currentAvg * (totalOps - 1)) + responseTime) / totalOps
  }
}

// System metrics collection
const collectSystemMetrics = () => {
  const memUsage = process.memoryUsage()
  const cpuUsage = process.cpuUsage()
  
  metrics.performance.memoryUsage.push({
    timestamp: Date.now(),
    rss: memUsage.rss,
    heapUsed: memUsage.heapUsed,
    heapTotal: memUsage.heapTotal,
    external: memUsage.external
  })
  
  // Keep only last 100 entries
  if (metrics.performance.memoryUsage.length > 100) {
    metrics.performance.memoryUsage.shift()
  }
}

// Start system metrics collection
setInterval(collectSystemMetrics, 30000) // Every 30 seconds

// Health check endpoint
const healthCheck = (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    system: {
      platform: os.platform(),
      arch: os.arch(),
      nodeVersion: process.version,
      memory: {
        total: os.totalmem(),
        free: os.freemem(),
        usage: process.memoryUsage()
      },
      cpu: {
        count: os.cpus().length,
        loadAverage: os.loadavg()
      }
    },
    services: {
      openai: {
        configured: !!process.env.OPENAI_API_KEY,
        status: 'unknown' // Could add actual API health check
      },
      cache: {
        size: apiCache.size(),
        stats: apiCache.getStats()
      }
    }
  }

  // Check for any critical issues
  const memoryUsage = process.memoryUsage()
  const memoryUsagePercent = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100
  
  if (memoryUsagePercent > 90) {
    health.status = 'warning'
    health.warnings = health.warnings || []
    health.warnings.push('High memory usage detected')
  }

  const loadAverage = os.loadavg()[0]
  const cpuCount = os.cpus().length
  if (loadAverage > cpuCount * 0.8) {
    health.status = 'warning'
    health.warnings = health.warnings || []
    health.warnings.push('High CPU load detected')
  }

  // Set appropriate status code
  const statusCode = health.status === 'healthy' ? 200 : 
                    health.status === 'warning' ? 200 : 503

  res.status(statusCode).json(health)
}

// Metrics endpoint
const getMetrics = (req, res) => {
  const currentMetrics = {
    ...metrics,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    system: {
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
      platform: {
        arch: os.arch(),
        platform: os.platform(),
        version: os.release()
      }
    },
    cache: apiCache.getStats()
  }

  // Convert Maps to Objects for JSON serialization
  currentMetrics.requests.byEndpoint = Object.fromEntries(metrics.requests.byEndpoint)
  currentMetrics.requests.byStatusCode = Object.fromEntries(metrics.requests.byStatusCode)

  res.json({
    success: true,
    data: currentMetrics
  })
}

// Ready check (for Kubernetes readiness probe)
const readyCheck = (req, res) => {
  // Check if all required services are available
  const checks = {
    openai: !!process.env.OPENAI_API_KEY,
    memory: process.memoryUsage().heapUsed < process.memoryUsage().heapTotal * 0.95
  }

  const allReady = Object.values(checks).every(check => check)

  res.status(allReady ? 200 : 503).json({
    ready: allReady,
    checks,
    timestamp: new Date().toISOString()
  })
}

// Graceful shutdown handler
const gracefulShutdown = (server) => {
  return (signal) => {
    console.log(`Received ${signal}, starting graceful shutdown...`)
    
    server.close((err) => {
      if (err) {
        console.error('Error during server shutdown:', err)
        process.exit(1)
      }
      
      console.log('Server closed successfully')
      
      // Clean up resources
      apiCache.clear()
      
      console.log('Graceful shutdown completed')
      process.exit(0)
    })
    
    // Force shutdown after 30 seconds
    setTimeout(() => {
      console.error('Forced shutdown after timeout')
      process.exit(1)
    }, 30000)
  }
}

module.exports = {
  metrics,
  requestTracker,
  uploadTracker,
  trackAIOperation,
  healthCheck,
  getMetrics,
  readyCheck,
  gracefulShutdown
}