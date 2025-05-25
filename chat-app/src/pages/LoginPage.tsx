import { useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { FcGoogle } from 'react-icons/fc';
import { motion } from 'framer-motion';
import { FaSpinner } from 'react-icons/fa';
import { observer } from 'mobx-react-lite';

const LoginPage = () => {
  const { user, signInWithGoogle, loading } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';

  // If user is already logged in, redirect them to the page they were trying to access
  if (user) {
    return <Navigate to={from} replace />;
  }

  const handleGoogleSignIn = async () => {
    try {
      setError(null);
      await signInWithGoogle();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign in with Google');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Welcome to ChatApp
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Sign in to continue to your account
            </p>
          </div>
          
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">{error}</h3>
                </div>
              </div>
            </div>
          )}

          <div className="mt-8">
            <motion.button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <FaSpinner className="animate-spin mr-2" />
                  Signing in...
                </>
              ) : (
                <>
                  <FcGoogle className="w-5 h-5 mr-2" />
                  Sign in with Google
                </>
              )}
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default observer(LoginPage);
