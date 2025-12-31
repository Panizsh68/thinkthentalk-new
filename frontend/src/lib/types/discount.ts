
export type Discount = {
  id: string;
  name: string;
  code?: string;
  type: 'PERCENT' | 'FIXED';
  value: number;
  applicableEventIds?: string[];
  maxUses?: number;
  usedCount: number;
  maxUsesPerUser?: number;
  minAmount?: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  isPublic: boolean;
};

export type DiscountFormData = Omit<Discount, 'id' | 'usedCount'>;


export interface UpdateDiscountFormDataDto {
  name?: string;
  code?: string;
  type?: 'PERCENT' | 'FIXED';
  value?: number;
  applicableEventIds?: string[];
  maxUses?: number;
  maxUsesPerUser?: number;
  minAmount?: number;
  startDate?: string;
  endDate?: string;
  isActive?: boolean;
  isPublic?: boolean;
}

export interface ValidateDiscountDto {
    code: string;
    eventId: string;
    ticketPrice: number;
}
