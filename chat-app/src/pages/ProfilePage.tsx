import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import { useStore } from '../store';
import { FaUser, FaEnvelope, FaSave, FaSpinner } from 'react-icons/fa';

const ProfilePage = () => {
  const { authStore } = useStore();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    username: '',
    displayName: '',
    email: '',
    avatar: '',
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!authStore.user) {
      navigate('/login');
      return;
    }

    // Initialize form with current user data
    setFormData({
      username: authStore.user.username || '',
      displayName: authStore.user.displayName || '',
      email: authStore.user.email || '',
      avatar: authStore.user.avatar || '',
    });
  }, [authStore.user, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!authStore.user) {
      setError('User not authenticated');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const updates: { username?: string; displayName?: string; avatar?: string } = {};
      
      if (formData.username !== authStore.user.username) {
        updates.username = formData.username;
      }
      
      if (formData.displayName !== authStore.user.displayName) {
        updates.displayName = formData.displayName;
      }
      
      if (formData.avatar !== authStore.user.avatar) {
        updates.avatar = formData.avatar;
      }

      if (Object.keys(updates).length > 0) {
        await authStore.updateProfile(updates);
        setSuccess(true);
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
      setError(error instanceof Error ? error.message : 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  if (!authStore.user) {
    return null; // Will redirect due to useEffect
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden md:max-w-2xl">
        <div className="p-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
              <p className="mt-1 text-sm text-gray-600">
                Update your account information
              </p>
            </div>
            {authStore.user.avatar ? (
              <img
                className="h-16 w-16 rounded-full"
                src={authStore.user.avatar}
                alt={authStore.user.displayName || authStore.user.username}
              />
            ) : (
              <div className="h-16 w-16 rounded-full bg-indigo-100 flex items-center justify-center">
                <FaUser className="h-8 w-8 text-indigo-500" />
              </div>
            )}
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-md">
              {error}
            </div>
          )}

          {success && (
            <div className="mt-4 p-3 bg-green-50 text-green-700 rounded-md">
              Profile updated successfully!
            </div>
          )}

          <form className="mt-6 space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                Username
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  id="username"
                  name="username"
                  required
                  value={formData.username}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="displayName" className="block text-sm font-medium text-gray-700">
                Display Name
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  id="displayName"
                  name="displayName"
                  value={formData.displayName}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <div className="mt-1 flex rounded-md shadow-sm">
                <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm">
                  <FaEnvelope className="h-4 w-4" />
                </span>
                <input
                  type="email"
                  id="email"
                  name="email"
                  disabled
                  value={formData.email}
                  className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md border-gray-300 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-gray-100"
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Email cannot be changed
              </p>
            </div>

            <div>
              <label htmlFor="avatar" className="block text-sm font-medium text-gray-700">
                Avatar URL
              </label>
              <div className="mt-1">
                <input
                  type="url"
                  id="avatar"
                  name="avatar"
                  value={formData.avatar}
                  onChange={handleChange}
                  placeholder="https://example.com/avatar.jpg"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Enter a URL to your profile picture
              </p>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <FaSpinner className="animate-spin -ml-1 mr-2 h-4 w-4" />
                    Saving...
                  </>
                ) : (
                  <>
                    <FaSave className="-ml-1 mr-2 h-4 w-4" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default observer(ProfilePage);
