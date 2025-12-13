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
    const remaining =
      typeof ticket.quantityRemaining === 'number'
        ? ticket.quantityRemaining
        : Math.max(ticket.quantityTotal - ticket.quantitySold, 0);

    if (remaining <= 0) {
      return { available: false, reason: t('tickets.soldOut'), remaining: 0 };
    }

    const now = new Date();
    const start = ticket.saleStartDate ? new Date(ticket.saleStartDate) : undefined;
    const end = ticket.saleEndDate ? new Date(ticket.saleEndDate) : undefined;

    if (start && now < start) {
      return { available: false, reason: t('tickets.notStarted', { date: format(start, 'MMM d') }), remaining };
    }
    if (end && now > end) {
      return { available: false, reason: t('tickets.saleEnded'), remaining: 0 };
    }
    if (ticket.type === 'EARLY_BIRD' && ticket.earlyBirdEndDate && new Date(ticket.earlyBirdEndDate) < now) {
      return { available: false, reason: t('tickets.expired'), remaining };
    }

    return { available: true, reason: null, remaining };
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
        const { available, reason, remaining } = getTicketStatus(ticket);
        const isTicketDisabled = disabled || !available;
        const remainingText =
          remaining !== undefined ? t('tickets.remaining', { count: remaining }) : null;

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
            <div className="pl-8 pt-1 text-xs text-muted-foreground space-y-1">
              {remainingText && available && <div>{remainingText}</div>}
              {reason ? (
                <div>{reason}</div>
              ) : (
                ticket.earlyBirdEndDate &&
                <div>{t('tickets.earlyBirdEnds', { date: format(new Date(ticket.earlyBirdEndDate), 'MMM d') })}</div>
              )}
            </div>
          </Label>
        );
      })}
    </RadioGroup>
  );
}
