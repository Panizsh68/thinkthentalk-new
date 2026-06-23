
export type EventIdeaType = 'TOPIC' | 'FORMAT' | 'VENUE' | 'OTHER';
export type EventIdeaStatus = 'PENDING' | 'REVIEWED' | 'PLANNED' | 'REJECTED';

export interface EventIdea {
  id: string;
  userId?: string | null;
  name?: string | null;
  email?: string | null;
  title: string;
  description: string;
  type: EventIdeaType;
  status: EventIdeaStatus;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    firstNameFa: string;
    lastNameFa: string;
    mobile: string;
  } | null;
}

export interface CreateEventIdeaDto {
  name?: string;
  email?: string;
  title: string;
  description: string;
  type: EventIdeaType;
}

export interface PaginatedEventIdeas {
  items: EventIdea[];
  total: number;
  page: number;
  limit: number;
}
