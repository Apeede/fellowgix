import { useAuth } from '@context/useAuth';
import { ClubType } from '@types/club';
import { Admin, authService } from '@services/firebase/auth-service';
import { clubService } from '@services/firebase/club-service';
import {
  addDoc,
  collection,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { ArrowLeft, History, Loader, Mail, RotateCcw, Search, ShieldCheck, Trash2, UserCog } from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { db } from '../services/firebase/firebase';

interface ClubSummary {
  clubId: string;
  clubName: string;
  clubType: ClubType;
  clubCode?: string;
  adminCount: number;
  eventCount: number;
  memberCount: number;
  guestCount: number;
  attendanceCount: number;
}

interface ArchivedClubSummary {
  deleteGroupId: string;
  clubId: string;
  clubName: string;
  deletedAtLabel: string;
  deletedByEmail: string;
  totalRecords: number;
}

interface ArchivedAdminSummary {
  adminId: string;
  name: string;
  email: string;
  clubId: string;
  clubName: string;
  deletedAtLabel: string;
  deletedByEmail: string;
}

interface SystemStats {
  clubs: number;
  admins: number;
  activeAdmins: number;
  events: number;
  members: number;
  guests: number;
  attendance: number;
}

interface AuditLogEntry {
  id: string;
  action: string;
  targetType: string;
  targetId: string;
  actorEmail: string;
  createdAt?: Timestamp;
  details?: Record<string, unknown>;
}

interface TrashRecord {
  id: string;
  sourceCollection: string;
  sourceId: string;
  clubId?: string;
  clubName?: string;
  deleteGroupId: string;
  deleteGroupLabel?: string;
  deletedByEmail?: string;
  deletedAt?: Timestamp;
  payload: Record<string, unknown>;
}

type AdminRole = 'super_admin' | 'club_admin' | 'event_manager' | 'viewer';

const CLUB_COLLECTIONS = [
  'clubs',
  'events',
  'members',
  'memberPublicDirectory',
  'guests',
  'attendance',
  // Keep admins last so authorization remains valid throughout the archive.
  'admins',
] as const;

type ClubCollection = (typeof CLUB_COLLECTIONS)[number];

const tsLabel = (value?: Timestamp): string => {
  if (!value) return 'Unknown time';
  return value.toDate().toLocaleString();
};
const maybeToDate = (value: unknown): Date | undefined => {
  if (!value) return undefined;
  if (value instanceof Timestamp) return value.toDate();
  if (value instanceof Date) return value;
  const parsed = new Date(String(value));
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
};

const trashDocId = (collectionName: string, docId: string): string =>
  `${collectionName}__${docId}`.replace(/\//g, '__');

const searchableText = (value: unknown): string => String(value ?? '').toLowerCase();

const SuperAdminPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentAdmin } = useAuth();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [clubs, setClubs] = useState<ClubSummary[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [archivedClubs, setArchivedClubs] = useState<ArchivedClubSummary[]>([]);
  const [archivedAdmins, setArchivedAdmins] = useState<ArchivedAdminSummary[]>([]);
  const [stats, setStats] = useState<SystemStats>({
    clubs: 0,
    admins: 0,
    activeAdmins: 0,
    events: 0,
    members: 0,
    guests: 0,
    attendance: 0,
  });

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    clubId: '',
    clubName: '',
    clubType: 'rotaract' as ClubType,
    clubCode: '',
    role: 'club_admin' as AdminRole,
    sendInviteEmail: true,
  });
  const [adminSearch, setAdminSearch] = useState('');
  const [clubSearch, setClubSearch] = useState('');
  const [deletingClubId, setDeletingClubId] = useState<string | null>(null);
  const [adminRoleFilter, setAdminRoleFilter] = useState<'all' | AdminRole>('all');
  const [adminStatusFilter, setAdminStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [adminPage, setAdminPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const writeAuditLog = useCallback(
    async (action: string, targetType: string, targetId: string, details?: Record<string, unknown>) => {
      if (!currentAdmin) return;
      try {
        await addDoc(collection(db, 'auditLogs'), {
          action,
          targetType,
          targetId,
          actorId: currentAdmin.id,
          actorEmail: currentAdmin.email,
          actorClubId: currentAdmin.clubId,
          createdAt: serverTimestamp(),
          details: details || {},
        });
      } catch {
        // Keep admin flows resilient even if logging fails.
      }
    },
    [currentAdmin]
  );

  const loadSystemData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [clubsSnap, adminsSnap, eventsSnap, membersSnap, guestsSnap, attendanceSnap, auditLogsSnap, trashSnap] =
        await Promise.all([
          getDocs(collection(db, 'clubs')),
          getDocs(query(collection(db, 'admins'), orderBy('createdAt', 'desc'))),
          getDocs(collection(db, 'events')),
          getDocs(collection(db, 'members')),
          getDocs(collection(db, 'guests')),
          getDocs(collection(db, 'attendance')),
          getDocs(query(collection(db, 'auditLogs'), orderBy('createdAt', 'desc'), limit(60))),
          getDocs(query(collection(db, 'trash'), orderBy('deletedAt', 'desc'), limit(1200))),
        ]);

      const allAdmins = adminsSnap.docs.map((d) => {
        const data = d.data() as Record<string, unknown>;
        return {
          id: d.id,
          ...data,
          role: (data.role === 'admin' ? 'club_admin' : data.role) as AdminRole,
          createdAt: maybeToDate(data.createdAt) || new Date(),
          lastLogin: maybeToDate(data.lastLogin),
          invitedAt: maybeToDate(data.invitedAt),
        } as Admin;
      });
      setAdmins(allAdmins);

      const clubMap = new Map<string, ClubSummary>();
      const ensureClub = (clubId: string, clubName?: string, clubType: ClubType = 'rotaract', clubCode?: string) => {
        const id = (clubId || '').trim();
        if (!id) return null;
        if (!clubMap.has(id)) {
          clubMap.set(id, {
            clubId: id,
            clubName: (clubName || id).trim() || id,
            clubType,
            clubCode: clubCode?.trim() || undefined,
            adminCount: 0,
            eventCount: 0,
            memberCount: 0,
            guestCount: 0,
            attendanceCount: 0,
          });
        }
        return clubMap.get(id)!;
      };

      clubsSnap.docs.forEach((d) => {
        const data = d.data() as Record<string, unknown>;
        ensureClub(
          String(data.clubId || d.id),
          String(data.clubName || d.id),
          data.clubType === 'rotary' ? 'rotary' : 'rotaract',
          String(data.clubCode || '')
        );
      });

      allAdmins.forEach((admin) => {
        const row = ensureClub(admin.clubId, admin.clubName, admin.clubType || 'rotaract', admin.clubCode);
        if (row) row.adminCount += 1;
      });

      eventsSnap.docs.forEach((d) => {
        const data = d.data() as Record<string, unknown>;
        const row = ensureClub(
          String(data.clubId || ''),
          String(data.clubName || ''),
          data.clubType === 'rotary' ? 'rotary' : 'rotaract',
          String(data.clubCode || '')
        );
        if (row) row.eventCount += 1;
      });

      membersSnap.docs.forEach((d) => {
        const data = d.data() as Record<string, unknown>;
        const row = ensureClub(
          String(data.clubId || ''),
          String(data.clubName || data.club || ''),
          data.clubType === 'rotary' ? 'rotary' : 'rotaract',
          String(data.clubCode || '')
        );
        if (row) row.memberCount += 1;
      });

      guestsSnap.docs.forEach((d) => {
        const data = d.data() as Record<string, unknown>;
        const row = ensureClub(
          String(data.clubId || ''),
          String(data.clubName || ''),
          data.clubType === 'rotary' ? 'rotary' : 'rotaract',
          String(data.clubCode || '')
        );
        if (row) row.guestCount += 1;
      });

      attendanceSnap.docs.forEach((d) => {
        const data = d.data() as Record<string, unknown>;
        const row = ensureClub(String(data.clubId || ''), '');
        if (row) row.attendanceCount += 1;
      });

      const clubRows = Array.from(clubMap.values()).sort((a, b) => a.clubName.localeCompare(b.clubName));
      setClubs(clubRows);

      setStats({
        clubs: clubsSnap.size || clubRows.length,
        admins: allAdmins.length,
        activeAdmins: allAdmins.filter((a) => a.isActive).length,
        events: eventsSnap.size,
        members: membersSnap.size,
        guests: guestsSnap.size,
        attendance: attendanceSnap.size,
      });

      const logs = auditLogsSnap.docs.map((d) => ({ id: d.id, ...d.data() })) as AuditLogEntry[];
      setAuditLogs(logs);

      const trashRows = trashSnap.docs.map((d) => ({ id: d.id, ...d.data() })) as TrashRecord[];

      const clubTrashMap = new Map<string, ArchivedClubSummary>();
      const adminTrashRows: ArchivedAdminSummary[] = [];

      trashRows.forEach((row) => {
        if (row.deleteGroupId.startsWith('club:')) {
          const key = row.deleteGroupId;
          const existing = clubTrashMap.get(key);
          if (!existing) {
            clubTrashMap.set(key, {
              deleteGroupId: key,
              clubId: row.clubId || key.replace('club:', ''),
              clubName: row.deleteGroupLabel || row.clubName || row.clubId || 'Unknown Club',
              deletedAtLabel: tsLabel(row.deletedAt),
              deletedByEmail: row.deletedByEmail || 'Unknown',
              totalRecords: 1,
            });
          } else {
            existing.totalRecords += 1;
          }
        }

        if (row.sourceCollection === 'admins' && row.deleteGroupId.startsWith('admin:')) {
          adminTrashRows.push({
            adminId: row.sourceId,
            name: String(row.payload.name || 'Unknown'),
            email: String(row.payload.email || 'Unknown'),
            clubId: String(row.payload.clubId || ''),
            clubName: String(row.payload.clubName || row.payload.club || ''),
            deletedAtLabel: tsLabel(row.deletedAt),
            deletedByEmail: row.deletedByEmail || 'Unknown',
          });
        }
      });

      setArchivedClubs(
        Array.from(clubTrashMap.values()).sort((a, b) => a.clubName.localeCompare(b.clubName))
      );
      setArchivedAdmins(adminTrashRows);
    } catch {
      toast.error('Failed to load super admin data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (currentAdmin?.role === 'super_admin') {
      loadSystemData();
    }
  }, [currentAdmin?.role, loadSystemData]);

  const requireTypedConfirmation = (message: string, expectedText: string): boolean => {
    const typed = window.prompt(`${message}\n\nType exactly: ${expectedText}`);
    if (typed !== expectedText) {
      toast.error('Confirmation text did not match. Action cancelled.');
      return false;
    }
    return true;
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.clubName) {
      toast.error('Please fill all fields');
      return;
    }
    const generatedPassword = `${Math.random().toString(36).slice(2, 10)}A1!`;
    const effectivePassword = form.password || generatedPassword;
    if (effectivePassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setIsSubmitting(true);
    try {
      const normalizedEmail = form.email.trim().toLowerCase();
      const existingAdmin = admins.find(
        (admin) => searchableText(admin.email) === normalizedEmail
      );
      if (existingAdmin) {
        throw new Error(`An active admin account already exists for ${normalizedEmail}.`);
      }

      // Club archives and individual admin archives use different group IDs. Looking up the
      // archived payload by email catches both cases while the Firebase Auth account still exists.
      const archivedEmailSnapshot = await getDocs(
        query(collection(db, 'trash'), where('payload.email', '==', normalizedEmail), limit(20))
      );
      const archivedAdminDoc = archivedEmailSnapshot.docs.find(
        (row) => String(row.data().sourceCollection || '') === 'admins'
      );
      const archivedAdmin = archivedAdminDoc
        ? {
            adminId: String(archivedAdminDoc.data().sourceId || ''),
            email: normalizedEmail,
          }
        : undefined;
      let newAdmin: Admin;
      let auditAction = 'ADMIN_CREATED';

      if (archivedAdmin) {
        const club = await clubService.ensureClub({
          clubId: form.clubId || undefined,
          clubName: form.clubName.trim(),
          clubType: form.clubType,
          clubCode: form.clubCode.trim() || undefined,
        });
        const activeClubAdmins = admins.filter(
          (admin) => admin.clubId === club.clubId && admin.isActive
        ).length;
        if (activeClubAdmins >= 3) {
          throw new Error('This club already has the maximum of 3 admins. Deactivate one before adding another.');
        }

        if (!archivedAdmin.adminId || !archivedAdminDoc) {
          throw new Error('The archived account could not be found. Refresh and try again.');
        }

        const restoredAt = new Date();
        newAdmin = {
          id: archivedAdmin.adminId,
          name: form.name.trim(),
          email: normalizedEmail,
          clubId: club.clubId,
          clubName: club.clubName,
          clubType: club.clubType,
          clubCode: club.clubCode,
          role: form.role,
          createdAt: restoredAt,
          isActive: true,
          inviteStatus: form.sendInviteEmail ? 'pending' : 'accepted',
          invitedAt: form.sendInviteEmail ? restoredAt : undefined,
        };

        const batch = writeBatch(db);
        batch.set(doc(db, 'admins', newAdmin.id), {
          ...newAdmin,
          createdAt: Timestamp.now(),
          invitedAt: form.sendInviteEmail ? Timestamp.now() : null,
        });
        batch.delete(archivedAdminDoc.ref);
        await batch.commit();

        if (form.sendInviteEmail) {
          await authService.sendAdminPasswordReset(normalizedEmail);
        }
        auditAction = 'ADMIN_RESTORED_AND_REASSIGNED';
      } else {
        newAdmin = await authService.createAdminBySuperAdmin({
          name: form.name.trim(),
          email: normalizedEmail,
          password: effectivePassword,
          clubId: form.clubId || undefined,
          clubName: form.clubName.trim(),
          clubType: form.clubType,
          clubCode: form.clubCode.trim() || undefined,
          role: form.role,
          sendInviteEmail: form.sendInviteEmail,
        });
      }

      await writeAuditLog(auditAction, 'admin', newAdmin.id, {
        email: newAdmin.email,
        role: newAdmin.role,
        clubId: newAdmin.clubId,
        clubName: newAdmin.clubName,
        clubType: newAdmin.clubType || 'rotaract',
        clubCode: newAdmin.clubCode || null,
        inviteStatus: newAdmin.inviteStatus || 'accepted',
      });
      toast.success(archivedAdmin ? 'Archived admin restored and assigned successfully' : 'Admin created successfully');
      setForm({
        name: '',
        email: '',
        password: '',
        clubId: '',
        clubName: '',
        clubType: 'rotaract',
        clubCode: '',
        role: 'club_admin',
        sendInviteEmail: true,
      });
      await loadSystemData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create admin');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleAdmin = async (admin: Admin, targetActive: boolean) => {
    const activeSuperAdmins = admins.filter((item) => item.role === 'super_admin' && item.isActive).length;

    if (admin.id === currentAdmin?.id && !targetActive) {
      toast.error('You cannot deactivate your own super admin account');
      return;
    }
    if (admin.role === 'super_admin' && !targetActive && activeSuperAdmins <= 1) {
      toast.error('Cannot deactivate the last active super admin');
      return;
    }

    if (!targetActive) {
      const confirmed = requireTypedConfirmation(
        `Deactivate admin ${admin.email}? They will not be able to sign in.`,
        `DEACTIVATE ${admin.email}`
      );
      if (!confirmed) return;
    }

    try {
      await updateDoc(doc(db, 'admins', admin.id), { isActive: targetActive });
      await writeAuditLog(targetActive ? 'ADMIN_ACTIVATED' : 'ADMIN_DEACTIVATED', 'admin', admin.id, {
        email: admin.email,
      });
      toast.success(`Admin ${targetActive ? 'activated' : 'deactivated'}`);
      await loadSystemData();
    } catch {
      toast.error('Failed to update admin status');
    }
  };

  const handleChangeRole = async (admin: Admin, role: AdminRole) => {
    if (admin.role === role) return;
    if (admin.id === currentAdmin?.id && role !== 'super_admin') {
      toast.error('You cannot downgrade your own super admin account');
      return;
    }

    const activeSuperAdmins = admins.filter((item) => item.role === 'super_admin' && item.isActive).length;
    if (admin.role === 'super_admin' && role !== 'super_admin' && activeSuperAdmins <= 1) {
      toast.error('Cannot remove role from the last active super admin');
      return;
    }

    const confirmed = requireTypedConfirmation(
      `Change role for ${admin.email} from ${admin.role} to ${role}?`,
      `ROLE ${admin.email} ${role}`
    );
    if (!confirmed) return;

    try {
      await updateDoc(doc(db, 'admins', admin.id), { role });
      await writeAuditLog('ADMIN_ROLE_CHANGED', 'admin', admin.id, {
        email: admin.email,
        previousRole: admin.role,
        nextRole: role,
      });
      toast.success('Admin role updated');
      await loadSystemData();
    } catch {
      toast.error('Failed to update admin role');
    }
  };

  const handleSendReset = async (admin: Admin) => {
    try {
      await authService.sendAdminPasswordReset(admin.email);
      await writeAuditLog('ADMIN_INVITED', 'admin', admin.id, {
        email: admin.email,
        action: 'password_reset_sent',
      });
      toast.success(`Password reset link sent to ${admin.email}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to send reset link');
    }
  };

  const archiveDoc = async (
    collectionName: ClubCollection,
    sourceId: string,
    sourceData: Record<string, unknown>,
    deleteGroupId: string,
    deleteGroupLabel: string,
    clubId: string,
    clubName: string
  ) => {
    const batch = writeBatch(db);
    const sourceRef = doc(db, collectionName, sourceId);
    const archiveRef = doc(db, 'trash', trashDocId(collectionName, sourceId));

    batch.set(archiveRef, {
      sourceCollection: collectionName,
      sourceId,
      clubId,
      clubName,
      deleteGroupId,
      deleteGroupLabel,
      payload: sourceData,
      deletedAt: serverTimestamp(),
      deletedById: currentAdmin?.id || 'unknown',
      deletedByEmail: currentAdmin?.email || 'unknown',
    });
    batch.delete(sourceRef);

    await batch.commit();
  };

  const handleDeleteAdmin = async (admin: Admin) => {
    const activeSuperAdmins = admins.filter((item) => item.role === 'super_admin' && item.isActive).length;

    if (admin.id === currentAdmin?.id) {
      toast.error('You cannot delete your own super admin account');
      return;
    }
    if (admin.role === 'super_admin' && activeSuperAdmins <= 1) {
      toast.error('Cannot delete the last active super admin');
      return;
    }

    const confirmed = requireTypedConfirmation(
      `Soft-delete admin ${admin.email}? This can be restored from Archive.`,
      `DELETE ADMIN ${admin.email}`
    );
    if (!confirmed) return;

    try {
      await archiveDoc(
        'admins',
        admin.id,
        admin as unknown as Record<string, unknown>,
        `admin:${admin.id}`,
        admin.email,
        admin.clubId,
        admin.clubName
      );
      await writeAuditLog('ADMIN_SOFT_DELETED', 'admin', admin.id, {
        email: admin.email,
        clubId: admin.clubId,
      });
      toast.success('Admin archived. You can restore from Archive section.');
      await loadSystemData();
    } catch {
      toast.error('Failed to delete admin');
    }
  };

  const archiveByClub = async (collectionName: ClubCollection, club: ClubSummary): Promise<number> => {
    let archivedCount = 0;

    for (;;) {
      const snap = await getDocs(
        query(collection(db, collectionName), where('clubId', '==', club.clubId), limit(200))
      );
      if (snap.empty) break;

      const batch = writeBatch(db);
      snap.docs.forEach((item) => {
        batch.set(doc(db, 'trash', trashDocId(collectionName, item.id)), {
          sourceCollection: collectionName,
          sourceId: item.id,
          clubId: club.clubId,
          clubName: club.clubName,
          deleteGroupId: `club:${club.clubId}`,
          deleteGroupLabel: club.clubName,
          payload: item.data(),
          deletedAt: serverTimestamp(),
          deletedById: currentAdmin?.id || 'unknown',
          deletedByEmail: currentAdmin?.email || 'unknown',
        });
        batch.delete(item.ref);
      });

      await batch.commit();
      archivedCount += snap.size;

      if (snap.size < 200) break;
    }

    return archivedCount;
  };

  const handleDeleteClub = async (club: ClubSummary) => {
    if (deletingClubId) return;

    if (club.clubId === currentAdmin?.clubId) {
      toast.error('You cannot archive your own club while signed in. Use another super admin account.');
      return;
    }

    const confirmed = requireTypedConfirmation(
      `Archive all data for ${club.clubName}? This removes club data from live views until restored.`,
      `DELETE CLUB ${club.clubId}`
    );
    if (!confirmed) return;

    setDeletingClubId(club.clubId);
    try {
      const archiveCounts: Record<string, number> = {};
      for (const collectionName of CLUB_COLLECTIONS) {
        archiveCounts[collectionName] = await archiveByClub(collectionName, club);
      }

      await writeAuditLog('CLUB_SOFT_DELETED', 'club', club.clubId, {
        clubName: club.clubName,
        counts: archiveCounts,
      });

      toast.success(
        `Club archived (club:${archiveCounts.clubs}, admins:${archiveCounts.admins}, events:${archiveCounts.events}, members:${archiveCounts.members}, guests:${archiveCounts.guests}, attendance:${archiveCounts.attendance})`
      );
      await loadSystemData();
    } catch (error) {
      toast.error(error instanceof Error ? `Failed to archive club: ${error.message}` : 'Failed to archive club data');
    } finally {
      setDeletingClubId(null);
    }
  };

  const restoreAdmin = async (adminId: string) => {
    try {
      const snap = await getDocs(query(collection(db, 'trash'), where('deleteGroupId', '==', `admin:${adminId}`)));
      if (snap.empty) {
        toast.error('No archived admin data found to restore.');
        return;
      }

      const batch = writeBatch(db);
      let restoredEmail = adminId;
      snap.docs.forEach((row) => {
        const data = row.data() as TrashRecord;
        if (data.sourceCollection === 'admins') {
          restoredEmail = String(data.payload.email || restoredEmail);
        }
        batch.set(doc(db, data.sourceCollection, data.sourceId), data.payload);
        batch.delete(row.ref);
      });
      await batch.commit();

      await writeAuditLog('ADMIN_RESTORED', 'admin', adminId, { email: restoredEmail });
      toast.success('Admin restored successfully.');
      await loadSystemData();
    } catch {
      toast.error('Failed to restore admin');
    }
  };

  const restoreClub = async (group: ArchivedClubSummary) => {
    const confirmed = requireTypedConfirmation(
      `Restore all archived data for ${group.clubName}?`,
      `RESTORE CLUB ${group.clubId}`
    );
    if (!confirmed) return;

    try {
      let totalRestored = 0;

      for (;;) {
        const snap = await getDocs(
          query(collection(db, 'trash'), where('deleteGroupId', '==', group.deleteGroupId), limit(200))
        );
        if (snap.empty) break;

        const batch = writeBatch(db);
        snap.docs.forEach((row) => {
          const data = row.data() as TrashRecord;
          batch.set(doc(db, data.sourceCollection, data.sourceId), data.payload);
          batch.delete(row.ref);
        });
        await batch.commit();

        totalRestored += snap.size;
        if (snap.size < 200) break;
      }

      await writeAuditLog('CLUB_RESTORED', 'club', group.clubId, {
        clubName: group.clubName,
        restoredRecords: totalRestored,
      });

      toast.success(`Restored ${totalRestored} records for ${group.clubName}.`);
      await loadSystemData();
    } catch {
      toast.error('Failed to restore club');
    }
  };

  const sortedAdmins = useMemo(
    () => [...admins].sort((a, b) => (a.name || '').localeCompare(b.name || '')),
    [admins]
  );
  const filteredAdmins = useMemo(() => {
    const term = adminSearch.trim().toLowerCase();
    return sortedAdmins.filter((admin) => {
      const rolePass = adminRoleFilter === 'all' || admin.role === adminRoleFilter;
      const statusPass =
        adminStatusFilter === 'all'
          ? true
          : adminStatusFilter === 'active'
            ? admin.isActive
            : !admin.isActive;
      const searchPass =
        term.length === 0 ||
        searchableText(admin.name).includes(term) ||
        searchableText(admin.email).includes(term) ||
        searchableText(admin.clubName).includes(term) ||
        searchableText(admin.clubId).includes(term) ||
        searchableText(admin.clubCode).includes(term) ||
        searchableText(admin.clubType).includes(term);
      return rolePass && statusPass && searchPass;
    });
  }, [sortedAdmins, adminSearch, adminRoleFilter, adminStatusFilter]);
  const filteredClubs = useMemo(() => {
    const term = clubSearch.trim().toLowerCase();
    if (!term) return clubs;

    return clubs.filter((club) =>
      [club.clubName, club.clubId, club.clubCode, club.clubType].some((value) =>
        searchableText(value).includes(term)
      )
    );
  }, [clubs, clubSearch]);
  const totalPages = Math.max(1, Math.ceil(filteredAdmins.length / pageSize));
  const pagedAdmins = useMemo(
    () => filteredAdmins.slice((adminPage - 1) * pageSize, adminPage * pageSize),
    [filteredAdmins, adminPage, pageSize]
  );

  useEffect(() => {
    setAdminPage(1);
  }, [adminSearch, adminRoleFilter, adminStatusFilter, pageSize]);

  useEffect(() => {
    if (adminPage > totalPages) {
      setAdminPage(totalPages);
    }
  }, [adminPage, totalPages]);

  if (!currentAdmin || currentAdmin.role !== 'super_admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="card max-w-lg text-center">
          <h1 className="text-xl font-bold text-gray-900 mb-2">Super Admin Only</h1>
          <p className="text-gray-600 mb-6">You do not have permission to access this page.</p>
          <button type="button" className="btn-primary" onClick={() => navigate('/dashboard')}>
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              aria-label="Go back"
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-gray-700" />
            </button>
            <ShieldCheck className="w-7 h-7 text-primary-700" />
            <h1 className="text-2xl font-bold text-gray-900">Super Admin Control Center</h1>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {isLoading ? (
          <div className="card text-center py-12">
            <Loader className="w-10 h-10 text-primary-600 animate-spin mx-auto mb-3" />
            <p className="text-gray-600">Loading full system data...</p>
          </div>
        ) : (
          <>
            <section className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
              <div className="card bg-blue-50"><p className="text-xs text-gray-600">Clubs</p><p className="text-2xl font-bold">{stats.clubs}</p></div>
              <div className="card bg-indigo-50"><p className="text-xs text-gray-600">Admins</p><p className="text-2xl font-bold">{stats.admins}</p></div>
              <div className="card bg-green-50"><p className="text-xs text-gray-600">Active Admins</p><p className="text-2xl font-bold">{stats.activeAdmins}</p></div>
              <div className="card bg-purple-50"><p className="text-xs text-gray-600">Events</p><p className="text-2xl font-bold">{stats.events}</p></div>
              <div className="card bg-orange-50"><p className="text-xs text-gray-600">Members</p><p className="text-2xl font-bold">{stats.members}</p></div>
              <div className="card bg-pink-50"><p className="text-xs text-gray-600">Guests</p><p className="text-2xl font-bold">{stats.guests}</p></div>
              <div className="card bg-red-50"><p className="text-xs text-gray-600">Attendance</p><p className="text-2xl font-bold">{stats.attendance}</p></div>
            </section>

            <section className="card">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">System Comparison</h2>
                  <p className="text-sm text-gray-600">See Rotary vs Rotaract performance across the full platform.</p>
                </div>
                <button type="button" className="btn-outline" onClick={() => navigate('/analytics/system')}>
                  Open System Analytics
                </button>
              </div>
            </section>

            <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <div className="card">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Create Club Admin</h2>
                <form onSubmit={handleCreateAdmin} className="space-y-4">
                  <input className="input-field" placeholder="Name" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
                  <input className="input-field" type="email" placeholder="Email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} />
                  <select
                    className="input-field"
                    value={form.clubId || '__new__'}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === '__new__') {
                        setForm((p) => ({ ...p, clubId: '', clubName: '', clubType: 'rotaract', clubCode: '' }));
                        return;
                      }
                      const selectedClub = clubs.find((club) => club.clubId === value);
                      setForm((p) => ({
                        ...p,
                        clubId: value,
                        clubName: selectedClub?.clubName || '',
                        clubType: selectedClub?.clubType || 'rotaract',
                        clubCode: selectedClub?.clubCode || '',
                      }));
                    }}
                  >
                    <option value="__new__">Create New Club</option>
                    {clubs.map((club) => (
                      <option key={club.clubId} value={club.clubId}>
                        {club.clubName} ({club.clubType})
                      </option>
                    ))}
                  </select>
                  <input className="input-field" placeholder="Club Name" value={form.clubName} onChange={(e) => setForm((p) => ({ ...p, clubName: e.target.value }))} />
                  <select className="input-field" value={form.clubType} onChange={(e) => setForm((p) => ({ ...p, clubType: e.target.value as ClubType }))}>
                    <option value="rotaract">Rotaract Club</option>
                    <option value="rotary">Rotary Club</option>
                  </select>
                  <input className="input-field" placeholder="Club Code (optional)" value={form.clubCode} onChange={(e) => setForm((p) => ({ ...p, clubCode: e.target.value }))} />
                  <select className="input-field" value={form.role} onChange={(e) => setForm((p) => ({ ...p, role: e.target.value as AdminRole }))}>
                    <option value="viewer">Viewer</option>
                    <option value="event_manager">Event Manager</option>
                    <option value="club_admin">Club Admin</option>
                    <option value="super_admin">Super Admin</option>
                  </select>
                  <input className="input-field" type="password" placeholder="Temporary Password" value={form.password} onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))} />
                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={form.sendInviteEmail}
                      onChange={(e) => setForm((p) => ({ ...p, sendInviteEmail: e.target.checked }))}
                    />
                    Send password reset invite email
                  </label>
                  <button type="submit" className="btn-primary w-full" disabled={isSubmitting}>
                    {isSubmitting ? 'Creating Admin...' : 'Create Admin'}
                  </button>
                </form>
              </div>

              <div className="card">
                <h2 className="text-xl font-bold text-gray-900 mb-4">All Clubs (System)</h2>
                <div className="relative mb-4">
                  <Search className="w-4 h-4 text-gray-400 absolute top-3 left-3" />
                  <input
                    className="input-field pl-9"
                    value={clubSearch}
                    onChange={(e) => setClubSearch(e.target.value)}
                    placeholder="Search clubs by name, ID, code or type..."
                    aria-label="Search clubs"
                  />
                </div>
                <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
                  {filteredClubs.map((club) => (
                    <div key={club.clubId} className="border border-gray-200 rounded-lg p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-gray-900">{club.clubName}</p>
                          <p className="text-xs text-gray-500">
                            {club.clubId}
                            {club.clubCode ? ` • ${club.clubCode}` : ''}
                            {` • ${club.clubType.toUpperCase()}`}
                          </p>
                          <p className="text-sm text-gray-600 mt-1">
                            Admins: {club.adminCount} | Events: {club.eventCount} | Members: {club.memberCount} | Guests: {club.guestCount} | Attendance: {club.attendanceCount}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteClub(club)}
                          disabled={deletingClubId !== null}
                          className="text-red-600 border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-50 text-sm flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {deletingClubId === club.clubId ? (
                            <Loader className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                          {deletingClubId === club.clubId ? 'Archiving...' : 'Archive Club'}
                        </button>
                      </div>
                    </div>
                  ))}
                  {filteredClubs.length === 0 && (
                    <p className="text-gray-600">
                      {clubs.length === 0 ? 'No clubs found.' : 'No clubs match your search.'}
                    </p>
                  )}
                </div>
              </div>
            </section>

            <section className="card">
              <h2 className="text-xl font-bold text-gray-900 mb-4">All Admins</h2>
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-3 mb-4">
                <div className="lg:col-span-2 relative">
                  <Search className="w-4 h-4 text-gray-400 absolute top-3 left-3" />
                  <input
                    className="input-field pl-9"
                    value={adminSearch}
                    onChange={(e) => setAdminSearch(e.target.value)}
                    placeholder="Search by name, email or club..."
                  />
                </div>
                <select
                  className="input-field"
                  value={adminRoleFilter}
                  onChange={(e) => setAdminRoleFilter(e.target.value as 'all' | AdminRole)}
                >
                  <option value="all">All Roles</option>
                  <option value="viewer">Viewer</option>
                  <option value="event_manager">Event Manager</option>
                  <option value="club_admin">Club Admin</option>
                  <option value="super_admin">Super Admin</option>
                </select>
                <select
                  className="input-field"
                  value={adminStatusFilter}
                  onChange={(e) => setAdminStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Admin</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Club</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Role</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Last Login</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {pagedAdmins.map((admin) => (
                      <tr key={admin.id}>
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900">{admin.name}</p>
                          <p className="text-sm text-gray-600">{admin.email}</p>
                          {admin.inviteStatus === 'pending' && (
                            <p className="text-xs text-amber-700 mt-1">Invite pending</p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          <p>{admin.clubName || admin.clubId}</p>
                          <p className="text-xs text-gray-500">
                            {admin.clubId}
                            {admin.clubCode ? ` • ${admin.clubCode}` : ''}
                            {admin.clubType ? ` • ${admin.clubType.toUpperCase()}` : ''}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-sm uppercase text-gray-700">
                          <select
                            className="input-field py-1 text-xs min-w-[140px]"
                            value={admin.role}
                            onChange={(e) => handleChangeRole(admin, e.target.value as AdminRole)}
                          >
                            <option value="viewer">VIEWER</option>
                            <option value="event_manager">EVENT_MANAGER</option>
                            <option value="club_admin">CLUB_ADMIN</option>
                            <option value="super_admin">SUPER_ADMIN</option>
                          </select>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-600">{admin.lastLogin ? admin.lastLogin.toLocaleString() : 'Never'}</td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${admin.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'}`}>
                            {admin.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => handleToggleAdmin(admin, !admin.isActive)}
                              className="text-sm border border-gray-300 rounded-lg px-2.5 py-1.5 hover:bg-gray-50 flex items-center gap-1"
                            >
                              <UserCog className="w-4 h-4" />
                              {admin.isActive ? 'Deactivate' : 'Activate'}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteAdmin(admin)}
                              className="text-sm border border-red-200 text-red-600 rounded-lg px-2.5 py-1.5 hover:bg-red-50 flex items-center gap-1"
                            >
                              <Trash2 className="w-4 h-4" />
                              Archive
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSendReset(admin)}
                              className="text-sm border border-indigo-200 text-indigo-700 rounded-lg px-2.5 py-1.5 hover:bg-indigo-50 flex items-center gap-1"
                            >
                              <Mail className="w-4 h-4" />
                              Reset Link
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {pagedAdmins.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                          No admins match your filters.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <p className="text-sm text-gray-600">
                  {filteredAdmins.length === 0
                    ? 'Showing 0 of 0'
                    : `Showing ${(adminPage - 1) * pageSize + 1}-${Math.min(adminPage * pageSize, filteredAdmins.length)} of ${filteredAdmins.length}`}
                </p>
                <div className="flex items-center gap-2">
                  <select
                    className="input-field py-1 text-sm"
                    value={pageSize}
                    onChange={(e) => setPageSize(Number(e.target.value))}
                  >
                    <option value={10}>10 / page</option>
                    <option value={20}>20 / page</option>
                    <option value={50}>50 / page</option>
                  </select>
                  <button
                    type="button"
                    disabled={adminPage <= 1}
                    onClick={() => setAdminPage((p) => Math.max(1, p - 1))}
                    className="btn-outline py-1 px-3 disabled:opacity-50"
                  >
                    Prev
                  </button>
                  <span className="text-sm text-gray-600">
                    {adminPage}/{totalPages}
                  </span>
                  <button
                    type="button"
                    disabled={adminPage >= totalPages}
                    onClick={() => setAdminPage((p) => Math.min(totalPages, p + 1))}
                    className="btn-outline py-1 px-3 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            </section>

            <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <div className="card">
                <div className="flex items-center gap-2 mb-4">
                  <RotateCcw className="w-5 h-5 text-amber-600" />
                  <h2 className="text-xl font-bold text-gray-900">Archived Clubs (Restore)</h2>
                </div>
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                  {archivedClubs.map((club) => (
                    <div key={club.deleteGroupId} className="border border-amber-200 bg-amber-50 rounded-lg p-3">
                      <p className="font-semibold text-gray-900">{club.clubName}</p>
                      <p className="text-xs text-gray-600">{club.clubId}</p>
                      <p className="text-xs text-gray-600 mt-1">
                        Records: {club.totalRecords} | Deleted by: {club.deletedByEmail} | {club.deletedAtLabel}
                      </p>
                      <button
                        type="button"
                        onClick={() => restoreClub(club)}
                        className="mt-2 text-sm border border-amber-300 text-amber-800 rounded-lg px-2.5 py-1.5 hover:bg-amber-100 flex items-center gap-1"
                      >
                        <RotateCcw className="w-4 h-4" />
                        Restore Club
                      </button>
                    </div>
                  ))}
                  {archivedClubs.length === 0 && <p className="text-gray-600">No archived clubs.</p>}
                </div>
              </div>

              <div className="card">
                <div className="flex items-center gap-2 mb-4">
                  <RotateCcw className="w-5 h-5 text-amber-600" />
                  <h2 className="text-xl font-bold text-gray-900">Archived Admins (Restore)</h2>
                </div>
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                  {archivedAdmins.map((admin) => (
                    <div key={admin.adminId} className="border border-amber-200 bg-amber-50 rounded-lg p-3">
                      <p className="font-semibold text-gray-900">{admin.name}</p>
                      <p className="text-sm text-gray-700">{admin.email}</p>
                      <p className="text-xs text-gray-600 mt-1">
                        Club: {admin.clubName || admin.clubId} | Deleted by: {admin.deletedByEmail} | {admin.deletedAtLabel}
                      </p>
                      <button
                        type="button"
                        onClick={() => restoreAdmin(admin.adminId)}
                        className="mt-2 text-sm border border-amber-300 text-amber-800 rounded-lg px-2.5 py-1.5 hover:bg-amber-100 flex items-center gap-1"
                      >
                        <RotateCcw className="w-4 h-4" />
                        Restore Admin
                      </button>
                    </div>
                  ))}
                  {archivedAdmins.length === 0 && <p className="text-gray-600">No archived admins.</p>}
                </div>
              </div>
            </section>

            <section className="card">
              <div className="flex items-center gap-2 mb-4">
                <History className="w-5 h-5 text-primary-700" />
                <h2 className="text-xl font-bold text-gray-900">Audit Log</h2>
              </div>
              <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                {auditLogs.map((log) => (
                  <div key={log.id} className="border border-gray-200 rounded-lg p-3 bg-white">
                    <p className="font-semibold text-gray-900 text-sm">{log.action}</p>
                    <p className="text-xs text-gray-600">
                      Target: {log.targetType} ({log.targetId}) | By: {log.actorEmail} | {tsLabel(log.createdAt)}
                    </p>
                  </div>
                ))}
                {auditLogs.length === 0 && <p className="text-gray-600">No audit logs yet.</p>}
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
};

export default SuperAdminPage;
