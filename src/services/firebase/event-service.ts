import { qrCodeGeneratorService } from '@services/qrcode/qrcode-generator';
import { CreateEventInput, Event, EventStats, UpdateEventInput } from '@types/event';
import {
    collection,
    doc,
    getDoc,
    getDocs,
    query,
    setDoc,
    Timestamp,
    updateDoc,
    where
} from 'firebase/firestore';
import { db } from './firebase';
import { firestoreTimestampToDate } from './firestore-utils';

class EventService {
  private collectionName = 'events';

  /**
   * Create a new event with auto-generated QR code
   */
  async createEvent(input: CreateEventInput, adminId: string, clubId: string, clubName?: string): Promise<Event> {
    try {
      // Generate unique event ID and QR code
      const eventId = qrCodeGeneratorService.generateEventId();
      const qrCodeDataUrl = await qrCodeGeneratorService.generateEventQRCode(eventId);

      // Create event document
      const eventData = {
        name: input.name,
        date: input.date,
        time: input.time || '',
        theme: input.theme,
        speaker: input.speaker,
        location: input.location || '',
        description: input.description || '',
        qrCode: qrCodeDataUrl,
        qrCodeUrl: '', // Can be set later when uploaded to storage
        createdBy: adminId,
        clubId,
        clubName: clubName || '',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        isActive: true,
        expectedAttendance: 0,
      };

      // Use setDoc with the custom eventId as the document ID
      await setDoc(doc(db, this.collectionName, eventId), eventData);

      return {
        ...eventData,
        id: eventId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    } catch (error) {
      throw new Error(`Failed to create event: ${(error instanceof Error ? error.message : String(error))}`);
    }
  }

  /**
   * Get all events for an admin
   */
  async getEventsByAdmin(adminId: string, includeInactive = false, clubId?: string): Promise<Event[]> {
    try {
      // Fetch club-bound events plus legacy createdBy events, then merge/filter client-side.
      const queries = [
        clubId
          ? query(collection(db, this.collectionName), where('clubId', '==', clubId))
          : query(collection(db, this.collectionName), where('createdBy', '==', adminId)),
      ];

      if (clubId) {
        queries.push(query(collection(db, this.collectionName), where('createdBy', '==', adminId)));
      }

      const snapshots = await Promise.all(queries.map((q) => getDocs(q)));
      const merged = new Map<string, Event>();

      snapshots.forEach((snapshot) => {
        snapshot.docs.forEach((doc) => {
          const data = doc.data();
          const event = {
            ...data,
            id: doc.id,
            createdAt: firestoreTimestampToDate(data.createdAt),
            updatedAt: firestoreTimestampToDate(data.updatedAt),
          } as Event;
          merged.set(event.id, event);
        });
      });

      return Array.from(merged.values())
        .filter((event) => (includeInactive ? true : event.isActive))
        .sort((a, b) => (a.date < b.date ? 1 : -1));
    } catch (error) {
      throw new Error(`Failed to fetch events: ${(error instanceof Error ? error.message : String(error))}`);
    }
  }

  /**
   * Get upcoming events for an admin
   */
  async getUpcomingEvents(adminId: string, clubId?: string): Promise<Event[]> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const allEvents = await this.getEventsByAdmin(adminId, false, clubId);
      return allEvents
        .filter((event) => event.isActive && event.date >= today)
        .sort((a, b) => (a.date > b.date ? 1 : -1));
    } catch (error) {
      throw new Error(`Failed to fetch upcoming events: ${(error instanceof Error ? error.message : String(error))}`);
    }
  }

  /**
   * Get a single event by ID
   */
  async getEventById(eventId: string): Promise<Event | null> {
    try {
      const docRef = doc(db, this.collectionName, eventId);
      const docSnapshot = await getDoc(docRef);

      if (!docSnapshot.exists()) {
        return null;
      }

      const data = docSnapshot.data();
      return {
        ...data,
        id: docSnapshot.id,
        createdAt: firestoreTimestampToDate(data.createdAt),
        updatedAt: firestoreTimestampToDate(data.updatedAt),
      } as Event;
    } catch (error) {
      throw new Error(`Failed to fetch event: ${(error instanceof Error ? error.message : String(error))}`);
    }
  }

  /**
   * Update an event
   */
  async updateEvent(eventId: string, input: UpdateEventInput): Promise<void> {
    try {
      const docRef = doc(db, this.collectionName, eventId);
      const updateData: Record<string, unknown> = { ...input, updatedAt: Timestamp.now() };

      // If date changed, regenerate QR code
      if (input.date) {
        const event = await this.getEventById(eventId);
        if (event) {
          const newQRCode = await qrCodeGeneratorService.generateEventQRCode(eventId);
          updateData.qrCode = newQRCode;
        }
      }

      await updateDoc(docRef, updateData);
    } catch (error) {
      throw new Error(`Failed to update event: ${(error instanceof Error ? error.message : String(error))}`);
    }
  }

  /**
   * Delete an event (soft delete by marking inactive)
   */
  async deleteEvent(eventId: string): Promise<void> {
    try {
      const docRef = doc(db, this.collectionName, eventId);
      await updateDoc(docRef, {
        isActive: false,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      throw new Error(`Failed to delete event: ${(error instanceof Error ? error.message : String(error))}`);
    }
  }

  /**
   * Get event statistics for admin dashboard
   */
  async getEventStats(adminId: string, clubId?: string): Promise<EventStats> {
    try {
      // Get all events for this admin
      const allEvents = await getDocs(
        query(
          collection(db, this.collectionName),
          clubId ? where('clubId', '==', clubId) : where('createdBy', '==', adminId)
        )
      );

      const activeEvents = allEvents.docs.filter((doc) => doc.data().isActive);
      const today = new Date().toISOString().split('T')[0];
      const upcoming = activeEvents.filter((doc) => doc.data().date >= today);

      // Get total attendance across all events for this admin
      const eventIds = allEvents.docs.map((doc) => doc.id);
      let totalAttendance = 0;

      if (eventIds.length > 0) {
        const attendanceQuery = query(
          collection(db, 'attendance'),
          where('eventId', 'in', eventIds)
        );
        const attendanceSnapshot = await getDocs(attendanceQuery);
        totalAttendance = attendanceSnapshot.size;
      }

      return {
        totalEvents: allEvents.docs.length,
        activeEvents: activeEvents.length,
        upcomingEvents: upcoming.length,
        totalAttendance,
      };
    } catch (error) {
      throw new Error(`Failed to fetch event stats: ${(error instanceof Error ? error.message : String(error))}`);
    }
  }

  /**
   * Regenerate QR code for an event
   */
  async regenerateQRCode(eventId: string): Promise<string> {
    try {
      const newQRCode = await qrCodeGeneratorService.generateEventQRCode(eventId);
      const docRef = doc(db, this.collectionName, eventId);
      await updateDoc(docRef, {
        qrCode: newQRCode,
        updatedAt: Timestamp.now(),
      });
      return newQRCode;
    } catch (error) {
      throw new Error(`Failed to regenerate QR code: ${(error instanceof Error ? error.message : String(error))}`);
    }
  }
}

export const eventService = new EventService();
