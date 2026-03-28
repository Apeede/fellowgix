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
  uniqueAttendeeCount: number;
  memberCount: number;
  guestCount: number;
  returningGuestCount: number;
  duplicateCheckInCount: number;
  attendanceRate: number;
  checkInByHour: Record<number, number>;
  checkInByDay: Record<string, number>;
  clubComparison: Array<{ club: string; count: number }>;
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

export interface ClubEventAnalyticsRow {
  eventId: string;
  eventName: string;
  eventDate: string;
  totalAttendees: number;
  uniqueAttendees: number;
  memberCount: number;
  guestCount: number;
  attendanceRate: number;
}

export interface ClubAnalyticsSummary {
  clubId: string;
  totalEvents: number;
  activeEvents: number;
  totalAttendance: number;
  uniqueAttendees: number;
  memberCount: number;
  guestCount: number;
  returningGuestCount: number;
  avgAttendancePerEvent: number;
  attendanceByDay: Array<{ day: string; count: number }>;
  eventRows: ClubEventAnalyticsRow[];
}

export class AnalyticsService {
  /**
   * Get comprehensive attendance analytics for an event
   */
  static async getEventAnalytics(
    eventId: string,
    options?: { from?: Date; to?: Date }
  ): Promise<AttendanceAnalytics> {
    try {
      const eventDoc = await getDoc(doc(db, 'events', eventId));
      const eventData = eventDoc.exists() ? (eventDoc.data() as Record<string, unknown>) : null;
      const expectedAttendance = Number(eventData?.expectedAttendance || 0);

      const attendanceQuery = query(
        collection(db, 'attendance'),
        where('eventId', '==', eventId)
      );

      const snapshot = await getDocs(attendanceQuery);
      const allRecords = snapshot.docs.map((attendanceDoc) => ({
        id: attendanceDoc.id,
        ...attendanceDoc.data(),
      }));
      const records = allRecords.filter((record) => {
        if (!options?.from && !options?.to) return true;
        const timestamp = record.checkedInAt;
        const date = timestamp instanceof Timestamp ? timestamp.toDate() : new Date(timestamp);
        if (options.from && date < options.from) return false;
        if (options.to && date > options.to) return false;
        return true;
      });

      // Calculate statistics
      const totalAttendees = records.length;
      const uniqueAttendeeCount = new Set(records.map((r) => `${r.type}:${r.personId}`)).size;
      const memberCount = records.filter((r) => r.type === 'member').length;
      const guestCount = records.filter((r) => r.type === 'guest').length;
      const returningGuestCount = records.filter(
        (r) => r.type === 'guest' && r.isReturningGuest
      ).length;
      const duplicateCheckInCount = records.filter((r) => r.isDuplicate).length;
      const attendanceRate =
        expectedAttendance > 0 ? Math.min(100, (uniqueAttendeeCount / expectedAttendance) * 100) : 0;

      // Check-in by hour
      const checkInByHour: Record<number, number> = {};
      const checkInByDay: Record<string, number> = {};
      records.forEach((record) => {
        const timestamp = record.checkedInAt;
        const date = timestamp instanceof Timestamp ? timestamp.toDate() : new Date(timestamp);
        const hour = date.getHours();
        checkInByHour[hour] = (checkInByHour[hour] || 0) + 1;
        const dayKey = date.toISOString().slice(0, 10);
        checkInByDay[dayKey] = (checkInByDay[dayKey] || 0) + 1;
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
      const clubCountMap = new Map<string, number>();

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
            clubCountMap.set(guestClub, (clubCountMap.get(guestClub) || 0) + 1);
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
            clubCountMap.set(memberClub, (clubCountMap.get(memberClub) || 0) + 1);
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
        uniqueAttendeeCount,
        memberCount,
        guestCount,
        returningGuestCount,
        duplicateCheckInCount,
        attendanceRate,
        checkInByHour,
        checkInByDay,
        clubComparison: Array.from(clubCountMap.entries())
          .map(([club, count]) => ({ club, count }))
          .sort((a, b) => b.count - a.count),
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

  static async exportAttendanceAsPDF(eventId: string, eventName: string): Promise<void> {
    const attendees = await this.getEventAttendanceList(eventId);
    const analytics = await this.getEventAnalytics(eventId);
    const printWindow = window.open('', '_blank', 'width=1000,height=700');
    if (!printWindow) throw new Error('Popup blocked. Enable popups to export PDF.');

    const rows = attendees
      .map(
        (attendee) =>
          `<tr><td>${attendee.personName}</td><td>${attendee.email}</td><td>${attendee.phone}</td><td>${attendee.type}</td><td>${attendee.club || '-'}</td><td>${attendee.checkedInAt.toLocaleString()}</td></tr>`
      )
      .join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>${eventName} Attendance Report</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; }
            h1, h2 { margin-bottom: 8px; }
            .muted { color: #666; margin-bottom: 16px; }
            table { width: 100%; border-collapse: collapse; font-size: 12px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background: #f7f7f7; }
            .metrics { display: flex; gap: 16px; margin: 16px 0; flex-wrap: wrap; }
            .metric { border: 1px solid #eee; padding: 8px 12px; border-radius: 8px; }
          </style>
        </head>
        <body>
          <h1>${eventName} Attendance Report</h1>
          <p class="muted">Generated on ${new Date().toLocaleString()}</p>
          <div class="metrics">
            <div class="metric">Total: ${analytics.totalAttendees}</div>
            <div class="metric">Unique: ${analytics.uniqueAttendeeCount}</div>
            <div class="metric">Members: ${analytics.memberCount}</div>
            <div class="metric">Guests: ${analytics.guestCount}</div>
            <div class="metric">Attendance Rate: ${analytics.attendanceRate.toFixed(1)}%</div>
          </div>
          <h2>Attendee Details</h2>
          <table>
            <thead>
              <tr><th>Name</th><th>Email</th><th>Phone</th><th>Type</th><th>Club</th><th>Checked In</th></tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  }

  static async getClubAnalytics(
    clubId: string,
    options?: { from?: Date; to?: Date }
  ): Promise<ClubAnalyticsSummary> {
    const eventsSnapshot = await getDocs(query(collection(db, 'events'), where('clubId', '==', clubId)));
    const allEvents = eventsSnapshot.docs.map((item) => ({ id: item.id, ...item.data() })) as Array<Record<string, unknown>>;

    const events = allEvents.filter((event) => {
      const eventDate = new Date(String(event.date || ''));
      if (Number.isNaN(eventDate.getTime())) return true;
      if (options?.from && eventDate < options.from) return false;
      if (options?.to && eventDate > options.to) return false;
      return true;
    });
    const eventMap = new Map(events.map((event) => [String(event.id), event]));
    const eventIds = new Set(events.map((event) => String(event.id)));

    const attendanceSnapshot = await getDocs(query(collection(db, 'attendance'), where('clubId', '==', clubId)));
    const allAttendance = attendanceSnapshot.docs.map((item) => ({ id: item.id, ...item.data() })) as Array<Record<string, unknown>>;
    const attendance = allAttendance.filter((record) => {
      const eventId = String(record.eventId || '');
      if (!eventIds.has(eventId)) return false;
      const checkedInAt = record.checkedInAt instanceof Timestamp
        ? record.checkedInAt.toDate()
        : new Date(String(record.checkedInAt || ''));
      if (Number.isNaN(checkedInAt.getTime())) return true;
      if (options?.from && checkedInAt < options.from) return false;
      if (options?.to && checkedInAt > options.to) return false;
      return true;
    });

    const dayMap = new Map<string, number>();
    const eventStats = new Map<string, { total: number; members: number; guests: number; unique: Set<string> }>();
    const uniqueGlobal = new Set<string>();
    let memberCount = 0;
    let guestCount = 0;
    let returningGuestCount = 0;

    attendance.forEach((record) => {
      const eventId = String(record.eventId || '');
      const type = String(record.type || '');
      const personId = String(record.personId || '');
      const checkedInAt = record.checkedInAt instanceof Timestamp
        ? record.checkedInAt.toDate()
        : new Date(String(record.checkedInAt || ''));
      if (!Number.isNaN(checkedInAt.getTime())) {
        const key = checkedInAt.toISOString().slice(0, 10);
        dayMap.set(key, (dayMap.get(key) || 0) + 1);
      }

      if (!eventStats.has(eventId)) {
        eventStats.set(eventId, { total: 0, members: 0, guests: 0, unique: new Set<string>() });
      }
      const row = eventStats.get(eventId)!;
      row.total += 1;
      row.unique.add(`${type}:${personId}`);

      if (type === 'member') {
        row.members += 1;
        memberCount += 1;
      } else if (type === 'guest') {
        row.guests += 1;
        guestCount += 1;
      }
      if (record.isReturningGuest) {
        returningGuestCount += 1;
      }

      uniqueGlobal.add(`${type}:${personId}`);
    });

    const eventRows: ClubEventAnalyticsRow[] = Array.from(eventMap.values())
      .map((event) => {
        const eventId = String(event.id);
        const stats = eventStats.get(eventId) || { total: 0, members: 0, guests: 0, unique: new Set<string>() };
        const expectedAttendance = Number(event.expectedAttendance || 0);
        const attendanceRate = expectedAttendance > 0 ? Math.min(100, (stats.unique.size / expectedAttendance) * 100) : 0;
        return {
          eventId,
          eventName: String(event.name || 'Unnamed Event'),
          eventDate: String(event.date || ''),
          totalAttendees: stats.total,
          uniqueAttendees: stats.unique.size,
          memberCount: stats.members,
          guestCount: stats.guests,
          attendanceRate,
        };
      })
      .sort((a, b) => (a.eventDate < b.eventDate ? 1 : -1));

    return {
      clubId,
      totalEvents: events.length,
      activeEvents: events.filter((event) => Boolean(event.isActive)).length,
      totalAttendance: attendance.length,
      uniqueAttendees: uniqueGlobal.size,
      memberCount,
      guestCount,
      returningGuestCount,
      avgAttendancePerEvent: events.length > 0 ? attendance.length / events.length : 0,
      attendanceByDay: Array.from(dayMap.entries())
        .map(([day, count]) => ({ day, count }))
        .sort((a, b) => (a.day > b.day ? 1 : -1)),
      eventRows,
    };
  }

  static exportClubAnalyticsAsCSV(clubName: string, analytics: ClubAnalyticsSummary): void {
    const header = [
      'Event Date',
      'Event Name',
      'Total Attendees',
      'Unique Attendees',
      'Members',
      'Guests',
      'Attendance Rate %',
    ];
    const rows = analytics.eventRows.map((row) => [
      row.eventDate,
      row.eventName,
      row.totalAttendees,
      row.uniqueAttendees,
      row.memberCount,
      row.guestCount,
      row.attendanceRate.toFixed(1),
    ]);
    const csv = [
      `Club,${clubName}`,
      `Total Events,${analytics.totalEvents}`,
      `Total Attendance,${analytics.totalAttendance}`,
      `Unique Attendees,${analytics.uniqueAttendees}`,
      `Members,${analytics.memberCount}`,
      `Guests,${analytics.guestCount}`,
      '',
      header.join(','),
      ...rows.map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(',')),
    ].join('\n');

    const link = document.createElement('a');
    link.href = `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`;
    link.download = `${clubName.replace(/\s+/g, '-')}-club-analytics-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
