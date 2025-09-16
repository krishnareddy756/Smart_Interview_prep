/**
 * Text cleaning and normalization utilities
 */

class TextCleaner {
  /**
   * Clean and normalize text for better processing
   * @param {string} text - Raw text to clean
   * @returns {string} Cleaned text
   */
  static cleanText(text) {
    if (!text || typeof text !== 'string') {
      return '';
    }

    return text
      // Normalize line endings
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      
      // Remove excessive whitespace
      .replace(/[ \t]+/g, ' ')  // Multiple spaces/tabs to single space
      .replace(/\n{3,}/g, '\n\n')  // Multiple newlines to double newline
      
      // Remove special characters that might interfere with parsing
      .replace(/[^\w\s\n.,;:()\-+@#$%&*]/g, ' ')
      
      // Clean up spacing around punctuation
      .replace(/\s+([.,;:])/g, '$1')
      .replace(/([.,;:])\s+/g, '$1 ')
      
      // Trim and normalize
      .trim();
  }

  /**
   * Extract email addresses from text
   * @param {string} text - Text to search
   * @returns {string[]} Array of email addresses
   */
  static extractEmails(text) {
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    return text.match(emailRegex) || [];
  }

  /**
   * Extract phone numbers from text
   * @param {string} text - Text to search
   * @returns {string[]} Array of phone numbers
   */
  static extractPhoneNumbers(text) {
    const phoneRegex = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
    return text.match(phoneRegex) || [];
  }

  /**
   * Extract URLs from text
   * @param {string} text - Text to search
   * @returns {string[]} Array of URLs
   */
  static extractUrls(text) {
    const urlRegex = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/g;
    return text.match(urlRegex) || [];
  }

  /**
   * Remove personal information for privacy
   * @param {string} text - Text to sanitize
   * @returns {string} Sanitized text
   */
  static removePII(text) {
    let sanitized = text;
    
    // Remove email addresses
    sanitized = sanitized.replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[EMAIL]');
    
    // Remove phone numbers
    sanitized = sanitized.replace(/(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g, '[PHONE]');
    
    // Remove potential addresses (basic pattern)
    sanitized = sanitized.replace(/\d+\s+[A-Za-z\s]+(?:Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Lane|Ln|Boulevard|Blvd)/gi, '[ADDRESS]');
    
    return sanitized;
  }

  /**
   * Normalize skill names for better matching
   * @param {string} skill - Skill name to normalize
   * @returns {string} Normalized skill name
   */
  static normalizeSkill(skill) {
    return skill
      .trim()
      .toLowerCase()
      .replace(/[^\w\s]/g, '')  // Remove special characters
      .replace(/\s+/g, ' ')     // Normalize spaces
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))  // Title case
      .join(' ');
  }

  /**
   * Extract years from text (useful for experience calculation)
   * @param {string} text - Text to search
   * @returns {number[]} Array of years found
   */
  static extractYears(text) {
    const yearRegex = /\b(19|20)\d{2}\b/g;
    const matches = text.match(yearRegex);
    return matches ? matches.map(year => parseInt(year)) : [];
  }

  /**
   * Split text into sentences
   * @param {string} text - Text to split
   * @returns {string[]} Array of sentences
   */
  static splitIntoSentences(text) {
    return text
      .split(/[.!?]+/)
      .map(sentence => sentence.trim())
      .filter(sentence => sentence.length > 0);
  }

  /**
   * Extract bullet points from text
   * @param {string} text - Text to search
   * @returns {string[]} Array of bullet points
   */
  static extractBulletPoints(text) {
    const lines = text.split('\n');
    const bulletPoints = [];
    
    lines.forEach(line => {
      const trimmed = line.trim();
      // Look for common bullet point indicators
      if (/^[•·▪▫‣⁃-]\s/.test(trimmed) || /^\*\s/.test(trimmed) || /^\d+\.\s/.test(trimmed)) {
        bulletPoints.push(trimmed.replace(/^[•·▪▫‣⁃-]\s|^\*\s|^\d+\.\s/, '').trim());
      }
    });
    
    return bulletPoints;
  }

  /**
   * Calculate text readability score (simple implementation)
   * @param {string} text - Text to analyze
   * @returns {number} Readability score (0-100, higher is more readable)
   */
  static calculateReadability(text) {
    const sentences = this.splitIntoSentences(text);
    const words = text.split(/\s+/).filter(word => word.length > 0);
    const syllables = words.reduce((count, word) => count + this.countSyllables(word), 0);
    
    if (sentences.length === 0 || words.length === 0) return 0;
    
    const avgWordsPerSentence = words.length / sentences.length;
    const avgSyllablesPerWord = syllables / words.length;
    
    // Simplified Flesch Reading Ease formula
    const score = 206.835 - (1.015 * avgWordsPerSentence) - (84.6 * avgSyllablesPerWord);
    
    return Math.max(0, Math.min(100, Math.round(score)));
  }

  /**
   * Count syllables in a word (approximation)
   * @param {string} word - Word to count syllables for
   * @returns {number} Estimated syllable count
   */
  static countSyllables(word) {
    word = word.toLowerCase();
    if (word.length <= 3) return 1;
    
    word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
    word = word.replace(/^y/, '');
    const matches = word.match(/[aeiouy]{1,2}/g);
    
    return matches ? matches.length : 1;
  }
}

module.exports = TextCleaner;