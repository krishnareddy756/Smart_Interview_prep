import React, { useState, useCallback } from 'react'
import {
  Typography,
  Paper,
  Box,
  Button,
  Alert,
  LinearProgress,
  Chip,
  Grid,
  Card,
  CardContent
} from '@mui/material'
import { CloudUpload, Description, CheckCircle } from '@mui/icons-material'
import { useDropzone } from 'react-dropzone'
import { useApp } from '../context/AppContext'
import { uploadResume } from '../api/resume'

function UploadPage() {
  const { setLoading, setError, setResumeData } = useApp()
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  const onDrop = useCallback(async (acceptedFiles) => {
    const file = acceptedFiles[0]
    if (!file) return

    setUploading(true)
    setLoading(true)
    setUploadProgress(0)

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 200)

      const resumeData = await uploadResume(file)
      
      clearInterval(progressInterval)
      setUploadProgress(100)
      
      setTimeout(() => {
        setResumeData(resumeData)
      }, 500)

    } catch (error) {
      setError(error.message || 'Failed to upload resume')
    } finally {
      setUploading(false)
      setLoading(false)
      setTimeout(() => setUploadProgress(0), 1000)
    }
  }, [setLoading, setError, setResumeData])

  const {
    getRootProps,
    getInputProps,
    isDragActive,
    isDragReject,
    acceptedFiles,
    fileRejections
  } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
    disabled: uploading
  })

  const getDropzoneColor = () => {
    if (isDragReject) return 'error.main'
    if (isDragActive) return 'primary.main'
    return 'grey.300'
  }

  const getDropzoneText = () => {
    if (isDragReject) return 'File type not supported'
    if (isDragActive) return 'Drop your resume here'
    return 'Drag & drop your resume here, or click to browse'
  }

  return (
    <Box>
      {/* Welcome Section */}
      <Paper elevation={2} sx={{ p: 4, mb: 3, textAlign: 'center' }}>
        <Typography variant="h3" gutterBottom color="primary">
          Smart Interview Prep
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
          AI-powered interview preparation with personalized questions
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Upload your resume to get started with tailored interview questions and practice sessions
        </Typography>
      </Paper>

      {/* Upload Section */}
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          Upload Your Resume
        </Typography>
        
        {/* Dropzone */}
        <Box
          {...getRootProps()}
          sx={{
            border: 2,
            borderColor: getDropzoneColor(),
            borderStyle: 'dashed',
            borderRadius: 2,
            p: 4,
            textAlign: 'center',
            cursor: uploading ? 'not-allowed' : 'pointer',
            bgcolor: isDragActive ? 'action.hover' : 'background.paper',
            transition: 'all 0.2s ease',
            '&:hover': {
              bgcolor: uploading ? 'background.paper' : 'action.hover'
            }
          }}
        >
          <input {...getInputProps()} />
          
          <CloudUpload 
            sx={{ 
              fontSize: 48, 
              color: getDropzoneColor(),
              mb: 2 
            }} 
          />
          
          <Typography variant="h6" gutterBottom>
            {getDropzoneText()}
          </Typography>
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Supported formats: PDF, DOCX (Max size: 10MB)
          </Typography>
          
          <Button
            variant="contained"
            disabled={uploading}
            sx={{ mt: 1 }}
          >
            {uploading ? 'Uploading...' : 'Browse Files'}
          </Button>
        </Box>

        {/* Upload Progress */}
        {uploading && (
          <Box sx={{ mt: 2 }}>
            <LinearProgress 
              variant="determinate" 
              value={uploadProgress} 
              sx={{ mb: 1 }}
            />
            <Typography variant="body2" color="text.secondary" textAlign="center">
              {uploadProgress < 90 ? 'Uploading...' : 'Processing resume...'}
            </Typography>
          </Box>
        )}

        {/* File Rejections */}
        {fileRejections.length > 0 && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {fileRejections[0].errors[0].message}
          </Alert>
        )}

        {/* Accepted Files */}
        {acceptedFiles.length > 0 && !uploading && (
          <Box sx={{ mt: 2 }}>
            <Alert severity="success" icon={<CheckCircle />}>
              File ready for upload: {acceptedFiles[0].name}
            </Alert>
          </Box>
        )}
      </Paper>

      {/* Features Section */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card elevation={1}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Description color="primary" sx={{ fontSize: 40, mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Resume Analysis
              </Typography>
              <Typography variant="body2" color="text.secondary">
                AI extracts your skills, experience, and projects automatically
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card elevation={1}>
            <CardContent sx={{ textAlign: 'center' }}>
              <CloudUpload color="primary" sx={{ fontSize: 40, mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Personalized Questions
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Get interview questions tailored to your background and target role
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card elevation={1}>
            <CardContent sx={{ textAlign: 'center' }}>
              <CheckCircle color="primary" sx={{ fontSize: 40, mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Interactive Practice
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Practice with speech recognition and get AI feedback on your answers
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}

export default UploadPage