import { motion } from 'framer-motion';
import { observer } from 'mobx-react-lite';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import CreateRoomController from '../controllers/CreateRoomController';

import { useStore } from '../store';
import Header from '../components/ui/Header';
import { Button } from '@adobe/react-spectrum';

const ChatRoomsPage = () => {
  const { chatStore, authStore } = useStore();
  const { rooms, createRoom } = chatStore;

  const navigate = useNavigate();

  useEffect(() => {
    chatStore.loadRooms();
    chatStore.setCurrentUser(authStore.user);

    return () => {
      chatStore.clearRooms();
      chatStore.setCurrentUser(null);
    };
  }, []);

  const handleRoomClick = (roomId: string) => {
    navigate(`/chats/${roomId}`);
  };

  return (
    <div className="flex flex-col items-center h-screen w-full bg-gray-50 overflow-hidden">
      <Header className='w-full' />
      <div className="w-full my-auto flex flex-col grow bg-white rounded-lg shadow-md p-6 overflow-y-auto">
        <div className="flex justify-end">
          <CreateRoomController createRoom={createRoom} />
        </div>

        {rooms.length ? (
          <div className="flex items-center justify-center w-full overflow-y-auto">
            <div className="flex items-center justify-start flex-wrap gap-4 flex-wrap my-6 mx-auto">
            {rooms.map((room) => (
              <motion.div
                key={room.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="p-6 border border-gray-200 rounded-lg cursor-pointer transition-colors hover:border-indigo-300"
                onClick={() => handleRoomClick(room.id)}
              >
                <h3 className="font-medium text-gray-900">{room.name}</h3>
                <p className="text-sm text-gray-500">
                  {room.isPrivate ? 'Private' : 'Public'} • {room.members?.length || 0} members
                </p>
              </motion.div>
            ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="mx-auto h-24 w-24 text-gray-400 mb-4">
              <svg
                className="h-full w-full"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">No chat rooms yet</h3>
            <p className="text-gray-500 mb-6">Be the first to create a chat room!</p>
          </div>
        )}
      </div>
      </div>
  );
};

export default observer(ChatRoomsPage);
