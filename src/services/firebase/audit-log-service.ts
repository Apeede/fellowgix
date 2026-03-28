import { db } from '@services/firebase/firebase';
import { addDoc, collection, limit, orderBy, query, serverTimestamp, where, getDocs } from 'firebase/firestore';

export type AuditAction =
  | 'ADMIN_CREATED'
  | 'ADMIN_INVITED'
  | 'ADMIN_ACTIVATED'
  | 'ADMIN_DEACTIVATED'
  | 'ADMIN_SOFT_DELETED'
  | 'ADMIN_RESTORED'
  | 'ADMIN_ROLE_CHANGED'
  | 'CLUB_SOFT_DELETED'
  | 'CLUB_RESTORED'
  | 'EVENT_CREATED'
  | 'EVENT_UPDATED'
  | 'EVENT_DELETED'
  | 'ATTENDANCE_CREATED'
  | 'ATTENDANCE_UPDATED'
  | 'ATTENDANCE_DELETED'
  | 'MEMBER_CREATED'
  | 'MEMBER_UPDATED'
  | 'MEMBER_DEACTIVATED';

interface AuditInput {
  action: AuditAction;
  actorId: string;
  actorEmail: string;
  actorRole: string;
  actorClubId: string;
  targetType: string;
  targetId: string;
  targetClubId?: string;
  details?: Record<string, unknown>;
}

class AuditLogService {
  async log(input: AuditInput): Promise<void> {
    await addDoc(collection(db, 'auditLogs'), {
      ...input,
      createdAt: serverTimestamp(),
    });
  }

  async listByClub(clubId: string): Promise<Record<string, unknown>[]> {
    const snapshot = await getDocs(
      query(collection(db, 'auditLogs'), where('targetClubId', '==', clubId), orderBy('createdAt', 'desc'), limit(150))
    );
    return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
  }
}

export const auditLogService = new AuditLogService();
