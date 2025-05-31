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

// Helper function to check if user is authenticated
export const isAuthenticated = (): boolean => {
  return !!getToken();
};

// WebSocket setup
export const setupWebSocket = (onMessage: (message: any) => void): WebSocket => {
  const token = getToken();
  if (!token) {
    throw new Error('User not authenticated');
  }

  // Get the WebSocket URL based on the current environment
  const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = `${wsProtocol}//${window.location.host}/ws`;
  
  // Create WebSocket connection with JWT token for authentication
  const socket = new WebSocket(wsUrl);

  // Connection opened
  socket.addEventListener('open', () => {
    
    // Send authentication message with JWT token
    socket.send(JSON.stringify({
      type: 'AUTH',
      token: token
    }));
  });

  // Listen for messages
  socket.addEventListener('message', (event) => {
    try {
      const message = JSON.parse(event.data);
      onMessage(message);
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  });

  // Handle errors
  socket.addEventListener('error', (error) => {
    console.error('WebSocket error:', error);
  });

  // Handle connection close
  socket.addEventListener('close', (event) => {
    console.info('WebSocket disconnected:', event.code, event.reason);
  });

  return socket;
};
