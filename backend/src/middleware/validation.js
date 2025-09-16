const multer = require('multer');
const path = require('path');

/**
 * File upload validation middleware
 */

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = process.env.UPLOAD_DIR || 'uploads';
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, `resume-${uniqueSuffix}${extension}`);
  }
});

// File filter for allowed file types
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];
  
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF and DOCX files are allowed.'), false);
  }
};

// Configure multer with options
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB default
    files: 1 // Only one file at a time
  }
});

/**
 * Middleware to handle file upload errors
 */
const handleUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        return res.status(400).json({
          error: {
            message: 'File too large. Maximum size is 10MB.',
            code: 'FILE_TOO_LARGE'
          }
        });
      case 'LIMIT_FILE_COUNT':
        return res.status(400).json({
          error: {
            message: 'Too many files. Please upload only one file.',
            code: 'TOO_MANY_FILES'
          }
        });
      case 'LIMIT_UNEXPECTED_FILE':
        return res.status(400).json({
          error: {
            message: 'Unexpected file field. Please use "resume" field name.',
            code: 'UNEXPECTED_FIELD'
          }
        });
      default:
        return res.status(400).json({
          error: {
            message: 'File upload error.',
            code: 'UPLOAD_ERROR'
          }
        });
    }
  }
  
  if (error.message.includes('Invalid file type')) {
    return res.status(415).json({
      error: {
        message: 'Unsupported file format. Please upload PDF or DOCX files only.',
        code: 'UNSUPPORTED_FORMAT',
        supportedFormats: ['PDF', 'DOCX']
      }
    });
  }
  
  next(error);
};

/**
 * Middleware to validate file upload
 */
const validateFileUpload = (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({
      error: {
        message: 'No file uploaded. Please select a resume file.',
        code: 'NO_FILE'
      }
    });
  }
  
  // Additional file validation
  const allowedExtensions = ['.pdf', '.docx'];
  const fileExtension = path.extname(req.file.originalname).toLowerCase();
  
  if (!allowedExtensions.includes(fileExtension)) {
    return res.status(415).json({
      error: {
        message: 'Invalid file extension. Please upload PDF or DOCX files only.',
        code: 'INVALID_EXTENSION',
        supportedExtensions: allowedExtensions
      }
    });
  }
  
  // Check if file is empty
  if (req.file.size === 0) {
    return res.status(400).json({
      error: {
        message: 'Empty file uploaded. Please select a valid resume file.',
        code: 'EMPTY_FILE'
      }
    });
  }
  
  next();
};

/**
 * Request validation middleware
 */
const validateRequest = {
  /**
   * Validate resume upload request
   */
  resumeUpload: [
    upload.single('resume'),
    handleUploadError,
    validateFileUpload
  ],

  /**
   * Validate question generation request
   */
  questionGeneration: (req, res, next) => {
    const { role, level, resumeSummary } = req.body;
    
    if (!role || typeof role !== 'string' || role.trim().length === 0) {
      return res.status(400).json({
        error: {
          message: 'Role is required and must be a non-empty string.',
          code: 'INVALID_ROLE'
        }
      });
    }
    
    const validLevels = ['fresher', 'intermediate', 'experienced'];
    if (!level || !validLevels.includes(level)) {
      return res.status(400).json({
        error: {
          message: 'Level is required and must be one of: fresher, intermediate, experienced.',
          code: 'INVALID_LEVEL',
          validLevels
        }
      });
    }
    
    if (!resumeSummary || typeof resumeSummary !== 'object') {
      return res.status(400).json({
        error: {
          message: 'Resume summary is required and must be an object.',
          code: 'INVALID_RESUME_SUMMARY'
        }
      });
    }
    
    // Validate resume summary structure
    const requiredFields = ['skills', 'experience'];
    for (const field of requiredFields) {
      if (!resumeSummary[field]) {
        return res.status(400).json({
          error: {
            message: `Resume summary must include ${field}.`,
            code: 'MISSING_RESUME_FIELD',
            missingField: field
          }
        });
      }
    }
    
    next();
  },

  /**
   * Validate answer analysis request
   */
  answerAnalysis: (req, res, next) => {
    const { questions, answers, role, level } = req.body;
    
    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({
        error: {
          message: 'Questions must be a non-empty array.',
          code: 'INVALID_QUESTIONS'
        }
      });
    }
    
    if (!Array.isArray(answers) || answers.length === 0) {
      return res.status(400).json({
        error: {
          message: 'Answers must be a non-empty array.',
          code: 'INVALID_ANSWERS'
        }
      });
    }
    
    if (questions.length !== answers.length) {
      return res.status(400).json({
        error: {
          message: 'Number of questions and answers must match.',
          code: 'MISMATCHED_QA_COUNT'
        }
      });
    }
    
    if (!role || typeof role !== 'string') {
      return res.status(400).json({
        error: {
          message: 'Role is required and must be a string.',
          code: 'INVALID_ROLE'
        }
      });
    }
    
    const validLevels = ['fresher', 'intermediate', 'experienced'];
    if (!level || !validLevels.includes(level)) {
      return res.status(400).json({
        error: {
          message: 'Level is required and must be one of: fresher, intermediate, experienced.',
          code: 'INVALID_LEVEL',
          validLevels
        }
      });
    }
    
    next();
  },

  /**
   * Validate individual answer analysis request
   */
  individualAnalysis: (req, res, next) => {
    const { question, answer, role, level } = req.body;
    
    if (!question || typeof question !== 'string' || question.trim().length === 0) {
      return res.status(400).json({
        error: {
          message: 'Question is required and must be a non-empty string.',
          code: 'INVALID_QUESTION'
        }
      });
    }
    
    if (!answer || typeof answer !== 'string' || answer.trim().length === 0) {
      return res.status(400).json({
        error: {
          message: 'Answer is required and must be a non-empty string.',
          code: 'INVALID_ANSWER'
        }
      });
    }
    
    if (!role || typeof role !== 'string') {
      return res.status(400).json({
        error: {
          message: 'Role is required and must be a string.',
          code: 'INVALID_ROLE'
        }
      });
    }
    
    const validLevels = ['fresher', 'intermediate', 'experienced'];
    if (!level || !validLevels.includes(level)) {
      return res.status(400).json({
        error: {
          message: 'Level is required and must be one of: fresher, intermediate, experienced.',
          code: 'INVALID_LEVEL',
          validLevels
        }
      });
    }
    
    next();
  }
};

module.exports = {
  upload,
  handleUploadError,
  validateFileUpload,
  validateRequest
};