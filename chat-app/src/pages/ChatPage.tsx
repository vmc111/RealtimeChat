import { ActionButton } from '@adobe/react-spectrum';
import { observer } from 'mobx-react-lite';
import { useEffect } from 'react';
import { FaArrowLeft } from 'react-icons/fa';
import { useNavigate, useParams } from 'react-router-dom';
import ChatHeader from '../components/chat/ChatHeader';
import ChatInput from '../components/chat/ChatInput';
import MessageList from '../components/chat/MessageList';
import { Spinner } from '../components/ui/Spinner';
import { useStore } from '../store';

const ChatPage = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { chatStore, authStore } = useStore();
  const {
    messages,
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
    }
  }, [roomId]);

  const handleSendMessage = (message: string) => {
    if (!currentRoom || !authStore.user) return;
    sendMessage(message);
  };

  const handleBackToRooms = () => {
    navigate('/chats');
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
    <div className="flex flex-col grow bg-gray-100">
      {/* Header with back button */}
      <header className='flex items-center w-full bg-white shadow-sm'>
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
        <ChatHeader room={currentRoom} />
      </header>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4">
          <MessageList messages={messages} currentUserId={authStore.user?.id} roomId={roomId as string} />
        </div>
        <div className="border-t border-gray-200 bg-white p-4">
          <ChatInput onSend={handleSendMessage} />
        </div>
      </div>
    </div>
  );
};

export default observer(ChatPage);
