// Member types and interfaces

import { ClubType } from './club';

export interface Member {
  id: string;
  clubId: string;
  clubName?: string;
  clubType?: ClubType;
  clubCode?: string;
  createdByAdminId?: string;
  name: string;
  email: string;
  phone: string;
  memberId?: string; // Rotaract member ID
  club?: string;
  joinDate: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateMemberInput {
  name: string;
  email: string;
  phone: string;
  memberId?: string;
}

export interface UpdateMemberInput {
  name?: string;
  email?: string;
  phone?: string;
  isActive?: boolean;
}

export interface MemberSearchResult {
  id: string;
  clubId?: string;
  name: string;
  email: string;
  phone: string;
  memberId?: string;
  club?: string;
}
