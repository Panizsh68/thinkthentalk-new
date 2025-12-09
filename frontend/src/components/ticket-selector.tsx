'use client';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useLanguage } from '@/lib/i18n/language-provider';
import type { EventTicketConfig } from '@/lib/types';
import { getFormattedPrice } from '@/lib/event-helpers';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface TicketSelectorProps {
  tickets: EventTicketConfig[];
  selectedTicket: EventTicketConfig | null;
  onTicketSelect: (ticket: EventTicketConfig | null) => void;
  disabled?: boolean;
}

export function TicketSelector({ tickets, selectedTicket, onTicketSelect, disabled = false }: TicketSelectorProps) {
  const { t } = useLanguage();

  const getTicketStatus = (ticket: EventTicketConfig) => {
    const isSoldOut = ticket.quantitySold >= ticket.quantityTotal;
    if (isSoldOut) {
      return { available: false, reason: t('tickets.soldOut') };
    }
    if (ticket.type === 'EARLY_BIRD' && ticket.earlyBirdEndDate && new Date(ticket.earlyBirdEndDate) < new Date()) {
      return { available: false, reason: t('tickets.expired') };
    }
    return { available: true, reason: null };
  };

  return (
    <RadioGroup
      value={selectedTicket?.type}
      onValueChange={(value) => {
        const newSelectedTicket = tickets.find(t => t.type === value) || null;
        onTicketSelect(newSelectedTicket);
      }}
      className="space-y-3"
      disabled={disabled}
    >
      {tickets.map((ticket) => {
        const { available, reason } = getTicketStatus(ticket);
        const isTicketDisabled = disabled || !available;

        return (
          <Label
            key={ticket.type}
            htmlFor={ticket.type}
            className={cn(
              "flex flex-col rounded-lg border p-4 transition-colors",
              isTicketDisabled ? "cursor-not-allowed bg-muted/50 text-muted-foreground" : "cursor-pointer hover:bg-accent",
              selectedTicket?.type === ticket.type && !isTicketDisabled && "border-primary ring-2 ring-primary"
            )}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <RadioGroupItem value={ticket.type} id={ticket.type} disabled={isTicketDisabled} />
                <span className="font-semibold">{t(`tickets.${ticket.type.toLowerCase()}`)}</span>
              </div>
              <span className="font-semibold">{getFormattedPrice(ticket.price, ticket.currency, t)}</span>
            </div>
            {(reason || ticket.type === 'EARLY_BIRD') && (
              <div className="pl-8 pt-1 text-xs text-muted-foreground">
                {reason ? reason : 
                 ticket.earlyBirdEndDate ? t('tickets.earlyBirdEnds', { date: format(new Date(ticket.earlyBirdEndDate), 'MMM d') }) : null
                }
              </div>
            )}
          </Label>
        );
      })}
    </RadioGroup>
  );
}
