import { apiClient } from './client';

export interface UploadResponse {
  id: string;
  url: string;
  filename: string;
  originalName?: string;
  size?: number;
}

/**
 * Upload event poster image
 */
export async function uploadEventPoster(file: File): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await apiClient.post<UploadResponse>('/upload/event-poster', formData);

  return response.data;
}

/**
 * Upload team member photo
 */
export async function uploadTeamMember(file: File): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await apiClient.post<UploadResponse>('/upload/team-member', formData);

  return response.data;
}

/**
 * Upload sponsor logo
 */
export async function uploadSponsorLogo(file: File): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await apiClient.post<UploadResponse>('/upload/sponsor-logo', formData);

  return response.data;
}

/**
 * Upload event resource file
 */
export async function uploadEventResource(file: File): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await apiClient.post<UploadResponse>('/upload/event-resource', formData);

  return response.data;
}

/**
 * Delete uploaded file
 */
export async function deleteUploadedFile(category: string, filename: string): Promise<void> {
  await apiClient.delete(`/upload/${category}/${filename}`);
}
