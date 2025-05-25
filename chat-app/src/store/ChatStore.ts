import { makeAutoObservable, runInAction } from 'mobx';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  serverTimestamp, 
  orderBy, 
  doc, 
  updateDoc, 
  arrayUnion,
  type DocumentData,
  type QueryDocumentSnapshot,
  type QuerySnapshot
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type * as Types from '../types';

class ChatStore {
  messages: Types.Message[] = [];
  rooms: Types.Room[] = [];
  currentRoom: Types.Room | null = null;
  currentUser: Types.User | null = null;
  loading = false;
  error: string | null = null;

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  // Set current room
  setCurrentRoom = (room: Types.Room) => {
    this.currentRoom = room;
    // When room changes, load its messages
    if (room) {
      this.loadMessages(room.id);
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
      this.loadRooms(user.id);
    }
  }

  // Load messages for a room
  loadMessages = (roomId: string) => {
    this.loading = true;
    this.error = null;

    try {
      const messagesRef = collection(db, 'messages');
      const q = query(
        messagesRef,
        where('roomId', '==', roomId),
        orderBy('timestamp', 'asc')
      );

      // Subscribe to real-time updates
      const unsubscribe = onSnapshot(q, 
        (snapshot: QuerySnapshot<DocumentData>) => {
          const messages = snapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => {
            const data = doc.data();
            return {
              id: doc.id,
              text: data.text || '',
              userId: data.userId || '',
              userDisplayName: data.userDisplayName || '',
              userPhotoURL: data.userPhotoURL || null,
              roomId: data.roomId || '',
              timestamp: data.timestamp?.toDate() || new Date()
            } as Types.Message;
          }) as Types.Message[];

          runInAction(() => {
            this.messages = messages;
            this.loading = false;
          });
        }, 
        (error: Error) => {
          runInAction(() => {
            this.error = error.message;
            this.loading = false;
          });
        }
      );

      return unsubscribe;
    } catch (error) {
      runInAction(() => {
        this.error = error instanceof Error ? error.message : 'Failed to load messages';
        this.loading = false;
      });
      return () => {}; // Return empty cleanup function
    }
  };

  // Send a new message
  sendMessage = async (text: string, user: Types.User, roomId: string) => {
    if (!text.trim()) return;

    try {
      const messagesRef = collection(db, 'messages');
      await addDoc(messagesRef, {
        text,
        userId: user.id,
        userDisplayName: user.displayName,
        userPhotoURL: user.photoURL || null,
        timestamp: serverTimestamp(),
        roomId
      });
    } catch (error) {
      runInAction(() => {
        this.error = error instanceof Error ? error.message : 'Failed to send message';
      });
    }
  };

  // Load available rooms
  loadRooms = (userId?: string) => {
    this.loading = true;
    this.error = null;

    try {
      const roomsRef = collection(db, 'rooms');
      const q = userId 
        ? query(roomsRef, where('members', 'array-contains', userId), orderBy('createdAt', 'desc'))
        : query(roomsRef, orderBy('createdAt', 'desc'));

      // Subscribe to real-time updates for rooms
      const unsubscribe = onSnapshot(q, 
        (snapshot: QuerySnapshot<DocumentData>) => {
          const rooms = snapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => {
            const data = doc.data();
            return {
              id: doc.id,
              name: data.name || 'Unnamed Room',
              createdAt: data.createdAt?.toDate() || new Date(),
              createdBy: data.createdBy || '',
              isPrivate: !!data.isPrivate,
              members: Array.isArray(data.members) ? data.members : []
            } as Types.Room;
          }) as Types.Room[];

          runInAction(() => {
            this.rooms = rooms;
            this.loading = false;
          });
        }, 
        (error: Error) => {
          runInAction(() => {
            this.error = error.message;
            this.loading = false;
          });
        }
      );

      return unsubscribe;
    } catch (error) {
      runInAction(() => {
        this.error = error instanceof Error ? error.message : 'Failed to load rooms';
        this.loading = false;
      });
      return () => {}; // Return empty cleanup function
    }
  };

  // Create a new room
  async createRoom(name: string, isPrivate: boolean = false) {
    if (!this.currentUser) {
      throw new Error('User not authenticated. Please sign in to create a room.');
    }
    
    const trimmedName = name.trim();
    
    // Validate room name
    if (!trimmedName) {
      throw new Error('Room name cannot be empty');
    }
    
    if (trimmedName.length > 50) {
      throw new Error('Room name must be 50 characters or less');
    }
    
    try {
      const roomData = {
        name: trimmedName,
        displayName: trimmedName, // For case-insensitive search
        createdAt: serverTimestamp(),
        createdBy: this.currentUser.id,
        createdByDisplayName: this.currentUser.displayName || 'Anonymous',
        isPrivate,
        members: [this.currentUser.id],
        memberCount: 1,
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'rooms'), roomData);
      
      // Create a room with the server-generated ID
      const newRoom: Types.Room = {
        id: docRef.id,
        name: trimmedName,
        createdAt: new Date(),
        createdBy: this.currentUser.id,
        isPrivate,
        members: [this.currentUser.id],
        memberCount: 1
      };
      
      // Add the room to the local state
      runInAction(() => {
        this.rooms = [newRoom, ...this.rooms];
        this.currentRoom = newRoom;
      });
      
      return newRoom;
    } catch (error) {
      runInAction(() => {
        this.error = error instanceof Error ? error.message : 'Failed to create room';
      });
      return null;
    }
  };

  // Join a room
  joinRoom = async (roomId: string, userId: string) => {
    try {
      const roomRef = doc(db, 'rooms', roomId);
      await updateDoc(roomRef, {
        members: arrayUnion(userId)
      });
      return true;
    } catch (error) {
      runInAction(() => {
        this.error = error instanceof Error ? error.message : 'Failed to join room';
      });
      return false;
    }
  };

  static create() {
    return new ChatStore();
  }
}

export default ChatStore;
