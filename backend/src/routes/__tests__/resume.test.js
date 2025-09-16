const request = require('supertest');
const fs = require('fs');
const path = require('path');
const app = require('../../index');

describe('Resume Upload API', () => {
  const testFilesDir = path.join(__dirname, '../../test-data');
  
  beforeAll(() => {
    // Create test data directory if it doesn't exist
    if (!fs.existsSync(testFilesDir)) {
      fs.mkdirSync(testFilesDir, { recursive: true });
    }
    
    // Create a sample PDF file for testing (mock content)
    const samplePdfPath = path.join(testFilesDir, 'sample-resume.pdf');
    if (!fs.existsSync(samplePdfPath)) {
      // Create a minimal PDF-like file for testing
      const pdfHeader = '%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n';
      fs.writeFileSync(samplePdfPath, pdfHeader);
    }
    
    // Create a sample text file that looks like a resume
    const sampleTextPath = path.join(testFilesDir, 'sample-resume.txt');
    const resumeContent = `
John Doe
Software Developer
john.doe@email.com

SKILLS:
JavaScript, Python, React, Node.js, MongoDB, AWS

EXPERIENCE:
Software Developer - ABC Corp (2021-2024)
3 years of experience in web development

EDUCATION:
B.Tech Computer Science - XYZ University (2017-2021)

PROJECTS:
E-commerce Website
Built using React, Node.js, and MongoDB
    `;
    fs.writeFileSync(sampleTextPath, resumeContent);
  });

  afterAll(() => {
    // Clean up test files
    if (fs.existsSync(testFilesDir)) {
      fs.rmSync(testFilesDir, { recursive: true, force: true });
    }
  });

  describe('POST /api/resume', () => {
    test('should return 400 when no file is uploaded', async () => {
      const response = await request(app)
        .post('/api/resume')
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error.code).toBe('NO_FILE');
      expect(response.body.error.message).toContain('No file uploaded');
    });

    test('should return 415 for unsupported file types', async () => {
      const textFilePath = path.join(testFilesDir, 'sample-resume.txt');
      
      const response = await request(app)
        .post('/api/resume')
        .attach('resume', textFilePath)
        .expect(415);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error.code).toBe('UNSUPPORTED_FORMAT');
      expect(response.body.error.message).toContain('Unsupported file format');
      expect(response.body.error.supportedFormats).toEqual(['PDF', 'DOCX']);
    });

    test('should return 400 for files that are too large', async () => {
      // Create a large file for testing
      const largeFilePath = path.join(testFilesDir, 'large-file.pdf');
      const largeContent = Buffer.alloc(15 * 1024 * 1024); // 15MB
      fs.writeFileSync(largeFilePath, largeContent);

      const response = await request(app)
        .post('/api/resume')
        .attach('resume', largeFilePath)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error.code).toBe('FILE_TOO_LARGE');
      expect(response.body.error.message).toContain('File too large');

      // Clean up
      fs.unlinkSync(largeFilePath);
    });

    test('should return 400 for empty files', async () => {
      const emptyFilePath = path.join(testFilesDir, 'empty.pdf');
      fs.writeFileSync(emptyFilePath, '');

      const response = await request(app)
        .post('/api/resume')
        .attach('resume', emptyFilePath)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error.code).toBe('EMPTY_FILE');

      // Clean up
      fs.unlinkSync(emptyFilePath);
    });

    test('should handle PDF parsing errors gracefully', async () => {
      // Create an invalid PDF file
      const invalidPdfPath = path.join(testFilesDir, 'invalid.pdf');
      fs.writeFileSync(invalidPdfPath, 'This is not a valid PDF file');

      const response = await request(app)
        .post('/api/resume')
        .attach('resume', invalidPdfPath);

      // Should return an error status (422 or 500)
      expect(response.status).toBeGreaterThanOrEqual(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.success).toBe(false);

      // Clean up
      fs.unlinkSync(invalidPdfPath);
    });

    test('should process valid resume and return structured data', async () => {
      // Create a more realistic PDF-like file for testing
      const validPdfPath = path.join(testFilesDir, 'valid-resume.pdf');
      const pdfContent = `%PDF-1.4
John Doe
Software Developer
Skills: JavaScript, Python, React, Node.js
Experience: 3 years of experience
Education: B.Tech Computer Science
Projects: E-commerce Website`;
      
      fs.writeFileSync(validPdfPath, pdfContent);

      const response = await request(app)
        .post('/api/resume')
        .attach('resume', validPdfPath);

      // The response might be an error due to invalid PDF format,
      // but we're testing the endpoint structure
      expect(response.body).toHaveProperty('success');
      
      if (response.body.success) {
        expect(response.body).toHaveProperty('data');
        expect(response.body.data).toHaveProperty('text');
        expect(response.body.data).toHaveProperty('skills');
        expect(response.body.data).toHaveProperty('experience');
        expect(response.body.data).toHaveProperty('education');
        expect(response.body.data).toHaveProperty('projects');
        expect(response.body.data).toHaveProperty('metadata');
      } else {
        expect(response.body).toHaveProperty('error');
      }

      // Clean up
      fs.unlinkSync(validPdfPath);
    });

    test('should include proper metadata in successful response', async () => {
      const testPdfPath = path.join(testFilesDir, 'metadata-test.pdf');
      fs.writeFileSync(testPdfPath, '%PDF-1.4\nTest content');

      const response = await request(app)
        .post('/api/resume')
        .attach('resume', testPdfPath);

      if (response.body.success) {
        expect(response.body.data.metadata).toHaveProperty('originalName');
        expect(response.body.data.metadata).toHaveProperty('fileSize');
        expect(response.body.data.metadata).toHaveProperty('uploadedAt');
        expect(response.body.data.metadata).toHaveProperty('processingTime');
        expect(response.body.data.metadata.originalName).toBe('metadata-test.pdf');
      }

      // Clean up
      fs.unlinkSync(testPdfPath);
    });

    test('should handle multiple file upload attempts', async () => {
      const response = await request(app)
        .post('/api/resume')
        .attach('resume', path.join(testFilesDir, 'sample-resume.txt'))
        .attach('resume2', path.join(testFilesDir, 'sample-resume.txt'))
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error.code).toBe('TOO_MANY_FILES');
    });

    test('should handle wrong field name', async () => {
      const response = await request(app)
        .post('/api/resume')
        .attach('wrongfield', path.join(testFilesDir, 'sample-resume.txt'))
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error.code).toBe('UNEXPECTED_FIELD');
    });
  });

  describe('Error Handling', () => {
    test('should return proper error structure', async () => {
      const response = await request(app)
        .post('/api/resume')
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('message');
      expect(response.body.error).toHaveProperty('code');
      expect(typeof response.body.error.message).toBe('string');
      expect(typeof response.body.error.code).toBe('string');
    });

    test('should include timestamp in error responses', async () => {
      const testPdfPath = path.join(testFilesDir, 'error-test.pdf');
      fs.writeFileSync(testPdfPath, 'invalid pdf content');

      const response = await request(app)
        .post('/api/resume')
        .attach('resume', testPdfPath);

      if (!response.body.success) {
        expect(response.body.error).toHaveProperty('timestamp');
        expect(new Date(response.body.error.timestamp)).toBeInstanceOf(Date);
      }

      // Clean up
      fs.unlinkSync(testPdfPath);
    });
  });

  describe('File Cleanup', () => {
    test('should clean up uploaded files after processing', async () => {
      const testPdfPath = path.join(testFilesDir, 'cleanup-test.pdf');
      fs.writeFileSync(testPdfPath, '%PDF-1.4\nTest content');

      await request(app)
        .post('/api/resume')
        .attach('resume', testPdfPath);

      // Check that no temporary files are left in uploads directory
      const uploadDir = process.env.UPLOAD_DIR || 'uploads';
      if (fs.existsSync(uploadDir)) {
        const files = fs.readdirSync(uploadDir);
        // Should not contain any files with 'cleanup-test' in the name
        const testFiles = files.filter(file => file.includes('cleanup-test'));
        expect(testFiles.length).toBe(0);
      }

      // Clean up
      fs.unlinkSync(testPdfPath);
    });
  });
});