import type { Room } from '../../types';
import { observer } from 'mobx-react-lite';

interface ChatHeaderProps {
  room: Room;
}

const ChatHeader = ({ room }: ChatHeaderProps) => {
  return (
    <div className="border-b border-gray-200 bg-white p-4">
      <h2 className="text-lg font-semibold">{room.name}</h2>
      <p className="text-sm text-gray-500">
        {room.isPrivate ? 'Private' : 'Public'} room • {room.members?.length || 0} members
      </p>
    </div>
  );
};

export default observer(ChatHeader);
