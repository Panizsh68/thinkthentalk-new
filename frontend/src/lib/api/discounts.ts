
'use client';
import apiClient from './client';
import type { Discount, DiscountFormData, UpdateDiscountFormDataDto, ValidateDiscountDto } from '../types';

const transformDiscount = (discount: any): Discount => ({
  ...discount,
  value: Number(discount.value),
  maxUses: discount.maxUses !== null ? Number(discount.maxUses) : undefined,
  usedCount: Number(discount.usedCount),
  maxUsesPerUser: discount.maxUsesPerUser !== null ? Number(discount.maxUsesPerUser) : undefined,
  minAmount: discount.minAmount !== null ? Number(discount.minAmount) : undefined,
  startDate: discount.startDate,
  endDate: discount.endDate,
});


export async function getDiscounts(): Promise<Discount[]> {
  const { data } = await apiClient.get<any[]>('/admin/discounts');
  return data.map(transformDiscount);
}

export async function createDiscount(data: DiscountFormData): Promise<Discount> {
  const { data: newDiscount } = await apiClient.post<any>('/admin/discounts', data);
  return transformDiscount(newDiscount);
}

export async function updateDiscount(id: string, data: Partial<UpdateDiscountFormDataDto>): Promise<Discount> {
  const { data: updatedDiscount } = await apiClient.patch<any>(`/admin/discounts/${id}`, data);
  return transformDiscount(updatedDiscount);
}

export async function deleteDiscount(id: string): Promise<{ id: string }> {
  await apiClient.delete(`/admin/discounts/${id}`);
  return { id };
}

export async function validateDiscountCode(payload: ValidateDiscountDto): Promise<Discount> {
  try {
    const { data } = await apiClient.post<any>('/discounts/validate', payload);
    return transformDiscount(data);
  } catch (error: any) {
    console.error('Failed to validate discount code:', error);
    throw new Error(error.message || 'admin.discounts.errors.invalidCode');
  }
}
