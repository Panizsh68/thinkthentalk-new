
'use client';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { useAdminEventQuery, useUpdateEventTicketsMutation } from '@/hooks/use-event-queries';
import { useLanguage } from '@/lib/i18n/language-provider';
import { useToast } from '@/hooks/use-toast';
import type { EventTicketConfig } from '@/lib/types';
import { format } from 'date-fns';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Loader2, Calendar as CalendarIcon, Save } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';


const ticketConfigSchema = z.object({
  type: z.enum(['EARLY_BIRD', 'STANDARD', 'SUPPORTER']),
  price: z.coerce.number().min(0, "Price must be 0 or more"),
  quantityTotal: z.coerce.number().int().min(0, "Quantity must be 0 or more"),
  quantitySold: z.coerce.number().int().min(0),
  currency: z.enum(['IRR', 'TOMAN']),
  saleStartDate: z.date({ required_error: "Start date is required" }),
  saleEndDate: z.date({ required_error: "End date is required" }),
  earlyBirdEndDate: z.date().optional().nullable(),
  quantityRemaining: z.coerce.number().int().min(0).optional().default(0),
  enabled: z.boolean().default(false),
}).refine((data) => data.saleStartDate <= data.saleEndDate, {
  message: "Start date must be before end date",
  path: ['saleEndDate'],
});

const formSchema = z.object({
  tickets: z.array(ticketConfigSchema),
});

type TicketManagementFormValues = z.infer<typeof formSchema>;


export default function TicketManagementPage() {
  const params = useParams<{ eventId: string }>();
  const { eventId } = params;
  const { t } = useLanguage();
  const { toast } = useToast();
  const { data: event, isLoading: isLoadingEvent, error } = useAdminEventQuery(eventId);
  const { mutate: updateTickets, isPending: isSaving } = useUpdateEventTicketsMutation();


  const defaultTickets = useMemo<Omit<EventTicketConfig, 'quantitySold'>[]>(() => {
      const now = new Date();
      return [
        { type: 'EARLY_BIRD', price: 0, currency: 'TOMAN', quantityTotal: 0, earlyBirdEndDate: undefined, saleStartDate: now, saleEndDate: now, quantityRemaining: 0 },
        { type: 'STANDARD', price: 0, currency: 'TOMAN', quantityTotal: 0, saleStartDate: now, saleEndDate: now, quantityRemaining: 0 },
        { type: 'SUPPORTER', price: 0, currency: 'TOMAN', quantityTotal: 0, saleStartDate: now, saleEndDate: now, quantityRemaining: 0 },
      ];
  }, []);

  const form = useForm<TicketManagementFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      tickets: defaultTickets.map(dt => ({...dt, quantitySold: 0, enabled: false}))
    },
  });
  
  const { fields } = useFieldArray({
      control: form.control,
      name: "tickets",
  });

  useEffect(() => {
    if (event?.tickets) {
        const initialTickets = defaultTickets.map(defaultTicket => {
            const existingTicket = event.tickets.find(et => et.type === defaultTicket.type);
            const fallbackStart = event.startDateTime ? new Date(event.startDateTime) : new Date();
            const fallbackEnd = event.endDateTime ? new Date(event.endDateTime) : fallbackStart;
            if (existingTicket) {
                return {
                    ...existingTicket,
                    enabled: true,
                    saleStartDate: existingTicket.saleStartDate ? new Date(existingTicket.saleStartDate) : fallbackStart,
                    saleEndDate: existingTicket.saleEndDate ? new Date(existingTicket.saleEndDate) : fallbackEnd,
                    earlyBirdEndDate: existingTicket.earlyBirdEndDate ? new Date(existingTicket.earlyBirdEndDate) : undefined,
                    quantityRemaining: existingTicket.quantityRemaining ?? Math.max((existingTicket.quantityTotal || 0) - (existingTicket.quantitySold || 0), 0),
                };
            }
            return {
                ...defaultTicket,
                quantitySold: 0,
                enabled: false,
                saleStartDate: fallbackStart,
                saleEndDate: fallbackEnd,
                quantityRemaining: Math.max((defaultTicket.quantityTotal || 0), 0),
            };
        });
        form.reset({ tickets: initialTickets });
    }
  }, [event, form, defaultTickets]);


  function onSubmit(data: TicketManagementFormValues) {
    const enabledTickets = data.tickets
      .filter(t => t.enabled)
      .map(({ enabled, ...ticketData }) => ({
        ...ticketData,
        quantitySold: Number(ticketData.quantitySold ?? 0),
        quantityTotal: Number(ticketData.quantityTotal ?? 0),
        price: Number(ticketData.price ?? 0),
        saleStartDate: ticketData.saleStartDate?.toISOString?.() ?? ticketData.saleStartDate,
        saleEndDate: ticketData.saleEndDate?.toISOString?.() ?? ticketData.saleEndDate,
        earlyBirdEndDate: ticketData.earlyBirdEndDate
          ? ticketData.earlyBirdEndDate.toISOString?.() ?? ticketData.earlyBirdEndDate
          : null,
      })); // remove 'enabled' property
    
    updateTickets({ eventId, tickets: enabledTickets }, {
        onSuccess: () => {
            toast({
                title: t('admin.tickets.saveSuccessTitle'),
                description: t('admin.tickets.saveSuccessDescription', { eventName: event?.title || '' }),
            });
        },
        onError: (err) => {
            toast({
                variant: 'destructive',
                title: t('errors.genericTitle'),
                description: err.message,
            })
        }
    })
  }
  
  if (isLoadingEvent) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  if (error) {
    return <p className="text-destructive">{t('errors.fetchEvent')}</p>;
  }

  return (
    <div className="space-y-6">
       <div>
        <h1 className="text-2xl font-bold">{t('admin.tickets.title')}</h1>
        <p className="mt-2 text-muted-foreground">{t('admin.tickets.subtitle', { eventName: event?.title || ''})}</p>
      </div>

       <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {fields.map((field, index) => (
                    <Card key={field.id}>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle>{t(`tickets.${field.type.toLowerCase()}`)}</CardTitle>
                                 <FormField
                                    control={form.control}
                                    name={`tickets.${index}.enabled`}
                                    render={({ field: switchField }) => (
                                        <FormItem className="flex items-center space-x-2 space-y-0">
                                            <FormControl><Switch checked={switchField.value} onCheckedChange={switchField.onChange} /></FormControl>
                                            <FormLabel>{t('admin.tickets.enable')}</FormLabel>
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </CardHeader>
                        <CardContent className={cn("space-y-4", !form.watch(`tickets.${index}.enabled`) && "opacity-50 pointer-events-none")}>
                            <FormField
                                control={form.control}
                                name={`tickets.${index}.type`}
                                render={({ field: typeField }) => (
                                <FormItem className="hidden">
                                    <FormControl><Input type="hidden" {...typeField} /></FormControl>
                                </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name={`tickets.${index}.currency`}
                                render={({ field: currencyField }) => (
                                <FormItem className="hidden">
                                    <FormControl><Input type="hidden" {...currencyField} /></FormControl>
                                </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name={`tickets.${index}.quantitySold`}
                                render={({ field: soldField }) => (
                                <FormItem className="hidden">
                                    <FormControl><Input type="hidden" {...soldField} /></FormControl>
                                </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name={`tickets.${index}.quantityRemaining`}
                                render={({ field: remainingField }) => (
                                <FormItem className="hidden">
                                    <FormControl><Input type="hidden" {...remainingField} /></FormControl>
                                </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name={`tickets.${index}.price`}
                                render={({ field: priceField }) => (
                                <FormItem>
                                    <FormLabel>{t('admin.tickets.price')}</FormLabel>
                                    <FormControl><Input type="number" {...priceField} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name={`tickets.${index}.quantityTotal`}
                                render={({ field: quantityField }) => (
                                <FormItem>
                                    <FormLabel>{t('admin.tickets.quantity')}</FormLabel>
                                    <FormControl><Input type="number" {...quantityField} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name={`tickets.${index}.saleStartDate`}
                                render={({ field: dateField }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel>{t('admin.tickets.startDate')}</FormLabel>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button
                                                        variant={"outline"}
                                                        className={cn("w-full pl-3 text-left font-normal", !dateField.value && "text-muted-foreground")}
                                                    >
                                                        {dateField.value ? format(dateField.value, "PPP") : <span>{t('admin.events.form.pickDate')}</span>}
                                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                    </Button>
                                                </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="start">
                                                <Calendar mode="single" selected={dateField.value || undefined} onSelect={dateField.onChange} />
                                            </PopoverContent>
                                        </Popover>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name={`tickets.${index}.saleEndDate`}
                                render={({ field: dateField }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel>{t('admin.tickets.endDate')}</FormLabel>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button
                                                        variant={"outline"}
                                                        className={cn("w-full pl-3 text-left font-normal", !dateField.value && "text-muted-foreground")}
                                                    >
                                                        {dateField.value ? format(dateField.value, "PPP") : <span>{t('admin.events.form.pickDate')}</span>}
                                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                    </Button>
                                                </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="start">
                                                <Calendar mode="single" selected={dateField.value || undefined} onSelect={dateField.onChange} />
                                            </PopoverContent>
                                        </Popover>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            {field.type === 'EARLY_BIRD' && (
                                <FormField
                                    control={form.control}
                                    name={`tickets.${index}.earlyBirdEndDate`}
                                    render={({ field: dateField }) => (
                                        <FormItem className="flex flex-col">
                                        <FormLabel>{t('admin.tickets.endDate')}</FormLabel>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                            <FormControl>
                                                <Button
                                                variant={"outline"}
                                                className={cn("w-full pl-3 text-left font-normal", !dateField.value && "text-muted-foreground")}
                                                >
                                                {dateField.value ? format(dateField.value, "PPP") : <span>{t('admin.events.form.pickDate')}</span>}
                                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                </Button>
                                            </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="start">
                                            <Calendar mode="single" selected={dateField.value || undefined} onSelect={dateField.onChange} />
                                            </PopoverContent>
                                        </Popover>
                                        <FormDescription>{t('admin.tickets.endDateDesc')}</FormDescription>
                                        <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Button type="submit" disabled={isSaving}>
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                {t('admin.tickets.saveChanges')}
            </Button>
        </form>
      </Form>
    </div>
  );
}

    
