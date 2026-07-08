
'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/lib/i18n/language-provider';
import type { User } from '@/lib/types';
import { Textarea } from '../ui/textarea';
import { Checkbox } from '../ui/checkbox';
import { Label } from '../ui/label';
import { Loader2, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useSendBulkMessageMutation } from '@/hooks/use-messaging-queries';

interface SendMessageDialogProps {
  user: User;
  registrationId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SendMessageDialog({ user, registrationId, open, onOpenChange }: SendMessageDialogProps) {
  const { t } = useLanguage();
  const [message, setMessage] = useState('');
  const [sendSms, setSendSms] = useState(true);
  const [sendEmail, setSendEmail] = useState(false);
  const { toast } = useToast();
  const { mutate: sendBulkMessage, isPending: isSending } = useSendBulkMessageMutation();

  const handleSend = async () => {
    if (!message || (!sendSms && !sendEmail)) return;

    sendBulkMessage(
      {
        registrationIds: [registrationId],
        subject: '',
        body: message,
        channels: [sendSms ? 'sms' : null, sendEmail ? 'email' : null].filter(Boolean) as Array<'sms' | 'email'>,
      },
      {
        onSuccess: () => {
          toast({
            title: t('admin.registrations.sendMessage.successTitle'),
            description: t('admin.registrations.sendMessage.successDescription'),
          });
          onOpenChange(false);
          setMessage('');
        },
        onError: (error: any) => {
          toast({
            variant: 'destructive',
            title: t('errors.genericTitle'),
            description: error.message,
          });
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('admin.registrations.sendMessage.title')}</DialogTitle>
          <DialogDescription>
            {t('admin.registrations.sendMessage.subtitle', { userName: `${user.firstNameFa} ${user.lastNameFa}` })}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={t('admin.registrations.sendMessage.placeholder')}
            rows={5}
          />
          <div className="flex items-center gap-6">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="send-sms"
                checked={sendSms}
                onCheckedChange={(checked) => setSendSms(Boolean(checked))}
              />
              <Label htmlFor="send-sms">{t('admin.registrations.sendMessage.sendViaSms')}</Label>
            </div>
            <div className="flex items-center space-x-2">
               <Checkbox
                id="send-email"
                checked={sendEmail}
                onCheckedChange={(checked) => setSendEmail(Boolean(checked))}
                disabled={!user.email}
              />
              <Label htmlFor="send-email" className={!user.email ? 'text-muted-foreground' : ''}>
                {t('admin.registrations.sendMessage.sendViaEmail')}
              </Label>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            {t('admin.resources.form.cancel')}
          </Button>
          <Button onClick={handleSend} disabled={isSending || !message || (!sendSms && !sendEmail)}>
            {isSending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
            {t('admin.registrations.sendMessage.sendButton')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
