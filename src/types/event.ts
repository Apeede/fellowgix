// Event types and interfaces

import { ClubType } from './club';

export interface Event {
  id: string;
  name: string;
  date: string; // ISO format: YYYY-MM-DD
  time?: string; // HH:mm format
  theme: string;
  speaker: string;
  location?: string;
  description?: string;
  qrCode: string; // Base64 encoded or URL
  qrCodeUrl?: string; // Downloadable URL
  createdBy: string; // Admin user ID
  clubId: string;
  clubName?: string;
  clubType?: ClubType;
  clubCode?: string;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  expectedAttendance?: number;
}

export interface CreateEventInput {
  name: string;
  date: string;
  time?: string;
  theme: string;
  speaker: string;
  location?: string;
  description?: string;
}

export interface UpdateEventInput {
  name?: string;
  date?: string;
  time?: string;
  theme?: string;
  speaker?: string;
  location?: string;
  description?: string;
  isActive?: boolean;
}

export interface EventStats {
  totalEvents: number;
  activeEvents: number;
  totalAttendance: number;
  upcomingEvents: number;
}
