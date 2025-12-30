import type { RegistrationFormData } from '@/hooks/use-registration-wizard-store';
import type { TicketType } from './event';
import type { PaymentStatus } from './payment';
import type { RegistrationStatus } from './registration';

export type User = {
  id: string;
  firstNameFa: string;
  lastNameFa: string;
  firstNameEn?: string;
  lastNameEn?: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  age?: number;
  educationLevel?: string;
  fieldOfStudy?: string;
  isEmployed?: boolean;
  jobTitle?: string;
  mobile: string;
  email?: string;
  languageLevel?: string;
};

export type AdminUserProfile = {
  id: string;
  mobile: string;
  firstNameFa?: string;
  lastNameFa?: string;
  firstNameEn?: string | null;
  lastNameEn?: string | null;
  gender?: 'MALE' | 'FEMALE' | 'OTHER' | null;
  age?: number | null;
  educationLevel?: string | null;
  fieldOfStudy?: string | null;
  isEmployed?: boolean | null;
  jobTitle?: string | null;
  email?: string | null;
  languageLevel?: string | null;
  profileCompleted: boolean;
  missingFields: string[];
};

export type AdminUserListItem = AdminUserProfile & {
  registrationCount: number;
  lastRegistrationAt?: Date | null;
  createdAt: Date;
};

export type AdminUserRegistrationSummary = {
  id: string;
  eventId: string;
  eventTitle: string;
  eventStartDateTime?: Date;
  ticketType: TicketType;
  status: RegistrationStatus;
  paymentStatus?: PaymentStatus | null;
  paymentId?: string | null;
  paymentAmount?: number | null;
  gatewayTransactionId?: string | null;
  createdAt: Date;
  formData?: RegistrationFormData | null;
};

export type AdminUserDetails = {
  profile: AdminUserProfile;
  registrations: AdminUserRegistrationSummary[];
};

export type AdminUsersQuery = {
  search?: string;
  profileStatus?: 'complete' | 'incomplete';
  page?: number;
  limit?: number;
};
