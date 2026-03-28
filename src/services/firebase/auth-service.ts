import {
    createUserWithEmailAndPassword,
    getAuth,
    signOut as firebaseSignOut,
    onAuthStateChanged,
    sendPasswordResetEmail,
    signInWithEmailAndPassword,
    User
} from 'firebase/auth';
import { deleteApp, initializeApp } from 'firebase/app';
import { collection, doc, getDoc, getDocs, limit, query, setDoc, Timestamp, where } from 'firebase/firestore';
import { firebaseConfig } from '../../config/firebase-config';
import { auth, db } from './firebase';

export interface Admin {
  id: string;
  email: string;
  name: string;
  clubId: string;
  clubName: string;
  role: 'super_admin' | 'club_admin' | 'event_manager' | 'viewer';
  createdAt: Date;
  lastLogin?: Date;
  isActive: boolean;
  inviteStatus?: 'pending' | 'accepted';
  invitedAt?: Date;
  invitedBy?: string;
}

class AuthService {
  async createAdminBySuperAdmin(input: {
    email: string;
    password: string;
    name: string;
    clubName: string;
    role?: 'super_admin' | 'club_admin' | 'event_manager' | 'viewer';
    sendInviteEmail?: boolean;
  }): Promise<Admin> {
    const role = input.role || 'club_admin';
    const normalizedClubName = input.clubName.trim();
    const clubId = this.toClubId(normalizedClubName);
    await this.assertClubAdminCapacity(clubId);

    // Create auth user in an isolated Firebase app so the current super admin session is preserved.
    const secondaryApp = initializeApp(firebaseConfig, `secondary-${Date.now()}`);
    const secondaryAuth = getAuth(secondaryApp);

    try {
      const userCredential = await createUserWithEmailAndPassword(
        secondaryAuth,
        input.email,
        input.password
      );

      const adminData: Admin = {
        id: userCredential.user.uid,
        email: input.email.toLowerCase().trim(),
        name: input.name,
        clubId,
        clubName: normalizedClubName,
        role,
        createdAt: new Date(),
        isActive: true,
        inviteStatus: input.sendInviteEmail ? 'pending' : 'accepted',
        invitedAt: input.sendInviteEmail ? new Date() : undefined,
      };

      await setDoc(doc(db, 'admins', adminData.id), {
        ...adminData,
        createdAt: Timestamp.now(),
        invitedAt: input.sendInviteEmail ? Timestamp.now() : null,
      });

      if (input.sendInviteEmail) {
        await sendPasswordResetEmail(auth, adminData.email);
      }

      return adminData;
    } catch (error) {
      throw new Error(`Failed to create admin: ${(error instanceof Error ? error.message : String(error))}`);
    } finally {
      await firebaseSignOut(secondaryAuth).catch(() => undefined);
      await deleteApp(secondaryApp).catch(() => undefined);
    }
  }

  /**
   * Register a new admin user
   */
  async registerAdmin(
    email: string,
    password: string,
    name: string,
    role: 'super_admin' | 'club_admin' | 'event_manager' | 'viewer' = 'club_admin',
    clubName = 'Default Club'
  ): Promise<Admin> {
    try {
      const normalizedClubName = clubName.trim() || 'Default Club';
      const clubId = this.toClubId(normalizedClubName);
      await this.assertClubAdminCapacity(clubId);

      // Create Firebase user
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Create admin document in Firestore
      const adminData: Admin = {
        id: user.uid,
        email: email.toLowerCase().trim(),
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
      const normalizedEmail = email.toLowerCase().trim();
      const userCredential = await signInWithEmailAndPassword(auth, normalizedEmail, password);
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
          inviteStatus: normalized.inviteStatus === 'pending' ? 'accepted' : normalized.inviteStatus || 'accepted',
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

  async sendAdminPasswordReset(email: string): Promise<void> {
    await sendPasswordResetEmail(auth, email.toLowerCase().trim());
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

  private async assertClubAdminCapacity(clubId: string): Promise<void> {
    const snapshot = await getDocs(
      query(
        collection(db, 'admins'),
        where('clubId', '==', clubId),
        limit(10)
      )
    );

    const activeAdmins = snapshot.docs.filter((adminDoc) => {
      const data = adminDoc.data() as Partial<Admin>;
      return data.isActive !== false;
    }).length;

    if (activeAdmins >= 3) {
      throw new Error('This club already has the maximum of 3 admins. Deactivate one before adding another.');
    }
  }

  private normalizeAdmin(admin: Admin, userId: string): Admin {
    const mappedRole =
      (admin.role as unknown as string) === 'admin'
        ? 'club_admin'
        : (admin.role || 'club_admin');

    if (admin.clubId && admin.clubName) {
      return {
        ...admin,
        role: mappedRole as Admin['role'],
        email: admin.email?.toLowerCase?.() || '',
      };
    }

    const fallbackClubName = admin.clubName || `${admin.name || 'Admin'} Club`;
    return {
      ...admin,
      clubId: admin.clubId || `club-${userId}`,
      clubName: fallbackClubName,
      role: mappedRole as Admin['role'],
      email: admin.email?.toLowerCase?.() || '',
    };
  }
}

export const authService = new AuthService();
