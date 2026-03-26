// Member types and interfaces

export interface Member {
  id: string;
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
  club?: string;
}

export interface UpdateMemberInput {
  name?: string;
  email?: string;
  phone?: string;
  isActive?: boolean;
}

export interface MemberSearchResult {
  id: string;
  name: string;
  email: string;
  phone: string;
  club?: string;
}
