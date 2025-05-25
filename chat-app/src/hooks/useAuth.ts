import { useState, useEffect } from 'react';
import type * as Types from '../types';
import { useStore } from '../store';

interface UseAuthReturn {
  user: Types.User | null;
  loading: boolean;
  error: string | null;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  resetError: () => void;
}

export const useAuth = (): UseAuthReturn => {
  const { authStore } = useStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync loading state with auth store
  useEffect(() => {
    setLoading(authStore.status === 'loading');
  }, [authStore.status]);

  // Sync error state with auth store
  useEffect(() => {
    setError(authStore.error);
  }, [authStore.error]);

  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      setError(null);
      await authStore.signInWithGoogle();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign in with Google');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Sign out function
  const handleSignOut = async () => {
    try {
      setLoading(true);
      setError(null);
      await authStore.signOutUser();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign out');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Reset error function
  const handleResetError = () => {
    setError(null);
    authStore.resetError();
  };

  return {
    user: authStore.user,
    loading,
    error,
    signInWithGoogle,
    signOut: handleSignOut,
    resetError: handleResetError,
  };
};

export default useAuth;
