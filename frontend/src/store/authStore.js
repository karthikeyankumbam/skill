import { create } from 'zustand'
import api from '../utils/api'

// Simple localStorage-based persistence
const storage = {
  getItem: (key) => {
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : null
    } catch {
      return null
    }
  },
  setItem: (key, value) => {
    localStorage.setItem(key, JSON.stringify(value))
  },
  removeItem: (key) => {
    localStorage.removeItem(key)
  }
}

export const useAuthStore = create((set, get) => {
  // Load initial state from localStorage
  const saved = storage.getItem('auth-storage')
  const initialState = saved?.state || {
    user: null,
    token: null,
    isAuthenticated: false
  }

  // Set API header if token exists
  if (initialState.token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${initialState.token}`
  }

  return {
    ...initialState,
    login: async (token, user) => {
      const state = { token, user, isAuthenticated: true }
      set(state)
      storage.setItem('auth-storage', { state })
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`
    },
    
    logout: () => {
      const state = { user: null, token: null, isAuthenticated: false }
      set(state)
      storage.removeItem('auth-storage')
      delete api.defaults.headers.common['Authorization']
    },
    
    updateUser: (user) => {
      const currentState = get()
      const state = { ...currentState, user }
      set(state)
      storage.setItem('auth-storage', { state })
    },
    
    checkAuth: async () => {
      const { token } = get()
      if (!token) return false
      
      try {
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`
        const response = await api.get('/auth/me')
        const state = { ...get(), user: response.data.user, isAuthenticated: true }
        set(state)
        storage.setItem('auth-storage', { state })
        return true
      } catch (error) {
        get().logout()
        return false
      }
    }
  }
})

