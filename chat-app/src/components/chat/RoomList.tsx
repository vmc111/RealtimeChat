import { observer } from 'mobx-react-lite'

import type { Room } from '../../types'

interface RoomListProps {
  rooms: Room[]
  currentRoom: Room | null
  onSelectRoom: (room: Room) => void
  onCreateRoom?: () => void
  className?: string
}

const RoomList = ({
  rooms,
  currentRoom,
  onSelectRoom,
  onCreateRoom,
  className = '',
}: RoomListProps) => {
  return (
    <div className={`flex h-full flex-col ${className}`}>
      <div className="border-b border-gray-200 p-4">
        <h2 className="text-lg font-semibold text-gray-900">Rooms</h2>
      </div>

      <div className="flex-1 overflow-y-auto">
        {rooms.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            No rooms available. Create one to get started!
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {rooms.map((room) => (
              <li key={room.id}>
                <button
                  onClick={() => onSelectRoom(room)}
                  className={`w-full px-4 py-3 text-left transition-colors duration-150 hover:bg-gray-50 ${
                    currentRoom?.id === room.id ? 'border-l-4 border-indigo-500 bg-indigo-50' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-900">{room.name}</span>
                    {room.isPrivate && (
                      <span className="inline-flex items-center rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-medium text-indigo-800">
                        Private
                      </span>
                    )}
                  </div>
                  {room.description && (
                    <p className="truncate text-sm text-gray-500">{room.description}</p>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {onCreateRoom && (
        <div className="border-t border-gray-200 p-4">
          <button
            onClick={onCreateRoom}
            className="flex w-full items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            Create New Room
          </button>
        </div>
      )}
    </div>
  )
}

export default observer(RoomList)
