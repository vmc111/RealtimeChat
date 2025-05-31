import { ActionButton } from '@adobe/react-spectrum';
import { observer } from 'mobx-react-lite';
import { FaArrowLeft, FaPlus } from 'react-icons/fa';
import { FiUsers } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import type RoomModel from '../../store/models/RoomModel';

interface ChatHeaderProps {
  room: RoomModel;
  onAddMember?: () => void;
}


const ChatHeader = ({ room, onAddMember }: ChatHeaderProps) => {
    const navigate = useNavigate();
  

  const handleBackToRooms = () => {
    navigate('/chats');
  };

  const renderRoomNameAndMembers = (): React.ReactElement => (
    <div className="bg-white p-4 grow flex items-center justify-between overflow-hidden">
      <h2 className="text-lg font-semibold grow truncate" title={room.name}>
        {room.name}
      </h2>
      <div className="flex items-center gap-4">
        <ActionButton 
          onPress={onAddMember}
          isQuiet
          UNSAFE_style={{
            padding: '6px 12px',
            fontSize: '0.875rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            borderRadius: '4px',
            border: '1px solid #e2e8f0',
            cursor: 'pointer',
            outline: 'none',
          }}
        >
          <FaPlus size={14} />
          <span>Add Member</span>
        </ActionButton>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span>{room.isPrivate ? 'Private' : 'Public'} room</span>
          <div className="flex items-center gap-1">
            <FiUsers className="text-gray-500" />
            <span>{room.members.length || 0}</span>
          </div>
        </div>
      </div>
    </div>
  )
    
  
  return (
         <header className='flex items-center w-full bg-white shadow-sm border-b border-gray-300'>
           <div className="max-w-7xl px-4 sm:px-6 lg:px-8">
             <div className="flex items-center h-16">
               <ActionButton
                 UNSAFE_className="!cursor-pointer !border-none !outline-none"
                 onPress={handleBackToRooms}
                 >
                 <FaArrowLeft className="h-5 w-5 mr-2" />
                 Back to Rooms
               </ActionButton>
             </div>
           </div>
           {renderRoomNameAndMembers()}
         </header>
  );
};

export default observer(ChatHeader);
