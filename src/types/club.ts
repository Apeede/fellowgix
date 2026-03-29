export type ClubType = 'rotary' | 'rotaract';

export interface Club {
  id: string;
  clubId: string;
  clubName: string;
  clubType: ClubType;
  clubCode?: string;
  normalizedName: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateClubInput {
  clubId?: string;
  clubName: string;
  clubType: ClubType;
  clubCode?: string;
}
