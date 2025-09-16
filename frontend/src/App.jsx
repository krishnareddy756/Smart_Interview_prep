import React from 'react'
import { Container, AppBar, Toolbar, Typography, Box, Alert, Snackbar } from '@mui/material'
import { useApp } from './context/AppContext'
import UploadPage from './pages/UploadPage'
import QuestionsPage from './pages/QuestionsPage'
import InterviewPage from './pages/InterviewPage'
import ResultsPage from './pages/ResultsPage'
import LoadingOverlay from './components/LoadingOverlay'
import MobileViewport from './components/MobileViewport'
import NetworkStatus from './components/NetworkStatus'

function App() {
  const { state, clearError } = useApp()
  const { currentStep, error, loading } = state

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'upload':
        return <UploadPage />
      case 'questions':
        return <QuestionsPage />
      case 'interview':
        return <InterviewPage />
      case 'results':
        return <ResultsPage />
      default:
        return <UploadPage />
    }
  }

  return (
    <Box sx={{ flexGrow: 1, minHeight: '100vh', bgcolor: 'background.default' }}>
      <MobileViewport />
      <AppBar position="static" elevation={1}>
        <Toolbar>
          <Typography 
            variant="h6" 
            component="div" 
            sx={{ 
              flexGrow: 1,
              fontSize: { xs: '1.1rem', sm: '1.25rem' }
            }}
          >
            Smart Interview Prep
          </Typography>
          <Typography 
            variant="body2" 
            sx={{ 
              opacity: 0.8,
              display: { xs: 'none', sm: 'block' }
            }}
          >
            Step: {currentStep.charAt(0).toUpperCase() + currentStep.slice(1)}
          </Typography>
        </Toolbar>
      </AppBar>
      
      <Container 
        maxWidth="lg" 
        sx={{ 
          mt: { xs: 2, sm: 4 }, 
          mb: { xs: 2, sm: 4 }, 
          position: 'relative',
          px: { xs: 1, sm: 2 }
        }}
      >
        {renderCurrentStep()}
        
        {/* Loading overlay */}
        {loading && <LoadingOverlay />}
        
        {/* Error snackbar */}
        <Snackbar
          open={!!error}
          autoHideDuration={8000}
          onClose={clearError}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
          sx={{ mt: 8 }} // Account for app bar
        >
          <Alert 
            onClose={clearError} 
            severity="error" 
            sx={{ 
              width: '100%',
              maxWidth: { xs: '90vw', sm: '500px' }
            }}
          >
            {error}
          </Alert>
        </Snackbar>
        
        {/* Network status */}
        <NetworkStatus />
      </Container>
    </Box>
  )
}

export default App