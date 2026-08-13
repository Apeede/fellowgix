import { AttendanceRecord, AttendanceStats, CheckInResponse } from '@types/attendance';
import { auditLogService } from './audit-log-service';
import {
    Timestamp,
    addDoc,
    collection,
    doc,
    getDocs,
    orderBy,
    query,
    updateDoc,
    where,
} from 'firebase/firestore';
import { db } from './firebase';
import { FirebaseError } from 'firebase/app';
import { firestoreTimestampToDate, getTimestampMinutesAgo } from './firestore-utils';

class AttendanceService {
  private collectionName = 'attendance';

  /**
   * Record attendance for member or guest
   */
  async recordAttendance(
    eventId: string,
    type: 'member' | 'guest',
    personId: string,
    personName: string,
    personEmail: string,
    personPhone: string,
    clubId?: string,
    options?: { isReturningGuest?: boolean }
  ): Promise<CheckInResponse> {
    try {
      // Check for duplicate check-in (same person, same event, within 5 minutes)
      const isDuplicate = await this.isDuplicateCheckIn(eventId, type, personId);

      if (isDuplicate) {
        return {
          success: false,
          type,
          personName,
          eCardGenerated: false,
          isDuplicate: true,
          message: `${personName} has already checked in for this event!`,
        };
      }

      // Record attendance
      const attendanceData = {
        eventId,
        clubId: clubId || '',
        type,
        personId,
        personName,
        personEmail,
        personPhone,
        checkedInAt: Timestamp.now(),
        eCardGenerated: false,
        eCardUrl: '',
        isReturningGuest: options?.isReturningGuest === true,
      };

      await addDoc(collection(db, this.collectionName), attendanceData);

      return {
        success: true,
        type,
        personName,
        eCardGenerated: false,
        isDuplicate: false,
        message: `Welcome ${personName}! Check-in recorded.`,
      };
    } catch (error) {
      if (error instanceof FirebaseError && error.code === 'permission-denied') {
        throw new Error('This check-in could not be verified. Ask an administrator to confirm that the event is active and the attendee belongs to this club.');
      }
      throw new Error(`Failed to record attendance: ${(error instanceof Error ? error.message : String(error))}`);
    }
  }

  /**
   * Check if attendee has already checked in (within 5 minutes)
   */
  private async isDuplicateCheckIn(
    eventId: string,
    type: 'member' | 'guest',
    personId: string
  ): Promise<boolean> {
    try {
      const fiveMinutesAgo = getTimestampMinutesAgo(5);

      const q = query(
        collection(db, this.collectionName),
        where('eventId', '==', eventId),
        where('type', '==', type),
        where('personId', '==', personId),
        where('checkedInAt', '>=', fiveMinutesAgo)
      );

      const querySnapshot = await getDocs(q);
      return !querySnapshot.empty;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get attendance stats for an event
   */
  async getEventAttendanceStats(eventId: string): Promise<AttendanceStats> {
    try {
      const q = query(collection(db, this.collectionName), where('eventId', '==', eventId));
      const querySnapshot = await getDocs(q);

      let members = 0;
      let guests = 0;
      const returningGuests = 0;

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.type === 'member') {
          members++;
        } else {
          guests++;
          // Note: returningGuests count would need guest service integration
        }
      });

      return {
        totalAttendees: querySnapshot.size,
        members,
        guests,
        returningGuests,
      };
    } catch (error) {
      throw new Error(`Failed to fetch attendance stats: ${(error instanceof Error ? error.message : String(error))}`);
    }
  }

  /**
   * Get all attendance records for an event
   */
  async getEventAttendance(eventId: string): Promise<AttendanceRecord[]> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('eventId', '==', eventId),
        orderBy('checkedInAt', 'desc')
      );

      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
        checkedInAt: firestoreTimestampToDate(doc.data().checkedInAt),
      })) as AttendanceRecord[];
    } catch (error) {
      throw new Error(`Failed to fetch attendance: ${(error instanceof Error ? error.message : String(error))}`);
    }
  }

  /**
   * Update e-card status for an attendance record
   */
  async updateECardStatus(
    attendanceId: string,
    eCardUrl: string
  ): Promise<void> {
    try {
      const docRef = doc(db, this.collectionName, attendanceId);
      await updateDoc(docRef, {
        eCardGenerated: true,
        eCardUrl: eCardUrl,
        eCardGeneratedAt: Timestamp.now(),
      });
    } catch (error) {
      throw new Error(`Failed to update e-card: ${(error instanceof Error ? error.message : String(error))}`);
    }
  }

  async updateAttendanceNotes(
    attendanceId: string,
    notes: string,
    actor?: { id: string; email: string; role: string; clubId: string }
  ): Promise<void> {
    const docRef = doc(db, this.collectionName, attendanceId);
    await updateDoc(docRef, {
      notes,
      updatedAt: Timestamp.now(),
    });
    if (actor) {
      await auditLogService.log({
        action: 'ATTENDANCE_UPDATED',
        actorId: actor.id,
        actorEmail: actor.email,
        actorRole: actor.role,
        actorClubId: actor.clubId,
        targetType: 'attendance',
        targetId: attendanceId,
        targetClubId: actor.clubId,
        details: { fields: ['notes'] },
      });
    }
  }
}

export const attendanceService = new AttendanceService();
