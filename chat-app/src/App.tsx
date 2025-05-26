import { observer } from 'mobx-react-lite';
import { Toaster } from 'react-hot-toast';
import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import './App.css';
import { Spinner } from './components/ui/Spinner';
import { useAuthCheck } from './hooks/useAuthCheck';
import ChatPage from './pages/ChatPage';
import ChatRoomsPage from './pages/ChatRoomsPage';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import { StoreProvider, useStore } from './store';

// Protected route component
const ProtectedRoute = observer(({ children }: { children: React.ReactNode }) => {
  const { authStore } = useStore();

  if (authStore.status === 'loading') {
    return (
      <Spinner className='w-full h-screen' size="lg" />
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
      <Spinner className='w-full h-screen' size="lg" />
    );
  }

  if (authStore.user) {
    return <Navigate to="/chats" replace />;
  }

  return <>{children}</>;
});

const AppContent = observer(() => {
  const { isLoading } = useAuthCheck();

  if (isLoading) {
    return (
      <Spinner className='w-full h-screen' size="lg" />
    );
  }

  return (
    <Router>
        <Routes>
          <Route path="/login" element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          } />
          <Route path="/signup" element={
            <PublicRoute>
              <SignupPage />
            </PublicRoute>
          } />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <HomePage />
              </ProtectedRoute>
            }
          />
            <Route path="/chats" element={
              <ProtectedRoute>
                <ChatRoomsPage />
              </ProtectedRoute>
            } />
            <Route path="/chats/:roomId" element={
              <ProtectedRoute>
                <ChatPage />
              </ProtectedRoute>
            } />
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      <Toaster position="top-right" />
    </Router>
  );
});

const App = () => {
  return (
    <StoreProvider>
      <AppContent />
    </StoreProvider>
  );
};

export default observer(App);
