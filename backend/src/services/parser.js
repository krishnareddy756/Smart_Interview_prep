const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const fs = require('fs');

class ResumeParser {
  constructor() {
    // Common skills database for matching
    this.skillsDatabase = [
      // Programming Languages
      'JavaScript', 'Python', 'Java', 'C++', 'C#', 'PHP', 'Ruby', 'Go', 'Rust', 'Swift',
      'Kotlin', 'TypeScript', 'Scala', 'R', 'MATLAB', 'Perl', 'Shell', 'PowerShell',
      
      // Web Technologies
      'HTML', 'CSS', 'React', 'Angular', 'Vue.js', 'Node.js', 'Express', 'Django', 'Flask',
      'Spring', 'Laravel', 'Rails', 'ASP.NET', 'jQuery', 'Bootstrap', 'Tailwind',
      
      // Databases
      'MySQL', 'PostgreSQL', 'MongoDB', 'Redis', 'SQLite', 'Oracle', 'SQL Server',
      'Cassandra', 'DynamoDB', 'Firebase', 'Elasticsearch',
      
      // Cloud & DevOps
      'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'Jenkins', 'GitLab CI', 'GitHub Actions',
      'Terraform', 'Ansible', 'Chef', 'Puppet', 'Nginx', 'Apache',
      
      // Tools & Frameworks
      'Git', 'SVN', 'Jira', 'Confluence', 'Slack', 'Trello', 'Figma', 'Sketch', 'Photoshop',
      'Illustrator', 'InDesign', 'Canva', 'Postman', 'Swagger', 'REST API', 'GraphQL',
      
      // Data & Analytics
      'Pandas', 'NumPy', 'Scikit-learn', 'TensorFlow', 'PyTorch', 'Keras', 'Tableau',
      'Power BI', 'Excel', 'Google Analytics', 'Hadoop', 'Spark', 'Kafka',
      
      // Mobile Development
      'React Native', 'Flutter', 'iOS', 'Android', 'Xamarin', 'Ionic', 'Cordova',
      
      // Testing
      'Jest', 'Mocha', 'Cypress', 'Selenium', 'JUnit', 'PyTest', 'Postman', 'TestNG'
    ];

    // Education keywords
    this.educationKeywords = [
      'B.Tech', 'B.E.', 'Bachelor', 'Master', 'M.Tech', 'M.E.', 'MBA', 'PhD', 'Doctorate',
      'Diploma', 'Certificate', 'Associate', 'B.Sc', 'M.Sc', 'B.A.', 'M.A.', 'B.Com', 'M.Com',
      'Computer Science', 'Information Technology', 'Software Engineering', 'Electronics',
      'Mechanical', 'Civil', 'Electrical', 'Chemical', 'Biotechnology', 'Mathematics',
      'Physics', 'Chemistry', 'Biology', 'Business Administration', 'Management'
    ];
  }

  /**
   * Parse resume file and extract structured information
   * @param {string} filePath - Path to the resume file
   * @param {string} mimeType - MIME type of the file
   * @returns {Promise<Object>} Parsed resume data
   */
  async parseResume(filePath, mimeType) {
    try {
      let text = '';
      
      // Extract text based on file type
      if (mimeType === 'application/pdf') {
        text = await this.extractPdfText(filePath);
      } else if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        text = await this.extractDocxText(filePath);
      } else {
        throw new Error('Unsupported file format');
      }

      // Clean and normalize text
      const cleanedText = this.cleanText(text);
      
      // Extract structured information
      const skills = this.extractSkills(cleanedText);
      const experience = this.extractExperience(cleanedText);
      const education = this.extractEducation(cleanedText);
      const projects = this.extractProjects(cleanedText);

      return {
        text: cleanedText,
        skills,
        experience,
        education,
        projects,
        raw: {
          originalText: text,
          fileType: mimeType,
          extractedAt: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('Resume parsing error:', error);
      throw new Error(`Failed to parse resume: ${error.message}`);
    }
  }

  /**
   * Extract text from PDF file
   * @param {string} filePath - Path to PDF file
   * @returns {Promise<string>} Extracted text
   */
  async extractPdfText(filePath) {
    try {
      const dataBuffer = fs.readFileSync(filePath);
      const data = await pdfParse(dataBuffer);
      return data.text;
    } catch (error) {
      throw new Error(`PDF parsing failed: ${error.message}`);
    }
  }

  /**
   * Extract text from DOCX file
   * @param {string} filePath - Path to DOCX file
   * @returns {Promise<string>} Extracted text
   */
  async extractDocxText(filePath) {
    try {
      const result = await mammoth.extractRawText({ path: filePath });
      return result.value;
    } catch (error) {
      throw new Error(`DOCX parsing failed: ${error.message}`);
    }
  }

  /**
   * Clean and normalize extracted text
   * @param {string} text - Raw extracted text
   * @returns {string} Cleaned text
   */
  cleanText(text) {
    return text
      .replace(/\r\n/g, '\n')  // Normalize line endings
      .replace(/\n{3,}/g, '\n\n')  // Remove excessive line breaks
      .replace(/\s{2,}/g, ' ')  // Remove excessive spaces
      .trim();
  }

  /**
   * Extract skills from resume text
   * @param {string} text - Resume text
   * @returns {string[]} Array of identified skills
   */
  extractSkills(text) {
    const foundSkills = new Set();
    const textLower = text.toLowerCase();
    
    // Check each skill in our database
    this.skillsDatabase.forEach(skill => {
      const skillLower = skill.toLowerCase();
      
      // Look for exact matches with word boundaries
      const regex = new RegExp(`\\b${skillLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
      if (regex.test(textLower)) {
        foundSkills.add(skill);
      }
      
      // Also check for variations with dots, dashes, etc.
      const variations = [
        skillLower.replace(/\./g, ''),  // Remove dots (e.g., "Node.js" -> "nodejs")
        skillLower.replace(/-/g, ''),   // Remove dashes
        skillLower.replace(/\s+/g, ''), // Remove spaces
      ];
      
      variations.forEach(variation => {
        if (variation !== skillLower && textLower.includes(variation)) {
          foundSkills.add(skill);
        }
      });
    });

    // Look for skills in dedicated sections
    const skillsSections = this.extractSection(text, ['skills', 'technical skills', 'technologies', 'expertise', 'tools', 'programming languages']);
    skillsSections.forEach(section => {
      // Split by common delimiters
      const skillCandidates = section.split(/[,;|\n•·\-\*]/);
      
      skillCandidates.forEach(candidate => {
        const cleanCandidate = candidate.trim().toLowerCase();
        if (cleanCandidate.length > 1) {
          this.skillsDatabase.forEach(skill => {
            const skillLower = skill.toLowerCase();
            if (cleanCandidate.includes(skillLower) || skillLower.includes(cleanCandidate)) {
              foundSkills.add(skill);
            }
          });
        }
      });
    });

    // Look for programming languages specifically
    const programmingPatterns = [
      /programming languages?:?\s*([^\n]+)/gi,
      /languages?:?\s*([^\n]+)/gi,
      /technologies?:?\s*([^\n]+)/gi
    ];
    
    programmingPatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        matches.forEach(match => {
          this.skillsDatabase.forEach(skill => {
            if (match.toLowerCase().includes(skill.toLowerCase())) {
              foundSkills.add(skill);
            }
          });
        });
      }
    });

    return Array.from(foundSkills).sort();
  }

  /**
   * Extract experience information
   * @param {string} text - Resume text
   * @returns {string} Experience summary
   */
  extractExperience(text) {
    const experiencePatterns = [
      /(\d+)\+?\s*years?\s*of\s*experience/gi,
      /(\d+)\+?\s*years?\s*experience/gi,
      /experience\s*:?\s*(\d+)\+?\s*years?/gi,
      /(\d+)\+?\s*yrs?\s*experience/gi,
      /(\d+)\+?\s*year\s*experience/gi
    ];

    // Try to find explicit experience mentions
    for (const pattern of experiencePatterns) {
      const match = text.match(pattern);
      if (match) {
        return match[0];
      }
    }

    // Try to infer from work history dates
    const datePattern = /\b(19|20)\d{2}\b/g;
    const dates = text.match(datePattern);
    if (dates && dates.length >= 2) {
      const years = dates.map(d => parseInt(d)).sort();
      const experienceYears = new Date().getFullYear() - Math.min(...years);
      if (experienceYears > 0 && experienceYears < 50) {
        return `Approximately ${experienceYears} years`;
      }
    }

    // Look for internship or fresher indicators
    const fresherKeywords = ['intern', 'internship', 'fresher', 'graduate', 'entry level'];
    const textLower = text.toLowerCase();
    
    for (const keyword of fresherKeywords) {
      if (textLower.includes(keyword)) {
        return 'Fresher/Entry Level';
      }
    }

    return 'Experience level not specified';
  }

  /**
   * Extract education information
   * @param {string} text - Resume text
   * @returns {string[]} Array of education entries
   */
  extractEducation(text) {
    const education = new Set();
    const textLower = text.toLowerCase();

    // Look for education keywords
    this.educationKeywords.forEach(keyword => {
      const keywordLower = keyword.toLowerCase();
      if (textLower.includes(keywordLower)) {
        // Try to extract the full education line
        const lines = text.split('\n');
        lines.forEach(line => {
          if (line.toLowerCase().includes(keywordLower)) {
            education.add(line.trim());
          }
        });
        
        // If no full line found, just add the keyword
        if (education.size === 0) {
          education.add(keyword);
        }
      }
    });

    // Look for education sections
    const educationSections = this.extractSection(text, ['education', 'academic', 'qualification']);
    educationSections.forEach(section => {
      const lines = section.split('\n').filter(line => line.trim().length > 10);
      lines.forEach(line => education.add(line.trim()));
    });

    return Array.from(education).slice(0, 5); // Limit to 5 entries
  }

  /**
   * Extract project information
   * @param {string} text - Resume text
   * @returns {Object[]} Array of project objects
   */
  extractProjects(text) {
    const projects = [];
    
    // Look for project sections
    const projectSections = this.extractSection(text, ['projects', 'project work', 'key projects', 'major projects', 'academic projects', 'personal projects']);
    
    projectSections.forEach(section => {
      const lines = section.split('\n').filter(line => line.trim().length > 0);
      let currentProject = null;
      
      lines.forEach(line => {
        const trimmedLine = line.trim();
        
        // Check if this looks like a project title (capitalized, not too long)
        if (this.isProjectTitle(trimmedLine)) {
          // Save previous project if exists
          if (currentProject) {
            projects.push(currentProject);
          }
          
          // Start new project
          currentProject = {
            title: trimmedLine,
            summary: '',
            technologies: []
          };
        } else if (currentProject && trimmedLine.length > 10) {
          // Add to project description
          currentProject.summary += (currentProject.summary ? ' ' : '') + trimmedLine;
          
          // Extract technologies from this line
          const techs = this.extractTechnologiesFromLine(trimmedLine);
          currentProject.technologies.push(...techs);
        } else if (!currentProject && trimmedLine.length > 20) {
          // This might be a project without a clear title
          const techs = this.extractTechnologiesFromLine(trimmedLine);
          if (techs.length > 0) {
            projects.push({
              title: trimmedLine.substring(0, 50) + (trimmedLine.length > 50 ? '...' : ''),
              summary: trimmedLine,
              technologies: techs
            });
          }
        }
      });
      
      // Don't forget the last project
      if (currentProject) {
        projects.push(currentProject);
      }
    });

    // If no projects found in dedicated sections, look for project-like content
    if (projects.length === 0) {
      const projectKeywords = ['developed', 'built', 'created', 'designed', 'implemented', 'worked on'];
      const lines = text.split('\n');
      
      lines.forEach(line => {
        const trimmedLine = line.trim();
        if (trimmedLine.length > 30) {
          const hasProjectKeyword = projectKeywords.some(keyword => 
            trimmedLine.toLowerCase().includes(keyword)
          );
          
          if (hasProjectKeyword) {
            const techs = this.extractTechnologiesFromLine(trimmedLine);
            if (techs.length > 0) {
              projects.push({
                title: trimmedLine.substring(0, 50) + (trimmedLine.length > 50 ? '...' : ''),
                summary: trimmedLine,
                technologies: techs
              });
            }
          }
        }
      });
    }

    // Clean up and deduplicate technologies
    projects.forEach(project => {
      project.technologies = [...new Set(project.technologies)];
      project.summary = project.summary.substring(0, 300); // Limit summary length
    });

    return projects.slice(0, 8); // Limit to 8 projects
  }

  /**
   * Check if a line looks like a project title
   * @param {string} line - Text line
   * @returns {boolean} Whether it looks like a project title
   */
  isProjectTitle(line) {
    // Project titles are usually:
    // - Not too long (< 100 chars)
    // - Start with capital letter
    // - Don't contain too many common words
    if (line.length > 100 || line.length < 3) return false;
    
    const firstChar = line.charAt(0);
    if (firstChar !== firstChar.toUpperCase()) return false;
    
    // Avoid lines that are clearly descriptions
    const descriptionWords = ['the', 'this', 'that', 'with', 'using', 'developed', 'created', 'built'];
    const words = line.toLowerCase().split(' ');
    const descriptionWordCount = words.filter(word => descriptionWords.includes(word)).length;
    
    return descriptionWordCount < 2;
  }

  /**
   * Extract technologies from a text line
   * @param {string} line - Text line
   * @returns {string[]} Array of technologies found
   */
  extractTechnologiesFromLine(line) {
    const technologies = [];
    const lineLower = line.toLowerCase();
    
    this.skillsDatabase.forEach(skill => {
      if (lineLower.includes(skill.toLowerCase())) {
        technologies.push(skill);
      }
    });
    
    return technologies;
  }

  /**
   * Extract specific sections from resume text
   * @param {string} text - Resume text
   * @returns {string[]} Array of section contents
   */
  extractSection(text, sectionNames) {
    const sections = [];
    const lines = text.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].toLowerCase().trim();
      
      // Check if this line is a section header
      const isHeader = sectionNames.some(name => 
        line.includes(name.toLowerCase()) && line.length < 50
      );
      
      if (isHeader) {
        // Extract content until next section or end
        let sectionContent = '';
        let j = i + 1;
        
        while (j < lines.length) {
          const nextLine = lines[j].trim();
          
          // Stop if we hit another section header
          if (this.looksLikeSectionHeader(nextLine)) {
            break;
          }
          
          sectionContent += nextLine + '\n';
          j++;
          
          // Limit section size
          if (sectionContent.length > 2000) break;
        }
        
        if (sectionContent.trim().length > 0) {
          sections.push(sectionContent.trim());
        }
      }
    }
    
    return sections;
  }

  /**
   * Check if a line looks like a section header
   * @param {string} line - Text line
   * @returns {boolean} Whether it looks like a section header
   */
  looksLikeSectionHeader(line) {
    if (line.length > 50 || line.length < 3) return false;
    
    const commonHeaders = [
      'experience', 'education', 'skills', 'projects', 'work', 'employment',
      'qualifications', 'certifications', 'achievements', 'summary', 'objective',
      'contact', 'personal', 'references', 'languages', 'interests', 'hobbies'
    ];
    
    const lineLower = line.toLowerCase();
    return commonHeaders.some(header => lineLower.includes(header));
  }
}

module.exports = ResumeParser;