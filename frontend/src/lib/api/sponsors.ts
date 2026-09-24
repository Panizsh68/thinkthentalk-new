"use client";
import apiClient from "./client";
import type { Sponsor, SponsorFormData } from "@/lib/types";

export async function getSponsors({ isAdmin = false } = {}): Promise<
  Sponsor[]
> {
  const url = isAdmin ? "/admin/sponsors" : "/sponsors";
  const { data } = await apiClient.get<Sponsor[]>(url, {
    authMode: isAdmin ? "admin" : "public",
  });
  return data;
}

export async function createSponsor(data: SponsorFormData): Promise<Sponsor> {
  const { data: newSponsor } = await apiClient.post<Sponsor>(
    "/admin/sponsors",
    data,
    { authMode: "admin" },
  );
  return newSponsor;
}

export async function updateSponsor(
  id: string,
  data: Partial<SponsorFormData>,
): Promise<Sponsor> {
  const { data: updatedSponsor } = await apiClient.patch<Sponsor>(
    `/admin/sponsors/${id}`,
    data,
    { authMode: "admin" },
  );
  return updatedSponsor;
}

export async function deleteSponsor(id: string): Promise<{ id: string }> {
  await apiClient.delete(`/admin/sponsors/${id}`, { authMode: "admin" });
  return { id };
}
