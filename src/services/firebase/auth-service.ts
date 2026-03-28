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
  clubId: string;
  clubName: string;
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
    role: 'super_admin' | 'admin' = 'admin',
    clubName = 'Default Club'
  ): Promise<Admin> {
    try {
      // Create Firebase user
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      const normalizedClubName = clubName.trim() || 'Default Club';
      const clubId = this.toClubId(normalizedClubName);

      // Create admin document in Firestore
      const adminData: Admin = {
        id: user.uid,
        email,
        name,
        clubId,
        clubName: normalizedClubName,
        role,
        createdAt: new Date(),
        isActive: true,
      };

      await setDoc(doc(db, 'admins', user.uid), {
        ...adminData,
        createdAt: Timestamp.now(),
      });

      return adminData;
    } catch (error) {
      throw new Error(`Failed to register admin: ${(error instanceof Error ? error.message : String(error))}`);
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
      const normalized = this.normalizeAdmin(adminData, user.uid);

      // Check if admin is active
      if (!normalized.isActive) {
        await firebaseSignOut(auth);
        throw new Error('Admin account is deactivated');
      }

      // Update last login
      await setDoc(
        doc(db, 'admins', user.uid),
        {
          lastLogin: Timestamp.now(),
          clubId: normalized.clubId,
          clubName: normalized.clubName,
        },
        { merge: true }
      );

      return normalized;
    } catch (error) {
      throw new Error(`Login failed: ${(error instanceof Error ? error.message : String(error))}`);
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
            const normalized = this.normalizeAdmin(adminDoc.data() as Admin, user.uid);
            // Backfill club metadata for legacy admins
            await setDoc(
              doc(db, 'admins', user.uid),
              { clubId: normalized.clubId, clubName: normalized.clubName },
              { merge: true }
            );
            resolve(normalized);
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
    } catch (error) {
      throw new Error(`Sign out failed: ${(error instanceof Error ? error.message : String(error))}`);
    }
  }

  /**
   * Subscribe to auth state changes
   */
  onAuthStateChange(callback: (user: User | null) => void): () => void {
    return onAuthStateChanged(auth, callback);
  }

  private toClubId(clubName: string): string {
    return clubName
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') || 'default-club';
  }

  private normalizeAdmin(admin: Admin, userId: string): Admin {
    if (admin.clubId && admin.clubName) {
      return admin;
    }

    const fallbackClubName = admin.clubName || `${admin.name || 'Admin'} Club`;
    return {
      ...admin,
      clubId: admin.clubId || `club-${userId}`,
      clubName: fallbackClubName,
    };
  }
}

export const authService = new AuthService();
