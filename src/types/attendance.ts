// Attendance record types

export interface AttendanceRecord {
  id: string;
  eventId: string;
  clubId?: string;
  type: 'member' | 'guest';
  personId: string;
  personName: string;
  personEmail: string;
  personPhone: string;
  checkedInAt: Date;
  eCardGenerated: boolean;
  eCardUrl?: string;
  notes?: string;
}

export interface AttendanceStats {
  totalAttendees: number;
  members: number;
  guests: number;
  returningGuests: number;
}

export interface CheckInResponse {
  success: boolean;
  type: 'member' | 'guest';
  personName: string;
  eCardGenerated: boolean;
  isDuplicate: boolean;
  message: string;
}
