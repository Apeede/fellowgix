import { db } from '@services/firebase/firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';

class ErrorLogService {
  async capture(input: {
    message: string;
    stack?: string;
    context?: string;
    adminId?: string;
    adminEmail?: string;
    clubId?: string;
  }): Promise<void> {
    try {
      await addDoc(collection(db, 'errorLogs'), {
        ...input,
        createdAt: serverTimestamp(),
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
      });
    } catch {
      // no-op to avoid recursive failures
    }
  }
}

export const errorLogService = new ErrorLogService();
