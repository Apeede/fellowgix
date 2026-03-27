import { Timestamp } from 'firebase/firestore';

/**
 * Convert Firestore Timestamp to JavaScript Date
 * Safe utility that handles null/undefined timestamps
 */
export const firestoreTimestampToDate = (timestamp: unknown): Date => {
  if (!timestamp) return new Date();
  if (timestamp instanceof Timestamp) return timestamp.toDate();
  if (timestamp instanceof Date) return timestamp;
  return new Date();
};

/**
 * Convert JavaScript Date to Firestore Timestamp
 */
export const dateToFirestoreTimestamp = (date: Date): Timestamp => {
  return Timestamp.fromDate(date);
};

/**
 * Get a date from N minutes ago as Firestore Timestamp
 */
export const getTimestampMinutesAgo = (minutes: number): Timestamp => {
  const date = new Date(Date.now() - minutes * 60 * 1000);
  return Timestamp.fromDate(date);
};

/**
 * Convert Firestore document data, converting all Timestamp fields to Date
 */
export const convertFirestoreDoc = <T extends Record<string, unknown>>(doc: Record<string, unknown>): T => {
  if (!doc) return doc as T;

  const converted = { ...doc };

  // Recursively convert Timestamp fields
  Object.keys(converted).forEach((key) => {
    if (converted[key] instanceof Timestamp) {
      converted[key] = (converted[key] as Timestamp).toDate();
    } else if (key.toLowerCase().includes('date') || key.toLowerCase().includes('at')) {
      // Handle cases where field name indicates it's a date
      converted[key] = firestoreTimestampToDate(converted[key]);
    }
  });

  return converted as T;
};

/**
 * Add ID field to converted Firestore document
 */
export const convertDocWithId = <T extends Record<string, unknown>>(doc: Record<string, unknown>, id: string): T & { id: string } => {
  return {
    ...convertFirestoreDoc<T>(doc),
    id,
  };
};
