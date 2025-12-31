import { useMutation } from '@tanstack/react-query';
import {
  uploadEventPoster,
  uploadTeamMember,
  uploadSponsorLogo,
  uploadEventResource,
  deleteUploadedFile,
  UploadResponse,
} from '@/lib/api/upload';

/**
 * Hook for uploading event poster
 */
export function useUploadEventPoster() {
  return useMutation({
    mutationFn: async (file: File) => {
      if (!file) throw new Error('No file selected');
      if (file.size > 50 * 1024 * 1024) {
        throw new Error('File size exceeds 50MB limit');
      }
      return uploadEventPoster(file);
    },
  });
}

/**
 * Hook for uploading team member photo
 */
export function useUploadTeamMember() {
  return useMutation({
    mutationFn: async (file: File) => {
      if (!file) throw new Error('No file selected');
      if (file.size > 10 * 1024 * 1024) {
        throw new Error('File size exceeds 10MB limit');
      }
      return uploadTeamMember(file);
    },
  });
}

/**
 * Hook for uploading sponsor logo
 */
export function useUploadSponsorLogo() {
  return useMutation({
    mutationFn: async (file: File) => {
      if (!file) throw new Error('No file selected');
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('File size exceeds 5MB limit');
      }
      return uploadSponsorLogo(file);
    },
  });
}

/**
 * Hook for uploading event resource file
 */
export function useUploadEventResource() {
  return useMutation({
    mutationFn: async (file: File) => {
      if (!file) throw new Error('No file selected');
      if (file.size > 20 * 1024 * 1024) {
        throw new Error('File size exceeds 20MB limit');
      }
      return uploadEventResource(file);
    },
  });
}

/**
 * Hook for deleting uploaded files
 */
export function useDeleteUploadedFile() {
  return useMutation({
    mutationFn: ({ category, filename }: { category: string; filename: string }) => {
      return deleteUploadedFile(category, filename);
    },
  });
}
