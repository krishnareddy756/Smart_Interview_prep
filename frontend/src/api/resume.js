import apiClient from './client'

/**
 * Upload and parse resume file
 * @param {File} file - Resume file to upload
 * @returns {Promise<Object>} Parsed resume data
 */
export async function uploadResume(file) {
  try {
    const formData = new FormData()
    formData.append('resume', file)

    const response = await apiClient.post('/api/resume', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 30000, // 30 seconds for file upload
    })

    return response.data.data
  } catch (error) {
    const message = error.response?.data?.error?.message || 'Failed to upload resume'
    throw new Error(message)
  }
}