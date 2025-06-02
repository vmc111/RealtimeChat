import { observer } from 'mobx-react-lite'

import Header from '../components/ui/Header'
import { Spinner } from '../components/ui/Spinner'
import { useStore } from '../store'

const HomePage = () => {
  const { authStore } = useStore()
  const { user, signOut, status } = authStore

  const loading = status === 'loading'

  if (loading) {
    return <Spinner className="h-screen w-full" size="lg" />
  }

  return (
    <div className="flex w-full flex-1 flex-col bg-gray-50">
      <Header />

      <main className="flex flex-1 flex-col items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl sm:tracking-tight lg:text-6xl">
            {user ? `Welcome, ${user.displayName || 'User'}!` : 'Welcome to ChatApp'}
          </h1>
          <p className="mx-auto mt-6 max-w-lg text-xl text-gray-500">
            {user
              ? 'Start chatting with your friends and colleagues.'
              : 'Connect with friends and colleagues in real-time with our secure and easy-to-use chat application.'}
          </p>

          {!user ? (
            <div className="mt-10 flex justify-center space-x-4">
              <a
                href="/signup"
                className="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-6 py-3 text-base font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                Get Started
              </a>
              <a
                href="/login"
                className="inline-flex items-center rounded-md border border-transparent bg-indigo-100 px-6 py-3 text-base font-medium text-indigo-700 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                Sign In
              </a>
            </div>
          ) : (
            <div className="mt-10">
              <a
                href="/chats"
                className="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-6 py-3 text-base font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                Go to Chat
              </a>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default observer(HomePage)
