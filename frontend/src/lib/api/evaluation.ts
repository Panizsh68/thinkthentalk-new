
'use client';
import apiClient from './client';
import type { EvaluationForm, EvaluationAnswers, EvaluationQuestion, EvaluationResponse } from '@/lib/types';

export type { EvaluationAnswers, EvaluationQuestion };
export type EventRating = { average: number | null; count: number };

type EvaluationContext = 'user' | 'admin';

export async function getEventEvaluationForm(eventId: string, context: EvaluationContext = 'user'): Promise<EvaluationForm | null> {
  const path = context === 'admin'
    ? `/admin/events/${eventId}/evaluation`
    : `/events/${eventId}/evaluation`;

  try {
    const { data } = await apiClient.get<EvaluationForm>(path);
    return data;
  } catch (error: any) {
    if (error.status === 404) {
      if (context === 'user') {
        // Form not created for this event yet
        return {
          id: `temp-eval-id-${eventId}`,
          eventId,
          questions: [],
          submitted: false
        };
      }
      throw error;
    }
    if (context === 'user' && error.status === 403) {
      // Not eligible
      throw new Error("User is not eligible for this evaluation.");
    }
    console.error(`Failed to fetch evaluation form for event ${eventId}:`, error);
    throw error;
  }
}

export async function submitEventEvaluation(
  evaluationId: string,
  answers: EvaluationAnswers
): Promise<{ success: boolean; eventId: string; }> {
  try {
    const { data } = await apiClient.post<{ success: boolean; eventId: string }>(`/evaluations/${evaluationId}/submit`, { answers });
    return data;
  } catch (error: any) {
    console.error(`Failed to submit evaluation for ${evaluationId}:`, error);
    throw new Error(error.message || 'Failed to submit evaluation.');
  }
}


export async function saveEventEvaluationForm(eventId: string, questions: EvaluationQuestion[]): Promise<EvaluationForm> {
  try {
    const { data } = await apiClient.patch<EvaluationForm>(`/admin/events/${eventId}/evaluation`, { questions });
    return data;
  } catch (error: any) {
    console.error(`Failed to save evaluation form for event ${eventId}:`, error);
    throw new Error(error.message || 'Failed to save form.');
  }
}


export async function getEvaluationResponses(eventId: string): Promise<EvaluationResponse[]> {
  try {
    const { data } = await apiClient.get<EvaluationResponse[]>(`/admin/events/${eventId}/evaluation/responses`);
    return data;
  } catch (error: any) {
    if (error.status === 404) {
      return []; // Form might exist but has no responses yet
    }
    console.error(`Failed to fetch responses for event ${eventId}:`, error);
    throw new Error(error.message || 'Failed to fetch responses.');
  }
}

export async function getEventRating(eventId: string): Promise<EventRating> {
  try {
    const { data } = await apiClient.get<EventRating>(`/events/${eventId}/evaluation/rating`);
    return data;
  } catch (error: any) {
    console.error(`Failed to fetch rating for event ${eventId}:`, error);
    return { average: null, count: 0 };
  }
}
