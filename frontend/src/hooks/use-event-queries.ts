
'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getEvents, getEventById } from '@/lib/api/events';
import { getAdminEvents, getAdminEventById, createEvent, updateEvent, updateEventTickets, updateEventResources, archiveEvent as archiveEventApi, deleteEvent as deleteEventApi } from '@/lib/api/admin-events';
import type { GetAdminEventsParams } from '@/lib/api/admin-events';
import type { GetEventsParams as GetPublicEventsParams } from '@/lib/api/events';
import type { Event, EventFormData, UpdateEventFormDataDto, EventTicketConfig, EventResource } from '@/lib/types';


export const eventKeys = {
  all: ['events'] as const,
  lists: () => [...eventKeys.all, 'list'] as const,
  list: (params: GetPublicEventsParams) => [...eventKeys.lists(), params] as const,
  adminLists: () => [...eventKeys.all, 'admin-list'] as const,
  adminList: (params: GetAdminEventsParams) => [...eventKeys.adminLists(), params] as const,
  details: () => [...eventKeys.all, 'detail'] as const,
  detail: (id: string) => [...eventKeys.details(), id] as const,
  adminDetails: () => [...eventKeys.all, 'admin-detail'] as const,
  adminDetail: (id: string) => [...eventKeys.adminDetails(), id] as const,
};

export function useEventsQuery(params: GetPublicEventsParams = {}) {
  return useQuery({
    queryKey: eventKeys.list(params),
    queryFn: () => getEvents(params),
  });
}

export function useAdminEventsQuery(params: GetAdminEventsParams = {}) {
    return useQuery({
        queryKey: eventKeys.adminList(params),
        queryFn: () => getAdminEvents(params),
    });
}

export function useEventQuery(id: string) {
  return useQuery({
    queryKey: eventKeys.detail(id),
    queryFn: () => getEventById(id),
    enabled: !!id,
  });
}

export function useAdminEventQuery(id: string) {
  return useQuery({
    queryKey: eventKeys.adminDetail(id),
    queryFn: () => getAdminEventById(id),
    enabled: !!id,
  });
}

export function useCreateEventMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (eventData: EventFormData) => createEvent(eventData),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: eventKeys.adminLists() });
        }
    })
}

export function useUpdateEventMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateEventFormDataDto }) => updateEvent(id, data),
    onSuccess: (updatedEvent) => {
      queryClient.invalidateQueries({ queryKey: eventKeys.adminLists() });
      queryClient.setQueryData(eventKeys.adminDetail(updatedEvent.id), updatedEvent);
      queryClient.invalidateQueries({ queryKey: eventKeys.detail(updatedEvent.id), exact: true });
    },
  });
}

export function useUpdateEventTicketsMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ eventId, tickets }: { eventId: string; tickets: EventTicketConfig[] }) =>
      updateEventTickets(eventId, tickets),
    onSuccess: (updatedEvent) => {
      queryClient.invalidateQueries({ queryKey: eventKeys.adminLists() });
      queryClient.setQueryData(eventKeys.adminDetail(updatedEvent.id), updatedEvent);
      queryClient.invalidateQueries({ queryKey: eventKeys.detail(updatedEvent.id), exact: true });
    },
  });
}

export function useUpdateEventResourcesMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ eventId, resources }: { eventId: string; resources: Partial<EventResource>[] }) =>
      updateEventResources(eventId, resources),
    onSuccess: (updatedEvent) => {
      queryClient.invalidateQueries({ queryKey: eventKeys.adminLists() });
      queryClient.setQueryData(eventKeys.adminDetail(updatedEvent.id), updatedEvent);
      queryClient.invalidateQueries({ queryKey: eventKeys.detail(updatedEvent.id), exact: true });
    },
  });
}

export function useArchiveEventMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ eventId, archived }: { eventId: string; archived: boolean }) =>
      archiveEventApi(eventId, archived),
    onSuccess: (updatedEvent) => {
      queryClient.invalidateQueries({ queryKey: eventKeys.adminLists() });
      queryClient.setQueryData(eventKeys.adminDetail(updatedEvent.id), updatedEvent);
      queryClient.invalidateQueries({ queryKey: eventKeys.detail(updatedEvent.id), exact: true });
    },
  });
}

export function useDeleteEventMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ eventId, force }: { eventId: string; force?: boolean }) =>
      deleteEventApi(eventId, { force }),
    onSuccess: (updatedEvent) => {
      queryClient.invalidateQueries({ queryKey: eventKeys.adminLists() });
      queryClient.removeQueries({ queryKey: eventKeys.adminDetail(updatedEvent.id) });
      queryClient.invalidateQueries({ queryKey: eventKeys.detail(updatedEvent.id), exact: true });
    },
  });
}
