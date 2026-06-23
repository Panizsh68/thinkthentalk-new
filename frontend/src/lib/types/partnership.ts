
export type PartnershipStatus = 'PENDING' | 'REVIEWING' | 'CONTACTED' | 'ACCEPTED' | 'REJECTED';

export type SponsorshipPlan = 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';

export interface CollaborationRequest {
  id: string;
  userId?: string | null;
  name: string;
  email: string;
  mobile: string;
  fieldOfExpertise: string;
  experience?: string | null;
  whyJoin: string;
  availability?: string | null;
  status: PartnershipStatus;
  createdAt: string;
  updatedAt: string;
}

export interface SponsorshipRequest {
  id: string;
  userId?: string | null;
  companyName: string;
  representativeName: string;
  email: string;
  mobile: string;
  plan: SponsorshipPlan;
  description?: string | null;
  status: PartnershipStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCollaborationDto {
  name: string;
  email: string;
  mobile: string;
  fieldOfExpertise: string;
  experience?: string;
  whyJoin: string;
  availability?: string;
}

export interface CreateSponsorshipDto {
  companyName: string;
  representativeName: string;
  email: string;
  mobile: string;
  plan: SponsorshipPlan;
  description?: string;
}
