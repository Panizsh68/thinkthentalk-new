
'use client';
import apiClient from './client';
import type { TeamMember, TeamMemberFormData } from '@/lib/types';

const transformTeamMember = (member: any): TeamMember => ({
  ...member,
});

export async function getTeamMembers({ isAdmin = false } = {}): Promise<TeamMember[]> {
  const url = isAdmin ? '/admin/team' : '/team';
   try {
    const { data } = await apiClient.get<TeamMember[]>(url);
    return data.map(transformTeamMember);
  } catch (error: any) {
    console.error(`Failed to fetch team members (isAdmin: ${isAdmin}):`, error);
    throw new Error(error.message || "Failed to fetch team members.");
  }
}

export async function createTeamMember(data: TeamMemberFormData): Promise<TeamMember> {
  try {
    const { data: newMember } = await apiClient.post<TeamMember>('/admin/team', data);
    return transformTeamMember(newMember);
  } catch (error: any) {
    console.error("Failed to create team member:", error);
    throw new Error(error.message || "Failed to create team member.");
  }
}

export async function updateTeamMember(id: string, data: Partial<TeamMemberFormData>): Promise<TeamMember> {
  try {
    const { data: updatedMember } = await apiClient.patch<TeamMember>(`/admin/team/${id}`, data);
    return transformTeamMember(updatedMember);
  } catch (error: any) {
    console.error(`Failed to update team member ${id}:`, error);
    throw new Error(error.message || "Failed to update team member.");
  }
}

export async function deleteTeamMember(id: string): Promise<{ id: string }> {
  try {
    await apiClient.delete(`/admin/team/${id}`);
    return { id };
  } catch (error: any) {
    console.error(`Failed to delete team member ${id}:`, error);
    throw new Error(error.message || "Failed to delete team member.");
  }
}
