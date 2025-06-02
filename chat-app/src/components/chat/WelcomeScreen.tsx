import { FaPlus } from 'react-icons/fa'

import { motion } from 'framer-motion'
import { observer } from 'mobx-react-lite'

interface WelcomeScreenProps {
  hasRooms: boolean
  onCreateRoom: () => void
}

const WelcomeScreen = ({ hasRooms, onCreateRoom }: WelcomeScreenProps) => {
  return (
    <div className="flex flex-1 items-center justify-center bg-gray-50">
      <div className="p-4 text-center">
        <h3 className="text-lg font-medium text-gray-900">Welcome to ChatApp</h3>
        <p className="mb-4 mt-1 text-sm text-gray-500">
          {hasRooms
            ? 'Select a room from the sidebar or create a new one to start chatting.'
            : 'Create your first chat room to get started.'}
        </p>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onCreateRoom}
          className="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          <FaPlus className="mr-2" />
          Create Room
        </motion.button>
      </div>
    </div>
  )
}

export default observer(WelcomeScreen)
