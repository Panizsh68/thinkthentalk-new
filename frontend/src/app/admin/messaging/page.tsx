
'use client';

import { useState, useMemo, useEffect } from 'react';
import { useAllRegistrationsQuery } from '@/hooks/use-admin-registration-queries';
import { useEventsQuery } from '@/hooks/use-event-queries';
import { useLanguage } from '@/lib/i18n/language-provider';
import type { UserRegistrationDetails } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useSendBulkMessageMutation } from '@/hooks/use-messaging-queries';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Filter, X, Send, Mail, MessageSquare } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { withRoleGuard } from '@/components/admin/with-role-guard';
import { cn } from '@/lib/utils';
import { getLocalizedTextValue } from '@/lib/i18n/get-localized-text';

type MessageFilters = {
  eventId?: string;
  status?: 'PAID' | 'PENDING' | 'FAILED' | 'CANCELLED';
};

const MOCK_TEMPLATES = [
  { id: 'reminder', name: 'Event Reminder', subject: 'Reminder for {eventName}', body: 'Hi {name},\n\nThis is a reminder about the upcoming event "{eventName}" on {eventDate}.\n\nWe look forward to seeing you!' },
  { id: 'feedback', name: 'Post-Event Feedback', subject: 'Share your feedback for {eventName}', body: 'Hi {name},\n\nThank you for attending "{eventName}". Please take a moment to share your feedback with us by clicking the link below.\n\nThank you!' },
];

function AdminMessagingPage() {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const [filters, setFilters] = useState<MessageFilters>({});
  const [selectedRegistrationIds, setSelectedRegistrationIds] = useState<string[]>([]);
  const [message, setMessage] = useState({ subject: '', body: '' });
  const [channels, setChannels] = useState<{email: boolean, sms: boolean}>({ email: false, sms: true });
  
  const { data: registrations, isLoading: isLoadingRegistrations, error } = useAllRegistrationsQuery();
  const { data: events, isLoading: isLoadingEvents } = useEventsQuery({ showPastEvents: true });
  const { mutate: sendBulkMessage, isPending: isSending } = useSendBulkMessageMutation();


  const isLoading = isLoadingRegistrations || isLoadingEvents;
  
  const filteredRegistrations = useMemo(() => {
    if (!registrations) return [];
    return registrations.filter(reg => {
        const eventMatch = !filters.eventId || reg.eventId === filters.eventId;
        const statusMatch = !filters.status || reg.status === filters.status;
        return eventMatch && statusMatch;
    });
  }, [registrations, filters]);

  const handleFilterChange = (key: keyof MessageFilters, value: any) => {
    setSelectedRegistrationIds([]);
    setFilters(prev => {
        const newFilters = {...prev};
        if (value === 'all' || value === '') {
            delete newFilters[key];
        } else {
            // @ts-ignore
            newFilters[key] = value;
        }
        return newFilters;
    });
  };

  const handleSelectAll = (checked: boolean | 'indeterminate') => {
    if (checked === true) {
      setSelectedRegistrationIds(filteredRegistrations.map(r => r.id));
    } else {
      setSelectedRegistrationIds([]);
    }
  };
  
  const handleTemplateChange = (templateId: string) => {
    if (templateId === 'custom') {
        setMessage({ subject: '', body: '' });
        return;
    }
    const template = MOCK_TEMPLATES.find(t => t.id === templateId);
    if (template) {
        setMessage({ subject: template.subject, body: template.body });
    }
  }

  const handleSendMessages = () => {
    const selectedChannels = Object.entries(channels).filter(([, v]) => v).map(([k]) => k) as ('sms' | 'email')[];
    sendBulkMessage({
        registrationIds: selectedRegistrationIds,
        subject: message.subject,
        body: message.body,
        channels: selectedChannels,
    }, {
        onSuccess: (res) => {
            toast({
                title: t('admin.messaging.sendSuccessTitle'),
                description: t('admin.messaging.sendSuccessDescription', { count: selectedRegistrationIds.length }),
            });
            setSelectedRegistrationIds([]);
        },
        onError: (err) => {
             toast({
                variant: 'destructive',
                title: t('errors.genericTitle'),
                description: err.message,
            });
        }
    });
  }

  return (
    <div className="space-y-6">
       <div>
        <h1 className="text-2xl font-bold">{t('admin.messaging.title')}</h1>
        <p className="mt-2 text-muted-foreground">{t('admin.messaging.subtitle')}</p>
      </div>

       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
            <Card>
                <CardHeader>
                <div className="flex items-center gap-2">
                    <Filter className="h-5 w-5" />
                    <CardTitle className="text-lg">{t('admin.messaging.filterRecipients')}</CardTitle>
                </div>
                </CardHeader>
                <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select value={filters.eventId || 'all'} onValueChange={(v) => handleFilterChange('eventId', v)}>
                    <SelectTrigger disabled={isLoadingEvents}>
                        <SelectValue placeholder={t('admin.registrations.filters.eventPlaceholder')} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">{t('admin.registrations.filters.allEvents')}</SelectItem>
                        {events?.map(event => {
                            const eventLabel = getLocalizedTextValue(event.title, language);
                            return <SelectItem key={event.id} value={event.id}>{eventLabel}</SelectItem>;
                        })}
                    </SelectContent>
                </Select>
                <Select value={filters.status || 'all'} onValueChange={(v) => handleFilterChange('status', v)}>
                    <SelectTrigger>
                        <SelectValue placeholder={t('admin.registrations.filters.statusPlaceholder')} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">{t('admin.filters.all')}</SelectItem>
                        <SelectItem value="PAID">{t('registration.status.paid')}</SelectItem>
                        <SelectItem value="PENDING">{t('registration.status.pending')}</SelectItem>
                        <SelectItem value="FAILED">{t('registration.status.failed')}</SelectItem>
                        <SelectItem value="CANCELLED">{t('registration.status.cancelled')}</SelectItem>
                    </SelectContent>
                </Select>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>{t('admin.messaging.recipientList')}</CardTitle>
                    <CardDescription>{t('admin.messaging.recipientCount', { selected: selectedRegistrationIds.length, total: filteredRegistrations.length })}</CardDescription>
                </CardHeader>
                <CardContent>
                     {isLoading ? (
                        <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>
                    ) : error ? (
                        <p className="text-destructive text-center py-8">{t('errors.fetchRegistrations')}</p>
                    ) : (
                        <div className="border rounded-lg max-h-96 overflow-y-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                    <TableHead className="w-[50px]">
                                        <Checkbox 
                                            checked={filteredRegistrations.length > 0 && selectedRegistrationIds.length === filteredRegistrations.length ? true : selectedRegistrationIds.length > 0 ? 'indeterminate' : false}
                                            onCheckedChange={handleSelectAll}
                                        />
                                    </TableHead>
                                    <TableHead>{t('admin.registrations.table.user')}</TableHead>
                                    <TableHead>{t('admin.registrations.table.event')}</TableHead>
                                    <TableHead>{t('admin.registrations.table.status')}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredRegistrations.map(reg => (
                                        <TableRow key={reg.id}>
                                            <TableCell>
                                                <Checkbox 
                                                    checked={selectedRegistrationIds.includes(reg.id)}
                                                    onCheckedChange={(checked) => {
                                                        setSelectedRegistrationIds(prev => checked ? [...prev, reg.id] : prev.filter(id => id !== reg.id))
                                                    }}
                                                />
                                            </TableCell>
                                            <TableCell>{reg.user.firstNameFa} {reg.user.lastNameFa}</TableCell>
                                            <TableCell>{getLocalizedTextValue(reg.event.title, language)}</TableCell>
                                            <TableCell>{t(`registration.status.${reg.status.toLowerCase()}`)}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>

        <div className="lg:col-span-1">
             <Card>
                <CardHeader>
                    <CardTitle>{t('admin.messaging.composeTitle')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                     <Select onValueChange={handleTemplateChange}>
                        <SelectTrigger>
                            <SelectValue placeholder={t('admin.messaging.templatePlaceholder')} />
                        </SelectTrigger>
                        <SelectContent>
                             <SelectItem value="custom">{t('admin.messaging.noTemplate')}</SelectItem>
                            {MOCK_TEMPLATES.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <div className="space-y-1">
                        <Label htmlFor="subject">{t('admin.messaging.subject')}</Label>
                        <Input id="subject" value={message.subject} onChange={e => setMessage(p => ({...p, subject: e.target.value}))} />
                    </div>
                     <div className="space-y-1">
                        <Label htmlFor="body">{t('admin.messaging.body')}</Label>
                        <Textarea id="body" rows={8} value={message.body} onChange={e => setMessage(p => ({...p, body: e.target.value}))} />
                        <p className="text-xs text-muted-foreground">{t('admin.messaging.templateNote')}</p>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                        <Label>{t('admin.messaging.channels')}</Label>
                         <div className="flex items-center gap-6">
                            <div className="flex items-center space-x-2">
                                <Checkbox id="send-email" checked={channels.email} onCheckedChange={c => setChannels(p => ({...p, email: !!c}))} />
                                <Label htmlFor="send-email" className="font-normal flex items-center gap-1"><Mail className="w-4 h-4"/>{t('admin.registrations.sendMessage.sendViaEmail')}</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox id="send-sms" checked={channels.sms} onCheckedChange={c => setChannels(p => ({...p, sms: !!c}))} />
                                <Label htmlFor="send-sms" className="font-normal flex items-center gap-1"><MessageSquare className="w-4 h-4"/>{t('admin.registrations.sendMessage.sendViaSms')}</Label>
                            </div>
                        </div>
                    </div>
                </CardContent>
                <CardFooter>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button className="w-full" disabled={isSending || selectedRegistrationIds.length === 0 || !message.body || (!channels.email && !channels.sms)}>
                                {isSending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                                {t('admin.messaging.sendButton', { count: selectedRegistrationIds.length })}
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                            <AlertDialogTitle>{t('admin.messaging.confirmSendTitle')}</AlertDialogTitle>
                            <AlertDialogDescription>
                                {t('admin.messaging.confirmSendDescription', { count: selectedRegistrationIds.length })}
                            </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>{t('admin.resources.form.cancel')}</AlertDialogCancel>
                                <AlertDialogAction onClick={handleSendMessages}>{t('actions.confirm')}</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </CardFooter>
             </Card>
        </div>

       </div>
    </div>
  );
}

export default withRoleGuard(AdminMessagingPage, ['ADMIN', 'EVENT_MANAGER']);
    
    

    
