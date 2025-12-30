export type ContactMessageStatus = 'NEW' | 'SEEN' | 'ARCHIVED';

export interface ContactMessage {
  id: string;
  name?: string | null;
  email: string;
  message: string;
  source: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  language: string;
  status: ContactMessageStatus;
  processedAt?: string | null;
  emailSent: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedContactMessages {
  items: ContactMessage[];
  total: number;
  page: number;
  pageSize: number;
}
