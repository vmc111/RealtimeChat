import { observer } from 'mobx-react-lite';
import Header from '../components/ui/Header';
import { Spinner } from '../components/ui/Spinner';
import { useStore } from '../store';

const HomePage = () => {
  const {authStore } = useStore();
  const {user, signOut, status} = authStore

  const loading = status === 'loading';

  if (loading) {
    return (
      <Spinner className='w-full h-screen' size="lg" />
    );
  }

  return (
    <div className="flex-1 w-full bg-gray-50 flex flex-col">
     <Header />

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
                href="/chats"
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
