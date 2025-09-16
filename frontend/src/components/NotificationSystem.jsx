import React, { createContext, useContext, useState, useCallback } from 'react'
import { Snackbar, Alert, AlertTitle, Slide, IconButton } from '@mui/material'
import { Close } from '@mui/icons-material'

const NotificationContext = createContext()

export const useNotification = () => {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider')
  }
  return context
}

function SlideTransition(props) {
  return <Slide {...props} direction="up" />
}

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([])

  const addNotification = useCallback((notification) => {
    const id = Date.now() + Math.random()
    const newNotification = {
      id,
      severity: 'info',
      autoHideDuration: 6000,
      ...notification
    }
    
    setNotifications(prev => [...prev, newNotification])
    
    // Auto-remove notification
    if (newNotification.autoHideDuration > 0) {
      setTimeout(() => {
        removeNotification(id)
      }, newNotification.autoHideDuration)
    }
    
    return id
  }, [])

  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id))
  }, [])

  const clearAll = useCallback(() => {
    setNotifications([])
  }, [])

  // Convenience methods
  const showSuccess = useCallback((message, options = {}) => {
    return addNotification({ 
      message, 
      severity: 'success', 
      ...options 
    })
  }, [addNotification])

  const showError = useCallback((message, options = {}) => {
    return addNotification({ 
      message, 
      severity: 'error', 
      autoHideDuration: 8000, // Longer for errors
      ...options 
    })
  }, [addNotification])

  const showWarning = useCallback((message, options = {}) => {
    return addNotification({ 
      message, 
      severity: 'warning', 
      ...options 
    })
  }, [addNotification])

  const showInfo = useCallback((message, options = {}) => {
    return addNotification({ 
      message, 
      severity: 'info', 
      ...options 
    })
  }, [addNotification])

  const contextValue = {
    notifications,
    addNotification,
    removeNotification,
    clearAll,
    showSuccess,
    showError,
    showWarning,
    showInfo
  }

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
      
      {/* Render notifications */}
      {notifications.map((notification, index) => (
        <Snackbar
          key={notification.id}
          open={true}
          TransitionComponent={SlideTransition}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          sx={{
            bottom: { xs: 16 + (index * 70), sm: 24 + (index * 70) },
            zIndex: 1400 + index
          }}
        >
          <Alert
            severity={notification.severity}
            variant="filled"
            onClose={() => removeNotification(notification.id)}
            action={
              <IconButton
                size="small"
                aria-label="close"
                color="inherit"
                onClick={() => removeNotification(notification.id)}
              >
                <Close fontSize="small" />
              </IconButton>
            }
            sx={{ 
              minWidth: { xs: 280, sm: 320 },
              maxWidth: { xs: 320, sm: 400 }
            }}
          >
            {notification.title && (
              <AlertTitle>{notification.title}</AlertTitle>
            )}
            {notification.message}
          </Alert>
        </Snackbar>
      ))}
    </NotificationContext.Provider>
  )
}

export default NotificationProvider