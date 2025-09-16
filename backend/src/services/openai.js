const OpenAI = require("openai");

class OpenAIService {
  constructor() {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY environment variable is required");
    }

    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    this.model = "gpt-3.5-turbo";
    this.maxTokens = 1500;
    this.temperature = 0.7;
  }

  /**
   * Generate interview questions based on resume and role
   * @param {string} role - Target job role
   * @param {string} level - Experience level (fresher/intermediate/experienced)
   * @param {Object} resumeSummary - Parsed resume data
   * @returns {Promise<Object>} Generated questions
   */
  async generateQuestions(role, level, resumeSummary) {
    try {
      const prompt = this.buildQuestionPrompt(role, level, resumeSummary);

      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: "system",
            content: this.getSystemPrompt(),
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens: this.maxTokens,
        temperature: this.temperature,
        response_format: { type: "json_object" },
      });

      const content = response.choices[0].message.content;
      const questions = JSON.parse(content);

      // Validate response structure
      this.validateQuestionResponse(questions);

      return {
        ...questions,
        metadata: {
          promptUsed: prompt,
          model: this.model,
          generatedAt: new Date().toISOString(),
          tokensUsed: response.usage?.total_tokens || 0,
        },
      };
    } catch (error) {
      console.error("OpenAI question generation error:", error);

      if (error.message.includes("API key")) {
        throw new Error("Invalid OpenAI API key");
      } else if (error.message.includes("rate limit")) {
        throw new Error("OpenAI rate limit exceeded. Please try again later.");
      } else if (error.message.includes("JSON")) {
        // Fallback to default questions if JSON parsing fails
        return this.getFallbackQuestions(role, level);
      }

      throw new Error(`Question generation failed: ${error.message}`);
    }
  }

  /**
   * Analyze user answers and provide feedback
   * @param {string[]} questions - Interview questions
   * @param {string[]} answers - User answers
   * @param {string} role - Target job role
   * @param {string} level - Experience level
   * @returns {Promise<Object>} Analysis results
   */
  async analyzeAnswers(questions, answers, role, level) {
    try {
      const prompt = this.buildAnalysisPrompt(questions, answers, role, level);

      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: "system",
            content: this.getAnalysisSystemPrompt(),
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens: 800, // Reduced from 2000 to 800
        temperature: 0.3,
        response_format: { type: "json_object" },
      });

      const content = response.choices[0].message.content;
      const analysis = JSON.parse(content);

      // Validate analysis response
      this.validateAnalysisResponse(analysis);

      const tokensUsed = response.usage?.total_tokens || 0;
      console.log(`Analysis completed. Tokens used: ${tokensUsed}`);

      return {
        ...analysis,
        metadata: {
          analyzedAt: new Date().toISOString(),
          model: this.model,
          tokensUsed: tokensUsed,
        },
      };
    } catch (error) {
      console.error("OpenAI answer analysis error:", error);

      if (
        error.message.includes("rate limit") ||
        error.message.includes("quota")
      ) {
        console.log("Using fallback analysis due to API limits");
        return this.getFallbackAnalysis(questions, answers);
      } else if (error.message.includes("JSON")) {
        // Fallback to basic analysis
        return this.getFallbackAnalysis(questions, answers);
      }

      throw new Error(`Answer analysis failed: ${error.message}`);
    }
  }

  /**
   * Analyze a single question-answer pair
   * @param {string} question - Single interview question
   * @param {string} answer - User's answer
   * @param {string} role - Target job role
   * @param {string} level - Experience level
   * @returns {Promise<Object>} Individual analysis result
   */
  async analyzeIndividualAnswer(question, answer, role, level) {
    try {
      const prompt = this.buildIndividualAnalysisPrompt(
        question,
        answer,
        role,
        level
      );

      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: "system",
            content: this.getIndividualAnalysisSystemPrompt(),
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens: 300, // Even smaller for individual analysis
        temperature: 0.3,
        response_format: { type: "json_object" },
      });

      const content = response.choices[0].message.content;
      const analysis = JSON.parse(content);

      // Validate individual analysis response
      this.validateIndividualAnalysisResponse(analysis);

      const tokensUsed = response.usage?.total_tokens || 0;
      console.log(`Individual analysis completed. Tokens used: ${tokensUsed}`);

      return {
        ...analysis,
        metadata: {
          analyzedAt: new Date().toISOString(),
          model: this.model,
          tokensUsed: tokensUsed,
        },
      };
    } catch (error) {
      console.error("OpenAI individual analysis error:", error);

      if (
        error.message.includes("rate limit") ||
        error.message.includes("quota")
      ) {
        console.log("Using fallback for individual analysis due to API limits");
        return this.getFallbackIndividualAnalysis(question, answer);
      } else if (error.message.includes("JSON")) {
        // Fallback to basic analysis
        return this.getFallbackIndividualAnalysis(question, answer);
      }

      throw new Error(`Individual analysis failed: ${error.message}`);
    }
  }

  /**
   * Get system prompt for question generation
   * @returns {string} System prompt
   */
  getSystemPrompt() {
    return `You are an expert interview coach. Generate personalized interview questions only.
    Return only questions in the exact JSON format requested.
    Focus purely on creating relevant, professional questions without any additional commentary.
    
    Always return JSON with these exact keys: "roleQuestions", "hrQuestions"`;
  }

  /**
   * Get system prompt for answer analysis
   * @returns {string} System prompt for analysis
   */
  getAnalysisSystemPrompt() {
    return `You are an interview coach. Provide brief, constructive feedback.
    Rate answers 1-10 and give concise improvement tips.
    Return only valid JSON in the exact format requested.`;
  }

  /**
   * Get system prompt for individual answer analysis
   * @returns {string} System prompt for individual analysis
   */
  getIndividualAnalysisSystemPrompt() {
    return `You are an interview coach. Analyze this single answer briefly.
    Rate 1-10 and give 2-3 concise improvement tips.
    Return only valid JSON.`;
  }

  /**
   * Build prompt for question generation
   * @param {string} role - Target role
   * @param {string} level - Experience level
   * @param {Object} resumeSummary - Resume data
   * @returns {string} Formatted prompt
   */
  buildQuestionPrompt(role, level, resumeSummary) {
    const skillsList = Array.isArray(resumeSummary.skills)
      ? resumeSummary.skills.slice(0, 10).join(", ")
      : "Not specified";

    const projectsList = Array.isArray(resumeSummary.projects)
      ? resumeSummary.projects
          .slice(0, 3)
          .map((p) => p.title || p)
          .join(", ")
      : "Not specified";

    return `Role: ${role}
Level: ${level}
Skills: ${skillsList}

Generate exactly 3 interview questions in this JSON format:
{
  "roleQuestions": [
    "Technical question 1 based on candidate skills",
    "Technical question 2 based on ${role} role"
  ],
  "openEnded": [
    "One behavioral/HR question"
  ]
}

Keep questions concise and relevant.`;
  }

  /**
   * Build prompt for answer analysis
   * @param {string[]} questions - Questions asked
   * @param {string[]} answers - User answers
   * @param {string} role - Target role
   * @param {string} level - Experience level
   * @returns {string} Analysis prompt
   */
  buildAnalysisPrompt(questions, answers, role, level) {
    // Truncate long answers to save tokens
    const qaList = questions
      .map((q, i) => {
        const answer = answers[i] || "No answer";
        const truncatedAnswer =
          answer.length > 200 ? answer.substring(0, 200) + "..." : answer;
        return `Q${i + 1}: ${q}\nA${i + 1}: ${truncatedAnswer}`;
      })
      .join("\n\n");

    return `${role} ${level} interview analysis:

${qaList}

Return JSON:
{
  "feedback": [
    {
      "questionId": "1",
      "score": 7,
      "feedback": "Brief feedback",
      "suggestions": ["Tip 1", "Tip 2"]
    }
  ],
  "overallScore": 75,
  "summary": "Brief summary",
  "improvements": ["Area 1", "Area 2"]
}

Keep feedback concise. Score 1-10.`;
  }

  /**
   * Build prompt for individual answer analysis
   * @param {string} question - Single question
   * @param {string} answer - User's answer
   * @param {string} role - Target role
   * @param {string} level - Experience level
   * @returns {string} Individual analysis prompt
   */
  buildIndividualAnalysisPrompt(question, answer, role, level) {
    // Truncate answer to save tokens
    const truncatedAnswer =
      answer.length > 150 ? answer.substring(0, 150) + "..." : answer;

    return `${role} ${level} interview question:

Q: ${question}
A: ${truncatedAnswer}

Return JSON:
{
  "score": 7,
  "feedback": "Brief feedback on the answer",
  "suggestions": ["Tip 1", "Tip 2"]
}

Score 1-10. Keep feedback concise.`;
  }

  /**
   * Validate question generation response
   * @param {Object} questions - Generated questions
   */
  validateQuestionResponse(questions) {
    if (
      !Array.isArray(questions.roleQuestions) ||
      questions.roleQuestions.length !== 2
    ) {
      throw new Error(
        "Invalid response: roleQuestions must be array of 2 questions"
      );
    }

    if (
      !Array.isArray(questions.openEnded) ||
      questions.openEnded.length !== 1
    ) {
      throw new Error(
        "Invalid response: openEnded must be array of 1 question"
      );
    }
  }

  /**
   * Validate analysis response
   * @param {Object} analysis - Analysis results
   */
  validateAnalysisResponse(analysis) {
    if (!Array.isArray(analysis.feedback)) {
      throw new Error("Invalid analysis: feedback must be an array");
    }

    if (
      typeof analysis.overallScore !== "number" ||
      analysis.overallScore < 0 ||
      analysis.overallScore > 100
    ) {
      throw new Error(
        "Invalid analysis: overallScore must be number between 0-100"
      );
    }

    if (!analysis.summary || typeof analysis.summary !== "string") {
      throw new Error("Invalid analysis: summary must be a string");
    }

    // Validate each feedback item has required fields
    analysis.feedback.forEach((item, index) => {
      if (!item.questionId || !item.score || !item.feedback) {
        throw new Error(
          `Invalid feedback item at index ${index}: missing required fields`
        );
      }
    });
  }

  /**
   * Validate individual analysis response
   * @param {Object} analysis - Individual analysis results
   */
  validateIndividualAnalysisResponse(analysis) {
    if (
      typeof analysis.score !== "number" ||
      analysis.score < 1 ||
      analysis.score > 10
    ) {
      throw new Error(
        "Invalid individual analysis: score must be number between 1-10"
      );
    }

    if (!analysis.feedback || typeof analysis.feedback !== "string") {
      throw new Error("Invalid individual analysis: feedback must be a string");
    }

    if (!Array.isArray(analysis.suggestions)) {
      throw new Error(
        "Invalid individual analysis: suggestions must be an array"
      );
    }
  }

  /**
   * Get fallback analysis for individual question
   * @param {string} question - Question text
   * @param {string} answer - User's answer
   * @returns {Object} Fallback individual analysis
   */
  getFallbackIndividualAnalysis(question, answer) {
    return {
      score: 6,
      feedback: "Analysis unavailable. Your answer has been recorded.",
      suggestions: [
        "Practice clear communication",
        "Use specific examples",
        "Structure your response logically",
      ],
      metadata: {
        analyzedAt: new Date().toISOString(),
        model: "fallback",
        tokensUsed: 0,
      },
    };
  }

  /**
   * Get fallback questions when AI generation fails
   * @param {string} role - Target role
   * @param {string} level - Experience level
   * @returns {Object} Fallback questions
   */
  getFallbackQuestions(role, level) {
    // Role-specific technical questions (only 2)
    const roleQuestions = this.getRoleSpecificQuestions(role, level).slice(
      0,
      2
    );

    return {
      roleQuestions: roleQuestions,
      openEnded: [
        "Tell me about a challenging project you worked on and how you overcame the difficulties.",
      ],
      metadata: {
        promptUsed: "Fallback questions due to AI generation failure",
        model: "fallback",
        generatedAt: new Date().toISOString(),
        tokensUsed: 0,
      },
    };
  }

  /**
   * Get role-specific technical questions
   * @param {string} role - Target role
   * @param {string} level - Experience level
   * @returns {string[]} Role-specific questions
   */
  getRoleSpecificQuestions(role, level) {
    const questionSets = {
      "Frontend Developer": {
        fresher: [
          "What is the difference between HTML, CSS, and JavaScript?",
          "Explain the box model in CSS.",
          "What are the different ways to include CSS in a webpage?",
          "What is the DOM and how do you manipulate it?",
          "Explain the difference between var, let, and const in JavaScript.",
        ],
        intermediate: [
          "Explain the concept of closures in JavaScript.",
          "What are React hooks and why are they useful?",
          "How do you optimize website performance?",
          "Explain the difference between synchronous and asynchronous JavaScript.",
          "What is responsive design and how do you implement it?",
        ],
        experienced: [
          "How would you implement state management in a large React application?",
          "Explain the virtual DOM and its benefits.",
          "How do you handle cross-browser compatibility issues?",
          "Describe your approach to testing frontend applications.",
          "How would you optimize a web application for mobile devices?",
        ],
      },
      "Backend Developer": {
        fresher: [
          "What is the difference between GET and POST HTTP methods?",
          "Explain what an API is and how it works.",
          "What is a database and what types are there?",
          "What is the difference between SQL and NoSQL databases?",
          "Explain what server-side rendering means.",
        ],
        intermediate: [
          "How do you handle authentication and authorization in web applications?",
          "Explain the concept of RESTful APIs.",
          "What are microservices and their advantages?",
          "How do you handle database transactions?",
          "Explain caching strategies in backend development.",
        ],
        experienced: [
          "How would you design a scalable backend architecture?",
          "Explain different database indexing strategies.",
          "How do you handle high-traffic scenarios?",
          "Describe your approach to API versioning.",
          "How would you implement a distributed system?",
        ],
      },
      "Full Stack Developer": {
        fresher: [
          "What does full stack development mean to you?",
          "Explain the difference between frontend and backend development.",
          "What is a web framework and name a few you know?",
          "How do frontend and backend communicate?",
          "What is version control and why is it important?",
        ],
        intermediate: [
          "How do you manage state between frontend and backend?",
          "Explain the MVC architecture pattern.",
          "How do you handle user authentication in a full stack application?",
          "What are the considerations for deploying a web application?",
          "How do you ensure data security in web applications?",
        ],
        experienced: [
          "How would you architect a full stack application for scalability?",
          "Explain your approach to testing across the full stack.",
          "How do you handle real-time features in web applications?",
          "Describe your deployment and CI/CD strategies.",
          "How would you optimize performance across the entire stack?",
        ],
      },
    };

    // Get questions for the specific role and level, or use generic ones
    const roleSet = questionSets[role];
    if (roleSet && roleSet[level]) {
      return roleSet[level];
    }

    // Generic fallback questions
    return [
      `What interests you most about working as a ${role}?`,
      `Describe a project you've worked on that's relevant to this ${role} role.`,
      `What technologies or tools are you most comfortable working with?`,
      `How do you approach learning new technologies or skills?`,
      `What challenges do you expect to face in a ${role} position?`,
    ];
  }

  /**
   * Get fallback analysis when AI analysis fails
   * @param {string[]} questions - Questions asked
   * @param {string[]} answers - User answers
   * @returns {Object} Fallback analysis
   */
  getFallbackAnalysis(questions, answers) {
    const feedback = questions.map((question, index) => ({
      questionId: (index + 1).toString(),
      score: 6,
      feedback: "Analysis unavailable. Try again later.",
      suggestions: ["Practice clear communication", "Use specific examples"],
    }));

    return {
      feedback,
      overallScore: 60,
      summary: "Analysis temporarily unavailable. Responses recorded.",
      improvements: [
        "Practice technical explanations",
        "Prepare specific examples",
        "Structure answers logically",
      ],
      metadata: {
        analyzedAt: new Date().toISOString(),
        model: "fallback",
        tokensUsed: 0,
      },
    };
  }
}

module.exports = OpenAIService;
