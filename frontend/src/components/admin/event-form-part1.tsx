
'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useLanguage } from '@/lib/i18n/language-provider';
import type { EventFormData } from '@/lib/types';
import { useState } from 'react';
import { format } from 'date-fns';
import { Loader2, X } from 'lucide-react';
import Image from 'next/image';
import { useUploadEventPoster } from '@/hooks/use-upload';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { Separator } from '../ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Textarea } from '../ui/textarea';
import { isUploadUrl, normalizeUploadedFileUrl } from '@/lib/uploads';

const formatDateTimeLocal = (value?: Date) => value ? format(value, "yyyy-MM-dd'T'HH:mm") : '';

const getEventFormSchema = (t: (key: string) => string) => {
  const localizedSchema = z.object({
    fa: z.string().min(1, t('registration.validation.required')),
    en: z.string().min(1, t('registration.validation.required')),
  });

  return z.object({
    title: localizedSchema,
    categories: z.string().optional(),
    posterUrl: z
      .string()
      .trim()
      .refine((value) => value === '' || isUploadUrl(value), {
        message: t('admin.sponsors.validation.invalidUrl'),
      })
      .optional()
      .or(z.literal('')),
    summary: localizedSchema,
    description: localizedSchema,
    type: z.enum(['ONLINE', 'OFFLINE']),
    city: localizedSchema.optional(),
    address: z.string().optional(),
    startDateTime: z.date({ required_error: t('registration.validation.required') }),
    endDateTime: z.date().optional(),
    capacityTotal: z.coerce.number().int().min(0, t('admin.events.validation.nonNegative')),
    showRemainingCapacity: z.boolean().default(false),
    publicDiscountIds: z.array(z.string()).optional(),
  }).refine(data => {
    if (data.type === 'OFFLINE') {
      return Boolean(data.city && data.city.fa && data.city.en);
    }
    return true;
  }, {
    message: t('registration.validation.required'),
    path: ['city'],
  }).refine(data => {
    if (data.endDateTime && data.endDateTime < data.startDateTime) {
      return false;
    }
    return true;
  }, {
    message: 'End date/time must be after the start date/time.',
    path: ['endDateTime'],
  });
};

interface EventFormPart1Props {
  initialData?: Partial<EventFormData>;
  onSubmit: (data: EventFormData) => Promise<void>;
  isSubmitting: boolean;
}

// THIS COMPONENT IS NOW ONLY USED FOR CREATING NEW EVENTS
export function EventFormPart1({ initialData, onSubmit, isSubmitting }: EventFormPart1Props) {
  const { t } = useLanguage();
  const { mutate: uploadPoster, isPending: isUploading } = useUploadEventPoster();
  const [uploadError, setUploadError] = useState<string | null>(null);
  const form = useForm<EventFormData>({
    resolver: zodResolver(getEventFormSchema(t)),
    defaultValues: {
      title: { fa: '', en: '' },
      categories: '',
      posterUrl: '',
      summary: { fa: '', en: '' },
      description: { fa: '', en: '' },
      type: 'ONLINE',
      city: { fa: '', en: '' },
      address: '',
      startDateTime: undefined,
      endDateTime: undefined,
      capacityTotal: 0,
      showRemainingCapacity: false,
      ...initialData,
    },
  });

  const eventType = form.watch('type');
  const posterUrl = form.watch('posterUrl');

  const handleFormSubmit = async (data: EventFormData) => {
    const cleanedCity = data.city && (data.city.fa.trim() || data.city.en.trim())
      ? {
          fa: data.city.fa.trim(),
          en: data.city.en.trim(),
        }
      : undefined;

    await onSubmit({
      ...data,
      title: {
        fa: data.title.fa.trim(),
        en: data.title.en.trim(),
      },
      summary: {
        fa: data.summary.fa.trim(),
        en: data.summary.en.trim(),
      },
      description: {
        fa: data.description.fa.trim(),
        en: data.description.en.trim(),
      },
      city: cleanedCity,
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>{t('admin.events.form.basicInfo')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField control={form.control} name="title.fa" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('admin.events.form.titleFa')}</FormLabel>
                  <FormControl><Input dir="rtl" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="title.en" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('admin.events.form.titleEn')}</FormLabel>
                  <FormControl><Input dir="ltr" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <FormField control={form.control} name="categories" render={({ field }) => (
              <FormItem>
                <FormLabel>{t('admin.events.form.categories')}</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormDescription>{t('admin.events.form.categoriesDesc')}</FormDescription>
                <FormMessage />
              </FormItem>
            )} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>{t('admin.events.form.poster')}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="posterUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('admin.events.form.posterUrl')}</FormLabel>
                  <FormControl>
                    <div className="flex gap-2">
                      <Input
                        placeholder={t('admin.events.form.selectPosterImage')}
                        type="file"
                        accept="image/*"
                        disabled={isUploading}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;

                          setUploadError(null);
                          uploadPoster(file, {
                            onSuccess: (data) => {
                              field.onChange(normalizeUploadedFileUrl(data.url));
                            },
                            onError: (error: any) => {
                              setUploadError(error.message || 'Upload failed');
                              e.target.value = ''; // Reset input
                            },
                          });
                        }}
                      />
                      {isUploading && <Loader2 className="h-10 w-10 animate-spin" />}
                    </div>
                  </FormControl>
                  <FormDescription>{t('admin.events.form.posterDesc')}</FormDescription>
                  {uploadError && <p className="text-red-500 text-sm">{uploadError}</p>}
                  <FormMessage />
                </FormItem>
              )}
            />
            {posterUrl && (
              <div className="relative w-full max-w-sm rounded-md overflow-hidden border">
                <Image src={posterUrl} alt="Event Poster Preview" width={600} height={400} className="object-cover" />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 h-7 w-7"
                  onClick={() => form.setValue('posterUrl', '')}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('admin.events.form.content')}</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="fa" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="fa">{t('language.fa')}</TabsTrigger>
                <TabsTrigger value="en">{t('language.en')}</TabsTrigger>
              </TabsList>
              <TabsContent value="fa" className="space-y-4 pt-4">
                <FormField control={form.control} name="summary.fa" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('admin.events.form.summary')}</FormLabel>
                    <FormControl><Textarea dir="rtl" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="description.fa" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('admin.events.form.description')}</FormLabel>
                    <FormControl><Textarea dir="rtl" rows={5} {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </TabsContent>
              <TabsContent value="en" className="space-y-4 pt-4">
                <FormField control={form.control} name="summary.en" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('admin.events.form.summary')}</FormLabel>
                    <FormControl><Textarea dir="ltr" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="description.en" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('admin.events.form.description')}</FormLabel>
                    <FormControl><Textarea dir="ltr" rows={5} {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('admin.events.form.locationAndDate')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormField control={form.control} name="type" render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel>{t('filters.eventType')}</FormLabel>
                <FormControl>
                  <RadioGroup onValueChange={field.onChange} value={field.value} className="flex gap-4">
                    <FormItem className="flex items-center space-x-2 space-y-0">
                      <FormControl><RadioGroupItem value="ONLINE" /></FormControl>
                      <FormLabel className="font-normal">{t('event.online')}</FormLabel>
                    </FormItem>
                    <FormItem className="flex items-center space-x-2 space-y-0">
                      <FormControl><RadioGroupItem value="OFFLINE" /></FormControl>
                      <FormLabel className="font-normal">{t('event.offline')}</FormLabel>
                    </FormItem>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            {eventType === 'OFFLINE' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="city.fa" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('admin.events.form.cityFa')}</FormLabel>
                    <FormControl><Input dir="rtl" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="city.en" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('admin.events.form.cityEn')}</FormLabel>
                    <FormControl><Input dir="ltr" {...field} /></FormControl>
                    <FormDescription>{t('admin.events.form.cityDesc')}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="address" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('admin.events.form.address')}</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
            )}
            <Separator />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startDateTime"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>{t('admin.events.form.startDateTime')}</FormLabel>
                    <FormControl>
                      <Input
                        type="datetime-local"
                        value={formatDateTimeLocal(field.value)}
                        onChange={(event) => {
                          const value = event.target.value;
                          field.onChange(value ? new Date(value) : undefined);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="endDateTime"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>{t('admin.events.form.endDateTime')}</FormLabel>
                    <FormControl>
                      <Input
                        type="datetime-local"
                        value={formatDateTimeLocal(field.value)}
                        onChange={(event) => {
                          const value = event.target.value;
                          field.onChange(value ? new Date(value) : undefined);
                        }}
                      />
                    </FormControl>
                    <FormDescription>{t('admin.events.form.endDateTimeOptional')}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('admin.events.form.capacity')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormField control={form.control} name="capacityTotal" render={({ field }) => (
              <FormItem>
                <FormLabel>{t('admin.events.form.capacityTotal')}</FormLabel>
                <FormControl><Input type="number" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="showRemainingCapacity" render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">{t('admin.events.form.showRemainingCapacity')}</FormLabel>
                  <FormDescription>{t('admin.events.form.showRemainingCapacityDesc')}</FormDescription>
                </div>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
              </FormItem>
            )} />
          </CardContent>
        </Card>

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {t('admin.events.form.createEvent')}
        </Button>
      </form>
    </Form>
  );
}
