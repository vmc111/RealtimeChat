import { motion } from 'framer-motion';
import { observer } from 'mobx-react-lite';
import { FaSignOutAlt } from 'react-icons/fa';

import { useAuth } from '../hooks/useAuth';

const HomePage = () => {
  const { user, signOut, loading } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="flex-1 w-full bg-gray-50 flex flex-col">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">ChatApp</h1>
          {user && (
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                {user.photoURL ? (
                  <img 
                    src={user.photoURL} 
                    alt={user.displayName || 'User'} 
                    className="h-8 w-8 rounded-full"
                  />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center">
                    <span className="text-indigo-600 font-medium">
                      {user.displayName?.charAt(0) || user.email?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  </div>
                )}
                <span className="ml-2 text-sm font-medium text-gray-700">
                  {user.displayName || user.email?.split('@')[0]}
                </span>
              </div>
              <motion.button
                onClick={handleSignOut}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <FaSignOutAlt className="mr-1" />
                Sign out
              </motion.button>
            </div>
          )}
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl sm:tracking-tight lg:text-6xl">
            {user ? `Welcome, ${user.displayName || 'User'}!` : 'Welcome to ChatApp'}
          </h1>
          <p className="mt-6 max-w-lg mx-auto text-xl text-gray-500">
            {user 
              ? 'Start chatting with your friends and colleagues.'
              : 'Connect with friends and colleagues in real-time with our secure and easy-to-use chat application.'}
          </p>
          
          {!user ? (
            <div className="mt-10 flex justify-center space-x-4">
              <a
                href="/signup"
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Get Started
              </a>
              <a
                href="/login"
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Sign In
              </a>
            </div>
          ) : (
            <div className="mt-10">
              <a
                href="/chat"
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Go to Chat
              </a>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default observer(HomePage);
