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

  // WebSocket configuration
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private baseReconnectDelay = 1000; // Start with 1 second
  private maxReconnectDelay = 30000; // Max 30 seconds
  
  // Message queue for handling incoming messages
  private messageQueue: (Types.Message | { type: string; [key: string]: any })[] = [];
  private isProcessingQueue = false;
  
  // Type guards for message validation
  private isMessage(msg: any): msg is Types.Message {
    return msg && 
           typeof msg === 'object' && 
           'id' in msg && 
           'content' in msg && 
           'userId' in msg && 
           'createdAt' in msg &&
           'roomId' in msg;
  }

  private isWebSocketMessage(msg: any): msg is { type: string; [key: string]: any } {
    return msg && typeof msg === 'object' && 'type' in msg;
  }
  
  // Calculate next reconnect delay with exponential backoff
  private getNextReconnectDelay(): number {
    const delay = Math.min(this.baseReconnectDelay * Math.pow(2, this.reconnectAttempts), this.maxReconnectDelay);
    // Add jitter to prevent thundering herd
    return delay * (0.8 + Math.random() * 0.4);
  }

  // Process messages in the queue
  private async processMessageQueue() {
    if (this.isProcessingQueue || this.messageQueue.length === 0) return;
    
    this.isProcessingQueue = true;
    
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      if (message) {
        await this.handleWebSocketMessage(message);
      }
    }
    
    this.isProcessingQueue = false;
  }

  // Handle WebSocket messages in a non-reactive way
  private async handleWebSocketMessage(message: Types.Message | { type: string; [key: string]: any }) {
    try {
      console.log('Processing WebSocket message:', message);
      
      // Handle different message types
      if (this.isMessage(message)) {
        // This is a chat message
        if (message.roomId === this.currentRoom?.id) {
          this.messages = [...this.messages, message];
        }
        return;
      }

      // Handle other WebSocket message types
      if (!this.isWebSocketMessage(message)) {
        console.warn('Received invalid message format:', message);
        return;
      }

      switch (message.type) {
        case 'MESSAGE':
          // This should be handled by the isMessage check above
          console.warn('Received MESSAGE type but message format is invalid');
          break;
          
        case 'ROOM_UPDATE':
          if (message.roomId) {
            await this.handleRoomUpdate(message);
          }
          break;
          
        case 'MEMBER_ADDED':
        case 'MEMBER_REMOVED':
          if (message.roomId) {
            await this.updateRoomMembers(message.roomId);
          }
          break;
          
        case 'ERROR':
          console.error('WebSocket error:', message.payload);
          this.error = message.payload?.message || 'WebSocket error occurred';
          break;
          
        case 'AUTH_SUCCESS':
          console.log('WebSocket authentication successful');
          if (this.currentRoom) {
            await this.joinCurrentRoom();
          }
          break;
      }
    } catch (error) {
      console.error('Error handling WebSocket message:', error, message);
    }
  }

  async initWebSocket() {
    // Don't initialize if we already have a valid connection
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      console.log('WebSocket already connected');
      return true;
    }

    // Clean up any existing connection
    this.closeWebSocket();

    try {
      console.log('Initializing WebSocket connection...');
      
      // Create new WebSocket connection
      this.ws = setupWebSocket((message) => {
        // Add message to queue and process if it's a valid message
        if (message && typeof message === 'object' && ('type' in message || 'id' in message)) {
          this.messageQueue.push(message);
          this.processMessageQueue();
        } else {
          console.warn('Received invalid message format:', message);
        }
      });
      
      // Set up event handlers
      this.ws.onopen = () => {
        console.log('WebSocket connection established');
        this.reconnectAttempts = 0; // Reset reconnect attempts on successful connection
        this.error = null; // Clear any previous errors
      };
      
      this.ws.onclose = (event) => {
        console.log(`WebSocket connection closed: ${event.code} ${event.reason}`);
        this.ws = null;
        
        // Only attempt to reconnect if we have a current room
        if (this.currentRoom) {
          this.attemptReconnect();
        }
      };
      
      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
      
      this.reconnectAttempts = 0; // Reset reconnect attempts on successful connection
      return true;
    } catch (error) {
      console.error('Failed to initialize WebSocket:', error);
      this.ws = null;
      
      // Only attempt to reconnect if we have a current room
      if (this.currentRoom) {
        this.attemptReconnect();
      }
      
      return false;
    }
  }
  
  // Helper method to join the current room via WebSocket
  private joinCurrentRoom() {
    if (!this.currentRoom || !this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return;
    }
    
    try {
      console.log(`Joining room ${this.currentRoom.id} via WebSocket`);
      this.ws.send(JSON.stringify({
        type: 'JOIN',
        roomId: this.currentRoom.id
      }));
    } catch (error) {
      console.error('Error joining room via WebSocket:', error);
    }
  }
  
  private async attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      this.error = 'Connection lost. Please refresh the page to reconnect.';
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(this.maxReconnectDelay * Math.pow(2, this.reconnectAttempts - 1), 30000); // Max 30s delay
    
    console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    
    try {
      await new Promise(resolve => setTimeout(resolve, delay));
      
      if (this.currentRoom) {
        await this.initWebSocket();
      }
    } catch (error) {
      console.error('Error during reconnection attempt:', error);
      // Continue with next attempt
      if (this.currentRoom) {
        this.attemptReconnect();
      }
    }
  }

  // Handle room updates from WebSocket
  private async handleRoomUpdate(update: any) {
    if (!update.roomId) return;
    
    try {
      // Refresh the room data from the server
      const roomData = await api.getRoom(update.roomId);
      if (roomData) {
        const room = this._rooms.get(update.roomId);
        if (room) {
          room.updateFromServer(roomData);
          
          // If this is the current room, update the reference
          if (this.currentRoom?.id === update.roomId) {
            this.currentRoom = room;
          }
        } else {
          // If room doesn't exist in our store yet, add it using set
          this._rooms.set(new RoomModel(roomData));
        }
      }
    } catch (error) {
      console.error('Error handling room update:', error);
    }
  }

  // Update room members from the server
  private async updateRoomMembers(roomId: string) {
    try {
      const members = await api.getRoomMembers(roomId);
      const room = this._rooms.get(roomId);
      if (room) {
        room.setMembers(members);
      }
    } catch (error) {
      console.error('Error updating room members:', error);
    }
  }

  // Close WebSocket connection
  closeWebSocket() {
    if (this.ws) {
      // Remove all event listeners first
      this.ws.onopen = null;
      this.ws.onclose = null;
      this.ws.onerror = null;
      this.ws.onmessage = null;
      
      // Only close if not already in closing/closed state
      if (this.ws.readyState === WebSocket.OPEN) {
        try {
          this.ws.close(1000, 'User disconnected');
        } catch (error) {
          console.error('Error closing WebSocket:', error);
        }
      }
      
      this.ws = null;
    }
    
    // Clear the message queue on disconnect
    this.messageQueue = [];
  }

  // Set current room
  setCurrentRoom = async (room: RoomModel | null) => {
    // Close existing WebSocket connection if any
    this.closeWebSocket();
    
    // Update current room directly
    this.currentRoom = room;
    
    // When room changes, load its messages and initialize WebSocket
    if (room) {
      try {
        await this.loadMessages(room.id);
        await this.initWebSocket();
      } catch (error) {
        console.error('Error in setCurrentRoom:', error);
        throw error;
      }
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
      // Get room details
      const room = await api.getRoom(roomId);
      
      // Create a new RoomModel instance
      const roomModel = new RoomModel(room);
      
      // Set the current room - this will also initialize WebSocket
      await this.setCurrentRoom(roomModel);
      
      // The WebSocket connection will handle joining the room after authentication
      // through the AUTH_SUCCESS message handler
      
      this.loading = false;
      return true;
    } catch (error) {
      this.error = error instanceof Error ? error.message : 'Failed to join room';
      this.loading = false;
      console.error('Error joining room:', error);
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
      
      // Update local state immediately for better UX
      const room = this._rooms.get(roomId);
      if (room && response.member) {
        room.addMember(response.member);
      }
      
      onSuccess?.(response.members || []);
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
    if (room) {
      // Only update if members have actually changed to avoid unnecessary re-renders
      const currentMembers = room.members;
      const membersChanged = 
        currentMembers.length !== members.length ||
        !currentMembers.every((m, i) => 
          m.id === members[i]?.id && 
          m.displayName === members[i]?.displayName
        );
        
      if (membersChanged) {
        room.setMembers(members);
      }
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
