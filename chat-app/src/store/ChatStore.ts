import { makeAutoObservable } from 'mobx';
import { api, setupWebSocket } from '../services/api';
import type * as Types from '../types';

class ChatStore {
  messages: Types.Message[] = [];
  rooms: Types.Room[] = [];
  currentRoom: Types.Room | null = null;
  currentUser: Types.User | null = null;
  loading = false;
  error: string | null = null;
  private ws: WebSocket | null = null;
  
  // Expose WebSocket status
  get isWebSocketConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  // Initialize WebSocket connection
  async initWebSocket() {
    if (this.ws) {
      // If WebSocket is already connected, return
      if (this.ws.readyState === WebSocket.OPEN) return;
      // If WebSocket is in a closing or closed state, clean it up
      if (this.ws.readyState === WebSocket.CLOSING || this.ws.readyState === WebSocket.CLOSED) {
        this.ws = null;
      }
    }

    try {
      this.ws = await setupWebSocket((message: any) => {
        // Handle incoming WebSocket messages
        if (message.roomId === this.currentRoom?.id) {
            this.messages.push(message);
        }
      });
      
      this.ws.onclose = () => {
          this.ws = null;
      };
      
      return true;
    } catch (error) {
      console.error('Failed to initialize WebSocket:', error);
      this.ws = null;
      return false;
    }
  }
  
  // Close WebSocket connection
  closeWebSocket() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  // Set current room
  setCurrentRoom = async (room: Types.Room) => {
    this.currentRoom = room;
    // When room changes, load its messages
    if (room) {
      await this.loadMessages(room.id);
      this.initWebSocket();
    } else {
      this.messages = [];
    }
  };

  // Set current user
  setCurrentUser(user: Types.User | null) {
    this.currentUser = user;
  }

  // Load messages for a room
  loadMessages = async (roomId: string) => {
    this.loading = true;
    this.error = null;
    
    try {
      const responseData = await api.getMessages(roomId);
      this.messages = responseData.messages ?? [];
      this.loading = false;
    } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to load messages';
        this.loading = false;
    }
  };

  // Send a message
  sendMessage = async (content: string) => {
    if (!this.currentRoom || !this.currentUser) {
      throw new Error('No room selected or user not authenticated');
    }
    
    try {
      const message = await api.sendMessage(this.currentRoom.id, content);
      this.messages.push(message);
      return message;
    } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to send message';
      throw error;
    }
  };

  // Load rooms for the current user
  loadRooms = async () => {
    this.loading = true;
    this.error = null;
    
    try {
      const rooms = await api.getRooms();
      this.rooms = rooms ?? [];
      this.loading = false;
    } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to load rooms';
        this.loading = false;
    }
  };

  // Join a room
  joinRoom = async (roomId: string) => {
    if (!this.currentUser) {
      throw new Error('User not authenticated');
    }
    
    this.loading = true;
    this.error = null;
    
    try {
      // In a real app, you might have an endpoint to handle room joining
      // For now, we'll just load the room
      const room = await api.getRoom(roomId);
      
      this.currentRoom = room;
      this.loading = false;
      
      // Removed unused code
      return true;
    } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to join room';
        this.loading = false;
      return false;
    }
  };

  // Create a new chat room
  createRoom = async (name: string, isPrivate: boolean = false): Promise<Types.Room> => {
    if (!this.currentUser) {
      throw new Error('User not authenticated');
    }
    
    this.loading = true;
    this.error = null;
    
    try {
      const room = await api.createRoom(
        name, 
        isPrivate ? 'private' : 'public',
        `A ${isPrivate ? 'private' : 'public'} chat room`
      );
      
      // Add the current user as a member of the new room
      const updatedRoom: Types.Room = {
        ...room,
        createdBy: this.currentUser.id,
        createdByDisplayName: this.currentUser.displayName,
        members: [this.currentUser.id],
      };

        this.rooms.push(updatedRoom);
        this.loading = false;
      
      
      return updatedRoom;
    } catch (error) {
      this.error = error instanceof Error ? error.message : 'Failed to create room';
      this.loading = false;
      throw error;
    }
  };

  clearRooms() {
   this.rooms = [];
  }

  static create() {
    return new ChatStore();
  }
}

export default ChatStore;
