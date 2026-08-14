export type ClubType = 'rotary' | 'rotaract';

export interface Club {
  id: string;
  clubId: string;
  clubName: string;
  clubType: ClubType;
  clubCode?: string;
  normalizedName: string;
  isActive: boolean;
  organizationLogo?: string;
  clubLogo?: string;
  eCardMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ClubECardBranding {
  organizationLogo?: string;
  clubLogo?: string;
  eCardMessage?: string;
}

export interface CreateClubInput {
  clubId?: string;
  clubName: string;
  clubType: ClubType;
  clubCode?: string;
}
