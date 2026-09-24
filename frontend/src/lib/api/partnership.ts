import apiClient from './client';
import type {
  AdminPage,
  CollaborationAdminRequest,
  CollaborationUserRequest,
  CreateCollaborationDto,
  CreateSponsorshipDto,
  PartnershipStatus,
  SponsorshipAdminRequest,
  SponsorshipPlan,
  SponsorshipUserRequest,
  UpdatePartnershipStatusDto,
} from '../types';

export async function submitCollaboration(dto: CreateCollaborationDto): Promise<CollaborationUserRequest> {
  const { data } = await apiClient.post<CollaborationUserRequest>('/partnerships/collaborate', dto, { authMode: 'user' });
  return data;
}

export async function submitSponsorship(dto: CreateSponsorshipDto): Promise<SponsorshipUserRequest> {
  const { data } = await apiClient.post<SponsorshipUserRequest>('/partnerships/sponsor', dto, { authMode: 'user' });
  return data;
}

export async function getMyCollaborations(): Promise<CollaborationUserRequest[]> {
  const { data } = await apiClient.get<CollaborationUserRequest[]>('/partnerships/me/collaborations', { authMode: 'user' });
  return data;
}

export async function getMySponsorships(): Promise<SponsorshipUserRequest[]> {
  const { data } = await apiClient.get<SponsorshipUserRequest[]>('/partnerships/me/sponsorships', { authMode: 'user' });
  return data;
}

function buildQuery(params: {
  status?: PartnershipStatus;
  plan?: SponsorshipPlan;
  page: number;
  limit: number;
}): string {
  const query = new URLSearchParams();
  if (params.status) query.set('status', params.status);
  if (params.plan) query.set('plan', params.plan);
  query.set('page', String(params.page));
  query.set('limit', String(params.limit));
  return query.toString();
}

export async function getAdminCollaborations(
  status: PartnershipStatus | undefined,
  page = 1,
  limit = 20,
): Promise<AdminPage<CollaborationAdminRequest>> {
  const query = buildQuery({ status, page, limit });
  const { data } = await apiClient.get<AdminPage<CollaborationAdminRequest>>(
    `/partnerships/admin/collaborations?${query}`,
    { authMode: 'admin' },
  );
  return data;
}

export async function getAdminSponsorships(
  status: PartnershipStatus | undefined,
  plan: SponsorshipPlan | undefined,
  page = 1,
  limit = 20,
): Promise<AdminPage<SponsorshipAdminRequest>> {
  const query = buildQuery({ status, plan, page, limit });
  const { data } = await apiClient.get<AdminPage<SponsorshipAdminRequest>>(
    `/partnerships/admin/sponsorships?${query}`,
    { authMode: 'admin' },
  );
  return data;
}

export async function updateCollabStatus(
  id: string,
  dto: UpdatePartnershipStatusDto,
): Promise<CollaborationAdminRequest> {
  const { data } = await apiClient.patch<CollaborationAdminRequest>(
    `/partnerships/admin/collaborations/${id}/status`,
    dto,
    { authMode: 'admin' },
  );
  return data;
}

export async function updateSponsorStatus(
  id: string,
  dto: UpdatePartnershipStatusDto,
): Promise<SponsorshipAdminRequest> {
  const { data } = await apiClient.patch<SponsorshipAdminRequest>(
    `/partnerships/admin/sponsorships/${id}/status`,
    dto,
    { authMode: 'admin' },
  );
  return data;
}
