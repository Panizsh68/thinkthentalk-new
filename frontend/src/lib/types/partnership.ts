export const PARTNERSHIP_STATUSES = [
  'PENDING',
  'REVIEWING',
  'CONTACTED',
  'ACCEPTED',
  'REJECTED',
] as const;

export type PartnershipStatus = (typeof PARTNERSHIP_STATUSES)[number];

export const SPONSORSHIP_PLANS = ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM'] as const;
export type SponsorshipPlan = (typeof SPONSORSHIP_PLANS)[number];

export interface SafeUserSummary {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  mobile: string;
}

export interface CollaborationStatusHistory {
  id: string;
  fromStatus: PartnershipStatus | null;
  toStatus: PartnershipStatus;
  createdAt: string;
}

export interface CollaborationAdminStatusHistory extends CollaborationStatusHistory {
  note: string | null;
  changedByAdminId: string | null;
}

export interface CollaborationUserRequest {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  mobile: string;
  fieldOfExpertise: string;
  experience: string | null;
  whyJoin: string;
  availability: string | null;
  acceptedTerms: boolean;
  acceptedTermsAt: string | null;
  status: PartnershipStatus;
  processedAt: string | null;
  createdAt: string;
  updatedAt: string;
  history: CollaborationStatusHistory[];
}

export interface CollaborationAdminRequest extends CollaborationUserRequest {
  user: SafeUserSummary | null;
  adminNote: string | null;
  history: CollaborationAdminStatusHistory[];
}

export interface SponsorshipUserRequest {
  id: string;
  companyName: string;
  representativeName: string;
  email: string;
  mobile: string;
  plan: SponsorshipPlan;
  description: string | null;
  status: PartnershipStatus;
  processedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SponsorshipAdminRequest extends SponsorshipUserRequest {
  user: SafeUserSummary | null;
  adminNote: string | null;
}

/** @deprecated Use CollaborationUserRequest or CollaborationAdminRequest. */
export type CollaborationRequest = CollaborationUserRequest;
/** @deprecated Use SponsorshipUserRequest or SponsorshipAdminRequest. */
export type SponsorshipRequest = SponsorshipUserRequest;

export interface CreateCollaborationDto {
  firstName: string;
  lastName: string;
  email: string;
  mobile: string;
  fieldOfExpertise: string;
  experience?: string;
  whyJoin: string;
  availability?: string;
  acceptedTerms: true;
}

export interface CreateSponsorshipDto {
  companyName: string;
  representativeName: string;
  email: string;
  mobile: string;
  plan: SponsorshipPlan;
  description?: string;
}

export interface UpdatePartnershipStatusDto {
  status: PartnershipStatus;
  notes?: string;
}

export interface AdminPage<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}
