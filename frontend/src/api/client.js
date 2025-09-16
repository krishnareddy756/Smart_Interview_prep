import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor for logging
apiClient.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`)
    return config
  },
  (error) => {
    console.error('API Request Error:', error)
    return Promise.reject(error)
  }
)

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    console.error('API Response Error:', error.response?.data || error.message)
    
    // Enhance error object with more context
    if (error.response) {
      // Server responded with error status
      error.statusCode = error.response.status
      error.serverMessage = error.response.data?.error?.message || error.response.data?.message
    } else if (error.request) {
      // Request was made but no response received
      error.code = 'NETWORK_ERROR'
      error.message = 'Network connection failed'
    } else {
      // Something else happened
      error.code = 'REQUEST_SETUP_ERROR'
    }
    
    return Promise.reject(error)
  }
)

export default apiClient