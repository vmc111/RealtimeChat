import { useState } from 'react';
import { Navigate, useLocation, useNavigate, Link } from 'react-router-dom';
import { useStore } from '../store';
import { FaSpinner } from 'react-icons/fa';
import { observer } from 'mobx-react-lite';

const LoginPage = () => {
  const { authStore } = useStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(authStore.error || null);
  const location = useLocation();
  const navigate = useNavigate();
  const from = location.state?.from?.pathname || '/';

  // If user is already logged in, redirect them to the page they were trying to access
  if (authStore.user) {
    return <Navigate to={from} replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      await authStore.signIn(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(authStore.error || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 w-full bg-gray-50 flex flex-col">
      <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h2 className="mt-6 text-3xl text-left font-extrabold text-gray-900">
              Welcome to ChatApp
            </h2>
            <p className="mt-2 text-sm text-left text-gray-600">
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

          <form className="mt-8 space-y-6 w-full" onSubmit={handleSubmit}>
            <div className="rounded-md shadow-sm -space-y-px">
              <div>
                <label htmlFor="email-address" className="sr-only">
                  Email address
                </label>
                <input
                  id="email-address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder="Email address"
                  disabled={loading}
                />
              </div>
              <div>
                <label htmlFor="password" className="sr-only">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder="Password"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-4">
              <button
                type="submit"
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center">
                    <FaSpinner className="animate-spin mr-2" />
                    Signing in...
                  </span>
                ) : (
                  'Sign in'
                )}
              </button>
              <div className="text-center text-sm">
                <span className="text-gray-600">Don't have an account? </span>
                <Link
                  to="/signup"
                  className="font-medium text-indigo-600 hover:text-indigo-500"
                >
                  Sign up
                </Link>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default observer(LoginPage);
