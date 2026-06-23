import apiClient from './client';
import type { SubscriptionPlan, Subscription } from '../types';

export async function getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
  const { data } = await apiClient.get<any[]>('/subscriptions/plans');
  return data;
}

export async function getMySubscription(): Promise<Subscription | null> {
  try {
    const { data } = await apiClient.get<any>('/subscriptions/me');
    return data;
  } catch {
    return null;
  }
}

export async function purchaseSubscription(planId: string): Promise<Subscription> {
  const { data } = await apiClient.post<any>('/subscriptions/subscribe', { planId });
  return data;
}
