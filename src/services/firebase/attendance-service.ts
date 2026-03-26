import { AttendanceRecord, AttendanceStats, CheckInResponse } from '@types/attendance';
import {
    Timestamp,
    addDoc,
    collection,
    getDocs,
    orderBy,
    query,
    where,
} from 'firebase/firestore';
import { db } from './firebase';

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
    personPhone: string
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
        type,
        personId,
        personName,
        personEmail,
        personPhone,
        checkedInAt: Timestamp.now(),
        eCardGenerated: false,
        eCardUrl: '',
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
    } catch (error: any) {
      throw new Error(`Failed to record attendance: ${error.message}`);
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
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

      const q = query(
        collection(db, this.collectionName),
        where('eventId', '==', eventId),
        where('type', '==', type),
        where('personId', '==', personId),
        where('checkedInAt', '>=', Timestamp.fromDate(fiveMinutesAgo))
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
      let returningGuests = 0;

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
    } catch (error: any) {
      throw new Error(`Failed to fetch attendance stats: ${error.message}`);
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

      return querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id,
          checkedInAt: data.checkedInAt?.toDate() || new Date(),
        } as AttendanceRecord;
      });
    } catch (error: any) {
      throw new Error(`Failed to fetch attendance: ${error.message}`);
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
      // Note: Would need to use updateDoc from Firebase
      // For now, this is a placeholder
      console.log(`E-card updated for attendance ${attendanceId}: ${eCardUrl}`);
    } catch (error: any) {
      throw new Error(`Failed to update e-card: ${error.message}`);
    }
  }
}

export const attendanceService = new AttendanceService();
