import { makeAutoObservable } from 'mobx';
import { api, setupWebSocket } from '../services/api';
import type * as Types from '../types';
import RoomModel from './models/RoomModel';
import Collection from './Collections';

class ChatStore {
  messages: Types.Message[] = [];
  private _rooms!: Collection<RoomModel>
  currentRoom: RoomModel | null = null;
  currentUser: Types.User | null = null;
  loading = false;
  error: string | null = null;
  private ws: WebSocket | null = null;
  
  // Expose WebSocket status
  get isWebSocketConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  constructor() {
    this._rooms = new Collection<RoomModel>();
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
  setCurrentRoom = async (room: RoomModel) => {
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
  async loadMessages(roomId: string) {
    this.loading = true;
    this.error = null;
    
    try {
      const response = await api.getMessages(roomId);
      // Ensure messages have proper user info
      this.messages = (response.messages || []).map((message: any) => ({
        ...message,
        userDisplayName: message.userDisplayName || 'Unknown User',
        userPhotoURL: message.userPhotoURL || undefined,
      }));
    } catch (error: any) {
      this.error = error instanceof Error ? error.message : 'Failed to load messages';
    } finally {
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
  async loadRooms() {
    this.loading = true;
    this.error = null;
    
    try {
      const response = await api.getRooms();
      // Transform the response to ensure proper Member type
      const rooms = (response || []).map((room: any) => ({
        ...room,
        members: (room.members || []).map((member: any) => ({
          id: member.id || member._id || '',
          displayName: member.displayName || 'Unknown User',
          photoURL: member.photoURL || undefined,
        })),
      }));
      this._rooms.setMany(rooms.map((room: Types.Room) => new RoomModel(room)));
    } catch (error: any) {
      this.error = error instanceof Error ? error.message : 'Failed to load rooms';
    } finally {
      this.loading = false;
    }
  }

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
      
      this.currentRoom = new RoomModel(room);
      this.loading = false;
      
      return true;
    } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to join room';
        this.loading = false;
      return false;
    }
  };

  // Set loading state
  setLoading = (isLoading: boolean) => {
    this.loading = isLoading;
  };

  // Set error message
  setError = (error: string | null) => {
    this.error = error;
  };


  // Add a member to a room
  addRoomMember = async (roomId: string, userId: string, onSuccess?: (members: Types.RoomMemberType[]) => void): Promise<void> => {
    try {
      this.setLoading(true);
      // Call the API to add the member
      const response = await api.addMemberToRoom(roomId, userId);
      onSuccess?.(response.members);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to add member to room';
      this.setError(errorMessage);
      throw error;
    } finally {
      this.setLoading(false);
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
      const updatedRoom =new RoomModel({
        ...room,
        createdBy: this.currentUser.id,
        createdByDisplayName: this.currentUser.displayName,
        members: [{
          id: this.currentUser.id,
          displayName: this.currentUser.displayName ?? '',
        }],
      });

        this._rooms.set(updatedRoom);
        this.loading = false;
      
      
      return updatedRoom;
    } catch (error) {
      this.error = error instanceof Error ? error.message : 'Failed to create room';
      this.loading = false;
      throw error;
    }
  };

  clearMessages() {
    this.messages = [];
  }

  clearRooms() {
   this._rooms.clear();
  }

  setRoomMembers = (roomId: string, members: Types.RoomMemberType[]) => {
    const room = this._rooms.get(roomId);
    if(room){
      room.setMembers(members)
    }
  }

  get rooms(){
    return this._rooms.items;
  }

  static create() {
    return new ChatStore();
  }
}

export default ChatStore;
