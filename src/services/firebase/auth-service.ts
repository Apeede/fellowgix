import {
    createUserWithEmailAndPassword,
    signOut as firebaseSignOut,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    User
} from 'firebase/auth';
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { auth, db } from './firebase';

export interface Admin {
  id: string;
  email: string;
  name: string;
  role: 'super_admin' | 'admin';
  createdAt: Date;
  lastLogin?: Date;
  isActive: boolean;
}

class AuthService {
  /**
   * Register a new admin user
   */
  async registerAdmin(
    email: string,
    password: string,
    name: string,
    role: 'super_admin' | 'admin' = 'admin'
  ): Promise<Admin> {
    try {
      // Create Firebase user
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Create admin document in Firestore
      const adminData: Admin = {
        id: user.uid,
        email,
        name,
        role,
        createdAt: new Date(),
        isActive: true,
      };

      await setDoc(doc(db, 'admins', user.uid), {
        ...adminData,
        createdAt: Timestamp.now(),
      });

      return adminData;
    } catch (error: any) {
      throw new Error(`Failed to register admin: ${error.message}`);
    }
  }

  /**
   * Login admin user
   */
  async loginAdmin(email: string, password: string): Promise<Admin> {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Get admin data from Firestore
      const adminDoc = await getDoc(doc(db, 'admins', user.uid));
      if (!adminDoc.exists()) {
        await firebaseSignOut(auth);
        throw new Error('User is not registered as an admin');
      }

      const adminData = adminDoc.data() as Admin;

      // Check if admin is active
      if (!adminData.isActive) {
        await firebaseSignOut(auth);
        throw new Error('Admin account is deactivated');
      }

      // Update last login
      await setDoc(
        doc(db, 'admins', user.uid),
        { lastLogin: Timestamp.now() },
        { merge: true }
      );

      return adminData;
    } catch (error: any) {
      throw new Error(`Login failed: ${error.message}`);
    }
  }

  /**
   * Get current admin
   */
  async getCurrentAdmin(): Promise<Admin | null> {
    return new Promise((resolve) => {
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        if (!user) {
          resolve(null);
          return;
        }

        try {
          const adminDoc = await getDoc(doc(db, 'admins', user.uid));
          if (adminDoc.exists()) {
            resolve(adminDoc.data() as Admin);
          } else {
            resolve(null);
          }
        } catch (error) {
          resolve(null);
        }
      });

      // Unsubscribe after getting the first result
      setTimeout(() => unsubscribe(), 100);
    });
  }

  /**
   * Sign out current admin
   */
  async signOut(): Promise<void> {
    try {
      await firebaseSignOut(auth);
    } catch (error: any) {
      throw new Error(`Sign out failed: ${error.message}`);
    }
  }

  /**
   * Subscribe to auth state changes
   */
  onAuthStateChange(callback: (user: User | null) => void): () => void {
    return onAuthStateChanged(auth, callback);
  }
}

export const authService = new AuthService();
