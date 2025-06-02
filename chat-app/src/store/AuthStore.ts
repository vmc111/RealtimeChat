import { makeAutoObservable } from 'mobx'

import { api } from '../services/api'
import type * as Types from '../types'

class AuthStore {
  user: Types.User | null = null
  token: string | null = null
  status: Types.AuthStatus = 'loading'
  error: string | null = null

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true })
  }

  // Set token in store and localStorage
  setToken(token: string) {
    this.token = token
    if (token) {
      localStorage.setItem('token', token)
    } else {
      localStorage.removeItem('token')
    }
  }

  // Set user data
  setUser(user: Types.User | null) {
    this.user = user
      ? {
          ...user,
        }
      : null
    this.status = user ? 'authenticated' : 'unauthenticated'
    this.error = null
  }

  // Set loading/error states
  setStatus(status: Types.AuthStatus) {
    this.status = status
  }

  // Sign up with email and password
  signUp = async (email: string, password: string, username: string): Promise<void> => {
    this.setStatus('loading')
    this.error = null

    try {
      await api.signUp(email, password, username)
      this.status = 'unauthenticated'
      this.error = null
    } catch (error) {
      this.error = error instanceof Error ? error.message : 'Failed to sign up'
      this.status = 'unauthenticated'
      throw error
    }
  }

  // Sign in with email and password
  signIn = async (email: string, password: string): Promise<void> => {
    this.setStatus('loading')
    this.error = null

    try {
      const { user, token } = await api.login(email, password)

      // Store the token
      localStorage.setItem('token', token)
      localStorage.setItem('userId', user.id)

      this.user = {
        id: user.id,
        username: user.username,
        displayName: user.displayName || user.username,
        email: user.email,
        avatar: user.avatar,
        lastSeen: new Date(),
      }
      this.status = 'authenticated'
      this.error = null
    } catch (error) {
      this.error = error instanceof Error ? error.message : 'Failed to sign in'
      this.status = 'unauthenticated'
      throw error
    }
  }

  // Sign out
  signOut = (): void => {
    this.user = null
    this.token = null
    this.status = 'unauthenticated'
    this.error = null
    localStorage.removeItem('token')
    localStorage.removeItem('userId')
  }

  // Update user profile
  updateProfile = async (updates: {
    username?: string
    displayName?: string
    avatar?: string
  }): Promise<void> => {
    if (!this.user) {
      throw new Error('User not authenticated')
    }

    try {
      const updatedUser = await api.updateUserProfile(updates)

      if (this.user) {
        this.user = {
          ...this.user,
          ...updatedUser,
        }
      }
    } catch (error) {
      console.error('Failed to update profile:', error)
      throw error
    }
  }

  // Reset error state
  resetError = () => {
    this.error = null
  }

  static create() {
    return new AuthStore()
  }
}

export default AuthStore
