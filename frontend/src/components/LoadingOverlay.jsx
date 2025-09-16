import React from 'react'
import { Box, CircularProgress, Typography, Backdrop } from '@mui/material'

function LoadingOverlay({ message = 'Loading...' }) {
  return (
    <Backdrop
      sx={{
        color: '#fff',
        zIndex: (theme) => theme.zIndex.drawer + 1,
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        bgcolor: 'rgba(255, 255, 255, 0.8)'
      }}
      open={true}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 2
        }}
      >
        <CircularProgress size={60} />
        <Typography variant="h6" color="text.primary">
          {message}
        </Typography>
      </Box>
    </Backdrop>
  )
}

export default LoadingOverlay