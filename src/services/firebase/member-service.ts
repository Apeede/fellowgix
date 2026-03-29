import { CreateMemberInput, Member, MemberSearchResult, UpdateMemberInput } from '@types/member';
import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    query,
    setDoc,
    Timestamp,
    updateDoc,
    where,
} from 'firebase/firestore';
import { normalizeClubName, normalizeEmail, normalizePhone } from './club-utils';
import { db } from './firebase';
import { firestoreTimestampToDate } from './firestore-utils';

class MemberService {
  private collectionName = 'members';
  private publicDirectoryCollectionName = 'memberPublicDirectory';

  private normalizeSearchText(value: string): string {
    return value.trim().toLowerCase();
  }

  private matchesClubScope(
    raw: Record<string, unknown>,
    clubId: string,
    normalizedClubName?: string
  ): boolean {
    const rawClubId = String(raw.clubId || '').trim();
    if (clubId && rawClubId === clubId) {
      return true;
    }

    if (!normalizedClubName) {
      return false;
    }

    const rawClubName = this.normalizeSearchText(String(raw.club || raw.clubName || ''));
    return rawClubName === normalizedClubName;
  }

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

  private async syncPublicDirectoryEntry(member: Member): Promise<void> {
    const directoryRef = doc(db, this.publicDirectoryCollectionName, member.id);

    if (!member.isActive) {
      await deleteDoc(directoryRef).catch(() => undefined);
      return;
    }

    const nameSearch = this.normalizeSearchText(member.name);
    const emailSearch = this.normalizeSearchText(member.email);
    const phoneSearch = normalizePhone(member.phone);
    const memberIdSearch = this.normalizeSearchText(member.memberId || '');

    await setDoc(directoryRef, {
      memberId: member.id,
      clubId: member.clubId,
      name: member.name,
      email: member.email,
      phone: member.phone,
      directoryMemberId: member.memberId || '',
      club: member.club || member.clubName || '',
      nameSearch,
      emailSearch,
      phoneSearch,
      memberIdSearch,
      isActive: true,
      updatedAt: Timestamp.now(),
    });
  }

  private convertSearchResult(docData: Record<string, unknown>, id: string): MemberSearchResult {
    return {
      id: String(docData.memberId || id),
      clubId: String(docData.clubId || ''),
      name: String(docData.name || ''),
      email: String(docData.email || ''),
      phone: String(docData.phone || ''),
      memberId: String(docData.directoryMemberId || '').trim() || undefined,
      club: String(docData.club || '').trim() || undefined,
    };
  }

  private convertMemberToSearchResult(docData: Record<string, unknown>, id: string): MemberSearchResult {
    return {
      id,
      clubId: String(docData.clubId || ''),
      name: String(docData.name || ''),
      email: String(docData.email || ''),
      phone: String(docData.phone || ''),
      memberId: String(docData.memberId || '').trim() || undefined,
      club: String(docData.club || docData.clubName || '').trim() || undefined,
    };
  }

  private memberMatchesSearch(
    member: MemberSearchResult,
    raw: Record<string, unknown>,
    normalizedTerm: string,
    normalizedPhoneTerm: string,
    clubId: string,
    normalizedClubName?: string
  ): boolean {
    if (raw.isActive === false) {
      return false;
    }

    if (!this.matchesClubScope(raw, clubId, normalizedClubName)) {
      return false;
    }

    const haystack = `${member.name} ${member.email} ${member.phone} ${member.memberId || ''}`.toLowerCase();
    return haystack.includes(normalizedTerm) || (normalizedPhoneTerm ? member.phone.includes(normalizedPhoneTerm) : false);
  }

  /**
   * Create a new member
   */
  async createMember(input: CreateMemberInput, clubId: string, createdByAdminId: string): Promise<Member> {
    try {
      const normalizedEmail = normalizeEmail(input.email);
      const normalizedPhone = normalizePhone(input.phone);
      const club = await getDoc(doc(db, 'clubs', clubId));
      const clubData = club.exists() ? (club.data() as Record<string, unknown>) : null;
      const normalizedClubName = normalizeClubName(String(clubData?.clubName || ''));

      const duplicateByEmail = await getDocs(
        query(
          collection(db, this.collectionName),
          where('clubId', '==', clubId),
          where('email', '==', normalizedEmail),
          where('isActive', '==', true)
        )
      );
      if (!duplicateByEmail.empty) {
        throw new Error('A member with this email already exists in this club');
      }

      const duplicateByPhone = await getDocs(
        query(
          collection(db, this.collectionName),
          where('clubId', '==', clubId),
          where('phone', '==', normalizedPhone),
          where('isActive', '==', true)
        )
      );
      if (!duplicateByPhone.empty) {
        throw new Error('A member with this phone already exists in this club');
      }

      const memberData = {
        clubId,
        clubName: normalizedClubName,
        clubType: clubData?.clubType === 'rotary' ? 'rotary' : 'rotaract',
        clubCode: String(clubData?.clubCode || '').trim(),
        createdByAdminId,
        name: input.name,
        email: normalizedEmail,
        phone: normalizedPhone,
        memberId: input.memberId || '',
        club: normalizedClubName,
        joinDate: Timestamp.now(),
        isActive: true,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      const docRef = await addDoc(collection(db, this.collectionName), memberData);

      const createdMember = this.convertMemberDoc(memberData, docRef.id);
      await this.syncPublicDirectoryEntry(createdMember);

      return createdMember;
    } catch (error) {
      throw new Error(`Failed to create member: ${(error instanceof Error ? error.message : String(error))}`);
    }
  }

  /**
   * Search members by name or email
   */
  async searchMembers(searchTerm: string, clubId: string, clubName?: string): Promise<MemberSearchResult[]> {
    try {
      const normalizedTerm = this.normalizeSearchText(searchTerm);
      const normalizedPhoneTerm = normalizePhone(searchTerm);
      const eligibleMembers = await this.getEligibleCheckInMembers(clubId, clubName);

      return eligibleMembers
        .filter((member) => {
          const haystack = `${member.name} ${member.email} ${member.phone} ${member.memberId || ''}`.toLowerCase();
          return haystack.includes(normalizedTerm) || (normalizedPhoneTerm ? member.phone.includes(normalizedPhoneTerm) : false);
        })
        .slice(0, 25);
    } catch (error) {
      throw new Error(`Failed to search members: ${(error instanceof Error ? error.message : String(error))}`);
    }
  }

  async getEligibleCheckInMembers(clubId: string, clubName?: string): Promise<MemberSearchResult[]> {
    try {
      const normalizedClubName = this.normalizeSearchText(clubName || '');
      const [directoryResult, membersResult] = await Promise.allSettled([
        getDocs(
          query(
            collection(db, this.publicDirectoryCollectionName),
            where('isActive', '==', true)
          )
        ),
        getDocs(
          query(
            collection(db, this.collectionName),
            where('isActive', '==', true)
          )
        ),
      ]);

      const merged = new Map<string, MemberSearchResult>();

      if (directoryResult.status === 'fulfilled') {
        directoryResult.value.docs
          .map((item) => ({
            raw: item.data() as Record<string, unknown>,
            member: this.convertSearchResult(item.data() as Record<string, unknown>, item.id),
          }))
          .filter(({ raw, member }) =>
            this.memberMatchesSearch(
              member,
              raw,
              normalizedTerm,
              normalizedPhoneTerm,
              clubId,
              normalizedClubName || undefined
            )
          )
          .forEach(({ member }) => {
            const key = `${member.id}|${member.email.toLowerCase()}|${(member.memberId || '').toLowerCase()}`;
            merged.set(key, member);
          });
      }

      if (membersResult.status === 'fulfilled') {
        membersResult.value.docs
          .map((item) => ({
            raw: item.data() as Record<string, unknown>,
            member: this.convertMemberToSearchResult(item.data() as Record<string, unknown>, item.id),
          }))
          .filter(({ raw, member }) =>
            this.memberMatchesSearch(
              member,
              raw,
              normalizedTerm,
              normalizedPhoneTerm,
              clubId,
              normalizedClubName || undefined
            )
          )
          .forEach(({ member }) => {
            const key = `${member.id}|${member.email.toLowerCase()}|${(member.memberId || '').toLowerCase()}`;
            merged.set(key, member);
          });
      }

      if (merged.size > 0) {
        return Array.from(merged.values()).slice(0, 25);
      }

      if (directoryResult.status === 'rejected' && membersResult.status === 'rejected') {
        throw new Error(
          `Directory search failed: ${directoryResult.reason instanceof Error ? directoryResult.reason.message : String(directoryResult.reason)}; Members search failed: ${membersResult.reason instanceof Error ? membersResult.reason.message : String(membersResult.reason)}`
        );
      }

      return [];
    } catch (error) {
      throw new Error(`Failed to load eligible members: ${(error instanceof Error ? error.message : String(error))}`);
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
      const q = query(collection(db, this.collectionName), where('email', '==', normalizeEmail(email)));
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
      const existingDoc = await getDoc(docRef);
      if (!existingDoc.exists()) {
        throw new Error('Member not found');
      }

      await updateDoc(docRef, {
        ...input,
        updatedAt: Timestamp.now(),
      });

      const existingData = this.convertMemberDoc(existingDoc.data(), existingDoc.id);
      const updatedMember: Member = {
        ...existingData,
        ...input,
        email: input.email ? normalizeEmail(input.email) : existingData.email,
        phone: input.phone ? normalizePhone(input.phone) : existingData.phone,
        updatedAt: new Date(),
      };

      await this.syncPublicDirectoryEntry(updatedMember);
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

  async syncPublicDirectoryForMembers(members: Member[]): Promise<void> {
    await Promise.all(members.map((member) => this.syncPublicDirectoryEntry(member)));
  }
}

export const memberService = new MemberService();
