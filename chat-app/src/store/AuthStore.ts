import { makeAutoObservable, runInAction } from 'mobx';
import { 
  signOut as firebaseSignOut, 
  onAuthStateChanged, 
  type User as FirebaseUser,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import type * as Types from '../types';

class AuthStore {
  user: Types.User | null = null;
  status: Types.AuthStatus = 'loading';
  error: string | null = null;

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
    this.initializeAuthListener();
  }

  // Initialize auth state listener
  private initializeAuthListener = () => {
    this.setStatus('loading');
    
    return onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // User is signed in
        const userData = await this.getUserData(firebaseUser);
        runInAction(() => {
          this.user = userData;
          this.status = 'authenticated';
          this.error = null;
        });
      } else {
        // User is signed out
        runInAction(() => {
          this.user = null;
          this.status = 'unauthenticated';
        });
      }
    }, (error) => {
      runInAction(() => {
        this.error = error.message;
        this.status = 'unauthenticated';
      });
    });
  };

  // Set user data
  setUser(user: Types.User | null) {
    this.user = user;
    this.status = user ? 'authenticated' : 'unauthenticated';
    this.error = null;
  }

  // Get user data from Firebase User
  private async getUserData(firebaseUser: FirebaseUser): Promise<Types.User> {
    const userDocRef = doc(db, 'users', firebaseUser.uid);
    
    // Get user data from Firestore
    const userDoc = await getDoc(userDocRef);
    
    if (userDoc.exists()) {
      const data = userDoc.data();
      return {
        id: firebaseUser.uid,
        displayName: data.displayName || firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Anonymous',
        email: data.email || firebaseUser.email || '',
        photoURL: data.photoURL || firebaseUser.photoURL || undefined,
        isOnline: data.isOnline !== undefined ? data.isOnline : true,
        lastSeen: data.lastSeen?.toDate() || new Date()
      };
    }
    
    // Return basic auth info if no Firestore document exists
    return {
      id: firebaseUser.uid,
      displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Anonymous',
      email: firebaseUser.email || '',
      photoURL: firebaseUser.photoURL || undefined,
      isOnline: true,
      lastSeen: new Date()
    };
  };

  // Update auth status
  private setStatus = (status: Types.AuthStatus) => {
    this.status = status;
  };



  // Sign in with Google
  signInWithGoogle = async (): Promise<void> => {
    this.setStatus('loading');
    this.error = null;

    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      // Check if user already exists in Firestore
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      
      if (!userDoc.exists()) {
        // Create new user document if it doesn't exist
        const userData: Types.User = {
          id: user.uid,
          displayName: user.displayName || user.email?.split('@')[0] || 'Anonymous',
          email: user.email || '',
          photoURL: user.photoURL || undefined,
          isOnline: true,
          lastSeen: new Date()
        };

        await setDoc(doc(db, 'users', user.uid), {
          ...userData,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });

        runInAction(() => {
          this.user = userData;
          this.status = 'authenticated';
        });
      } else {
        // Update existing user's online status
        const userData = await this.getUserData(user);
        runInAction(() => {
          this.user = userData;
          this.status = 'authenticated';
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to sign in with Google';
      runInAction(() => {
        this.error = errorMessage;
        this.status = 'unauthenticated';
      });
      throw new Error(errorMessage);
    }
  };

  // Sign out
  signOutUser = async (): Promise<void> => {
    try {
      // Update user's online status before signing out
      if (this.user) {
        const userDocRef = doc(db, 'users', this.user.id);
        await setDoc(userDocRef, {
          isOnline: false,
          lastSeen: serverTimestamp()
        }, { merge: true });
      }

      await firebaseSignOut(auth);
      
      runInAction(() => {
        this.user = null;
        this.status = 'unauthenticated';
        this.error = null;
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to sign out';
      runInAction(() => {
        this.error = errorMessage;
      });
      throw new Error(errorMessage);
    }
  };

  // Reset error state
  resetError = () => {
    this.error = null;
  };

  static create() {
    return new AuthStore();
  }
}

export default AuthStore;
