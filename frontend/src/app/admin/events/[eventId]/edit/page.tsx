'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useLanguage } from '@/lib/i18n/language-provider';
import type { UpdateEventFormDataDto } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useAdminEventQuery, useUpdateEventMutation, useArchiveEventMutation, useDeleteEventMutation } from '@/hooks/use-event-queries';
import { useDiscountsQuery } from '@/hooks/use-discount-queries';
import { useRouter, useParams } from 'next/navigation';
import { format } from 'date-fns';
import { Loader2, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getLocalizedTextValue } from '@/lib/i18n/get-localized-text';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Archive, ArchiveRestore, Trash2 } from 'lucide-react';
import { useUploadEventPoster, useDeleteUploadedFile } from '@/hooks/use-upload';

const formatDateTimeLocal = (value?: Date) => value ? format(value, "yyyy-MM-dd'T'HH:mm") : '';
const legacyCategoryMap: Record<string, string> = {
  events: 'event-poster',
  'event-posters': 'event-poster',
  'event-resources': 'event-resource',
};

const getUploadPathFromUrl = (url?: string) => {
  if (!url) return null;
  try {
    const parsed = new URL(url, 'http://localhost');
    const pathname = parsed.pathname;
    if (pathname.startsWith('/uploads/')) {
      const parts = pathname.replace(/^\/uploads\//, '').split('/');
      if (parts.length < 2) return null;
      return { category: parts[0], filename: parts.slice(1).join('/') };
    }
    if (pathname.startsWith('/api/upload/files/')) {
      const parts = pathname.replace(/^\/api\/upload\/files\//, '').split('/');
      if (parts.length < 2) return null;
      const legacyCategory = parts[0];
      return {
        category: legacyCategoryMap[legacyCategory] ?? legacyCategory,
        filename: parts.slice(1).join('/'),
      };
    }
  } catch {
    return null;
  }
  return null;
};

const normalizeUploadUrl = (url?: string) => {
  if (!url) return '';
  const parsed = getUploadPathFromUrl(url);
  if (!parsed) return url;
  const isAbsolute = /^https?:\/\//i.test(url);
  if (!isAbsolute) {
    return `/uploads/${parsed.category}/${parsed.filename}`;
  }
  const origin = new URL(url).origin;
  return `${origin}/uploads/${parsed.category}/${parsed.filename}`;
};

const getEventFormSchema = (t: (key: string) => string) => {
  const localizedSchema = z.object({
    fa: z.string().min(1, t('registration.validation.required')),
    en: z.string().min(1, t('registration.validation.required')),
  });

  return z.object({
    title: localizedSchema,
    categories: z.string().optional(),
    posterUrl: z.string().url().optional().or(z.literal('')),
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
    if (data.endDateTime && data.startDateTime && data.endDateTime < data.startDateTime) {
      return false;
    }
    return true;
  }, {
    message: 'End date/time must be after the start date/time.',
    path: ['endDateTime'],
  });
};


export default function EditEventPage() {
  const { t, language } = useLanguage();
  const params = useParams<{ eventId: string }>();
  const eventId = params.eventId;
  const { toast } = useToast();
  const router = useRouter();

  const { data: event, isLoading: isLoadingEvent, error: eventError } = useAdminEventQuery(eventId);
  const { data: discounts, isLoading: isLoadingDiscounts } = useDiscountsQuery();
  const { mutate: updateEvent, isPending: isSubmitting } = useUpdateEventMutation();
  const { mutate: archiveEvent, isPending: isArchiving } = useArchiveEventMutation();
  const { mutate: deleteEvent, isPending: isDeleting } = useDeleteEventMutation();
  const { mutate: uploadPoster, isPending: isUploading } = useUploadEventPoster();
  const { mutateAsync: deleteUploadedFile, isPending: isDeletingFile } = useDeleteUploadedFile();
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [permanentDelete, setPermanentDelete] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const publicDiscounts = useMemo(() => {
    return discounts?.filter(d => d.isPublic && d.isActive) || [];
  }, [discounts]);

  const form = useForm<UpdateEventFormDataDto>({
    resolver: zodResolver(getEventFormSchema(t)),
    defaultValues: {
      title: { fa: '', en: '' },
      summary: { fa: '', en: '' },
      description: { fa: '', en: '' },
      city: { fa: '', en: '' },
      publicDiscountIds: []
    }
  });

  useEffect(() => {
    if (event) {
      form.reset({
        title: event.title,
        summary: event.summary,
        description: event.description,
        categories: event.categories.join(', '),
        posterUrl: normalizeUploadUrl(event.posterUrl || ''),
        type: event.type,
        city: event.city ?? { fa: '', en: '' },
        address: event.address,
        startDateTime: new Date(event.startDateTime),
        endDateTime: event.endDateTime ? new Date(event.endDateTime) : undefined,
        capacityTotal: event.capacityTotal,
        showRemainingCapacity: event.showRemainingCapacity,
        publicDiscountIds: event.publicDiscountIds || [],
      });
    }
  }, [event, form]);

  const eventType = form.watch('type');
  const posterUrl = form.watch('posterUrl');

  const handleSubmit = (data: UpdateEventFormDataDto) => {
    const cleanedCity = data.city && (data.city.fa.trim() || data.city.en.trim())
      ? {
          fa: data.city.fa.trim(),
          en: data.city.en.trim(),
        }
      : undefined;

    const payload: UpdateEventFormDataDto = {
      ...data,
      title: data.title
        ? { fa: data.title.fa.trim(), en: data.title.en.trim() }
        : undefined,
      summary: data.summary
        ? { fa: data.summary.fa.trim(), en: data.summary.en.trim() }
        : undefined,
      description: data.description
        ? { fa: data.description.fa.trim(), en: data.description.en.trim() }
        : undefined,
      city: cleanedCity,
    };

    updateEvent({ id: eventId, data: payload }, {
      onSuccess: (updatedEvent) => {
        const eventName = getLocalizedTextValue(updatedEvent.title, language);
        toast({
          title: t('admin.events.edit.successTitle'),
          description: t('admin.events.edit.successDescription', { eventName }),
        });
        router.push('/admin/events');
      },
      onError: (error) => {
        toast({
          variant: 'destructive',
          title: t('errors.genericTitle'),
          description: error.message,
        });
      }
    })
  };

  const isLoading = isLoadingEvent || isLoadingDiscounts;

  if (isLoading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  if (eventError || !event) {
    return <p className="text-destructive">{t('errors.fetchEvent')}</p>
  }
  const eventName = getLocalizedTextValue(event.title, language);

  const handleArchiveToggle = () => {
    archiveEvent({ eventId, archived: !event.isArchived }, {
      onSuccess: (updatedEvent) => {
        toast({
          title: t(updatedEvent.isArchived ? 'admin.events.archiveSuccess' : 'admin.events.unarchiveSuccess'),
          description: getLocalizedTextValue(updatedEvent.title, language),
        });
        setArchiveDialogOpen(false);
      },
      onError: (error: any) => {
        toast({
          variant: 'destructive',
          title: t('errors.genericTitle'),
          description: error.message,
        });
      }
    });
  };

  const handleDeleteConfirm = () => {
    deleteEvent({ eventId, force: permanentDelete }, {
      onSuccess: () => {
        toast({
          title: t(permanentDelete ? 'admin.events.deleteSuccessPermanent' : 'admin.events.deleteSuccess'),
          description: eventName,
        });
        setDeleteDialogOpen(false);
        setPermanentDelete(false);
        router.push('/admin/events');
      },
      onError: (error: any) => {
        toast({
          variant: 'destructive',
          title: t('errors.genericTitle'),
          description: error.message,
        });
      }
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-2xl font-bold">{t('admin.events.edit.title')}</h1>
            <p className="text-muted-foreground">{t('admin.events.edit.subtitle', { eventName })}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setArchiveDialogOpen(true)}
              disabled={isArchiving}
            >
              {event.isArchived ? (
                <>
                  <ArchiveRestore className="mr-2 h-4 w-4" />
                  {t('admin.events.actions.unarchive')}
                </>
              ) : (
                <>
                  <Archive className="mr-2 h-4 w-4" />
                  {t('admin.events.actions.archive')}
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => setDeleteDialogOpen(true)}
              disabled={isDeleting}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {t('admin.events.actions.delete')}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('admin.events.form.saveChanges')}
            </Button>
          </div>
        </div>

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
            <div className="space-y-2">
              <Label>{t('admin.events.form.posterUrl')}</Label>
              <Input
                type="file"
                accept="image/*"
                placeholder={t('admin.events.form.posterUrl')}
                disabled={isUploading || isDeletingFile}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;

                  setUploadError(null);
                  const previousUrl = form.getValues('posterUrl');
                  uploadPoster(file, {
                    onSuccess: async (data) => {
                      const previousPath = getUploadPathFromUrl(previousUrl);
                      if (previousPath) {
                        try {
                          await deleteUploadedFile(previousPath);
                        } catch {
                          // Best-effort cleanup; continue updating poster URL.
                        }
                      }
                      form.setValue('posterUrl', data.url);
                    },
                    onError: (error: any) => {
                      setUploadError(error.message || 'Upload failed');
                      e.target.value = '';
                    },
                  });
                }}
              />
              <FormDescription>{t('admin.events.form.posterDesc')}</FormDescription>
              {uploadError && <p className="text-red-500 text-sm">{uploadError}</p>}
            </div>
            {posterUrl && (
              <div className="relative w-full max-w-sm rounded-md overflow-hidden border">
                <Image src={posterUrl} alt="Event Poster Preview" width={600} height={400} className="object-cover" />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 h-7 w-7"
                  disabled={isDeletingFile}
                  onClick={async () => {
                    const previousPath = getUploadPathFromUrl(posterUrl);
                    if (previousPath) {
                      try {
                        await deleteUploadedFile(previousPath);
                      } catch {
                        // Best-effort cleanup; still clear the field.
                      }
                    }
                    form.setValue('posterUrl', '');
                  }}
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

        <Card>
          <CardHeader>
            <CardTitle>{t('admin.events.form.publicDiscountsTitle')}</CardTitle>
            <CardDescription>{t('admin.events.form.publicDiscountsDesc')}</CardDescription>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="publicDiscountIds"
              render={() => (
                <FormItem>
                  <ScrollArea className="h-48 rounded-md border">
                    <div className="p-4 space-y-2">
                      {publicDiscounts.length === 0 && <p className="text-muted-foreground text-sm">{t('admin.events.form.noPublicDiscounts')}</p>}
                      {publicDiscounts.map((discount) => (
                        <FormField
                          key={discount.id}
                          control={form.control}
                          name="publicDiscountIds"
                          render={({ field }) => {
                            return (
                              <FormItem
                                key={discount.id}
                                className="flex flex-row items-start space-x-3 space-y-0"
                              >
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(discount.id)}
                                    onCheckedChange={(checked) => {
                                      return checked
                                        ? field.onChange([...(field.value || []), discount.id])
                                        : field.onChange(field.value?.filter((value) => value !== discount.id))
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="font-normal">
                                  {discount.name} ({discount.type === 'PERCENT' ? `${discount.value}%` : `${discount.value.toLocaleString()} TOMAN`})
                                </FormLabel>
                              </FormItem>
                            )
                          }}
                        />
                      ))}
                    </div>
                  </ScrollArea>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>
      </form>
      <AlertDialog open={archiveDialogOpen} onOpenChange={setArchiveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {event.isArchived ? t('admin.events.confirm.unarchiveTitle') : t('admin.events.confirm.archiveTitle')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {event.isArchived ? t('admin.events.confirm.unarchiveDescription') : t('admin.events.confirm.archiveDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('admin.resources.form.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleArchiveToggle} disabled={isArchiving}>
              {event.isArchived ? t('admin.events.actions.unarchive') : t('admin.events.actions.archive')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={(open) => { setDeleteDialogOpen(open); if (!open) setPermanentDelete(false); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('admin.events.confirm.deleteTitle')}</AlertDialogTitle>
            <AlertDialogDescription>{t('admin.events.confirm.deleteDescription')}</AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex items-start space-x-2 py-4">
            <Checkbox
              id="permanent-delete-checkbox"
              checked={permanentDelete}
              onCheckedChange={(checked) => setPermanentDelete(Boolean(checked))}
            />
            <label htmlFor="permanent-delete-checkbox" className="text-sm leading-relaxed">
              {t('admin.events.confirm.permanentCheckbox')}
            </label>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('admin.resources.form.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
            >
              {permanentDelete ? t('admin.events.actions.deletePermanent') : t('admin.events.actions.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Form>
  );
}
