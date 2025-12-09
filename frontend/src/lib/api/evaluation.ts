
'use client';
import apiClient from './client';
import type { EvaluationForm, EvaluationSubmission, EvaluationAnswers, EvaluationQuestion, EvaluationResponse } from '@/lib/types';

export type { EvaluationAnswers, EvaluationQuestion };

export async function getEventEvaluationForm(eventId: string, userId?: string): Promise<EvaluationForm | null> {
  // The backend determines eligibility based on the user's token, so userId is not sent in the request
  try {
    const { data } = await apiClient.get<EvaluationForm>(`/events/${eventId}/evaluation`);
    return data;
  } catch (error: any) {
    if (error.status === 404) {
      // Form not created for this event yet
      return {
        id: `temp-eval-id-${eventId}`,
        eventId,
        questions: [],
        submitted: false
      };
    }
    if (error.status === 403) {
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
    return { ...data, eventId: '' }; // The backend doesn't return eventId, but we might need it for cache invalidation
  } catch (error: any) {
    console.error(`Failed to submit evaluation for ${evaluationId}:`, error);
    throw new Error(error.message || 'Failed to submit evaluation.');
  }
}


export async function saveEventEvaluationForm(eventId: string, questions: Partial<EvaluationQuestion>[]): Promise<EvaluationForm> {
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
