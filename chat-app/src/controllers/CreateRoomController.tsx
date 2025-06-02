import { PlusIcon } from '@heroicons/react/24/outline'

import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { motion } from 'framer-motion'

import CreateRoomModal from '../components/chat/CreateRoomModal'
import type { Room } from '../types'

interface CreateRoomControllerProps {
  className?: string
  createRoom: (name: string, isPrivate: boolean) => Promise<Room | null>
}

const CreateRoomController = (props: CreateRoomControllerProps): React.ReactElement => {
  const { createRoom } = props

  const [isCreateRoomModalOpen, setIsCreateRoomModalOpen] = useState(false)
  const navigate = useNavigate()

  const handleCreateRoom = async (name: string, isPrivate: boolean) => {
    try {
      const newRoom = await createRoom(name, isPrivate)

      if (newRoom) {
        // Navigate to the new room
        navigate(`/chats/${newRoom.id}`, {
          state: {
            from: 'room-creation',
            roomName: newRoom.name,
          },
        })
      }

      return newRoom
    } catch (error) {
      console.error('Error creating room:', error)
      throw error
    }
  }

  return (
    <>
      <motion.button
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setIsCreateRoomModalOpen(true)}
        className="flex items-center gap-2 rounded-lg border-none !bg-transparent p-2 text-primary-600 !outline-none hover:bg-primary-100"
      >
        <PlusIcon className="h-5 w-5" />
        Create Chat Room
      </motion.button>
      <CreateRoomModal
        isOpen={isCreateRoomModalOpen}
        onClose={() => setIsCreateRoomModalOpen(false)}
        onCreateRoom={handleCreateRoom}
      />
    </>
  )
}

export default CreateRoomController
