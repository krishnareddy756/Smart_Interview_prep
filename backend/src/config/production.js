/**
 * Production configuration settings
 */

const config = {
  // Server configuration
  server: {
    port: process.env.PORT || 5000,
    host: process.env.HOST || '0.0.0.0',
    trustProxy: true, // Enable if behind reverse proxy
    keepAliveTimeout: 65000, // Slightly higher than load balancer timeout
    headersTimeout: 66000
  },

  // Database configuration (if using database in future)
  database: {
    connectionPoolSize: parseInt(process.env.DB_POOL_SIZE) || 10,
    connectionTimeout: parseInt(process.env.DB_TIMEOUT) || 30000,
    idleTimeout: parseInt(process.env.DB_IDLE_TIMEOUT) || 600000
  },

  // OpenAI configuration
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    organization: process.env.OPENAI_ORG_ID,
    timeout: parseInt(process.env.OPENAI_TIMEOUT) || 30000,
    maxRetries: parseInt(process.env.OPENAI_MAX_RETRIES) || 3,
    retryDelay: parseInt(process.env.OPENAI_RETRY_DELAY) || 1000
  },

  // File upload configuration
  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024, // 5MB
    allowedMimeTypes: [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword'
    ],
    tempDir: process.env.UPLOAD_TEMP_DIR || '/tmp/uploads',
    cleanupInterval: parseInt(process.env.CLEANUP_INTERVAL) || 3600000 // 1 hour
  },

  // Security configuration
  security: {
    corsOrigins: process.env.ALLOWED_ORIGINS?.split(',') || [],
    rateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW) || 900000, // 15 minutes
    rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX) || 100,
    uploadRateLimitMax: parseInt(process.env.UPLOAD_RATE_LIMIT_MAX) || 5,
    aiRateLimitMax: parseInt(process.env.AI_RATE_LIMIT_MAX) || 10
  },

  // Cache configuration
  cache: {
    defaultTTL: parseInt(process.env.CACHE_TTL) || 300000, // 5 minutes
    questionsTTL: parseInt(process.env.QUESTIONS_CACHE_TTL) || 1800000, // 30 minutes
    analysisTTL: parseInt(process.env.ANALYSIS_CACHE_TTL) || 3600000, // 1 hour
    maxSize: parseInt(process.env.CACHE_MAX_SIZE) || 1000
  },

  // Logging configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'json',
    enableAccessLog: process.env.ENABLE_ACCESS_LOG === 'true',
    logFile: process.env.LOG_FILE,
    errorLogFile: process.env.ERROR_LOG_FILE
  },

  // Monitoring configuration
  monitoring: {
    enableHealthCheck: true,
    enableMetrics: process.env.ENABLE_METRICS === 'true',
    metricsPath: process.env.METRICS_PATH || '/metrics',
    healthCheckPath: process.env.HEALTH_CHECK_PATH || '/health'
  },

  // Performance configuration
  performance: {
    enableCompression: true,
    compressionLevel: parseInt(process.env.COMPRESSION_LEVEL) || 6,
    enableEtag: true,
    enableCaching: process.env.ENABLE_CACHING !== 'false'
  },

  // Environment flags
  environment: {
    isDevelopment: process.env.NODE_ENV === 'development',
    isProduction: process.env.NODE_ENV === 'production',
    isTest: process.env.NODE_ENV === 'test'
  }
}

// Validation function
const validateConfig = () => {
  const required = [
    'OPENAI_API_KEY'
  ]

  const missing = required.filter(key => !process.env[key])
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`)
  }

  // Validate OpenAI API key format
  if (process.env.OPENAI_API_KEY && !process.env.OPENAI_API_KEY.startsWith('sk-')) {
    console.warn('Warning: OpenAI API key does not appear to be in the correct format')
  }

  // Validate numeric values
  const numericFields = [
    'PORT', 'MAX_FILE_SIZE', 'RATE_LIMIT_MAX', 'CACHE_TTL'
  ]

  numericFields.forEach(field => {
    if (process.env[field] && isNaN(parseInt(process.env[field]))) {
      console.warn(`Warning: ${field} should be a numeric value`)
    }
  })
}

// Initialize configuration
const initializeConfig = () => {
  try {
    validateConfig()
    console.log('Configuration validated successfully')
    
    // Log non-sensitive configuration in production
    if (config.environment.isProduction) {
      console.log('Production configuration loaded:', {
        server: { port: config.server.port, host: config.server.host },
        upload: { maxFileSize: config.upload.maxFileSize },
        cache: { defaultTTL: config.cache.defaultTTL },
        security: { rateLimitMax: config.security.rateLimitMax }
      })
    }
  } catch (error) {
    console.error('Configuration validation failed:', error.message)
    process.exit(1)
  }
}

module.exports = {
  config,
  validateConfig,
  initializeConfig
}