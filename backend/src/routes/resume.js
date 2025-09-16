const express = require('express');
const fs = require('fs');
const path = require('path');
const ResumeParser = require('../services/parser');
const { validateRequest } = require('../middleware/validation');

const router = express.Router();

// Create parser instance
let parser;
try {
  parser = new ResumeParser();
  console.log('ResumeParser initialized successfully');
} catch (error) {
  console.error('Failed to initialize ResumeParser:', error);
  throw error;
}

/**
 * POST /api/resume
 * Upload and parse resume file
 */
router.post('/', validateRequest.resumeUpload, async (req, res) => {
  let filePath = null;
  
  try {
    filePath = req.file.path;
    const mimeType = req.file.mimetype;
    const originalName = req.file.originalname;
    
    console.log(`Processing resume: ${originalName} (${mimeType})`);
    
    // Parse the resume
    const resumeData = await parser.parseResume(filePath, mimeType);
    
    // Add file metadata
    resumeData.metadata = {
      originalName,
      fileSize: req.file.size,
      uploadedAt: new Date().toISOString(),
      processingTime: Date.now() - req.uploadStartTime
    };
    
    console.log(`Resume parsed successfully: ${resumeData.skills.length} skills, ${resumeData.projects.length} projects`);
    console.log('Extracted skills:', resumeData.skills.slice(0, 10));
    console.log('Extracted projects:', resumeData.projects.map(p => p.title || p));
    console.log('Experience:', resumeData.experience);
    
    // Return parsed data
    res.json({
      success: true,
      data: resumeData
    });
    
  } catch (error) {
    console.error('Resume parsing error:', error);
    
    // Determine error type and status code
    let statusCode = 500;
    let errorCode = 'PARSING_ERROR';
    
    if (error.message.includes('Unsupported file format')) {
      statusCode = 415;
      errorCode = 'UNSUPPORTED_FORMAT';
    } else if (error.message.includes('PDF parsing failed')) {
      statusCode = 422;
      errorCode = 'PDF_PARSING_ERROR';
    } else if (error.message.includes('DOCX parsing failed')) {
      statusCode = 422;
      errorCode = 'DOCX_PARSING_ERROR';
    }
    
    res.status(statusCode).json({
      success: false,
      error: {
        message: error.message,
        code: errorCode,
        timestamp: new Date().toISOString()
      }
    });
    
  } finally {
    // Clean up uploaded file
    if (filePath && fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
        console.log(`Cleaned up file: ${filePath}`);
      } catch (cleanupError) {
        console.error('File cleanup error:', cleanupError);
      }
    }
  }
});

/**
 * Middleware to track upload start time
 */
router.use((req, res, next) => {
  req.uploadStartTime = Date.now();
  next();
});

module.exports = router;