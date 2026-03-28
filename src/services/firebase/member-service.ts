import { CreateMemberInput, Member, UpdateMemberInput } from '@types/member';
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
import { firestoreTimestampToDate } from './firestore-utils';

class MemberService {
  private collectionName = 'members';

  /**
   * Convert Firestore member document to Member type
   */
  private convertMemberDoc(doc: any, id: string): Member {
    return {
      ...doc,
      id,
      joinDate: firestoreTimestampToDate(doc.joinDate),
      createdAt: firestoreTimestampToDate(doc.createdAt),
      updatedAt: firestoreTimestampToDate(doc.updatedAt),
    } as Member;
  }

  /**
   * Create a new member
   */
  async createMember(input: CreateMemberInput, clubId: string, createdByAdminId: string): Promise<Member> {
    try {
      const memberData = {
        clubId,
        createdByAdminId,
        name: input.name,
        email: input.email,
        phone: input.phone,
        memberId: input.memberId || '',
        club: input.club || '',
        joinDate: Timestamp.now(),
        isActive: true,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      const docRef = await addDoc(collection(db, this.collectionName), memberData);

      // Return with converted dates
      return this.convertMemberDoc(memberData, docRef.id);
    } catch (error) {
      throw new Error(`Failed to create member: ${(error instanceof Error ? error.message : String(error))}`);
    }
  }

  /**
   * Search members by name or email
   */
  async searchMembers(searchTerm: string, clubId: string): Promise<Member[]> {
    try {
      // Search by email (exact or partial)
      const constraints = [
        where('clubId', '==', clubId),
        where('email', '>=', searchTerm),
        where('email', '<=', searchTerm + '\uf8ff'),
      ];

      const q = query(collection(db, this.collectionName), ...constraints);
      const querySnapshot = await getDocs(q);

      const results = querySnapshot.docs.map((doc) => this.convertMemberDoc(doc.data(), doc.id));

      // Also search by name (case-insensitive)
      const nameQuery = query(
        collection(db, this.collectionName),
        where('clubId', '==', clubId),
        where('name', '>=', searchTerm),
        where('name', '<=', searchTerm + '\uf8ff')
      );
      const nameSnapshot = await getDocs(nameQuery);
      const nameResults = nameSnapshot.docs.map((doc) => this.convertMemberDoc(doc.data(), doc.id));

      // Combine and deduplicate
      const combined = [...results, ...nameResults];
      const unique = Array.from(new Map(combined.map((item) => [item.id, item])).values());

      return unique;
    } catch (error) {
      throw new Error(`Failed to search members: ${(error instanceof Error ? error.message : String(error))}`);
    }
  }

  /**
   * Get member by ID
   */
  async getMemberById(memberId: string): Promise<Member | null> {
    try {
      const docRef = doc(db, this.collectionName, memberId);
      const docSnapshot = await getDoc(docRef);

      if (!docSnapshot.exists()) {
        return null;
      }

      return this.convertMemberDoc(docSnapshot.data(), docSnapshot.id);
    } catch (error) {
      throw new Error(`Failed to get member: ${(error instanceof Error ? error.message : String(error))}`);
    }
  }

  /**
   * Get member by email
   */
  async getMemberByEmail(email: string): Promise<Member | null> {
    try {
      const q = query(collection(db, this.collectionName), where('email', '==', email));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        return null;
      }

      const doc = querySnapshot.docs[0];
      return this.convertMemberDoc(doc.data(), doc.id);
    } catch (error) {
      throw new Error(`Failed to get member by email: ${(error instanceof Error ? error.message : String(error))}`);
    }
  }

  /**
   * Update member
   */
  async updateMember(memberId: string, input: UpdateMemberInput): Promise<void> {
    try {
      const docRef = doc(db, this.collectionName, memberId);
      await updateDoc(docRef, {
        ...input,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      throw new Error(`Failed to update member: ${(error instanceof Error ? error.message : String(error))}`);
    }
  }

  /**
   * Get all active members
   */
  async getAllActiveMembers(clubId: string): Promise<Member[]> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('clubId', '==', clubId),
        where('isActive', '==', true)
      );
      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map((doc) => this.convertMemberDoc(doc.data(), doc.id));
    } catch (error) {
      throw new Error(`Failed to get members: ${(error instanceof Error ? error.message : String(error))}`);
    }
  }
}

export const memberService = new MemberService();
