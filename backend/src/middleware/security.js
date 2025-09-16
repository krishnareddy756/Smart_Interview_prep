const helmet = require('helmet')
const rateLimit = require('express-rate-limit')

/**
 * Security middleware configuration for production
 */

// Rate limiting configuration
const createRateLimiter = (windowMs, max, message) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      error: {
        message,
        type: 'rate_limit_exceeded',
        retryAfter: Math.ceil(windowMs / 1000)
      }
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      res.status(429).json({
        success: false,
        error: {
          message,
          type: 'rate_limit_exceeded',
          retryAfter: Math.ceil(windowMs / 1000)
        }
      })
    }
  })
}

// General API rate limiting
const generalLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  100, // limit each IP to 100 requests per windowMs
  'Too many requests from this IP, please try again later'
)

// Strict rate limiting for file uploads
const uploadLimiter = createRateLimiter(
  60 * 1000, // 1 minute
  5, // limit each IP to 5 uploads per minute
  'Too many file uploads, please try again later'
)

// Strict rate limiting for AI operations
const aiLimiter = createRateLimiter(
  60 * 1000, // 1 minute
  10, // limit each IP to 10 AI requests per minute
  'Too many AI requests, please try again later'
)

// Helmet security configuration
const helmetConfig = {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", "https://api.openai.com"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      workerSrc: ["'self'", "blob:"]
    }
  },
  crossOriginEmbedderPolicy: false, // Disable for speech APIs
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}

// CORS configuration
const corsConfig = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, etc.)
    if (!origin) return callback(null, true)
    
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
      'http://localhost:3000',
      'http://localhost:5173',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:5173'
    ]
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}

// Request size limiting
const requestSizeLimit = '10mb' // Adjust based on your needs

// File upload security
const fileUploadSecurity = {
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
    files: 1, // Only one file at a time
    fields: 10, // Limit form fields
    fieldNameSize: 100, // Limit field name size
    fieldSize: 1024 * 1024 // 1MB max field size
  },
  fileFilter: (req, file, cb) => {
    // Only allow specific file types
    const allowedMimes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword'
    ]
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('Invalid file type. Only PDF and Word documents are allowed.'))
    }
  }
}

// Input validation middleware
const validateInput = (req, res, next) => {
  // Remove any potential XSS attempts
  const sanitizeString = (str) => {
    if (typeof str !== 'string') return str
    return str.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
              .replace(/javascript:/gi, '')
              .replace(/on\w+\s*=/gi, '')
  }
  
  // Recursively sanitize request body
  const sanitizeObject = (obj) => {
    if (obj === null || typeof obj !== 'object') {
      return typeof obj === 'string' ? sanitizeString(obj) : obj
    }
    
    if (Array.isArray(obj)) {
      return obj.map(sanitizeObject)
    }
    
    const sanitized = {}
    for (const [key, value] of Object.entries(obj)) {
      sanitized[sanitizeString(key)] = sanitizeObject(value)
    }
    return sanitized
  }
  
  if (req.body) {
    req.body = sanitizeObject(req.body)
  }
  
  next()
}

// Error handling for security middleware
const securityErrorHandler = (err, req, res, next) => {
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({
      success: false,
      error: {
        message: 'CORS policy violation',
        type: 'cors_error'
      }
    })
  }
  
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      success: false,
      error: {
        message: 'File too large. Maximum size is 5MB.',
        type: 'file_size_error'
      }
    })
  }
  
  if (err.code === 'LIMIT_FILE_COUNT') {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Too many files. Only one file allowed.',
        type: 'file_count_error'
      }
    })
  }
  
  if (err.message.includes('Invalid file type')) {
    return res.status(400).json({
      success: false,
      error: {
        message: err.message,
        type: 'invalid_file_type'
      }
    })
  }
  
  next(err)
}

module.exports = {
  generalLimiter,
  uploadLimiter,
  aiLimiter,
  helmetConfig,
  corsConfig,
  requestSizeLimit,
  fileUploadSecurity,
  validateInput,
  securityErrorHandler
}