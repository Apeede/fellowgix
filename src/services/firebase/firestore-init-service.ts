import { collection, doc, getDocs, writeBatch } from 'firebase/firestore';
import { db } from './firebase';

/**
 * Firestore Database Schema Definition
 * 
 * This service provides database initialization and management utilities
 * for the Rotaract Attendance System
 */

export interface FirestoreCollectionSchema {
  name: string;
  description: string;
  example: Record<string, unknown>;
}

// Define the schema for each collection
const FIRESTORE_SCHEMA: Record<string, FirestoreCollectionSchema> = {
  admins: {
    name: 'admins',
    description: 'Admin users who can manage events and members',
    example: {
      id: 'uid_of_admin',
      email: 'admin@example.com',
      name: 'Admin Name',
      clubId: 'rotaract-club-name',
      clubName: 'Rotaract Club Name',
      role: 'super_admin', // super_admin or admin
      createdAt: new Date(),
      lastLogin: new Date(),
      isActive: true,
    },
  },
  members: {
    name: 'members',
    description: 'Rotaract members who can check in to events',
    example: {
      name: 'John Doe',
      email: 'john@example.com',
      phone: '1234567890',
      memberId: 'R12345',
      club: 'Rotaract Club Name',
      joinDate: new Date(),
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  },
  events: {
    name: 'events',
    description: 'Rotaract events with attendance tracking',
    example: {
      title: 'Monthly Meeting',
      description: 'Event description',
      date: new Date(),
      location: 'Event location',
      qrCode: 'qr_code_data_url',
      status: 'active', // upcoming, active, completed
      maxAttendees: 100,
      createdBy: 'admin_uid',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  },
  attendance: {
    name: 'attendance',
    description: 'Records of members attending events',
    example: {
      eventId: 'event_document_id',
      memberId: 'member_document_id',
      memberEmail: 'john@example.com',
      memberName: 'John Doe',
      checkInTime: new Date(),
      checkInType: 'member', // member or guest
      ipAddress: '192.168.1.1',
      createdAt: new Date(),
    },
  },
  guests: {
    name: 'guests',
    description: 'Guest attendees who are not members',
    example: {
      eventId: 'event_document_id',
      name: 'Guest Name',
      email: 'guest@example.com',
      phone: '9876543210',
      guestType: 'rotarian', // rotarian, rotaractor, non_rotaractor
      checkInTime: new Date(),
      isReturning: false,
      visitCount: 1,
      createdAt: new Date(),
    },
  },
};

class FirestoreInitService {
  /**
   * Get all collection schemas
   */
  static getSchemas(): Record<string, FirestoreCollectionSchema> {
    return FIRESTORE_SCHEMA;
  }

  /**
   * Get a specific collection schema
   */
  static getSchema(collectionName: string): FirestoreCollectionSchema | undefined {
    return FIRESTORE_SCHEMA[collectionName];
  }

  /**
   * Check if a collection exists (has documents)
   */
  static async collectionExists(collectionName: string): Promise<boolean> {
    try {
      const snapshot = await getDocs(collection(db, collectionName));
      return snapshot.size > 0;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get collection document count
   */
  static async getCollectionDocCount(collectionName: string): Promise<number> {
    try {
      const snapshot = await getDocs(collection(db, collectionName));
      return snapshot.size;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Initialize database with sample data (for testing)
   * Use with caution - only in development environments
   */
  static async initializeSampleData(): Promise<{
    success: boolean;
    message: string;
    collections: Record<string, number>;
  }> {
    try {
      const results: Record<string, number> = {};
      const batch = writeBatch(db);

      // Initialize admins collection with a default admin if empty
      const adminCount = await this.getCollectionDocCount('admins');
      if (adminCount === 0) {
        const adminRef = doc(collection(db, 'admins'));
        batch.set(adminRef, {
          email: 'admin@rotaract.local',
          name: 'Default Admin',
          clubId: 'default-club',
          clubName: 'Default Club',
          role: 'super_admin',
          createdAt: new Date(),
          isActive: true,
        });
        results['admins'] = 1;
      } else {
        results['admins'] = adminCount;
      }

      // Check other collections
      for (const [collName] of Object.entries(FIRESTORE_SCHEMA)) {
        if (collName === 'admins') continue;
        const count = await this.getCollectionDocCount(collName);
        results[collName] = count;
      }

      await batch.commit();

      return {
        success: true,
        message: 'Database initialized successfully',
        collections: results,
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to initialize database: ${(error instanceof Error ? error.message : String(error))}`,
        collections: {},
      };
    }
  }

  /**
   * Get database statistics
   */
  static async getDatabaseStats(): Promise<{
    timestamp: Date;
    collections: {
      name: string;
      documentCount: number;
      description: string;
    }[];
    totalDocuments: number;
  }> {
    const stats = [];
    let totalDocuments = 0;

    for (const [colleName, schema] of Object.entries(FIRESTORE_SCHEMA)) {
      const count = await this.getCollectionDocCount(colleName);
      stats.push({
        name: colleName,
        documentCount: count,
        description: schema.description,
      });
      totalDocuments += count;
    }

    return {
      timestamp: new Date(),
      collections: stats,
      totalDocuments,
    };
  }

  /**
   * Seed a collection with sample data
   */
  static async seedCollection(
    collectionName: string,
    documents: Record<string, unknown>[]
  ): Promise<{
    success: boolean;
    message: string;
    count: number;
  }> {
    try {
      const batch = writeBatch(db);
      const collectionRef = collection(db, collectionName);

      for (const doc of documents) {
        const docRef = doc(collectionRef);
        batch.set(docRef, {
          ...doc,
          createdAt: doc.createdAt || new Date(),
          updatedAt: doc.updatedAt || new Date(),
        });
      }

      await batch.commit();

      return {
        success: true,
        message: `Successfully seeded ${documents.length} documents to ${collectionName}`,
        count: documents.length,
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to seed collection: ${(error instanceof Error ? error.message : String(error))}`,
        count: 0,
      };
    }
  }
}

export default FirestoreInitService;
