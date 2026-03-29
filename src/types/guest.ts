// Guest types and interfaces

import { ClubType } from './club';

export interface Guest {
  id: string;
  clubId?: string;
  clubName?: string;
  clubType?: ClubType;
  clubCode?: string;
  name: string;
  email: string;
  phone: string;
  type: 'rotarian' | 'rotaractor' | 'non_rotaractor';
  club?: string; // Club name if Rotarian or Rotaractor
  visitCount: number;
  lastVisitedOn?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateGuestInput {
  name: string;
  email: string;
  phone: string;
  type: 'rotarian' | 'rotaractor' | 'non_rotaractor';
  club?: string;
}

export interface GuestCheckInData {
  guest: Guest;
  isReturningGuest: boolean;
  visitCount: number;
}
