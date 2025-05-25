import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useChat } from '../hooks/useChat';
import MessageList from '../components/chat/MessageList';
import ChatInput from '../components/chat/ChatInput';
import ChatSidebar from '../components/chat/ChatSidebar';
import ChatHeader from '../components/chat/ChatHeader';
import WelcomeScreen from '../components/chat/WelcomeScreen';
import CreateRoomModal from '../components/chat/CreateRoomModal';
import { FaBars, FaTimes } from 'react-icons/fa';
import { AnimatePresence } from 'framer-motion';

const ChatPage = () => {
  const { user, signOut } = useAuth();
  const {
    messages = [],
    rooms = [],
    currentRoom,
    sendMessage,
    createRoom,
    setCurrentRoom,
  } = useChat();

  const [isCreateRoomModalOpen, setIsCreateRoomModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Toggle mobile menu
  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (isMobileMenuOpen && !target.closest('.sidebar-container') && !target.closest('.mobile-menu-button')) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMobileMenuOpen]);

  const handleSendMessage = (message: string) => {
    if (!currentRoom || !user) return;
    sendMessage(message, currentRoom.id);
  };

  const handleCreateRoom = async (name: string, isPrivate: boolean) => {
    if (!user) {
      throw new Error('User not authenticated');
    }
    try {
      const newRoom = await createRoom(name, isPrivate);
      if (newRoom) {
        setCurrentRoom(newRoom);
        setIsCreateRoomModalOpen(false);
        setIsMobileMenuOpen(false);
      }
    } catch (error) {
      console.error('Error creating room:', error);
      throw error; // Re-throw to be caught by the CreateRoomModal
    }
  };

  if (!user) {
    return null; // Should be handled by ProtectedRoute
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Mobile menu button */}
      <button
        onClick={toggleMobileMenu}
        className="mobile-menu-button md:hidden fixed top-4 left-4 z-30 p-2 rounded-md bg-white shadow-md"
      >
        {isMobileMenuOpen ? <FaTimes className="h-5 w-5" /> : <FaBars className="h-5 w-5" />}
      </button>

      {/* Sidebar */}
      <AnimatePresence>
        {(isMobileMenuOpen || window.innerWidth >= 768) && (
          <ChatSidebar
            rooms={rooms}
            currentRoom={currentRoom}
            user={{
              displayName: user.displayName,
              email: user.email,
              photoURL: user.photoURL || null,
            }}
            onSelectRoom={room => {
              setCurrentRoom(room);
              if (window.innerWidth < 768) {
                setIsMobileMenuOpen(false);
              }
            }}
            onCreateRoom={() => {
              setIsCreateRoomModalOpen(true);
              if (window.innerWidth < 768) {
                setIsMobileMenuOpen(false);
              }
            }}
            onSignOut={signOut}
          />
        )}
      </AnimatePresence>

      {/* Overlay for mobile */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-10 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Main chat area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {currentRoom ? (
          <>
            <ChatHeader room={currentRoom} />
            <div className="flex-1 overflow-y-auto p-4">
              <MessageList messages={messages} currentUserId={user.id} />
            </div>
            <div className="border-t border-gray-200 bg-white p-4">
              <ChatInput onSend={handleSendMessage} />
            </div>
          </>
        ) : (
          <WelcomeScreen
            hasRooms={rooms.length > 0}
            onCreateRoom={() => {
              setIsCreateRoomModalOpen(true);
              if (window.innerWidth < 768) {
                setIsMobileMenuOpen(false);
              }
            }}
          />
        )}
      </div>

      <CreateRoomModal
        isOpen={isCreateRoomModalOpen}
        onClose={() => setIsCreateRoomModalOpen(false)}
        onCreateRoom={handleCreateRoom}
      />
    </div>
  );
};

export default ChatPage;
