import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import { StoreProvider, useStore } from './store';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import ChatPage from './pages/ChatPage';
import Layout from './components/Layout';
import { Toaster } from 'react-hot-toast';
import { auth } from './config/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { useEffect } from 'react';
import './App.css';

// Auth provider component to handle authentication state
const AuthProvider = observer(({ children }: { children: React.ReactNode }) => {
  const { authStore } = useStore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // User is signed in
        authStore.setUser({
          id: user.uid,
          displayName: user.displayName || user.email?.split('@')[0] || 'Anonymous',
          email: user.email || '',
          photoURL: user.photoURL || undefined,
          isOnline: true,
          lastSeen: new Date(),
        });
      } else {
        // User is signed out
        authStore.setUser(null);
      }
    });

    return () => unsubscribe();
  }, [authStore]);

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

// Public route that redirects to chat if already authenticated
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

function App() {
  return (
    <StoreProvider>
      <Router>
        <AuthProvider>
          <div className="flex-1 min-w-0 min-h-0 bg-gray-50 overflow-hidden">
            <Toaster position="top-right" />
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route
                path="/login"
                element={
                  <PublicRoute>
                    <LoginPage />
                  </PublicRoute>
                }
              />
              <Route
                path="/signup"
                element={
                  <PublicRoute>
                    <SignupPage />
                  </PublicRoute>
                }
              />
              <Route
                path="/chat"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <ChatPage />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </AuthProvider>
      </Router>
    </StoreProvider>
  );
}

export default observer(App);
