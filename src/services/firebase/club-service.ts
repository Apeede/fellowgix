import { Club, ClubECardBranding, ClubType, CreateClubInput } from '@types/club';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  setDoc,
  Timestamp,
  where,
} from 'firebase/firestore';
import { buildClubId, normalizeClubCode, normalizeClubName } from './club-utils';
import { db } from './firebase';
import { firestoreTimestampToDate } from './firestore-utils';

class ClubService {
  private collectionName = 'clubs';

  private convertClubDoc(data: Record<string, unknown>, id: string): Club {
    return {
      id,
      clubId: String(data.clubId || id),
      clubName: String(data.clubName || id),
      clubType: (data.clubType === 'rotary' ? 'rotary' : 'rotaract') as ClubType,
      clubCode: String(data.clubCode || '').trim() || undefined,
      normalizedName: String(data.normalizedName || normalizeClubName(String(data.clubName || ''))),
      isActive: data.isActive !== false,
      organizationLogo: String(data.organizationLogo || '').trim() || undefined,
      clubLogo: String(data.clubLogo || '').trim() || undefined,
      eCardMessage: String(data.eCardMessage || '').trim() || undefined,
      createdAt: firestoreTimestampToDate(data.createdAt),
      updatedAt: firestoreTimestampToDate(data.updatedAt),
    };
  }

  async updateECardBranding(clubId: string, branding: ClubECardBranding): Promise<void> {
    const normalizedClubId = clubId.trim();
    if (!normalizedClubId) throw new Error('Club ID is required');

    await setDoc(
      doc(db, this.collectionName, normalizedClubId),
      {
        organizationLogo: branding.organizationLogo || '',
        clubLogo: branding.clubLogo || '',
        eCardMessage: branding.eCardMessage?.trim() || '',
        updatedAt: Timestamp.now(),
      },
      { merge: true }
    );
  }

  async getClubById(clubId: string): Promise<Club | null> {
    const normalizedClubId = clubId.trim();
    if (!normalizedClubId) return null;

    const clubSnapshot = await getDoc(doc(db, this.collectionName, normalizedClubId));
    if (!clubSnapshot.exists()) {
      return null;
    }

    return this.convertClubDoc(clubSnapshot.data() as Record<string, unknown>, clubSnapshot.id);
  }

  async listClubs(): Promise<Club[]> {
    const snapshot = await getDocs(collection(db, this.collectionName));
    return snapshot.docs
      .map((clubDoc) => this.convertClubDoc(clubDoc.data() as Record<string, unknown>, clubDoc.id))
      .filter((club) => club.isActive)
      .sort((a, b) => a.clubName.localeCompare(b.clubName));
  }

  async ensureClub(input: CreateClubInput): Promise<Club> {
    const clubName = normalizeClubName(input.clubName);
    const clubType: ClubType = input.clubType === 'rotary' ? 'rotary' : 'rotaract';
    const clubCode = normalizeClubCode(input.clubCode);

    if (!clubName) {
      throw new Error('Club name is required');
    }

    if (input.clubId?.trim()) {
      const existingById = await this.getClubById(input.clubId);
      if (existingById) {
        if (
          existingById.clubName !== clubName ||
          existingById.clubType !== clubType ||
          (clubCode && existingById.clubCode !== clubCode)
        ) {
          await setDoc(
            doc(db, this.collectionName, existingById.clubId),
            {
              clubName,
              clubType,
              clubCode: clubCode || null,
              normalizedName: clubName.toLowerCase(),
              updatedAt: Timestamp.now(),
            },
            { merge: true }
          );
        }

        return {
          ...existingById,
          clubName,
          clubType,
          clubCode: clubCode || existingById.clubCode,
        };
      }
    }

    const existingSnapshot = await getDocs(
      query(
        collection(db, this.collectionName),
        where('normalizedName', '==', clubName.toLowerCase()),
        where('clubType', '==', clubType),
        limit(1)
      )
    );

    if (!existingSnapshot.empty) {
      const existingDoc = existingSnapshot.docs[0];
      const existingClub = this.convertClubDoc(existingDoc.data() as Record<string, unknown>, existingDoc.id);
      if (clubCode && existingClub.clubCode !== clubCode) {
        await setDoc(
          doc(db, this.collectionName, existingClub.clubId),
          { clubCode, updatedAt: Timestamp.now() },
          { merge: true }
        );
      }

      return {
        ...existingClub,
        clubCode: clubCode || existingClub.clubCode,
      };
    }

    const requestedClubId = input.clubId?.trim();
    const clubId = requestedClubId || (await this.createUniqueClubId(clubName, clubType));
    const clubData = {
      clubId,
      clubName,
      clubType,
      clubCode: clubCode || '',
      normalizedName: clubName.toLowerCase(),
      isActive: true,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    await setDoc(doc(db, this.collectionName, clubId), clubData);

    return {
      id: clubId,
      clubId,
      clubName,
      clubType,
      clubCode: clubCode || undefined,
      normalizedName: clubData.normalizedName,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  private async createUniqueClubId(clubName: string, clubType: ClubType): Promise<string> {
    const baseClubId = buildClubId(clubName, clubType);
    let candidate = baseClubId;
    let counter = 2;

    while (await this.getClubById(candidate)) {
      candidate = `${baseClubId}-${counter}`;
      counter += 1;
    }

    return candidate;
  }
}

export const clubService = new ClubService();
