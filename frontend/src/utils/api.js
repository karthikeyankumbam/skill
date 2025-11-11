import axios from 'axios'
import { Capacitor } from '@capacitor/core'

// Determine API base URL based on platform
const getBaseURL = () => {
  // For native Android/iOS, use production URL or local IP
  if (Capacitor.isNativePlatform()) {
    // In production, use your deployed backend URL
    return import.meta.env.VITE_API_URL || 'https://your-backend-url.com/api'
  }
  // For web development, use proxy
  return '/api'
}

const api = axios.create({
  baseURL: getBaseURL(),
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 30000 // 30 seconds timeout for mobile
})

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth-storage')
    if (token) {
      try {
        const parsed = JSON.parse(token)
        if (parsed.state?.token) {
          config.headers.Authorization = `Bearer ${parsed.state.token}`
        }
      } catch (e) {
        // Ignore parse errors
      }
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized
      localStorage.removeItem('auth-storage')
      if (!Capacitor.isNativePlatform()) {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default api
