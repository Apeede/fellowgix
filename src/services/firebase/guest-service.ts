import { CreateGuestInput, Guest, GuestCheckInData } from '@types/guest';
import {
    addDoc,
    collection,
    doc,
    getDoc,
    getDocs,
    query,
    Timestamp,
    updateDoc,
    where,
} from 'firebase/firestore';
import { normalizeClubName, normalizeEmail, normalizeGuestType, normalizePhone } from './club-utils';
import { db } from './firebase';
import { firestoreTimestampToDate } from './firestore-utils';

class GuestService {
  private collectionName = 'guests';

  /**
   * Convert Firestore guest document to Guest type
   */
  private convertGuestDoc(doc: any, id: string): Guest {
    return {
      ...doc,
      id,
      lastVisitedOn: firestoreTimestampToDate(doc.lastVisitedOn),
      createdAt: firestoreTimestampToDate(doc.createdAt),
      updatedAt: firestoreTimestampToDate(doc.updatedAt),
    } as Guest;
  }

  /**
   * Create or get existing guest
   * Returns the guest and whether they are returning
   */
  async checkInGuest(input: CreateGuestInput, clubId: string): Promise<GuestCheckInData> {
    try {
      const hostClub = await getDoc(doc(db, 'clubs', clubId));
      const hostClubData = hostClub.exists() ? (hostClub.data() as Record<string, unknown>) : null;
      const normalizedInput: CreateGuestInput = {
        ...input,
        email: normalizeEmail(input.email),
        phone: normalizePhone(input.phone),
        type: normalizeGuestType(input.type),
        club: normalizeClubName(input.club),
      };

      // Check if guest exists by email or phone
      let existingGuest = await this.getGuestByEmail(normalizedInput.email, clubId);

      if (!existingGuest) {
        existingGuest = await this.getGuestByPhone(normalizedInput.phone, clubId);
      }

      if (existingGuest) {
        // Increment visit count
        await updateDoc(doc(db, this.collectionName, existingGuest.id), {
          visitCount: existingGuest.visitCount + 1,
          lastVisitedOn: Timestamp.now(),
          updatedAt: Timestamp.now(),
        });

        // Refresh guest data
        const updated = await this.getGuestById(existingGuest.id);
        return {
          guest: updated!,
          isReturningGuest: true,
          visitCount: updated!.visitCount,
        };
      }

      // Create new guest
      const guestData = {
        clubId,
        clubName: String(hostClubData?.clubName || ''),
        clubType: hostClubData?.clubType === 'rotary' ? 'rotary' : 'rotaract',
        clubCode: String(hostClubData?.clubCode || '').trim(),
        name: normalizedInput.name,
        email: normalizedInput.email,
        phone: normalizedInput.phone,
        type: normalizedInput.type,
        club: normalizedInput.club || '',
        visitCount: 1,
        lastVisitedOn: Timestamp.now(),
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      const docRef = await addDoc(collection(db, this.collectionName), guestData);

      const newGuest = this.convertGuestDoc(guestData, docRef.id);

      return {
        guest: newGuest,
        isReturningGuest: false,
        visitCount: 1,
      };
    } catch (error) {
      throw new Error(`Failed to check in guest: ${(error instanceof Error ? error.message : String(error))}`);
    }
  }

  /**
   * Get guest by ID
   */
  async getGuestById(guestId: string): Promise<Guest | null> {
    try {
      const docRef = doc(db, this.collectionName, guestId);
      const docSnapshot = await getDoc(docRef);

      if (!docSnapshot.exists()) {
        return null;
      }

      return this.convertGuestDoc(docSnapshot.data(), docSnapshot.id);
    } catch (error) {
      throw new Error(`Failed to get guest: ${(error instanceof Error ? error.message : String(error))}`);
    }
  }

  /**
   * Get guest by email
   */
  async getGuestByEmail(email: string, clubId?: string): Promise<Guest | null> {
    try {
      const constraints = [where('email', '==', normalizeEmail(email))];
      if (clubId) constraints.push(where('clubId', '==', clubId));
      const q = query(collection(db, this.collectionName), ...constraints);
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        return null;
      }

      const doc = querySnapshot.docs[0];
      return this.convertGuestDoc(doc.data(), doc.id);
    } catch (error) {
      throw new Error(`Failed to get guest by email: ${(error instanceof Error ? error.message : String(error))}`);
    }
  }

  /**
   * Get guest by phone
   */
  async getGuestByPhone(phone: string, clubId?: string): Promise<Guest | null> {
    try {
      const constraints = [where('phone', '==', normalizePhone(phone))];
      if (clubId) constraints.push(where('clubId', '==', clubId));
      const q = query(collection(db, this.collectionName), ...constraints);
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        return null;
      }

      const doc = querySnapshot.docs[0];
      return this.convertGuestDoc(doc.data(), doc.id);
    } catch (error) {
      throw new Error(`Failed to get guest by phone: ${(error instanceof Error ? error.message : String(error))}`);
    }
  }

  /**
   * Search guests by name or email
   */
  async searchGuests(searchTerm: string, clubId: string): Promise<Guest[]> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('clubId', '==', clubId),
        where('name', '>=', searchTerm),
        where('name', '<=', searchTerm + '\uf8ff')
      );

      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map((doc) => this.convertGuestDoc(doc.data(), doc.id));
    } catch (error) {
      throw new Error(`Failed to search guests: ${(error instanceof Error ? error.message : String(error))}`);
    }
  }
}

export const guestService = new GuestService();
