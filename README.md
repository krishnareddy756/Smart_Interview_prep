# Smart Interview Prep

An AI-powered interview preparation application that helps users practice for job interviews by generating personalized questions based on their resume and providing intelligent feedback on their answers.

## Features

- **Resume Upload & Analysis**: Upload PDF or Word documents for automatic parsing
- **AI-Powered Question Generation**: Get personalized interview questions based on your role and experience level
- **Interactive Interview Modes**: 
  - Text-only mode for written practice
  - Interactive mode with speech-to-text and text-to-speech
- **Intelligent Answer Analysis**: Receive detailed feedback and scoring on your responses
- **Mobile-Friendly**: Responsive design that works on all devices
- **Performance Optimized**: Fast loading with efficient caching and code splitting

## Tech Stack

### Backend
- **Node.js** with Express.js
- **OpenAI GPT** for question generation and answer analysis
- **Multer** for file uploads
- **PDF-Parse** and **Mammoth** for document processing
- **Helmet** and **CORS** for security
- **Express Rate Limit** for API protection

### Frontend
- **React 18** with modern hooks
- **Material-UI (MUI)** for components and theming
- **Vite** for fast development and optimized builds
- **Axios** for API communication
- **Web Speech API** for voice features

## Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- OpenAI API key

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd smart-interview-prep
   ```

2. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd ../frontend
   npm install
   ```

4. **Set up environment variables**
   ```bash
   # Copy example environment file
   cp .env.example .env
   
   # Edit .env and add your OpenAI API key
   OPENAI_API_KEY=sk-your-openai-api-key-here
   ```

5. **Start the development servers**
   
   Backend (from backend directory):
   ```bash
   npm run dev
   ```
   
   Frontend (from frontend directory):
   ```bash
   npm run dev
   ```

6. **Open your browser**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5000

## Production Deployment

### Using Docker Compose

1. **Build and start services**
   ```bash
   docker-compose up -d
   ```

2. **Access the application**
   - Application: http://localhost
   - API: http://localhost:5000

### Manual Deployment

1. **Build the frontend**
   ```bash
   cd frontend
   npm run build
   ```

2. **Start the backend in production mode**
   ```bash
   cd backend
   NODE_ENV=production npm start
   ```

3. **Serve the frontend** using nginx or similar web server

## Environment Variables

### Backend (.env)
```bash
# Required
OPENAI_API_KEY=sk-your-openai-api-key-here

# Optional
NODE_ENV=production
PORT=5000
ALLOWED_ORIGINS=https://yourdomain.com
MAX_FILE_SIZE=5242880
RATE_LIMIT_MAX=100
ENABLE_CACHING=true
```

### Frontend (.env)
```bash
VITE_API_URL=http://localhost:5000
VITE_APP_NAME=Smart Interview Prep
```

## API Endpoints

### Resume Upload
```
POST /api/resume
Content-Type: multipart/form-data
Body: { file: <resume.pdf|resume.docx> }
```

### Generate Questions
```
POST /api/questions
Content-Type: application/json
Body: {
  "role": "Frontend Developer",
  "level": "intermediate",
  "resumeSummary": { ... }
}
```

### Analyze Answers
```
POST /api/analyze-answers
Content-Type: application/json
Body: {
  "questions": [...],
  "answers": [...],
  "role": "Frontend Developer",
  "level": "intermediate"
}
```

## Performance Features

- **Code Splitting**: Automatic vendor and feature-based chunk splitting
- **Caching**: Intelligent API response caching
- **Compression**: Gzip compression for all assets
- **Rate Limiting**: Protection against abuse
- **Error Boundaries**: Graceful error handling
- **Lazy Loading**: Components and images loaded on demand

## Security Features

- **CORS Protection**: Configurable origin restrictions
- **Rate Limiting**: Per-IP request limits
- **Input Validation**: XSS and injection protection
- **File Type Validation**: Only PDF/DOCX uploads allowed
- **Security Headers**: Helmet.js security headers
- **Content Security Policy**: Strict CSP rules

## Browser Support

- **Chrome/Edge**: Full support including speech features
- **Firefox**: Full support including speech features
- **Safari**: Limited speech support, full text functionality
- **Mobile**: Responsive design with touch-friendly interface

## Development

### Running Tests
```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

### Code Quality
```bash
# Lint code
npm run lint

# Format code
npm run format
```

### Performance Monitoring
- Development: Automatic performance logging
- Production: `/metrics` endpoint for monitoring
- Health checks: `/health` endpoint

## Troubleshooting

### Common Issues

1. **OpenAI API Errors**
   - Verify API key is correct
   - Check rate limits and billing
   - Ensure network connectivity

2. **File Upload Issues**
   - Check file size (max 5MB)
   - Verify file type (PDF/DOCX only)
   - Ensure proper CORS configuration

3. **Speech Features Not Working**
   - Requires HTTPS in production
   - Check browser compatibility
   - Verify microphone permissions

### Performance Issues

1. **Slow Question Generation**
   - Check OpenAI API response times
   - Verify caching is enabled
   - Monitor rate limits

2. **High Memory Usage**
   - Check for memory leaks in components
   - Monitor cache size
   - Review file upload cleanup

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions:
- Create an issue on GitHub
- Check the troubleshooting section
- Review the API documentation

## Roadmap

- [ ] User authentication and profiles
- [ ] Interview session history
- [ ] Advanced analytics and insights
- [ ] Multiple language support
- [ ] Video interview simulation
- [ ] Integration with job boards