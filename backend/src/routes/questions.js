const express = require('express');
const OpenAIService = require('../services/openai');
const { validateRequest } = require('../middleware/validation');

const router = express.Router();

/**
 * POST /api/questions
 * Generate interview questions based on resume and role
 */
router.post('/', validateRequest.questionGeneration, async (req, res) => {
  const { role, level, resumeSummary } = req.body;
  
  try {
    console.log(`Generating questions for ${level} ${role} position`);
    
    // Initialize OpenAI service
    const openaiService = new OpenAIService();
    
    // Generate questions
    const questions = await openaiService.generateQuestions(role, level, resumeSummary);
    
    console.log(`Generated ${questions.roleQuestions.length} role questions and ${questions.openEnded.length} open-ended questions`);
    
    res.json({
      success: true,
      data: questions
    });
    
  } catch (error) {
    console.error('Question generation error:', error);
    console.log('Falling back to default questions...');
    
    // Use fallback questions when OpenAI fails
    try {
      const openaiService = new OpenAIService();
      const fallbackQuestions = openaiService.getFallbackQuestions(role, level);
      
      console.log('Using fallback questions due to OpenAI API issues');
      
      res.json({
        success: true,
        data: fallbackQuestions,
        fallback: true,
        message: 'Using default questions due to API limitations'
      });
      
    } catch (fallbackError) {
      console.error('Fallback generation error:', fallbackError);
      
      // Determine error type and status code
      let statusCode = 500;
      let errorCode = 'GENERATION_ERROR';
      
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
  }
});

module.exports = router;