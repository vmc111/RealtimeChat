import { useEffect, useCallback } from 'react';
import { useStore } from '../store';
import type { Message, Room } from '../types';

interface UseChatReturn {
  messages: Message[];
  rooms: Room[];
  currentRoom: Room | null;
  loading: boolean;
  error: string | null;
  setCurrentRoom: (room: Room) => void;
  sendMessage: (text: string, roomId: string) => void;
  createRoom: (name: string, isPrivate?: boolean) => Promise<Room | null>;
  joinRoom: (roomId: string) => Promise<boolean>;
  loadRooms: () => void;
}

export const useChat = (): UseChatReturn => {
  const { chatStore, authStore } = useStore();
  const { user } = authStore;

  // Load rooms when component mounts
  useEffect(() => {
    const unsubscribe = chatStore.loadRooms();
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [chatStore]);

  // Set up message subscription when current room changes
  useEffect(() => {
    if (chatStore.currentRoom) {
      const unsubscribe = chatStore.loadMessages(chatStore.currentRoom.id);
      return () => {
        if (unsubscribe) unsubscribe();
      };
    }
  }, [chatStore, chatStore.currentRoom?.id]);

  const sendMessage = useCallback((text: string, roomId: string) => {
    if (!user) {
      throw new Error('User must be authenticated to send messages');
    }
    chatStore.sendMessage(text, user, roomId);
  }, [chatStore, user]);

  const createRoom = useCallback(async (name: string, isPrivate = false) => {
    if (!user) {
      throw new Error('User must be authenticated to create a room');
    }
    return chatStore.createRoom(name, isPrivate);
  }, [chatStore, user]);

  const joinRoom = useCallback(async (roomId: string) => {
    if (!user) {
      throw new Error('User must be authenticated to join a room');
    }
    return chatStore.joinRoom(roomId, user.id);
  }, [chatStore, user]);

  return {
    messages: chatStore.messages,
    rooms: chatStore.rooms,
    currentRoom: chatStore.currentRoom,
    loading: chatStore.loading,
    error: chatStore.error,
    setCurrentRoom: chatStore.setCurrentRoom,
    sendMessage,
    createRoom,
    joinRoom,
    loadRooms: chatStore.loadRooms,
  };
};

export default useChat;
