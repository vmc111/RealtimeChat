export interface User {
  id: string;
  displayName: string;
  email: string;
  photoURL?: string;
  isOnline: boolean;
  lastSeen?: Date;
}

export interface Message {
  id: string;
  text: string;
  userId: string;
  userDisplayName: string;
  userPhotoURL?: string;
  timestamp: Date;
  roomId: string;
}

export interface Room {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  createdBy: string;
  createdByDisplayName?: string;
  isPrivate: boolean;
  members: string[];
  memberCount: number;
  updatedAt?: Date;
  displayName?: string; // For case-insensitive search
}

export type AuthStatus = 'idle' | 'loading' | 'authenticated' | 'unauthenticated';

export interface AuthState {
  user: User | null;
  status: AuthStatus;
  error: string | null;
}

export interface ChatState {
  messages: Message[];
  rooms: Room[];
  currentRoom: Room | null;
  loading: boolean;
  error: string | null;
}
