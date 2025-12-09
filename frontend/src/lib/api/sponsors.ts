
'use client';
import apiClient from './client';
import type { Sponsor, SponsorFormData } from '@/lib/types';

const transformSponsor = (sponsor: any): Sponsor => ({
  ...sponsor,
});

export async function getSponsors({ isAdmin = false } = {}): Promise<Sponsor[]> {
  const url = isAdmin ? '/admin/sponsors' : '/sponsors';
  try {
    const { data } = await apiClient.get<Sponsor[]>(url);
    return data.map(transformSponsor);
  } catch (error: any) {
    console.error(`Failed to fetch sponsors (isAdmin: ${isAdmin}):`, error);
    throw new Error(error.message || "Failed to fetch sponsors.");
  }
}

export async function createSponsor(data: SponsorFormData): Promise<Sponsor> {
   try {
    const { data: newSponsor } = await apiClient.post<Sponsor>('/admin/sponsors', data);
    return transformSponsor(newSponsor);
  } catch (error: any) {
    console.error("Failed to create sponsor:", error);
    throw new Error(error.message || "Failed to create sponsor.");
  }
}

export async function updateSponsor(id: string, data: Partial<SponsorFormData>): Promise<Sponsor> {
  try {
    const { data: updatedSponsor } = await apiClient.patch<Sponsor>(`/admin/sponsors/${id}`, data);
    return transformSponsor(updatedSponsor);
  } catch (error: any) {
    console.error(`Failed to update sponsor ${id}:`, error);
    throw new Error(error.message || "Failed to update sponsor.");
  }
}

export async function deleteSponsor(id: string): Promise<{ id: string }> {
  try {
    await apiClient.delete(`/admin/sponsors/${id}`);
    return { id };
  } catch (error: any) {
     console.error(`Failed to delete sponsor ${id}:`, error);
    throw new Error(error.message || "Failed to delete sponsor.");
  }
}
