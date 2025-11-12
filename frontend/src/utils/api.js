import axios from 'axios'
import { Capacitor } from '@capacitor/core'

// Determine API base URL based on platform and environment
const getBaseURL = () => {
  // If VITE_API_URL is explicitly set, use it (for production web or native)
  if (import.meta.env.VITE_API_URL) {
    // Ensure it ends with /api if not already
    const apiUrl = import.meta.env.VITE_API_URL
    return apiUrl.endsWith('/api') ? apiUrl : `${apiUrl}/api`
  }
  
  // For native Android/iOS platforms, use default production URL
  if (Capacitor.isNativePlatform()) {
    return 'https://your-backend-url.com/api' // Update this with your actual backend URL
  }
  
  // For web (development and production), use relative path
  // Nginx will proxy /api requests to backend
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
