import { makeAutoObservable, runInAction } from 'mobx';
import { api, isAuthenticated } from '../services/api';
import type * as Types from '../types';

class AuthStore {
  user: Types.User | null = null;
  status: Types.AuthStatus = 'loading';
  error: string | null = null;

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
    this.initializeAuth();
  }

  // Initialize auth state
  private initializeAuth = async () => {
    this.setStatus('loading');
    
    if (isAuthenticated()) {
      try {
        const userData = await this.getCurrentUser();
        runInAction(() => {
          this.user = userData;
          this.status = 'authenticated';
          this.error = null;
        });
        
      } catch (error) {
        runInAction(() => {
          this.status = 'unauthenticated';
          this.error = error instanceof Error ? error.message : 'Failed to authenticate';
        });
      }
    } else {
      runInAction(() => {
        this.status = 'unauthenticated';
      });
    }
  };

  // Set user data
  setUser(user: Types.User | null) {
    this.user = user;
    this.status = user ? 'authenticated' : 'unauthenticated';
    this.error = null;
  }

  // Get current user data
  async getCurrentUser(): Promise<Types.User> {
    try {
      const userData = await api.getCurrentUser();
      return {
        id: userData.id,
        username: userData.username || userData.email.split('@')[0],
        displayName: userData.displayName || userData.username || userData.email.split('@')[0],
        email: userData.email,
        avatar: userData.avatar,
        isOnline: true,
        lastSeen: new Date(),
      };
    } catch (error) {
      throw new Error('Failed to load user data');
    }
  }

  // Update auth status
  private setStatus = (status: Types.AuthStatus) => {
    this.status = status;
  };

  // Sign up with email and password
  signUp = async (email: string, password: string, username: string): Promise<void> => {
    this.setStatus('loading');
    this.error = null;

    try {
      const { user, token } = await api.signUp(email, password, username);
      
      // Store the token
      localStorage.setItem('token', token);
      
      runInAction(() => {
        this.user = {
          id: user.id,
          username: user.username,
          displayName: user.displayName || user.username,
          email: user.email,
          avatar: user.avatar,
          isOnline: true,
          lastSeen: new Date(),
        };
        this.status = 'authenticated';
        this.error = null;
      });
    } catch (error) {
      runInAction(() => {
        this.error = error instanceof Error ? error.message : 'Failed to sign up';
        this.status = 'unauthenticated';
      });
      throw error;
    }
  };

  // Sign in with email and password
  signIn = async (email: string, password: string): Promise<void> => {
    this.setStatus('loading');
    this.error = null;

    try {
      const { user, token } = await api.login(email, password);

      // Store the token
      localStorage.setItem('token', token);
      
      runInAction(() => {
        this.user = {
          id: user.id,
          username: user.username,
          displayName: user.displayName || user.username,
          email: user.email,
          avatar: user.avatar,
          isOnline: true,
          lastSeen: new Date(),
        };
        this.status = 'authenticated';
        this.error = null;
      });
    } catch (error) {
      runInAction(() => {
        this.error = error instanceof Error ? error.message : 'Failed to sign in';
        this.status = 'unauthenticated';
      });
      throw error;
    }
  };

  // Sign out
  signOut = async (): Promise<void> => {
    try {
      await api.logout();
      runInAction(() => {
        this.user = null;
        this.status = 'unauthenticated';
        this.error = null;
      });
    } catch (error) {
      console.error('Failed to sign out:', error);
      throw error;
    }
  };

  // Update user profile
  updateProfile = async (updates: { username?: string; displayName?: string; avatar?: string }): Promise<void> => {
    if (!this.user) {
      throw new Error('User not authenticated');
    }

    try {
      const updatedUser = await api.updateUserProfile(updates);
      
      runInAction(() => {
        if (this.user) {
          this.user = {
            ...this.user,
            ...updatedUser,
          };
        }
      });
    } catch (error) {
      console.error('Failed to update profile:', error);
      throw error;
    }
  };

  // Reset error state
  resetError = () => {
    this.error = null;
  };

  static create() {
    return new AuthStore();
  }
}

export default AuthStore;
