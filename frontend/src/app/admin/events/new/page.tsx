
'use client';
import { EventFormPart1 } from '@/components/admin/event-form-part1';
import { useLanguage } from '@/lib/i18n/language-provider';
import type { EventFormData } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { useCreateEventMutation } from '@/hooks/use-event-queries';
import { getLocalizedTextValue } from '@/lib/i18n/get-localized-text';

export default function NewEventPage() {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const router = useRouter();
  const { mutateAsync: createEvent, isPending } = useCreateEventMutation();

  const handleSubmit = async (data: EventFormData) => {
    try {
      // Convert empty strings to undefined for optional fields
      const cleanedData = {
        ...data,
        summary: {
          fa: data.summary.fa || '',
          en: data.summary.en || undefined,
        },
        description: {
          fa: data.description.fa || '',
          en: data.description.en || undefined,
        },
      };
      const newEvent = await createEvent(cleanedData);
      toast({
        title: t('admin.events.create.successTitle'),
        description: t('admin.events.create.successDescription', {
          eventName: getLocalizedTextValue(newEvent.title, language),
        }),
      });
      router.push(`/admin/events/${newEvent.id}/edit`);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: t('errors.genericTitle'),
        description: error.message
      });
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{t('admin.events.create.title')}</h1>
        <p className="text-muted-foreground">{t('admin.events.create.subtitle')}</p>
      </div>
      <EventFormPart1 onSubmit={handleSubmit} isSubmitting={isPending} />
    </div>
  );
}
