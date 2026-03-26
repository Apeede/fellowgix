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

class MemberService {
  private collectionName = 'members';

  /**
   * Create a new member
   */
  async createMember(input: CreateMemberInput): Promise<Member> {
    try {
      const memberData = {
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

      return {
        ...memberData,
        id: docRef.id,
        joinDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    } catch (error: any) {
      throw new Error(`Failed to create member: ${error.message}`);
    }
  }

  /**
   * Search members by name or email
   */
  async searchMembers(searchTerm: string): Promise<Member[]> {
    try {
      // Search by email (exact or partial)
      let constraints = [where('email', '>=', searchTerm), where('email', '<=', searchTerm + '\uf8ff')];

      let q = query(collection(db, this.collectionName), ...constraints);
      let querySnapshot = await getDocs(q);

      const results = querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id,
          joinDate: data.joinDate?.toDate() || new Date(),
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as Member;
      });

      // Also search by name (case-insensitive)
      const nameQuery = query(
        collection(db, this.collectionName),
        where('name', '>=', searchTerm),
        where('name', '<=', searchTerm + '\uf8ff')
      );
      const nameSnapshot = await getDocs(nameQuery);
      const nameResults = nameSnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id,
          joinDate: data.joinDate?.toDate() || new Date(),
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as Member;
      });

      // Combine and deduplicate
      const combined = [...results, ...nameResults];
      const unique = Array.from(new Map(combined.map((item) => [item.id, item])).values());

      return unique;
    } catch (error: any) {
      throw new Error(`Failed to search members: ${error.message}`);
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

      const data = docSnapshot.data();
      return {
        ...data,
        id: docSnapshot.id,
        joinDate: data.joinDate?.toDate() || new Date(),
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as Member;
    } catch (error: any) {
      throw new Error(`Failed to get member: ${error.message}`);
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
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        joinDate: data.joinDate?.toDate() || new Date(),
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as Member;
    } catch (error: any) {
      throw new Error(`Failed to get member by email: ${error.message}`);
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
    } catch (error: any) {
      throw new Error(`Failed to update member: ${error.message}`);
    }
  }

  /**
   * Get all active members
   */
  async getAllActiveMembers(): Promise<Member[]> {
    try {
      const q = query(collection(db, this.collectionName), where('isActive', '==', true));
      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id,
          joinDate: data.joinDate?.toDate() || new Date(),
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as Member;
      });
    } catch (error: any) {
      throw new Error(`Failed to get members: ${error.message}`);
    }
  }
}

export const memberService = new MemberService();
