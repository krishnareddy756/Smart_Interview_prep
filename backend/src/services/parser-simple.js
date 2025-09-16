const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const fs = require('fs');

class ResumeParser {
  constructor() {
    console.log('ResumeParser constructor called');
  }

  async parseResume(filePath, mimeType) {
    return {
      text: 'Sample text',
      skills: ['JavaScript', 'Node.js'],
      experience: 'Sample experience',
      education: ['Sample education'],
      projects: []
    };
  }
}

module.exports = ResumeParser;