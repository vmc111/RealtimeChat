import { observer } from 'mobx-react-lite';
import type { Room } from '../../types';

interface RoomListProps {
  rooms: Room[];
  currentRoom: Room | null;
  onSelectRoom: (room: Room) => void;
  onCreateRoom?: () => void;
  className?: string;
}

const RoomList = ({
  rooms,
  currentRoom,
  onSelectRoom,
  onCreateRoom,
  className = '',
}: RoomListProps) => {
  return (
    <div className={`flex flex-col h-full ${className}`}>
      <div className="p-4 border-b border-gray-200">
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
                  className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors duration-150 ${
                    currentRoom?.id === room.id ? 'bg-indigo-50 border-l-4 border-indigo-500' : ''
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-900">{room.name}</span>
                    {room.isPrivate && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                        Private
                      </span>
                    )}
                  </div>
                  {room.description && (
                    <p className="text-sm text-gray-500 truncate">{room.description}</p>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      
      {onCreateRoom && (
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={onCreateRoom}
            className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Create New Room
          </button>
        </div>
      )}
    </div>
  );
};

export default observer(RoomList);
