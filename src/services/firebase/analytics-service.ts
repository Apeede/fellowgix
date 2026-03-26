import { db } from '@services/firebase/firebase';
import {
    collection,
    getDocs,
    orderBy,
    query,
    Timestamp,
    where,
} from 'firebase/firestore';

export interface AttendanceAnalytics {
  totalAttendees: number;
  memberCount: number;
  guestCount: number;
  returningGuestCount: number;
  duplicateCheckInCount: number;
  checkInByHour: Record<number, number>;
  guestTypeBreakdown: {
    rotarian: number;
    rotaractor: number;
    non_rotaractor: number;
  };
}

export interface AttendanceListItem {
  id: string;
  personName: string;
  email: string;
  phone: string;
  type: 'member' | 'guest';
  checkedInAt: Date;
  club?: string;
  isDuplicate: boolean;
}

export class AnalyticsService {
  /**
   * Get comprehensive attendance analytics for an event
   */
  static async getEventAnalytics(eventId: string): Promise<AttendanceAnalytics> {
    try {
      const attendanceQuery = query(
        collection(db, 'attendance'),
        where('eventId', '==', eventId)
      );

      const snapshot = await getDocs(attendanceQuery);
      const records = snapshot.docs.map((doc) => doc.data());

      // Calculate statistics
      const totalAttendees = records.length;
      const memberCount = records.filter((r) => r.type === 'member').length;
      const guestCount = records.filter((r) => r.type === 'guest').length;
      const returningGuestCount = records.filter(
        (r) => r.type === 'guest' && r.isReturningGuest
      ).length;
      const duplicateCheckInCount = records.filter((r) => r.isDuplicate).length;

      // Check-in by hour
      const checkInByHour: Record<number, number> = {};
      records.forEach((record) => {
        const timestamp = record.checkedInAt;
        const date = timestamp instanceof Timestamp ? timestamp.toDate() : new Date(timestamp);
        const hour = date.getHours();
        checkInByHour[hour] = (checkInByHour[hour] || 0) + 1;
      });

      // Guest type breakdown
      const guestTypeBreakdown = {
        rotarian: 0,
        rotaractor: 0,
        non_rotaractor: 0,
      };

      // For guest type breakdown, we need to fetch guest data
      for (const record of records) {
        if (record.type === 'guest') {
          try {
            const guestQuery = query(
              collection(db, 'guests'),
              where('email', '==', record.email)
            );
            const guestSnapshot = await getDocs(guestQuery);
            if (!guestSnapshot.empty) {
              const guestData = guestSnapshot.docs[0].data();
              const guestType = guestData.type || 'non_rotaractor';
              guestTypeBreakdown[guestType as keyof typeof guestTypeBreakdown]++;
            }
          } catch (error) {
            // Skip if guest not found
          }
        }
      }

      return {
        totalAttendees,
        memberCount,
        guestCount,
        returningGuestCount,
        duplicateCheckInCount,
        checkInByHour,
        guestTypeBreakdown,
      };
    } catch (error) {
      console.error('Failed to get event analytics:', error);
      throw error;
    }
  }

  /**
   * Get detailed attendance list for an event
   */
  static async getEventAttendanceList(eventId: string): Promise<AttendanceListItem[]> {
    try {
      const attendanceQuery = query(
        collection(db, 'attendance'),
        where('eventId', '==', eventId),
        orderBy('checkedInAt', 'desc')
      );

      const snapshot = await getDocs(attendanceQuery);
      const attendees: AttendanceListItem[] = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          personName: data.personName,
          email: data.email,
          phone: data.phone,
          type: data.type,
          checkedInAt: data.checkedInAt instanceof Timestamp 
            ? data.checkedInAt.toDate() 
            : new Date(data.checkedInAt),
          club: data.club,
          isDuplicate: data.isDuplicate || false,
        };
      });

      return attendees;
    } catch (error) {
      console.error('Failed to get attendance list:', error);
      throw error;
    }
  }

  /**
   * Export attendance list as CSV
   */
  static async exportAttendanceAsCSV(
    eventId: string,
    eventName: string
  ): Promise<void> {
    try {
      const attendees = await this.getEventAttendanceList(eventId);

      // Build CSV header
      const headers = ['Name', 'Email', 'Phone', 'Type', 'Check-in Time', 'Club', 'Status'];
      const csvContent = [
        headers.join(','),
        ...attendees.map((attendee) =>
          [
            `"${attendee.personName}"`,
            `"${attendee.email}"`,
            `"${attendee.phone}"`,
            attendee.type.toUpperCase(),
            attendee.checkedInAt.toLocaleString('en-US'),
            `"${attendee.club || '-'}"`,
            attendee.isDuplicate ? 'Duplicate' : 'Valid',
          ].join(',')
        ),
      ].join('\n');

      // Add summary
      const analytics = await this.getEventAnalytics(eventId);
      const summary = [
        '',
        'SUMMARY',
        `Total Attendees,${analytics.totalAttendees}`,
        `Members,${analytics.memberCount}`,
        `Guests,${analytics.guestCount}`,
        `Returning Guests,${analytics.returningGuestCount}`,
        `Duplicate Check-ins,${analytics.duplicateCheckInCount}`,
        '',
        'GUEST TYPE BREAKDOWN',
        `Rotarians,${analytics.guestTypeBreakdown.rotarian}`,
        `Rotaractors,${analytics.guestTypeBreakdown.rotaractor}`,
        `Non-Rotaractors,${analytics.guestTypeBreakdown.non_rotaractor}`,
      ].join('\n');

      const fullCSV = csvContent + '\n' + summary;

      // Trigger download
      const link = document.createElement('a');
      link.href = `data:text/csv;charset=utf-8,${encodeURIComponent(fullCSV)}`;
      link.download = `${eventName.replace(/\s+/g, '-')}-attendance-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Failed to export attendance:', error);
      throw error;
    }
  }
}
