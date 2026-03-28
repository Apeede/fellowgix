import { db } from '@services/firebase/firebase';
import {
    collection,
    doc,
    getDoc,
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
  clubsVisited: {
    rotary: string[];
    rotaract: string[];
    member: string[];
    all: string[];
  };
  attendeeDetails: AttendanceListItem[];
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
      const records = snapshot.docs.map((attendanceDoc) => ({
        id: attendanceDoc.id,
        ...attendanceDoc.data(),
      }));

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

      const rotaryClubs = new Set<string>();
      const rotaractClubs = new Set<string>();
      const memberClubs = new Set<string>();
      const allClubs = new Set<string>();
      const attendeeDetails: AttendanceListItem[] = [];

      const guestCache = new Map<string, any>();
      const memberCache = new Map<string, any>();

      // Build enriched attendee details and club analytics
      for (const record of records) {
        const personEmail = record.personEmail || record.email || '';
        const personPhone = record.personPhone || record.phone || '';
        const checkedInAt =
          record.checkedInAt instanceof Timestamp
            ? record.checkedInAt.toDate()
            : new Date(record.checkedInAt);

        let club = record.club || '';

        if (record.type === 'guest' && record.personId) {
          if (!guestCache.has(record.personId)) {
            try {
              const guestDoc = await getDoc(doc(db, 'guests', record.personId));
              guestCache.set(record.personId, guestDoc.exists() ? guestDoc.data() : null);
            } catch {
              guestCache.set(record.personId, null);
            }
          }

          const guestData = guestCache.get(record.personId);
          const guestType = (guestData?.type || 'non_rotaractor') as
            | 'rotarian'
            | 'rotaractor'
            | 'non_rotaractor';
          const guestClub = (guestData?.club || club || '').trim();
          club = guestClub;

          guestTypeBreakdown[guestType]++;

          if (guestClub) {
            allClubs.add(guestClub);
            if (guestType === 'rotarian') rotaryClubs.add(guestClub);
            if (guestType === 'rotaractor') rotaractClubs.add(guestClub);
          }
        }

        if (record.type === 'member' && record.personId) {
          if (!memberCache.has(record.personId)) {
            try {
              const memberDoc = await getDoc(doc(db, 'members', record.personId));
              memberCache.set(record.personId, memberDoc.exists() ? memberDoc.data() : null);
            } catch {
              memberCache.set(record.personId, null);
            }
          }

          const memberData = memberCache.get(record.personId);
          const memberClub = (memberData?.club || club || '').trim();
          club = memberClub;

          if (memberClub) {
            memberClubs.add(memberClub);
            allClubs.add(memberClub);
          }
        }

        attendeeDetails.push({
          id: record.id,
          personName: record.personName,
          email: personEmail,
          phone: personPhone,
          type: record.type,
          checkedInAt,
          club,
          isDuplicate: record.isDuplicate || false,
        });
      }

      return {
        totalAttendees,
        memberCount,
        guestCount,
        returningGuestCount,
        duplicateCheckInCount,
        checkInByHour,
        guestTypeBreakdown,
        clubsVisited: {
          rotary: Array.from(rotaryClubs).sort(),
          rotaract: Array.from(rotaractClubs).sort(),
          member: Array.from(memberClubs).sort(),
          all: Array.from(allClubs).sort(),
        },
        attendeeDetails: attendeeDetails.sort(
          (a, b) => b.checkedInAt.getTime() - a.checkedInAt.getTime()
        ),
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
          email: data.personEmail || data.email || '',
          phone: data.personPhone || data.phone || '',
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
