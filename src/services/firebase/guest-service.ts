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
import { db } from './firebase';

class GuestService {
  private collectionName = 'guests';

  /**
   * Create or get existing guest
   * Returns the guest and whether they are returning
   */
  async checkInGuest(input: CreateGuestInput): Promise<GuestCheckInData> {
    try {
      // Check if guest exists by email or phone
      let existingGuest = await this.getGuestByEmail(input.email);

      if (!existingGuest) {
        existingGuest = await this.getGuestByPhone(input.phone);
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
        name: input.name,
        email: input.email,
        phone: input.phone,
        type: input.type,
        club: input.club || '',
        visitCount: 1,
        lastVisitedOn: Timestamp.now(),
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      const docRef = await addDoc(collection(db, this.collectionName), guestData);

      const newGuest: Guest = {
        ...guestData,
        id: docRef.id,
        lastVisitedOn: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      return {
        guest: newGuest,
        isReturningGuest: false,
        visitCount: 1,
      };
    } catch (error: any) {
      throw new Error(`Failed to check in guest: ${error.message}`);
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

      const data = docSnapshot.data();
      return {
        ...data,
        id: docSnapshot.id,
        lastVisitedOn: data.lastVisitedOn?.toDate(),
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as Guest;
    } catch (error: any) {
      throw new Error(`Failed to get guest: ${error.message}`);
    }
  }

  /**
   * Get guest by email
   */
  async getGuestByEmail(email: string): Promise<Guest | null> {
    try {
      const q = query(collection(db, this.collectionName), where('email', '==', email));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        return null;
      }

      const doc = querySnapshot.docs[0];
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        lastVisitedOn: data.lastVisitedOn?.toDate(),
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as Guest;
    } catch (error: any) {
      throw new Error(`Failed to get guest by email: ${error.message}`);
    }
  }

  /**
   * Get guest by phone
   */
  async getGuestByPhone(phone: string): Promise<Guest | null> {
    try {
      const q = query(collection(db, this.collectionName), where('phone', '==', phone));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        return null;
      }

      const doc = querySnapshot.docs[0];
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        lastVisitedOn: data.lastVisitedOn?.toDate(),
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as Guest;
    } catch (error: any) {
      throw new Error(`Failed to get guest by phone: ${error.message}`);
    }
  }

  /**
   * Search guests by name or email
   */
  async searchGuests(searchTerm: string): Promise<Guest[]> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('name', '>=', searchTerm),
        where('name', '<=', searchTerm + '\uf8ff')
      );

      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id,
          lastVisitedOn: data.lastVisitedOn?.toDate(),
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as Guest;
      });
    } catch (error: any) {
      throw new Error(`Failed to search guests: ${error.message}`);
    }
  }
}

export const guestService = new GuestService();
