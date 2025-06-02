import { useEffect } from 'react'

import { api } from '../services/api'
import { useStore } from '../store'

export const useAuthCheck = () => {
  const { authStore } = useStore()

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token')
      const userId = localStorage.getItem('userId')

      if (!token || !userId) {
        return authStore.signOut()
      }

      try {
        // Set the token first
        authStore.setToken(token)

        // Then fetch the user data
        const user = await api.getUser(userId)
        if (user) {
          authStore.setUser({
            ...user,
          })
          authStore.setStatus('authenticated')
        } else {
          authStore.signOut()
        }
      } catch (error) {
        console.error('Auth check failed:', error)
        authStore.signOut()
      }
    }

    checkAuth()
  }, [authStore])

  return { isLoading: authStore.status === 'loading' }
}
