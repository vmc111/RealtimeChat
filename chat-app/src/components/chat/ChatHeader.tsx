import type { Room } from '../../types';
import { observer } from 'mobx-react-lite';
import { FiUsers } from 'react-icons/fi';

interface ChatHeaderProps {
  room: Room;
}

const ChatHeader = ({ room }: ChatHeaderProps) => {
  return (
    <div className="border-b border-gray-200 bg-white p-4 grow flex items-center justify-between">
      <h2 className="text-lg font-semibold">{room.name}</h2>
      <p className="text-sm text-gray-500">
        <div className="flex items-center gap-2">
          <span>{room.isPrivate ? 'Private' : 'Public'} room</span>
          <div className="flex items-center gap-1">
            <FiUsers className="text-gray-500" />
            <span>{room.members?.length || 0}</span>
          </div>
        </div>
      </p>
    </div>
  );
};

export default observer(ChatHeader);
