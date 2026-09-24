"use client";
import apiClient from "./client";
import type {
  TeamMember,
  TeamMemberFormData,
  UpdateTeamMemberData,
} from "@/lib/types";

export async function getTeamMembers({ isAdmin = false } = {}): Promise<
  TeamMember[]
> {
  const url = isAdmin ? "/admin/team" : "/team";
  const { data } = await apiClient.get<TeamMember[]>(url, {
    authMode: isAdmin ? "admin" : "public",
  });
  return data;
}

export async function createTeamMember(
  data: TeamMemberFormData,
): Promise<TeamMember> {
  const { data: newMember } = await apiClient.post<TeamMember>(
    "/admin/team",
    data,
    {
      authMode: "admin",
    },
  );
  return newMember;
}

export async function updateTeamMember(
  id: string,
  data: UpdateTeamMemberData,
): Promise<TeamMember> {
  const { data: updatedMember } = await apiClient.patch<TeamMember>(
    `/admin/team/${id}`,
    data,
    {
      authMode: "admin",
    },
  );
  return updatedMember;
}

export async function deleteTeamMember(id: string): Promise<{ id: string }> {
  await apiClient.delete(`/admin/team/${id}`, { authMode: "admin" });
  return { id };
}

export async function reorderTeamMember(
  memberId: string,
  direction: "up" | "down",
): Promise<TeamMember[]> {
  const { data } = await apiClient.patch<TeamMember[]>(
    "/admin/team/reorder",
    { memberId, direction },
    {
      authMode: "admin",
    },
  );
  return data;
}
