
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAdminEventQuery, useUpdateEventResourcesMutation } from '@/hooks/use-event-queries';
import { useLanguage } from '@/lib/i18n/language-provider';
import type { EventResource } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useParams } from 'next/navigation';
import { useUploadEventResource } from '@/hooks/use-upload';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Loader2, PlusCircle, Edit, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { getUploadedFilePath, isUploadUrl, normalizeUploadedFileUrl, sameUploadedFilePath } from '@/lib/uploads';
import { useDeleteUploadedFile } from '@/hooks/use-upload';

const getResourceSchema = (t: (key: string) => string) => z.object({
  id: z.string().optional(),
  title: z.object({
    fa: z.string().min(1, t('registration.validation.required')),
    en: z.string().min(1, t('registration.validation.required')),
  }),
  description: z.string().optional(),
  accessLevel: z.enum(['PUBLIC', 'REGISTERED_ONLY']),
  url: z.string().trim().refine((value) => isUploadUrl(value) || /^https?:\/\/\S+$/i.test(value), {
    message: "Please enter a valid URL or uploaded file path.",
  }),
});

type ResourceFormValues = z.infer<ReturnType<typeof getResourceSchema>>;

export default function ManageResourcesPage() {
  const params = useParams<{ eventId: string }>();
  const { eventId } = params;
  const { t } = useLanguage();
  const { toast } = useToast();
  const { data: event, isLoading: isLoadingEvent, error } = useAdminEventQuery(eventId);
  const { mutate: updateResources, isPending: isSaving } = useUpdateEventResourcesMutation();
  const { mutate: uploadResourceFile, isPending: isUploading } = useUploadEventResource();
  const { mutateAsync: deleteUploadedFile, isPending: isDeletingFile } = useDeleteUploadedFile();
  
  const [resources, setResources] = useState<Partial<EventResource>[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<Partial<EventResource> | null>(null);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [resourceToDeleteId, setResourceToDeleteId] = useState<string | null>(null);

  useEffect(() => {
    if (event?.resources) {
      setResources(event.resources);
    }
  }, [event]);

  const form = useForm<ResourceFormValues>({
    resolver: zodResolver(getResourceSchema(t)),
    defaultValues: {
      title: { fa: '', en: '' },
      description: '',
      accessLevel: 'PUBLIC',
      url: '',
    },
  });

  const handleOpenDialog = (resource: Partial<EventResource> | null = null) => {
    setEditingResource(resource);
    if (resource) {
      form.reset({
        id: resource.id,
        title: resource.title || { fa: '', en: '' },
        description: resource.description || '',
        accessLevel: resource.accessLevel || 'PUBLIC',
        url: normalizeUploadedFileUrl(resource.url || ''),
      });
    } else {
      form.reset({
        id: `temp-${Date.now()}`,
        title: { fa: '', en: '' },
        description: '',
        accessLevel: 'PUBLIC',
        url: '',
      });
    }
    setIsDialogOpen(true);
  };
  
  const onSubmit = async (data: ResourceFormValues) => {
    let updatedResources;
    if (editingResource) {
      updatedResources = resources.map(r => r.id === editingResource.id ? data : r);
    } else {
      updatedResources = [...resources, data];
    }

    updateResources({ eventId, resources: updatedResources }, {
      onSuccess: async (updatedEvent) => {
        const previousPath = getUploadedFilePath(editingResource?.url);
        const nextPath = getUploadedFilePath(data.url);
        if (previousPath && !sameUploadedFilePath(previousPath, nextPath)) {
          try {
            await deleteUploadedFile(previousPath);
          } catch {
            // Best-effort cleanup only.
          }
        }
        setResources(updatedEvent.resources);
        toast({ title: editingResource ? 'Resource updated' : 'Resource added' });
        setIsDialogOpen(false);
      },
      onError: (err) => {
        toast({ variant: 'destructive', title: t('errors.genericTitle'), description: err.message });
      }
    });
  };
  
  const handleDeleteConfirm = async () => {
    if (!resourceToDeleteId) return;

    const resource = resources.find((r) => r.id === resourceToDeleteId);
    const updatedResources = resources.filter(r => r.id !== resourceToDeleteId);
    
    updateResources({ eventId, resources: updatedResources }, {
      onSuccess: async (updatedEvent) => {
        if (resource?.url) {
          const previousPath = getUploadedFilePath(resource.url);
          if (previousPath) {
            try {
              await deleteUploadedFile(previousPath);
            } catch {
              // Best-effort cleanup only.
            }
          }
        }
        setResources(updatedEvent.resources);
        toast({ title: 'Resource deleted' });
        setIsDeleteAlertOpen(false);
        setResourceToDeleteId(null);
      },
      onError: (err) => {
        toast({ variant: 'destructive', title: t('errors.genericTitle'), description: err.message });
      }
    });
  }

  if (isLoadingEvent) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  if (error) {
    return <p className="text-destructive">{t('errors.fetchEvent')}</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t('admin.resources.title')}</h1>
          <p className="mt-2 text-muted-foreground">{t('admin.resources.subtitle', { eventName: event?.title || '' })}</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
             <Button onClick={() => handleOpenDialog()} disabled={isDeletingFile}>
                <PlusCircle className="mr-2 h-4 w-4" />
                {t('admin.resources.addNew')}
             </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl">
             <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <DialogHeader>
                        <DialogTitle>{editingResource ? t('admin.resources.form.editTitle') : t('admin.resources.form.addTitle')}</DialogTitle>
                    </DialogHeader>
                    
                    <Tabs defaultValue="fa">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="fa">{t('language.fa')}</TabsTrigger>
                            <TabsTrigger value="en">{t('language.en')}</TabsTrigger>
                        </TabsList>
                        <TabsContent value="fa" className="pt-4">
                            <FormField control={form.control} name="title.fa" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t('admin.resources.form.resourceTitle')}</FormLabel>
                                    <FormControl><Input {...field} dir="rtl" /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        </TabsContent>
                         <TabsContent value="en" className="pt-4">
                            <FormField control={form.control} name="title.en" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t('admin.resources.form.resourceTitle')}</FormLabel>
                                    <FormControl><Input {...field} dir="ltr" /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        </TabsContent>
                    </Tabs>

                    <FormField control={form.control} name="description" render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('admin.resources.form.description')}</FormLabel>
                            <FormControl><Textarea {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                    <FormField control={form.control} name="url" render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('admin.resources.form.url')}</FormLabel>
                            <FormControl>
                              <div className="flex flex-col gap-2">
                                <Input {...field} dir="ltr" placeholder="https://example.com/file.pdf" />
                                <div className="flex items-center gap-3">
                                  <Input
                                    type="file"
                                    accept=".pdf,.doc,.docx,.xls,.xlsx,.zip,.rar,.json,.txt,.png,.jpg,.jpeg"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (!file) return;
                                      uploadResourceFile(file, {
                                        onSuccess: (data) => {
                                          field.onChange(normalizeUploadedFileUrl(data.url));
                                          toast({ title: t('admin.resources.form.fileUploaded') });
                                          e.target.value = '';
                                        },
                                        onError: (err) => {
                                          toast({ variant: 'destructive', title: t('errors.genericTitle'), description: err.message });
                                        },
                                      });
                                    }}
                                    disabled={isUploading || isDeletingFile}
                                  />
                                  {isUploading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                                </div>
                                {field.value && <p className="text-xs text-muted-foreground break-all">{t('admin.resources.form.currentUrl')}: {field.value}</p>}
                              </div>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                    <FormField control={form.control} name="accessLevel" render={({ field }) => (
                        <FormItem className="space-y-3">
                            <FormLabel>{t('admin.resources.form.accessLevel')}</FormLabel>
                            <FormControl>
                                <RadioGroup onValueChange={field.onChange} value={field.value} className="flex flex-col space-y-1">
                                    <FormItem className="flex items-center space-x-3 space-y-0">
                                        <FormControl><RadioGroupItem value="PUBLIC" /></FormControl>
                                        <FormLabel className="font-normal">{t('admin.resources.form.accessPublic')}</FormLabel>
                                    </FormItem>
                                    <FormItem className="flex items-center space-x-3 space-y-0">
                                        <FormControl><RadioGroupItem value="REGISTERED_ONLY" /></FormControl>
                                        <FormLabel className="font-normal">{t('admin.resources.form.accessRegistered')}</FormLabel>
                                    </FormItem>
                                </RadioGroup>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />

                    <DialogFooter>
                        <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)}>{t('admin.resources.form.cancel')}</Button>
                        <Button type="submit" disabled={isSaving || isDeletingFile}>
                            {(isSaving || isUploading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {editingResource ? t('admin.resources.form.save') : t('admin.resources.form.add')}
                        </Button>
                    </DialogFooter>
                </form>
             </Form>
          </DialogContent>
        </Dialog>
      </div>
      
      <Card>
        <CardContent className="pt-6">
          {resources.length > 0 ? (
             <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>{t('admin.resources.table.title')}</TableHead>
                        <TableHead>{t('admin.resources.table.accessLevel')}</TableHead>
                        <TableHead className="text-right">{t('admin.resources.table.actions')}</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {resources.map(resource => (
                        <TableRow key={resource.id}>
                            <TableCell className="font-medium">{resource.title?.fa || resource.title?.en}</TableCell>
                            <TableCell>
                                <Badge variant={resource.accessLevel === 'PUBLIC' ? 'outline' : 'secondary'}>
                                    {t(`event.resource${resource.accessLevel === 'PUBLIC' ? 'Public' : 'RegisteredOnly'}`)}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                                <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(resource)}>
                                    <Edit className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => { setResourceToDeleteId(resource.id!); setIsDeleteAlertOpen(true); }}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
             </Table>
          ) : (
            <div className="text-center text-muted-foreground py-8">
              <p>{t('admin.resources.noResources')}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
            <AlertDialogTitle>{t('admin.resources.deleteConfirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription>{t('admin.resources.deleteConfirmText')}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setResourceToDeleteId(null)}>{t('admin.resources.form.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} disabled={isSaving} className="bg-destructive hover:bg-destructive/90">
                 {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t('admin.resources.delete')}
            </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
