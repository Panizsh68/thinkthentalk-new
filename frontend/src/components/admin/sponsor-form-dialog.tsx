
'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useLanguage } from '@/lib/i18n/language-provider';
import type { Sponsor, SponsorFormData } from '@/lib/types';
import { useDeleteUploadedFile, useUploadSponsorLogo } from '@/hooks/use-upload';
import Image from 'next/image';
import { getUploadedFilePath, isUploadUrl, normalizeUploadedFileUrl, sameUploadedFilePath } from '@/lib/uploads';

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, X } from 'lucide-react';

const getSponsorSchema = (t: (key: string) => string) => z.object({
  name: z.string().min(1, t('registration.validation.required')),
  productOrTagline: z.string().min(1, t('registration.validation.required')),
  logoUrl: z.string().trim().refine((value) => isUploadUrl(value), t('admin.sponsors.validation.invalidUrl')),
  websiteUrl: z.string().url(t('admin.sponsors.validation.invalidUrl')).optional().or(z.literal('')),
});

interface SponsorFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sponsor: Sponsor | null;
  isSubmitting: boolean;
  onSubmit: (data: SponsorFormData) => void;
}

export function SponsorFormDialog({ open, onOpenChange, sponsor, isSubmitting, onSubmit }: SponsorFormDialogProps) {
  const { t } = useLanguage();
  const { mutate: uploadLogo, isPending: isUploading } = useUploadSponsorLogo();
  const { mutateAsync: deleteUploadedFile, isPending: isDeletingFile } = useDeleteUploadedFile();
  const [uploadError, setUploadError] = useState<string | null>(null);

  const form = useForm<SponsorFormData>({
    resolver: zodResolver(getSponsorSchema(t)),
    defaultValues: {
      name: '',
      productOrTagline: '',
      logoUrl: '',
      websiteUrl: '',
    }
  });

  useEffect(() => {
    if (!open) return;
    if (sponsor) {
      form.reset({
        ...sponsor,
        logoUrl: normalizeUploadedFileUrl(sponsor.logoUrl),
      });
    } else {
      form.reset({
        name: '',
        productOrTagline: '',
        logoUrl: '',
        websiteUrl: '',
      });
    }
    // Only run when dialog opens or sponsor changes to avoid wiping user input mid-upload
  }, [sponsor?.id, open, form]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{sponsor ? t('admin.sponsors.edit.title') : t('admin.sponsors.create.title')}</DialogTitle>
          <DialogDescription>{sponsor ? t('admin.sponsors.edit.subtitle') : t('admin.sponsors.create.subtitle')}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem>
                <FormLabel>{t('admin.sponsors.form.name')}</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="productOrTagline" render={({ field }) => (
              <FormItem>
                <FormLabel>{t('admin.sponsors.form.tagline')}</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="logoUrl" render={({ field }) => (
              <FormItem>
                <FormLabel>{t('admin.sponsors.form.logoUrl')}</FormLabel>
                <FormControl>
                  <div className="space-y-3">
                    <Input
                      type="file"
                      accept="image/*,.svg"
                      disabled={isUploading}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;

                        setUploadError(null);
                        uploadLogo(file, {
                          onSuccess: (data) => {
                            const previousPath = getUploadedFilePath(field.value);
                            const nextPath = getUploadedFilePath(data.url);
                            if (previousPath && !sameUploadedFilePath(previousPath, nextPath)) {
                              void deleteUploadedFile(previousPath).catch(() => undefined);
                            }
                            field.onChange(normalizeUploadedFileUrl(data.url));
                            e.target.value = '';
                          },
                          onError: (error: any) => {
                            setUploadError(error.message || 'Upload failed');
                            e.target.value = '';
                          },
                        });
                      }}
                    />
                    {isUploading && <p className="text-sm text-gray-500 flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Uploading...</p>}
                    {uploadError && <p className="text-sm text-red-500">{uploadError}</p>}
                    {field.value && (
                      <div className="relative w-32 h-32 rounded-lg overflow-hidden border">
                        <Image src={field.value} alt="Sponsor logo" width={128} height={128} className="w-full h-full object-contain p-2" />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute top-1 right-1 h-6 w-6"
                          onClick={async () => {
                            const previousPath = getUploadedFilePath(field.value);
                            if (previousPath) {
                              try {
                                await deleteUploadedFile(previousPath);
                              } catch {
                                // Best effort cleanup.
                              }
                            }
                            form.setValue('logoUrl', '');
                          }}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                </FormControl>
                <FormDescription>{t('admin.events.form.posterDesc')}</FormDescription>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="websiteUrl" render={({ field }) => (
              <FormItem>
                <FormLabel>{t('admin.sponsors.form.websiteUrl')}</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>{t('admin.resources.form.cancel')}</Button>
                <Button type="submit" disabled={isSubmitting || isDeletingFile}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {sponsor ? t('admin.resources.form.save') : t('admin.resources.form.add')}
                </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
