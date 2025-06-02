const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';
import type * as Types from '../types';

// Get the JWT token from localStorage
function getToken(): string | null {
  return localStorage.getItem('token');
}

// Set the JWT token in localStorage
function setToken(token: string): void {
  localStorage.setItem('token', token);
}

// Remove the JWT token from localStorage
function removeToken(): void {
  localStorage.removeItem('token');
}


// Remove the user ID from localStorage
function removeUserId(): void {
  localStorage.removeItem('userId');
}

// Get the authorization header with JWT token
function getAuthHeader(): { [key: string]: string } {
  const token = getToken();
  if (!token) {
    throw new Error('User not authenticated');
  }
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

interface AuthResponse {
  user: {
    id: string;
    username: string;
    email: string;
    displayName?: string;
    avatar?: string;
  };
  token: string;
}

export const api = {
  // Auth endpoints
  async signUp(email: string, password: string, username: string): Promise<void> {
    const response = await fetch(`${API_URL}/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password, username }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to sign up');
    }
  },

  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to log in');
    }
    
    return {
      user: {
        id: data.user.id,
        username: data.user.username,
        email: data.user.email,
        displayName: data.user.displayName,
        avatar: data.user.avatar,
      },
      token: data.token,
    };
  },

  // User endpoints
  async getCurrentUser() {
    try {
      const headers = getAuthHeader();
      const response = await fetch(`${API_URL}/users/me`, { headers });
      
      const data = await response.json();
      
      if (!response.ok) {
        if (response.status === 401) {
          removeToken();
          removeUserId();
        }
        throw new Error(data.message || 'Failed to fetch user data');
      }
      
      return {
        id: data.id,
        username: data.username,
        email: data.email,
        displayName: data.displayName || data.username,
        avatar: data.avatar,
      };
    } catch (error) {
      console.error('Error fetching current user:', error);
      throw error;
    }
  },

  async getUser(userId: string) {
    const response = await fetch(`${API_URL}/users/${userId}`, {
      method: 'GET',
      headers: getAuthHeader(),
    });

    if (!response.ok) {
      // If token is invalid, clear it
      if (response.status === 401) {
        removeToken();
      }
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch current user');
    }

    const data = await response.json();
    return {
      id: data.id,
      username: data.username,
      email: data.email,
      displayName: data.displayName,
      avatar: data.avatar,
    };
  },

  async updateUserProfile(updates: { username?: string; displayName?: string; avatar?: string }) {
    try {
      const headers = getAuthHeader();
      const response = await fetch(`${API_URL}/users/me`, {
        method: 'PUT',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update profile');
      }

      return {
        id: data.id,
        username: data.username,
        email: data.email,
        displayName: data.displayName || data.username,
        avatar: data.avatar,
      };
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  },
  // Room endpoints
  async createRoom(name: string, visibility: 'public' | 'private' = 'public', description?: string): Promise<Types.Room> {
    const headers = await getAuthHeader();
    const response = await fetch(`${API_URL}/rooms`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ 
        name, 
        visibility,
        description 
      }),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to create room');
    }
    
    return {
      id: data.id,
      name: data.name,
      isPrivate: data.visibility === 'private',
      description: data.description,
      createdAt: new Date(data.createdAt),
      updatedAt: new Date(data.updatedAt),
      createdBy: data.createdBy || 'unknown',
      createdByDisplayName: data.createdByDisplayName,
      members: data.members || [],
      memberCount: data.memberCount || 0,
      displayName: data.displayName || data.name
    } as Types.Room;
  },

  async getRooms() {
    const headers = await getAuthHeader();
    const response = await fetch(`${API_URL}/rooms`, { headers });
    
    if (!response.ok) {
      throw new Error('Failed to fetch rooms');
    }
    
    return response.json();
  },

  async getRoom(roomId: string) {
    const headers = getAuthHeader();
    const response = await fetch(`${API_URL}/rooms/${roomId}`, { headers });
    
    if (!response.ok) {
      throw new Error('Failed to fetch room');
    }
    
    return response.json();
  },

  /**
   * Add a member to a room
   * @param roomId - ID of the room
   * @param userId - ID of the user to add
   */
  async addMemberToRoom(roomId: string, userId: string) {
    const headers = getAuthHeader();
    const response = await fetch(`${API_URL}/rooms/${roomId}/members`, {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to add member to room');
    }
    
    return response.json();
  },

  /**
   * Remove a member from a room
   * @param roomId - ID of the room
   * @param userId - ID of the user to remove
   */
  async removeMemberFromRoom(roomId: string, userId: string) {
    const headers = getAuthHeader();
    const response = await fetch(`${API_URL}/rooms/${roomId}/members/${userId}`, {
      method: 'DELETE',
      headers,
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to remove member from room');
    }
    
    return response.json();
  },

  /**
   * Update room details
   * @param roomId - ID of the room to update
   * @param updates - Object containing fields to update (name, description, etc.)
   */
  async updateRoom(roomId: string, updates: { name?: string; description?: string }) {
    const headers = getAuthHeader();
    const response = await fetch(`${API_URL}/rooms/${roomId}`, {
      method: 'PUT',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update room');
    }
    
    return response.json();
  },

  /**
   * Delete a room
   * @param roomId - ID of the room to delete
   */
  async deleteRoom(roomId: string) {
    const headers = getAuthHeader();
    const response = await fetch(`${API_URL}/rooms/${roomId}`, {
      method: 'DELETE',
      headers,
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete room');
    }
    
    return response.json();
  },

  /**
   * Get all members of a room
   * @param roomId - ID of the room
   */
  async getRoomMembers(roomId: string) {
    const headers = getAuthHeader();
    const response = await fetch(`${API_URL}/rooms/${roomId}/members`, { headers });
    
    if (!response.ok) {
      throw new Error('Failed to fetch room members');
    }
    
    return response.json();
  },

  /**
   * Search for rooms by name or description
   * @param query - Search query string
   */
  async searchRooms(query: string) {
    const headers = getAuthHeader();
    const response = await fetch(`${API_URL}/rooms/search?q=${encodeURIComponent(query)}`, { 
      headers 
    });
    
    if (!response.ok) {
      throw new Error('Failed to search rooms');
    }
    
    return response.json();
  },

  // Message endpoints
  async getMessages(roomId: string) {
    const headers = await getAuthHeader();
    const response = await fetch(`${API_URL}/rooms/${roomId}/messages`, { headers });
    
    if (!response.ok) {
      throw new Error('Failed to fetch messages');
    }
    
    return response.json();
  },

  async sendMessage(roomId: string, content: string) {
    const headers = await getAuthHeader();
    const response = await fetch(`${API_URL}/rooms/${roomId}/messages`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ content }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to send message');
    }
    
    return response.json();
  },
};

export const isAuthenticated = (): boolean => {
  return !!getToken();
};

// WebSocket message types
type WebSocketMessage = {
  type: string;
  payload?: any;
  roomId?: string;
  error?: string;
};

// WebSocket setup with enhanced error handling and authentication
export const setupWebSocket = (onMessage: (message: WebSocketMessage) => void): WebSocket => {
  const token = getToken();
  if (!token) {
    throw new Error('User not authenticated');
  }

  // Get the WebSocket URL with the token as a query parameter
  const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = `${wsProtocol}//${window.location.host}/ws?token=${encodeURIComponent(token)}`;
  
  console.log('Creating WebSocket connection to:', wsUrl);
  
  // Create WebSocket connection
  const socket = new WebSocket(wsUrl);
  
  // Authentication state
  let isAuthenticated = false;
  let authTimeout: NodeJS.Timeout | null = null;
  const AUTH_TIMEOUT = 5000; // 5 seconds for auth to complete
  let reconnectAttempts = 0;
  const MAX_RECONNECT_ATTEMPTS = 5;
  const RECONNECT_DELAY = 3000; // 3 seconds
  
  // Connection opened
  const onOpen = () => {
    console.log('WebSocket connection established, waiting for authentication...');
    reconnectAttempts = 0; // Reset reconnect attempts on successful connection
    
    // Set a timeout for authentication
    authTimeout = setTimeout(() => {
      if (!isAuthenticated) {
        console.error('Authentication timeout');
        socket.close(4000, 'Authentication timeout');
      }
    }, AUTH_TIMEOUT);
  };

  // Handle incoming messages
  const onMessageHandler = (event: MessageEvent) => {
    try {
      const message: WebSocketMessage = JSON.parse(event.data);
      console.log('Received WebSocket message:', message);
      
      // Handle authentication response
      if (message.type === 'AUTH_SUCCESS' || message.type === 'system') {
        console.log('WebSocket authentication successful');
        isAuthenticated = true;
        if (authTimeout) {
          clearTimeout(authTimeout);
          authTimeout = null;
        }
      }
      
      // Forward all messages to the handler
      onMessage(message);
      
    } catch (error) {
      console.error('Error processing WebSocket message:', error);
      onMessage({
        type: 'ERROR',
        error: 'Invalid message format',
        payload: { raw: event.data }
      });
    }
  };
  
  // Handle connection errors
  const onError = (error: Event) => {
    console.error('WebSocket error:', error);
    if (authTimeout) {
      clearTimeout(authTimeout);
      authTimeout = null;
    }
    
    onMessage({
      type: 'ERROR',
      error: 'WebSocket connection error',
      payload: { error: error }
    });
  };
  
  // Handle connection close
  const onClose = (event: CloseEvent) => {
    console.log('WebSocket connection closed:', event.code, event.reason);
    
    // Clean up
    if (authTimeout) {
      clearTimeout(authTimeout);
      authTimeout = null;
    }
    
    // Notify about disconnection
    onMessage({
      type: 'DISCONNECTED',
      error: event.reason || 'Connection closed',
      payload: {
        code: event.code,
        wasClean: event.wasClean
      }
    });
    
    // Attempt to reconnect if not a normal closure and under max attempts
    if (event.code !== 1000 && reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
      reconnectAttempts++;
      const delay = RECONNECT_DELAY * Math.pow(2, reconnectAttempts);
      
      console.log(`Attempting to reconnect (${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS}) in ${delay/1000} seconds...`);
      
      setTimeout(() => {
        console.log('Reconnecting WebSocket...');
        const newSocket = setupWebSocket(onMessage);
        // Replace event listeners with new socket's handlers
        Object.assign(socket, newSocket);
      }, delay);
    } else if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      console.error('Max reconnection attempts reached');
      onMessage({
        type: 'ERROR',
        error: 'Connection lost. Please refresh the page to reconnect.',
        payload: { code: event.code, reason: event.reason }
      });
    }
  };
  
  // Set up event listeners
  socket.addEventListener('open', onOpen);
  socket.addEventListener('message', onMessageHandler);
  socket.addEventListener('error', onError);
  socket.addEventListener('close', onClose);
  
  // Send a ping every 30 seconds to keep the connection alive
  const pingInterval = setInterval(() => {
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: 'PING' }));
    }
  }, 30000);
  
  // Clean up
  const cleanup = () => {
    clearInterval(pingInterval);
    socket.removeEventListener('open', onOpen);
    socket.removeEventListener('message', onMessageHandler);
    socket.removeEventListener('error', onError);
    socket.removeEventListener('close', onClose);
  };
  
  // Return a proxy to handle cleanup
  return new Proxy(socket, {
    get(target, prop) {
      if (prop === 'close') {
        return function(...args: any[]) {
          cleanup();
          return target.close(...args);
        };
      }
      return (target as any)[prop];
    }
  });
};
