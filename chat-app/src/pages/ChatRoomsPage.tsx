import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

import { motion } from 'framer-motion'
import { observer } from 'mobx-react-lite'

import Header from '../components/ui/Header'
import { Spinner } from '../components/ui/Spinner'
import CreateRoomController from '../controllers/CreateRoomController'
import { useStore } from '../store'

const ChatRoomsPage = () => {
  const { chatStore, authStore } = useStore()
  const { rooms, createRoom, loading } = chatStore

  const navigate = useNavigate()

  useEffect(() => {
    chatStore.loadRooms()
    chatStore.setCurrentUser(authStore.user)

    return () => {
      chatStore.clearRooms()
      chatStore.setCurrentUser(null)
    }
  }, [])

  const handleRoomClick = (roomId: string) => {
    navigate(`/chats/${roomId}`)
  }

  const renderLoading = (): React.ReactElement => {
    return (
      <div className="flex grow items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    )
  }

  const renderNoRoomsView = (): React.ReactElement => (
    <div className="py-12 text-center">
      <div className="mx-auto mb-4 h-24 w-24 text-gray-400">
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
      <h3 className="mb-1 text-lg font-medium text-gray-900">No chat rooms yet</h3>
      <p className="mb-6 text-gray-500">Be the first to create a chat room!</p>
    </div>
  )

  const renderRooms = (): React.ReactElement => (
    <div className="flex w-full items-center justify-center overflow-y-auto">
      <div className="mx-auto my-6 flex flex-wrap items-center justify-start gap-4">
        {rooms.map((room) => (
          <motion.div
            key={room.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="cursor-pointer rounded-lg border border-gray-200 p-6 transition-colors hover:border-indigo-300"
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
  )

  const renderBody = (): React.ReactElement => {
    if (loading) return renderLoading()

    if (!rooms.length) return renderNoRoomsView()

    return renderRooms()
  }

  return (
    <div className="flex h-screen w-full flex-col items-center overflow-hidden bg-gray-50">
      <Header className="w-full" />
      <div className="my-auto flex w-full grow flex-col overflow-y-auto rounded-lg bg-white p-6 shadow-md">
        <div className="flex justify-end">
          <CreateRoomController createRoom={createRoom} />
        </div>
        {renderBody()}
      </div>
    </div>
  )
}

export default observer(ChatRoomsPage)
