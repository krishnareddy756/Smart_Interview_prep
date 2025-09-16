import React from 'react'
import { Typography, Paper, Box } from '@mui/material'

function ResultsPage() {
  return (
    <Paper elevation={3} sx={{ p: 4 }}>
      <Box textAlign="center">
        <Typography variant="h4" gutterBottom>
          Interview Results
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Results component will be implemented in subsequent tasks
        </Typography>
      </Box>
    </Paper>
  )
}

export default ResultsPage