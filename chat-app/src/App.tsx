import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import { StoreProvider, useStore } from './store';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import ChatPage from './pages/ChatPage';
import ProfilePage from './pages/ProfilePage';
import Layout from './components/Layout';
import { Toaster } from 'react-hot-toast';
import { useEffect } from 'react';
import { isAuthenticated } from './services/api';
import './App.css';

// Auth provider component to handle authentication state
const AuthProvider = observer(({ children }: { children: React.ReactNode }) => {
  const { authStore, chatStore } = useStore();

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        if (isAuthenticated()) {
          // Get user data if authenticated
          await authStore.getCurrentUser();
          
          // Initialize WebSocket connection when user is authenticated
          try {
            await chatStore.initWebSocket();
            await chatStore.loadRooms();
          } catch (error) {
            console.error('Failed to initialize WebSocket:', error);
          }
        } else {
          // User is not authenticated
          authStore.setUser(null);
        }
      } catch (error) {
        console.error('Authentication error:', error);
        authStore.setUser(null);
      }
    };

    initializeAuth();

    // Clean up WebSocket connection on unmount
    return () => {
      chatStore.closeWebSocket();
    };
  }, [authStore, chatStore]);

  return <>{children}</>;
});

// Protected route component
const ProtectedRoute = observer(({ children }: { children: React.ReactNode }) => {
  const { authStore } = useStore();

  if (authStore.status === 'loading') {
    return (
      <div className="min-h-screen w-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!authStore.user) {
    // Redirect to login if not authenticated
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
});

// Public route component (only for unauthenticated users)
const PublicRoute = observer(({ children }: { children: React.ReactNode }) => {
  const { authStore } = useStore();

  if (authStore.status === 'loading') {
    return (
      <div className="min-h-screen w-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (authStore.user) {
    return <Navigate to="/chat" replace />;
  }

  return <>{children}</>;
});

const App = () => {
  return (
    <StoreProvider>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
            <Route path="/signup" element={<PublicRoute><SignupPage /></PublicRoute>} />
            <Route
              path="/"
              element={
              <ProtectedRoute>
                {/* <Layout> */}
                    <HomePage />
                {/* </Layout> */}
              </ProtectedRoute>
              }
            >
              <Route index element={<HomePage />} />
              <Route path="chat" element={<ChatPage />} />
              <Route path="chat/:roomId" element={<ChatPage />} />
            </Route>
            <Route path="/profile" element={
              <ProtectedRoute>
                {/* <Layout> */}
                  <ProfilePage />
                {/* </Layout> */}
              </ProtectedRoute>
            } />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <Toaster position="top-right" />
        </Router>
      </AuthProvider>
    </StoreProvider>
  );
};

export default observer(App);
