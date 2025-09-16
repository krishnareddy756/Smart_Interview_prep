const express = require('express');
const OpenAIService = require('../services/openai');
const { validateRequest } = require('../middleware/validation');

const router = express.Router();

/**
 * POST /api/analyze-individual
 * Analyze a single question-answer pair
 */
router.post('/', validateRequest.individualAnalysis, async (req, res) => {
  try {

    const { question, answer, role, level } = req.body;
    
    console.log(`Analyzing individual answer for ${level} ${role} position`);
    
    // Initialize OpenAI service
    const openaiService = new OpenAIService();
    
    // Analyze single answer
    const analysis = await openaiService.analyzeIndividualAnswer(question, answer, role, level);
    
    console.log(`Individual analysis complete. Score: ${analysis.score}`);
    
    res.json({
      success: true,
      data: analysis
    });
    
  } catch (error) {
    console.error('Individual answer analysis error:', error);
    
    // Determine error type and status code
    let statusCode = 500;
    let errorCode = 'ANALYSIS_ERROR';
    
    if (error.message.includes('API key')) {
      statusCode = 401;
      errorCode = 'INVALID_API_KEY';
    } else if (error.message.includes('rate limit') || error.message.includes('quota')) {
      statusCode = 429;
      errorCode = 'RATE_LIMIT_EXCEEDED';
    } else if (error.message.includes('OpenAI')) {
      statusCode = 502;
      errorCode = 'OPENAI_ERROR';
    }
    
    res.status(statusCode).json({
      success: false,
      error: {
        message: error.message,
        code: errorCode,
        timestamp: new Date().toISOString()
      }
    });
  }
});

module.exports = router;