
'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useLanguage } from '@/lib/i18n/language-provider';
import type { TeamMember, TeamMemberFormData } from '@/lib/types';
import { useUploadTeamMember } from '@/hooks/use-upload';
import { X } from 'lucide-react';

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';

const getTeamMemberSchema = (t: (key: string) => string) => z.object({
  name: z.string().min(1, t('registration.validation.required')),
  role: z.string().min(1, t('registration.validation.required')),
  photoUrl: z.string().min(1, t('registration.validation.required')).refine(
    (value) => /^(https?:\/\/\S+|\/\S+)$/.test(value),
    t('admin.sponsors.validation.invalidUrl'),
  ),
});

interface TeamMemberFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: TeamMember | null;
  isSubmitting: boolean;
  onSubmit: (data: TeamMemberFormData) => void;
}

export function TeamMemberFormDialog({ open, onOpenChange, member, isSubmitting, onSubmit }: TeamMemberFormDialogProps) {
  const { t } = useLanguage();
  const { mutate: uploadPhoto, isPending: isUploading } = useUploadTeamMember();
  const [uploadError, setUploadError] = useState<string | null>(null);

  const form = useForm<TeamMemberFormData>({
    resolver: zodResolver(getTeamMemberSchema(t)),
    defaultValues: {
      name: '',
      role: '',
      photoUrl: '',
    }
  });

  useEffect(() => {
    if (!open) return;
    if (member) {
      form.reset(member);
    } else {
      form.reset({
        name: '',
        role: '',
        photoUrl: '',
      });
    }
    // only reset when dialog opens or member changes to avoid wiping inputs during upload
  }, [member?.id, open, form]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{member ? t('admin.team.edit.title') : t('admin.team.create.title')}</DialogTitle>
          <DialogDescription>{member ? t('admin.team.edit.subtitle') : t('admin.team.create.subtitle')}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem>
                <FormLabel>{t('admin.team.form.name')}</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="role" render={({ field }) => (
              <FormItem>
                <FormLabel>{t('admin.team.form.role')}</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="photoUrl" render={({ field }) => (
              <FormItem>
                <FormLabel>{t('admin.team.form.photoUrl')}</FormLabel>
                <FormControl>
                  <div className="space-y-3">
                    <Input
                      type="file"
                      accept="image/*"
                      disabled={isUploading}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;

                        setUploadError(null);
                        uploadPhoto(file, {
                          onSuccess: (data) => {
                            field.onChange(data.url);
                            e.target.value = '';
                          },
                          onError: (error) => setUploadError(error.message),
                        });
                      }}
                    />
                    {isUploading && <p className="text-sm text-gray-500 flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Uploading...</p>}
                    {uploadError && <p className="text-sm text-red-500">{uploadError}</p>}
                    {field.value && (
                      <div className="relative w-32 h-32 rounded-lg overflow-hidden border">
                        <img src={field.value} alt="Team member" className="w-full h-full object-cover" />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute top-1 right-1 h-6 w-6"
                          onClick={() => form.setValue('photoUrl', '')}
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
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>{t('admin.resources.form.cancel')}</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {member ? t('admin.resources.form.save') : t('admin.resources.form.add')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
