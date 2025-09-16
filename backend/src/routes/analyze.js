const express = require('express');
const OpenAIService = require('../services/openai');
const { validateRequest } = require('../middleware/validation');

const router = express.Router();

/**
 * POST /api/analyze-answers
 * Analyze user answers and provide feedback
 */
router.post('/', validateRequest.answerAnalysis, async (req, res) => {
  try {
    const { questions, answers, role, level } = req.body;
    
    console.log(`Analyzing ${answers.length} answers for ${level} ${role} position`);
    
    // Initialize OpenAI service
    const openaiService = new OpenAIService();
    
    // Analyze answers
    const analysis = await openaiService.analyzeAnswers(questions, answers, role, level);
    
    console.log(`Analysis complete. Overall score: ${analysis.overallScore}`);
    
    res.json({
      success: true,
      data: analysis
    });
    
  } catch (error) {
    console.error('Answer analysis error:', error);
    
    // Determine error type and status code
    let statusCode = 500;
    let errorCode = 'ANALYSIS_ERROR';
    
    if (error.message.includes('API key')) {
      statusCode = 401;
      errorCode = 'INVALID_API_KEY';
    } else if (error.message.includes('rate limit')) {
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