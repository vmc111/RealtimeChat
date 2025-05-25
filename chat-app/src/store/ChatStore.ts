import { makeAutoObservable, runInAction } from 'mobx';
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
          runInAction(() => {
            this.messages.push(message);
          });
        }
      });
      
      this.ws.onclose = () => {
        runInAction(() => {
          this.ws = null;
        });
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
    runInAction(() => {
      this.currentUser = user;
    });
    
    if (user) {
      this.loadRooms();
    }
  }

  // Load messages for a room
  loadMessages = async (roomId: string) => {
    this.loading = true;
    this.error = null;
    
    try {
      const messages = await api.getMessages(roomId);
      runInAction(() => {
        this.messages = messages;
        this.loading = false;
      });
    } catch (error) {
      runInAction(() => {
        this.error = error instanceof Error ? error.message : 'Failed to load messages';
        this.loading = false;
      });
    }
  };

  // Send a message
  sendMessage = async (content: string) => {
    if (!this.currentRoom || !this.currentUser) {
      throw new Error('No room selected or user not authenticated');
    }
    
    try {
      const message = await api.sendMessage(this.currentRoom.id, content);
      runInAction(() => {
        this.messages.push(message);
      });
      return message;
    } catch (error) {
      runInAction(() => {
        this.error = error instanceof Error ? error.message : 'Failed to send message';
      });
      throw error;
    }
  };

  // Load rooms for the current user
  loadRooms = async () => {
    this.loading = true;
    this.error = null;
    
    try {
      const rooms = await api.getRooms();
      runInAction(() => {
        this.rooms = rooms;
        this.loading = false;
      });
    } catch (error) {
      runInAction(() => {
        this.error = error instanceof Error ? error.message : 'Failed to load rooms';
        this.loading = false;
      });
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
      
      runInAction(() => {
        this.currentRoom = room;
        this.loading = false;
      });
      
      // Removed unused code
      return true;
    } catch (error) {
      runInAction(() => {
        this.error = error instanceof Error ? error.message : 'Failed to join room';
        this.loading = false;
      });
      return false;
    }
  };

  static create() {
    return new ChatStore();
  }
}

export default ChatStore;
