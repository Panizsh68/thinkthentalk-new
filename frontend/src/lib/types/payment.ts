
import type { TicketType } from './event';
import type { RegistrationFormData } from '@/hooks/use-registration-wizard-store';


export type PaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILED';

export type Payment = {
  id: string;
  registrationId: string;
  eventId: string;
  ticketType: TicketType;
  amount: number;
  currency: 'TOMAN' | 'IRR';
  status: PaymentStatus;
  gatewayTransactionId?: string;
  redirectUrl?: string;
  createdAt: string;
  updatedAt: string;
};


export interface CreatePaymentBodyDto {
  eventId: string;
  ticketType: TicketType;
  amount: number;
  currency: 'TOMAN' | 'IRR';
  formData: RegistrationFormData;
}

export interface VerifyPaymentStatusDto {
  status: 'SUCCESS' | 'FAILED';
}


export interface AdminPaymentsQueryDto {
  eventId?: string;
  status?: PaymentStatus;
}
