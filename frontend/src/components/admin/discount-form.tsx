
'use client';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useLanguage } from '@/lib/i18n/language-provider';
import type { DiscountFormData, Event } from '@/lib/types';
import { format } from 'date-fns';
import { getLocalizedTextValue } from '@/lib/i18n/get-localized-text';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Calendar as CalendarIcon, Loader2, Save } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEventsQuery } from '@/hooks/use-event-queries';


const getDiscountSchema = (t: (key: string) => string) => z.object({
    name: z.string().min(1, t('registration.validation.required')),
    isPublic: z.boolean().default(false),
    code: z.string().optional(),
    type: z.enum(['PERCENT', 'FIXED']),
    value: z.coerce.number().positive(t('admin.discounts.validation.positiveValue')),
    applicableEventIds: z.array(z.string()).optional(),
    maxUses: z.coerce.number().int().min(0).optional(),
    maxUsesPerUser: z.coerce.number().int().min(0).optional(),
    minAmount: z.coerce.number().min(0).optional(),
    startDate: z.date({ required_error: t('registration.validation.required') }).or(z.string()),
    endDate: z.date({ required_error: t('registration.validation.required') }).or(z.string()),
    isActive: z.boolean().default(true),
}).refine(data => data.isPublic || (data.code && data.code.length > 0), {
    message: t('admin.discounts.validation.codeRequired'),
    path: ['code'],
}).refine(data => {
    const endDate = typeof data.endDate === 'string' ? new Date(data.endDate) : data.endDate;
    const startDate = typeof data.startDate === 'string' ? new Date(data.startDate) : data.startDate;
    return endDate >= startDate;
}, {
    message: t('admin.discounts.validation.endDateAfterStart'),
    path: ['endDate'],
});


interface DiscountFormProps {
    initialData?: Partial<DiscountFormData>;
    isSubmitting: boolean;
    onSubmit: (data: DiscountFormData) => void;
}

export function DiscountForm({ initialData, isSubmitting, onSubmit }: DiscountFormProps) {
    const { t, language } = useLanguage();
    const { data: events, isLoading: isLoadingEvents } = useEventsQuery({ showPastEvents: true });

    const form = useForm<DiscountFormData>({
        resolver: zodResolver(getDiscountSchema(t)),
        defaultValues: {
            name: '',
            isPublic: false,
            code: '',
            type: 'PERCENT',
            value: 0,
            applicableEventIds: [],
            isActive: true,
            ...initialData,
            startDate: initialData?.startDate ? new Date(initialData.startDate) : new Date(),
            endDate: initialData?.endDate ? new Date(initialData.endDate) : new Date(new Date().setMonth(new Date().getMonth() + 1)),
        },
    });

    const isPublic = form.watch('isPublic');

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-8">
                        {/* General Details */}
                        <Card>
                            <CardHeader><CardTitle>{t('admin.discounts.form.generalTitle')}</CardTitle></CardHeader>
                            <CardContent className="space-y-6">
                                <FormField control={form.control} name="name" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t('admin.discounts.form.name')}</FormLabel>
                                        <FormControl><Input {...field} /></FormControl>
                                        <FormDescription>{t('admin.discounts.form.nameDesc')}</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <FormField control={form.control} name="isPublic" render={({ field }) => (
                                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                        <div className="space-y-0.5">
                                            <FormLabel>{t('admin.discounts.form.isPublic')}</FormLabel>
                                            <FormDescription>{t('admin.discounts.form.isPublicDesc')}</FormDescription>
                                        </div>
                                        <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                                    </FormItem>
                                )} />
                                {!isPublic && (
                                    <FormField control={form.control} name="code" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{t('admin.discounts.form.code')}</FormLabel>
                                            <FormControl><Input {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                )}
                            </CardContent>
                        </Card>

                        {/* Discount Value */}
                        <Card>
                            <CardHeader><CardTitle>{t('admin.discounts.form.valueTitle')}</CardTitle></CardHeader>
                            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormField control={form.control} name="type" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t('admin.discounts.table.type')}</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                            <SelectContent>
                                                <SelectItem value="PERCENT">{t('admin.discounts.types.percent')}</SelectItem>
                                                <SelectItem value="FIXED">{t('admin.discounts.types.fixed')}</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <FormField control={form.control} name="value" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t('admin.discounts.table.value')}</FormLabel>
                                        <FormControl><Input type="number" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                            </CardContent>
                        </Card>

                        {/* Rules */}
                        <Card>
                            <CardHeader><CardTitle>{t('admin.discounts.form.rulesTitle')}</CardTitle></CardHeader>
                            <CardContent className="space-y-6">
                                <FormField control={form.control} name="applicableEventIds" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t('admin.discounts.form.applicableEvents')}</FormLabel>
                                        <FormDescription>{t('admin.discounts.form.applicableEventsDesc')}</FormDescription>
                                        <ScrollArea className="h-48 rounded-md border">
                                            <div className="p-4 space-y-2">
                                                {isLoadingEvents ? <Loader2 className="animate-spin" /> : events?.map((event) => {
                                                    const eventTitle = getLocalizedTextValue(event.title, language);
                                                    return (
                                                        <FormField key={event.id} control={form.control} name="applicableEventIds" render={({ field }) => (
                                                            <FormItem key={event.id} className="flex flex-row items-start space-x-3 space-y-0">
                                                                <FormControl>
                                                                    <Checkbox
                                                                        checked={field.value?.includes(event.id)}
                                                                    onCheckedChange={(checked) => {
                                                                        return checked
                                                                            ? field.onChange([...(field.value || []), event.id])
                                                                            : field.onChange(field.value?.filter((value) => value !== event.id))
                                                                    }}
                                                                />
                                                            </FormControl>
                                                        <FormLabel className="font-normal">{eventTitle}</FormLabel>
                                                        </FormItem>
                                                        )} />
                                                    );
                                                })}
                                            </div>
                                        </ScrollArea>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <FormField control={form.control} name="minAmount" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t('admin.discounts.form.minAmount')}</FormLabel>
                                        <FormControl><Input type="number" {...field} /></FormControl>
                                        <FormDescription>{t('admin.discounts.form.minAmountDesc')}</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                            </CardContent>
                        </Card>

                    </div>

                    <div className="lg:col-span-1 space-y-8">
                        {/* Activation */}
                        <Card>
                            <CardHeader><CardTitle>{t('admin.discounts.form.activationTitle')}</CardTitle></CardHeader>
                            <CardContent className="space-y-6">
                                <FormField control={form.control} name="isActive" render={({ field }) => (
                                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                        <div className="space-y-0.5">
                                            <FormLabel>{t('admin.discounts.form.isActive')}</FormLabel>
                                        </div>
                                        <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                                    </FormItem>
                                )} />
                            </CardContent>
                        </Card>

                        {/* Validity Period */}
                        <Card>
                            <CardHeader><CardTitle>{t('admin.discounts.form.validityTitle')}</CardTitle></CardHeader>
                            <CardContent className="space-y-6">
                                <FormField control={form.control} name="startDate" render={({ field }) => {
                                    const dateValue = typeof field.value === 'string' ? new Date(field.value) : field.value;
                                    return (
                                        <FormItem className="flex flex-col"><FormLabel>{t('admin.discounts.form.startDate')}</FormLabel>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <FormControl>
                                                        <Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                                                            {field.value ? format(dateValue, "PPP") : <span>{t('admin.events.form.pickDate')}</span>}
                                                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                        </Button>
                                                    </FormControl>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0" align="start">
                                                    <Calendar mode="single" selected={dateValue} onSelect={field.onChange} />
                                                </PopoverContent>
                                            </Popover>
                                            <FormMessage />
                                        </FormItem>
                                    );
                                }} />
                                <FormField control={form.control} name="endDate" render={({ field }) => {
                                    const dateValue = typeof field.value === 'string' ? new Date(field.value) : field.value;
                                    return (
                                        <FormItem className="flex flex-col"><FormLabel>{t('admin.discounts.form.endDate')}</FormLabel>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <FormControl>
                                                        <Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                                                            {field.value ? format(dateValue, "PPP") : <span>{t('admin.events.form.pickDate')}</span>}
                                                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                        </Button>
                                                    </FormControl>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0" align="start">
                                                    <Calendar mode="single" selected={dateValue} onSelect={field.onChange} />
                                                </PopoverContent>
                                            </Popover>
                                            <FormMessage />
                                        </FormItem>
                                    );
                                }} />
                            </CardContent>
                        </Card>

                        {/* Limits */}
                        <Card>
                            <CardHeader><CardTitle>{t('admin.discounts.form.limitsTitle')}</CardTitle></CardHeader>
                            <CardContent className="space-y-6">
                                <FormField control={form.control} name="maxUses" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t('admin.discounts.form.maxUses')}</FormLabel>
                                        <FormControl><Input type="number" {...field} /></FormControl>
                                        <FormDescription>{t('admin.discounts.form.maxUsesDesc')}</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <FormField control={form.control} name="maxUsesPerUser" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t('admin.discounts.form.maxUsesPerUser')}</FormLabel>
                                        <FormControl><Input type="number" {...field} /></FormControl>
                                        <FormDescription>{t('admin.discounts.form.maxUsesPerUserDesc')}</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                            </CardContent>
                        </Card>
                    </div>

                </div>

                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="mr-2 animate-spin" /> : <Save className="mr-2" />}
                    {initialData ? t('admin.discounts.form.saveChanges') : t('admin.discounts.form.createDiscount')}
                </Button>
            </form>
        </Form>
    );
}
