
import type { LocalizedText, TicketType } from './event';
import type { User } from './user';
import type { RegistrationFormData } from '@/hooks/use-registration-wizard-store';

export type RegistrationStatus = 'PAID' | 'PENDING' | 'FAILED' | 'CANCELLED';

export type Registration = {
  id: string;
  userId: string;
  eventId: string;
  ticketType: TicketType;
  status: RegistrationStatus;
  paymentId?: string;
  createdAt: Date;
  updatedAt: Date;
};

// A simplified version for the "My Registrations" list
export type UserRegistration = {
  id: string;
  userId: string;
  eventId: string;
  paymentId: string;
  ticketType: TicketType;
  status: RegistrationStatus;
  createdAt: Date;
  event: {
    title: LocalizedText;
    startDateTime: Date;
  };
};

// A detailed version for the Admin panel
export type UserRegistrationDetails = {
    id: string;
    userId: string;
    eventId: string;
    paymentId: string;
    ticketType: TicketType;
    status: RegistrationStatus;
    createdAt: Date;
    user: Partial<User>;
    formData: RegistrationFormData;
    event: {
        id: string;
        title: LocalizedText;
        startDateTime: Date;
    };
    payment: {
        id: string;
        amount: number;
        currency: 'TOMAN' | 'IRR';
        status: 'PENDING' | 'SUCCESS' | 'FAILED';
        gatewayTransactionId?: string;
    }
}


export interface AdminRegistrationsQueryDto {
  eventId?: string;
  status?: RegistrationStatus;
  page?: number;
  limit?: number;
}

export interface UpdateRegistrationAdminDto {
  status?: RegistrationStatus;
  formData?: RegistrationFormData;
}
