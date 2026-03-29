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
import { ClubType } from '../../types/club';
import { buildClubId, normalizeClubCode, normalizeClubName } from './club-utils';
import { clubService } from './club-service';
import { auth, authReady, db } from './firebase';

export interface Admin {
  id: string;
  email: string;
  name: string;
  clubId: string;
  clubName: string;
  clubType?: ClubType;
  clubCode?: string;
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
    clubId?: string;
    clubName: string;
    clubType: ClubType;
    clubCode?: string;
    role?: 'super_admin' | 'club_admin' | 'event_manager' | 'viewer';
    sendInviteEmail?: boolean;
  }): Promise<Admin> {
    const role = input.role || 'club_admin';
    const club = await clubService.ensureClub({
      clubId: input.clubId,
      clubName: input.clubName,
      clubType: input.clubType,
      clubCode: input.clubCode,
    });
    await this.assertClubAdminCapacity(club.clubId);

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
        clubId: club.clubId,
        clubName: club.clubName,
        clubType: club.clubType,
        clubCode: club.clubCode,
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
    clubName = 'Default Club',
    clubType: ClubType = 'rotaract',
    clubCode?: string
  ): Promise<Admin> {
    try {
      const club = await clubService.ensureClub({
        clubName,
        clubType,
        clubCode,
      });
      await this.assertClubAdminCapacity(club.clubId);

      // Create Firebase user
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Create admin document in Firestore
      const adminData: Admin = {
        id: user.uid,
        email: email.toLowerCase().trim(),
        name,
        clubId: club.clubId,
        clubName: club.clubName,
        clubType: club.clubType,
        clubCode: club.clubCode,
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
      const normalized = await this.normalizeAdmin(adminData, user.uid);

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
          clubType: normalized.clubType || null,
          clubCode: normalized.clubCode || null,
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
    await authReady;
    const user = auth.currentUser;
    if (!user) {
      return null;
    }

    return this.getAdminForUserId(user.uid);
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

  async getAdminForUserId(userId: string): Promise<Admin | null> {
    try {
      const adminDoc = await getDoc(doc(db, 'admins', userId));
      if (!adminDoc.exists()) {
        return null;
      }

      const normalized = await this.normalizeAdmin(adminDoc.data() as Admin, userId);
      await setDoc(
        doc(db, 'admins', userId),
        {
          clubId: normalized.clubId,
          clubName: normalized.clubName,
          clubType: normalized.clubType || null,
          clubCode: normalized.clubCode || null,
        },
        { merge: true }
      );

      return normalized;
    } catch {
      return null;
    }
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

  private async normalizeAdmin(admin: Admin, userId: string): Promise<Admin> {
    const mappedRole =
      (admin.role as unknown as string) === 'admin'
        ? 'club_admin'
        : (admin.role || 'club_admin');

    const fallbackClubName = normalizeClubName(admin.clubName || `${admin.name || 'Admin'} Club`);
    const fallbackClubType: ClubType = admin.clubType === 'rotary' ? 'rotary' : 'rotaract';
    const fallbackAdmin: Admin = {
      ...admin,
      clubId: admin.clubId || buildClubId(fallbackClubName || `club-${userId}`, fallbackClubType),
      clubName: fallbackClubName,
      clubType: fallbackClubType,
      clubCode: normalizeClubCode(admin.clubCode) || undefined,
      role: mappedRole as Admin['role'],
      email: admin.email?.toLowerCase?.() || '',
    };

    try {
      if (admin.clubId) {
        const club = await clubService.getClubById(admin.clubId);
        if (club) {
          return {
            ...fallbackAdmin,
            clubId: club.clubId,
            clubName: club.clubName,
            clubType: club.clubType,
            clubCode: club.clubCode,
          };
        }
      }

      const ensuredClub = await clubService.ensureClub({
        clubId: fallbackAdmin.clubId,
        clubName: fallbackAdmin.clubName,
        clubType: fallbackAdmin.clubType || 'rotaract',
        clubCode: fallbackAdmin.clubCode,
      });

      return {
        ...fallbackAdmin,
        clubId: ensuredClub.clubId,
        clubName: ensuredClub.clubName,
        clubType: ensuredClub.clubType,
        clubCode: ensuredClub.clubCode,
      };
    } catch {
      // Keep login working even if club metadata cannot be read or backfilled yet.
      return fallbackAdmin;
    }
  }
}

export const authService = new AuthService();
