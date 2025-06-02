import React from 'react'
import { FaPlus } from 'react-icons/fa'

import { motion } from 'framer-motion'
import { observer } from 'mobx-react-lite'

import type { Room } from '../../types'

interface ChatSidebarProps {
  rooms: Room[]
  currentRoom: Room | null
  user: {
    displayName: string | null
    email: string | null
    photoURL: string | null
  }
  onSelectRoom: (room: Room) => void
  onCreateRoom: () => void
  onSignOut: () => void
}

const ChatSidebar: React.FC<ChatSidebarProps> = ({
  rooms,
  currentRoom,
  user,
  onSelectRoom,
  onCreateRoom,
  onSignOut,
}) => {
  return (
    <div className="flex h-full w-64 flex-col border-r border-gray-200 bg-white">
      <div className="border-b border-gray-200 p-4">
        <h2 className="text-lg font-semibold">Chat Rooms</h2>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onCreateRoom}
          className="mt-2 flex w-full items-center justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          <FaPlus className="mr-2" />
          Create Room
        </motion.button>
      </div>
      <div className="flex-1 overflow-y-auto">
        <div className="divide-y divide-gray-200">
          {rooms.map((room) => (
            <button
              key={room.id}
              onClick={() => onSelectRoom(room)}
              className={`w-full px-4 py-3 text-left text-sm font-medium ${
                currentRoom?.id === room.id
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center">
                <span className="truncate">{room.name}</span>
                {room.isPrivate && (
                  <span className="ml-2 inline-flex items-center rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-800">
                    Private
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>
      <div className="border-t border-gray-200 p-4">
        <div className="flex items-center justify-between">
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
                  {user.displayName?.charAt(0) || user.email?.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-700">
                {user.displayName || user.email?.split('@')[0]}
              </p>
              <p className="text-xs text-gray-500">Online</p>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onSignOut}
            className="text-xs text-red-600 hover:text-red-800"
          >
            Sign out
          </motion.button>
        </div>
      </div>
    </div>
  )
}

export default observer(ChatSidebar)
