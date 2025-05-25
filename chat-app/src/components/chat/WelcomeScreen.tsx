import { motion } from 'framer-motion';
import { FaPlus } from 'react-icons/fa';
import { observer } from 'mobx-react-lite';

interface WelcomeScreenProps {
  hasRooms: boolean;
  onCreateRoom: () => void;
}

const WelcomeScreen = ({ hasRooms, onCreateRoom }: WelcomeScreenProps) => {
  return (
    <div className="flex-1 flex items-center justify-center bg-gray-50">
      <div className="text-center p-4">
        <h3 className="text-lg font-medium text-gray-900">Welcome to ChatApp</h3>
        <p className="mt-1 text-sm text-gray-500 mb-4">
          {hasRooms
            ? 'Select a room from the sidebar or create a new one to start chatting.'
            : 'Create your first chat room to get started.'}
        </p>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onCreateRoom}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <FaPlus className="mr-2" />
          Create Room
        </motion.button>
      </div>
    </div>
  );
};

export default observer(WelcomeScreen);
