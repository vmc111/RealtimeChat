export interface User {
  id: string;
  username: string;
  displayName?: string;
  email: string;
  avatar?: string;
  photoURL?: string; // Kept for backward compatibility
  lastSeen?: Date;
}

export interface Message {
  id: string;
  content: string;
  userId: string;
  createdAt: string;
  roomId: string;
}

export interface RoomMemberType {
  id: string;
  displayName: string;
  photoURL?: string;
}

export interface Room {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  createdBy: string;
  createdByDisplayName?: string;
  isPrivate: boolean;
  members: RoomMemberType[];
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
