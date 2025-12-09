
import type { Language } from './language';

export type EventCategory = string;

export type TicketType = 'EARLY_BIRD' | 'STANDARD' | 'SUPPORTER';

export type LocalizedText = Record<Language, string>;

export type EventResource = {
  id: string;
  title: Record<Language, string>;
  description?: string;
  accessLevel: 'PUBLIC' | 'REGISTERED_ONLY';
  url: string;
};

export type EventTicketConfig = {
  type: TicketType;
  price: number;
  currency: 'IRR' | 'TOMAN';
  quantityTotal: number;
  quantitySold: number;
  earlyBirdEndDate?: Date;
};

export type Event = {
  id: string;
  title: LocalizedText;
  summary: LocalizedText;
  description: LocalizedText;
  type: 'ONLINE' | 'OFFLINE';
  address?: string;
  city?: LocalizedText;
  startDateTime: Date;
  endDateTime?: Date; // Optional end time
  capacityTotal: number;
  capacityRemaining: number;
  showRemainingCapacity: boolean;
  categories: EventCategory[];
  tickets: EventTicketConfig[];
  resources: EventResource[];
  publicDiscountIds?: string[];
  posterUrl?: string;
  isArchived: boolean;
  archivedAt?: Date;
  archivedById?: string | null;
  deletedAt?: Date;
  deletedById?: string | null;
};

// This type is for the admin form
export type EventFormData = {
  title: LocalizedText;
  categories: string; // Comma-separated for the form
  summary: LocalizedText;
  description: LocalizedText;
  type: 'ONLINE' | 'OFFLINE';
  city?: LocalizedText;
  address?: string;
  startDateTime: Date;
  endDateTime?: Date;
  capacityTotal: number;
  showRemainingCapacity: boolean;
  publicDiscountIds?: string[];
  posterUrl?: string;
};

export interface UpdateEventFormDataDto {
  title?: LocalizedText;
  categories?: string;
  summary?: LocalizedText;
  description?: LocalizedText;
  type?: 'ONLINE' | 'OFFLINE';
  city?: LocalizedText;
  address?: string;
  startDateTime?: Date;
  endDateTime?: Date;
  capacityTotal?: number;
  showRemainingCapacity?: boolean;
  publicDiscountIds?: string[];
  posterUrl?: string;
}
