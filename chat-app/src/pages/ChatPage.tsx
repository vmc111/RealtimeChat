import { observer } from 'mobx-react-lite';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ChatHeader from '../components/chat/ChatHeader';
import ChatInput from '../components/chat/ChatInput';
import MessageList from '../components/chat/MessageList';
import AddMemberModal from '../components/chat/AddMemberModal';
import { Spinner } from '../components/ui/Spinner';
import { useStore } from '../store';

const ChatPage = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { chatStore, authStore } = useStore();
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);

  const {
    currentRoom,
    sendMessage,
    joinRoom,
  } = chatStore;


  // Join the room when component mounts or roomId changes
  useEffect(() => {
    chatStore.setCurrentUser(authStore.user);
    if (roomId && authStore.user) {
      joinRoom(roomId).catch(error => {
        console.error('Error joining room:', error);
        // Redirect back to chat rooms if there's an error joining the room
        navigate('/chats');
      });

    }

    return () => {
      chatStore.setCurrentUser(null);
      chatStore.closeWebSocket();
    }
  }, [roomId]);

  const handleSendMessage = (message: string) => {
    if (!currentRoom || !authStore.user) return;
    sendMessage(message);
  };

  if (!authStore.user) {
    throw new Error('User not found');
  }

  if (!currentRoom ) {
    return (
      <Spinner className='w-full h-screen' size="lg" />
    );
  }


  return (
    <div className="flex flex-col grow bg-gray-100 overflow-hidden">
      <ChatHeader 
        room={currentRoom} 
        onAddMember={() => setIsAddMemberModalOpen(true)} 
      />
      {/* Main chat area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 max-w-full overflow-y-auto overflow-x-hidden p-4">
          {roomId ? <MessageList roomId={roomId as string} /> : null}
        </div>
        <ChatInput onSend={handleSendMessage} />
      </div>
      
      {isAddMemberModalOpen ? (
        <AddMemberModal
          isOpen={isAddMemberModalOpen}
          onOpenChange={setIsAddMemberModalOpen}
          roomId={roomId || ''}
        />
      ): null}
    </div>
  );
};

export default observer(ChatPage);
