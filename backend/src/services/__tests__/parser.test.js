const ResumeParser = require('../parser');
const fs = require('fs');
const path = require('path');

describe('ResumeParser', () => {
  let parser;

  beforeEach(() => {
    parser = new ResumeParser();
  });

  describe('Text Cleaning', () => {
    test('should clean text properly', () => {
      const dirtyText = 'This   is\r\n\r\n\r\na   test\n\n\nwith   extra   spaces';
      const cleaned = parser.cleanText(dirtyText);
      expect(cleaned).toBe('This is\n\na test\n\nwith extra spaces');
    });
  });

  describe('Skills Extraction', () => {
    test('should extract common programming skills', () => {
      const text = 'I have experience with JavaScript, Python, React, and Node.js. Also worked with MongoDB and AWS.';
      const skills = parser.extractSkills(text);
      
      expect(skills).toContain('JavaScript');
      expect(skills).toContain('Python');
      expect(skills).toContain('React');
      expect(skills).toContain('Node.js');
      expect(skills).toContain('MongoDB');
      expect(skills).toContain('AWS');
    });

    test('should handle case insensitive matching', () => {
      const text = 'Skills: javascript, PYTHON, React.js, node.js';
      const skills = parser.extractSkills(text);
      
      expect(skills).toContain('JavaScript');
      expect(skills).toContain('Python');
      expect(skills).toContain('React');
      expect(skills).toContain('Node.js');
    });

    test('should not duplicate skills', () => {
      const text = 'JavaScript JavaScript React React Python';
      const skills = parser.extractSkills(text);
      
      expect(skills.filter(skill => skill === 'JavaScript')).toHaveLength(1);
      expect(skills.filter(skill => skill === 'React')).toHaveLength(1);
      expect(skills.filter(skill => skill === 'Python')).toHaveLength(1);
    });
  });

  describe('Experience Extraction', () => {
    test('should extract explicit experience mentions', () => {
      const text = 'I have 3 years of experience in software development';
      const experience = parser.extractExperience(text);
      expect(experience).toContain('3 years of experience');
    });

    test('should handle different experience formats', () => {
      const formats = [
        '5 years experience in web development',
        'Experience: 2 years',
        '4+ years of experience',
        '3 yrs experience'
      ];

      formats.forEach(text => {
        const experience = parser.extractExperience(text);
        expect(experience).toBeTruthy();
        expect(experience.toLowerCase()).toContain('year');
      });
    });

    test('should identify fresher indicators', () => {
      const text = 'Recent graduate seeking internship opportunities';
      const experience = parser.extractExperience(text);
      expect(experience.toLowerCase()).toContain('fresher');
    });
  });

  describe('Education Extraction', () => {
    test('should extract education information', () => {
      const text = 'B.Tech in Computer Science from XYZ University. Also completed MBA in 2020.';
      const education = parser.extractEducation(text);
      
      expect(education.length).toBeGreaterThan(0);
      expect(education.some(edu => edu.includes('B.Tech') || edu.includes('Computer Science'))).toBe(true);
    });

    test('should handle various education formats', () => {
      const text = `
        Education:
        Bachelor of Technology in Computer Science - ABC University (2018-2022)
        Master of Business Administration - XYZ College (2022-2024)
      `;
      const education = parser.extractEducation(text);
      
      expect(education.length).toBeGreaterThan(0);
    });
  });

  describe('Projects Extraction', () => {
    test('should extract project information', () => {
      const text = `
        Projects:
        E-commerce Website
        Developed a full-stack e-commerce platform using React, Node.js, and MongoDB.
        
        Task Management App
        Built a task management application with real-time updates using Socket.io and Express.
      `;
      
      const projects = parser.extractProjects(text);
      
      expect(projects.length).toBeGreaterThan(0);
      expect(projects[0]).toHaveProperty('title');
      expect(projects[0]).toHaveProperty('summary');
      expect(projects[0]).toHaveProperty('technologies');
    });

    test('should identify project titles correctly', () => {
      expect(parser.isProjectTitle('E-commerce Website')).toBe(true);
      expect(parser.isProjectTitle('Task Management System')).toBe(true);
      expect(parser.isProjectTitle('This is a very long description that should not be considered a title because it contains too many words')).toBe(false);
      expect(parser.isProjectTitle('developed using react')).toBe(false);
    });
  });

  describe('Section Extraction', () => {
    test('should extract specific sections', () => {
      const text = `
        Name: John Doe
        
        Skills:
        JavaScript, Python, React
        
        Experience:
        Software Developer at ABC Corp
        
        Education:
        B.Tech Computer Science
      `;
      
      const skillsSections = parser.extractSection(text, ['skills']);
      expect(skillsSections.length).toBeGreaterThan(0);
      expect(skillsSections[0]).toContain('JavaScript');
    });

    test('should identify section headers', () => {
      expect(parser.looksLikeSectionHeader('Skills')).toBe(true);
      expect(parser.looksLikeSectionHeader('Work Experience')).toBe(true);
      expect(parser.looksLikeSectionHeader('This is a long sentence that should not be considered a header')).toBe(false);
    });
  });

  describe('Technology Extraction from Lines', () => {
    test('should extract technologies from project descriptions', () => {
      const line = 'Built using React, Node.js, MongoDB, and deployed on AWS';
      const technologies = parser.extractTechnologiesFromLine(line);
      
      expect(technologies).toContain('React');
      expect(technologies).toContain('Node.js');
      expect(technologies).toContain('MongoDB');
      expect(technologies).toContain('AWS');
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid file paths gracefully', async () => {
      await expect(parser.parseResume('/invalid/path', 'application/pdf'))
        .rejects.toThrow();
    });

    test('should handle unsupported file types', async () => {
      await expect(parser.parseResume('/some/path', 'text/plain'))
        .rejects.toThrow('Unsupported file format');
    });
  });

  describe('Integration Tests', () => {
    test('should parse a complete resume text', () => {
      const sampleResume = `
        John Doe
        Software Developer
        john.doe@email.com | +1-234-567-8900
        
        Summary:
        Experienced software developer with 3 years of experience in web development.
        
        Skills:
        JavaScript, Python, React, Node.js, MongoDB, AWS, Git
        
        Experience:
        Software Developer - ABC Corp (2021-2024)
        - Developed web applications using React and Node.js
        - Worked with MongoDB for database management
        - Deployed applications on AWS
        
        Education:
        B.Tech in Computer Science - XYZ University (2017-2021)
        
        Projects:
        E-commerce Platform
        Built a full-stack e-commerce website using React, Express, and MongoDB.
        
        Task Manager
        Developed a task management application with real-time features using Socket.io.
      `;
      
      const skills = parser.extractSkills(sampleResume);
      const experience = parser.extractExperience(sampleResume);
      const education = parser.extractEducation(sampleResume);
      const projects = parser.extractProjects(sampleResume);
      
      expect(skills.length).toBeGreaterThan(5);
      expect(experience).toContain('3 years');
      expect(education.length).toBeGreaterThan(0);
      expect(projects.length).toBeGreaterThan(0);
      expect(projects[0].title).toBe('E-commerce Platform');
    });
  });
});