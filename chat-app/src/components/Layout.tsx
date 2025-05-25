import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import { useStore } from '../store';
import { FaSignOutAlt, FaUser, FaChevronDown } from 'react-icons/fa';
import { useState, useRef, useEffect } from 'react';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const { authStore } = useStore();
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleSignOut = async () => {
    try {
      await authStore.signOut();
      navigate('/login');
    } catch (error) {
      console.error('Failed to sign out:', error);
    }
  };

  const navigateToProfile = () => {
    navigate('/profile');
    setIsDropdownOpen(false);
  };

  return (
    <div className="flex-1 w-full bg-gray-100 flex flex-col">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <Link to="/" className="text-xl font-bold text-indigo-600">
            RealTime Chat
          </Link>
          
          <nav className="flex items-center space-x-4">
            {authStore.user ? (
              <div className="flex items-center space-x-4">
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={toggleDropdown}
                    className="flex items-center space-x-2 focus:outline-none"
                    aria-haspopup="true"
                    aria-expanded={isDropdownOpen}
                  >
                    {authStore.user.avatar ? (
                      <img 
                        src={authStore.user.avatar} 
                        alt={authStore.user.username}
                        className="h-8 w-8 rounded-full"
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center">
                        <FaUser className="text-indigo-600" />
                      </div>
                    )}
                    <span className="text-sm text-gray-700">
                      {authStore.user.username}
                    </span>
                    <FaChevronDown 
                      className={`h-3 w-3 text-gray-500 transition-transform ${isDropdownOpen ? 'transform rotate-180' : ''}`} 
                    />
                  </button>

                  
                  {isDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                      <button
                        onClick={navigateToProfile}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                      >
                        <FaUser className="mr-2 text-gray-500" />
                        Profile
                      </button>
                      <button
                        onClick={handleSignOut}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 flex items-center"
                      >
                        <FaSignOutAlt className="mr-2" />
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-3 py-1 text-sm text-indigo-600 hover:text-indigo-800"
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  className="px-3 py-1 text-sm text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
                >
                  Sign Up
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>

      <footer className="bg-white border-t border-gray-200 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-gray-500">
          © {new Date().getFullYear()} RealTime Chat. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default observer(Layout);
