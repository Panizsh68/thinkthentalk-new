
'use client';
import { useMutation } from '@tanstack/react-query';
import { sendBulkMessage } from '@/lib/api/messaging';
import type { SendBulkMessageDto } from '@/lib/types';

export function useSendBulkMessageMutation() {
    return useMutation({
        mutationFn: (data: SendBulkMessageDto) => sendBulkMessage(data),
    });
}
