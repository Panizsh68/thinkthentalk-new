
'use client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getEventEvaluationForm, submitEventEvaluation, saveEventEvaluationForm, getEvaluationResponses, getEventRating, type EvaluationAnswers, type EvaluationQuestion, type EventRating } from '@/lib/api/evaluation';
import type { EvaluationForm } from '@/lib/types';

const evaluationKeys = {
  all: ['evaluations'] as const,
  forms: () => [...evaluationKeys.all, 'form'] as const,
  form: (eventId: string, context: 'user' | 'admin' = 'user', identity: string = 'public') =>
    [...evaluationKeys.forms(), eventId, context, identity] as const,
  responses: () => [...evaluationKeys.all, 'responses'] as const,
  responseList: (eventId: string) => [...evaluationKeys.responses(), eventId] as const,
  ratings: () => [...evaluationKeys.all, 'ratings'] as const,
  rating: (eventId: string) => [...evaluationKeys.ratings(), eventId] as const,
};

export function useEvaluationFormQuery(eventId: string, context: 'user' | 'admin' = 'user', identity?: string) {
  const cacheIdentity = context === 'admin' ? 'admin' : (identity || 'public');
  return useQuery({
    queryKey: evaluationKeys.form(eventId, context, cacheIdentity),
    queryFn: () => getEventEvaluationForm(eventId, context), // Backend determines user from token
    enabled: !!eventId,
  });
}

export function useSubmitEvaluationMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { evaluationId: string; eventId: string; answers: EvaluationAnswers }) =>
      submitEventEvaluation(data.evaluationId, data.answers),
    onSuccess: (result, variables) => {
      const eventId = result.eventId || variables.eventId;
      if (eventId) {
        const relatedQueries = queryClient.getQueryCache().findAll({ queryKey: evaluationKeys.forms() });
        relatedQueries.forEach((q) => {
          const [,, cachedEventId, context] = q.queryKey as ReturnType<typeof evaluationKeys.form>;
          if (context === 'user' && cachedEventId === eventId) {
            queryClient.setQueryData(q.queryKey, (prev?: EvaluationForm) =>
              prev ? { ...prev, submitted: true } : prev,
            );
          }
        });
        queryClient.invalidateQueries({ queryKey: evaluationKeys.forms() });
      }
    },
  });
}


export function useSaveEvaluationFormMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: { eventId: string, questions: EvaluationQuestion[] }) =>
            saveEventEvaluationForm(data.eventId, data.questions),
        onSuccess: (savedForm) => {
            // Update the cache for the admin view of this form
            queryClient.setQueryData(evaluationKeys.form(savedForm.eventId, 'admin', 'admin'), savedForm);
        }
    })
}

export function useEvaluationResponsesQuery(eventId: string) {
    return useQuery({
        queryKey: evaluationKeys.responseList(eventId),
        queryFn: () => getEvaluationResponses(eventId),
        enabled: !!eventId,
    })
}

export function useEventRatingQuery(eventId: string) {
  return useQuery<EventRating>({
    queryKey: evaluationKeys.rating(eventId),
    queryFn: () => getEventRating(eventId),
    enabled: !!eventId,
  });
}
