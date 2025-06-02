import React from 'react'
import { FaSignOutAlt } from 'react-icons/fa'

import cn from 'classnames'
import { motion } from 'framer-motion'
import { observer } from 'mobx-react-lite'

import { useStore } from '../../store'

interface HeaderProps {
  className?: string
}

const Header = (props: HeaderProps): React.ReactElement => {
  const { className } = props
  const { authStore } = useStore()
  const { user, signOut } = authStore

  return (
    <header className={cn('bg-white shadow-sm', className)}>
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
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
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100">
                  <span className="font-medium text-indigo-600">
                    {user?.displayName?.charAt(0) || user?.email?.charAt(0).toUpperCase() || 'U'}
                  </span>
                </div>
              )}
              <span className="ml-2 text-sm font-medium text-gray-700">
                {user?.displayName || user?.email?.split('@')[0]}
              </span>
            </div>
            <motion.button
              onClick={signOut}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="inline-flex items-center rounded-md border border-transparent bg-red-100 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              <FaSignOutAlt className="mr-1" />
              Sign out
            </motion.button>
          </div>
        )}
      </div>
    </header>
  )
}

export default observer(Header)
