
'use client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getEventEvaluationForm, submitEventEvaluation, saveEventEvaluationForm, getEvaluationResponses, type EvaluationAnswers, type EvaluationQuestion } from '@/lib/api/evaluation';

const evaluationKeys = {
  all: ['evaluations'] as const,
  forms: () => [...evaluationKeys.all, 'form'] as const,
  form: (eventId: string, userId?: string) => [...evaluationKeys.forms(), eventId, userId || 'public'] as const,
  responses: () => [...evaluationKeys.all, 'responses'] as const,
  responseList: (eventId: string) => [...evaluationKeys.responses(), eventId] as const,
};

export function useEvaluationFormQuery(eventId: string, userId?: string) {
  return useQuery({
    queryKey: evaluationKeys.form(eventId, userId),
    queryFn: () => getEventEvaluationForm(eventId), // Backend determines user from token
    enabled: !!eventId,
  });
}

export function useSubmitEvaluationMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { evaluationId: string; answers: EvaluationAnswers }) => 
        submitEventEvaluation(data.evaluationId, data.answers),
    onSuccess: (data, variables) => {
        // Need to figure out the eventId to invalidate the form query
        const queryCache = queryClient.getQueryCache();
        const queries = queryCache.findAll({ queryKey: evaluationKeys.forms() });
        
        const formQuery = queries.find(q => {
            const data = queryClient.getQueryData(q.queryKey) as any;
            return data?.id === variables.evaluationId;
        });

        if (formQuery) {
            const eventId = (formQuery.queryKey[2] as string);
            queryClient.invalidateQueries({ queryKey: evaluationKeys.form(eventId) });
        }
    },
  });
}


export function useSaveEvaluationFormMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: { eventId: string, questions: Partial<EvaluationQuestion>[]}) =>
            saveEventEvaluationForm(data.eventId, data.questions),
        onSuccess: (savedForm) => {
            // Update the cache for the admin view of this form
            queryClient.setQueryData(evaluationKeys.form(savedForm.eventId, 'admin'), savedForm);
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
