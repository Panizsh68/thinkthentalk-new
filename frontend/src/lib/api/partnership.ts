
import apiClient from './client';
import type { CreateCollaborationDto, CreateSponsorshipDto, CollaborationRequest, SponsorshipRequest, PartnershipStatus, SponsorshipPlan } from '../types';

export async function submitCollaboration(dto: CreateCollaborationDto): Promise<CollaborationRequest> {
  const { data } = await apiClient.post<CollaborationRequest>('/partnerships/collaborate', dto);
  return data;
}

export async function submitSponsorship(dto: CreateSponsorshipDto): Promise<SponsorshipRequest> {
  const { data } = await apiClient.post<SponsorshipRequest>('/partnerships/sponsor', dto);
  return data;
}

export async function getAdminCollaborations(status?: PartnershipStatus): Promise<{ items: CollaborationRequest[], total: number }> {
  const query = status ? `?status=${status}` : '';
  const { data } = await apiClient.get<any>(`/partnerships/admin/collaborations${query}`);
  return data;
}

export async function getAdminSponsorships(status?: PartnershipStatus, plan?: SponsorshipPlan): Promise<{ items: SponsorshipRequest[], total: number }> {
  const params = new URLSearchParams();
  if (status) params.append('status', status);
  if (plan) params.append('plan', plan);
  const { data } = await apiClient.get<any>(`/partnerships/admin/sponsorships?${params.toString()}`);
  return data;
}

export async function updateCollabStatus(id: string, status: PartnershipStatus, notes?: string): Promise<CollaborationRequest> {
  const { data } = await apiClient.patch<CollaborationRequest>(`/partnerships/admin/collaborations/${id}/status`, { status, notes });
  return data;
}

export async function updateSponsorStatus(id: string, status: PartnershipStatus, notes?: string): Promise<SponsorshipRequest> {
  const { data } = await apiClient.patch<SponsorshipRequest>(`/partnerships/admin/sponsorships/${id}/status`, { status, notes });
  return data;
}
