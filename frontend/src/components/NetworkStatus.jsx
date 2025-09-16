import React, { useState, useEffect } from 'react'
import { Alert, Snackbar, IconButton } from '@mui/material'
import { Close, WifiOff, Wifi } from '@mui/icons-material'

/**
 * Component to show network connectivity status
 */
function NetworkStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [showOfflineAlert, setShowOfflineAlert] = useState(false)
  const [showOnlineAlert, setShowOnlineAlert] = useState(false)

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      setShowOfflineAlert(false)
      setShowOnlineAlert(true)
      
      // Auto-hide online alert after 3 seconds
      setTimeout(() => setShowOnlineAlert(false), 3000)
    }

    const handleOffline = () => {
      setIsOnline(false)
      setShowOnlineAlert(false)
      setShowOfflineAlert(true)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Show offline alert if already offline
    if (!navigator.onLine) {
      setShowOfflineAlert(true)
    }

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return (
    <>
      {/* Offline Alert */}
      <Snackbar
        open={showOfflineAlert}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        sx={{ mt: 8 }} // Account for app bar
      >
        <Alert
          severity="error"
          icon={<WifiOff />}
          action={
            <IconButton
              size="small"
              color="inherit"
              onClick={() => setShowOfflineAlert(false)}
            >
              <Close fontSize="small" />
            </IconButton>
          }
        >
          You're offline. Some features may not work properly.
        </Alert>
      </Snackbar>

      {/* Back Online Alert */}
      <Snackbar
        open={showOnlineAlert}
        autoHideDuration={3000}
        onClose={() => setShowOnlineAlert(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        sx={{ mt: 8 }}
      >
        <Alert
          severity="success"
          icon={<Wifi />}
          onClose={() => setShowOnlineAlert(false)}
        >
          You're back online!
        </Alert>
      </Snackbar>
    </>
  )
}

export default NetworkStatus