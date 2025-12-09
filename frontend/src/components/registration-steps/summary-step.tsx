
'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '@/lib/i18n/language-provider';
import { useRegistrationWizardStore } from '@/hooks/use-registration-wizard-store';
import { useEventQuery } from '@/hooks/use-event-queries';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Separator } from '../ui/separator';
import { getFormattedPrice, getFormattedDateTime } from '@/lib/event-helpers';
import { Loader2, TicketPercent, X } from 'lucide-react';
import { Input } from '../ui/input';
import { useToast } from '@/hooks/use-toast';
import { useValidateDiscountMutation, useDiscountsQuery } from '@/hooks/use-discount-queries';
import type { Discount } from '@/lib/types';
import { useAuth } from '@/lib/auth/auth-provider';
import { getLocalizedTextValue } from '@/lib/i18n/get-localized-text';


export function SummaryStep() {
    const { t, language } = useLanguage();
    const { formData, eventId, ticketType, setStep, setFinalAmount } = useRegistrationWizardStore();
    const { currentUser } = useAuth();
    const { data: event, isLoading: isLoadingEvent } = useEventQuery(eventId);
    const { toast } = useToast();

    const [discountCode, setDiscountCode] = useState('');
    const [appliedCodeDiscount, setAppliedCodeDiscount] = useState<Discount | null>(null);

    const { mutate: validateCode, isPending: isApplyingCode, error: discountError } = useValidateDiscountMutation();
    const { data: allDiscounts } = useDiscountsQuery();


    const publicDiscount = useMemo(() => {
        if (!event || !allDiscounts) return null;
        return allDiscounts.find(d =>
            d.isPublic &&
            d.isActive &&
            (!d.applicableEventIds || d.applicableEventIds.length === 0 || d.applicableEventIds.includes(event.id)) &&
            new Date(d.startDate) <= new Date() &&
            new Date(d.endDate) >= new Date()
        ) || null;
    }, [event, allDiscounts]);

    const selectedTicket = useMemo(() => {
        if (!event) return null;
        return event.tickets.find(t => t.type === ticketType);
    }, [event, ticketType]);

    const { finalPrice, totalDiscount, originalPrice } = useMemo(() => {
        const originalPrice = selectedTicket?.price || 0;
        let priceAfterDiscounts = originalPrice;
        let totalDiscount = 0;

        const discountsToApply = [publicDiscount, appliedCodeDiscount].filter(Boolean) as Discount[];

        // Simple application logic: apply discounts one by one.
        for (const discount of discountsToApply) {
            if (discount.type === 'PERCENT') {
                totalDiscount += priceAfterDiscounts * (discount.value / 100);
                priceAfterDiscounts -= priceAfterDiscounts * (discount.value / 100);
            } else { // FIXED
                totalDiscount += discount.value;
                priceAfterDiscounts -= discount.value;
            }
        }

        const finalPrice = Math.max(0, priceAfterDiscounts);
        return { finalPrice, totalDiscount, originalPrice };

    }, [selectedTicket, publicDiscount, appliedCodeDiscount]);

    // Update finalAmount in parent component when price changes
    useEffect(() => {
        setFinalAmount(finalPrice);
    }, [finalPrice, setFinalAmount]);


    const handleApplyCode = async () => {
        if (!discountCode || !selectedTicket || !currentUser) return;
        validateCode({ code: discountCode, eventId, ticketPrice: selectedTicket.price }, {
            onSuccess: (validatedDiscount) => {
                setAppliedCodeDiscount(validatedDiscount);
                toast({ title: t('admin.discounts.applySuccessTitle') });
            },
            onError: (e: any) => {
                toast({ variant: 'destructive', title: t('admin.discounts.applyErrorTitle'), description: e.message });
            }
        })
    }

    const handleRemoveCode = () => {
        setDiscountCode('');
        setAppliedCodeDiscount(null);
    }

    if (isLoadingEvent) {
        return (
            <div className="flex justify-center items-center h-40">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    if (!event || !selectedTicket) {
        return <p>{t('errors.eventNotFound')}</p>
    }

    const educationLevels = ['high-school', 'associate', 'bachelor', 'master', 'phd', 'other'];
    const languageLevels = ['beginner', 'intermediate', 'advanced', 'native'];
    const referralSources = ['instagram', 'telegram', 'website', 'friends', 'other'];

    const getDisplayValue = (value: string | undefined | null, options: string[], translationPrefix: string) => {
        if (!value || !options.includes(value)) return value;
        return t(`${translationPrefix}.${value}`);
    }

    const renderField = (label: string, value: string | number | undefined | null) => {
        if (value === undefined || value === null || value === '') return null;
        return (
            <div className="flex justify-between py-2 text-sm">
                <dt className="text-muted-foreground">{label}</dt>
                <dd className="font-medium text-right">{String(value)}</dd>
            </div>
        );
    };

    const eventTitle = event ? getLocalizedTextValue(event.title, language) : '';

    return (
        <div>
            <h2 className="text-xl font-semibold mb-1">{t('registration.steps.summary')}</h2>
            <p className="text-muted-foreground mb-6">{t('registration.steps.summarySubtitle')}</p>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <SummarySection title={t('registration.steps.personal')} stepIndex={0} onEdit={setStep}>
                        {renderField(t('registration.fields.firstNameFa'), formData.firstNameFa)}
                        {renderField(t('registration.fields.lastNameFa'), formData.lastNameFa)}
                        {renderField(t('registration.fields.firstNameEn'), formData.firstNameEn)}
                        {renderField(t('registration.fields.lastNameEn'), formData.lastNameEn)}
                        {renderField(t('registration.fields.age'), formData.age)}
                        {renderField(t('registration.fields.gender'), formData.gender ? t(`registration.fields.gender${formData.gender.charAt(0)}${formData.gender.slice(1).toLowerCase()}`) : null)}
                    </SummarySection>

                    <SummarySection title={t('registration.steps.education')} stepIndex={1} onEdit={setStep}>
                        {renderField(t('registration.fields.educationLevel'), getDisplayValue(formData.educationLevel, educationLevels, 'registration.fields.educationLevels'))}
                        {renderField(t('registration.fields.fieldOfStudy'), formData.fieldOfStudy)}
                        {renderField(t('registration.fields.isEmployed'), formData.isEmployed ? t('registration.summary.yes') : t('registration.summary.no'))}
                        {formData.isEmployed && renderField(t('registration.fields.jobTitle'), formData.jobTitle)}
                    </SummarySection>

                    <SummarySection title={t('registration.steps.language')} stepIndex={2} onEdit={setStep}>
                        {renderField(t('registration.fields.languageLevel'), getDisplayValue(formData.languageLevel, languageLevels, 'registration.fields.languageLevelsList'))}
                        {renderField(t('registration.fields.referralSource'), getDisplayValue(formData.referralSource, referralSources, 'registration.fields.referralSources'))}
                        {formData.referralSource === 'friends' && renderField(t('registration.fields.referrerName'), formData.referrerName)}
                        {formData.referralSource === 'other' && renderField(t('registration.fields.otherReferralSource'), formData.otherReferralSource)}
                    </SummarySection>

                    <SummarySection title={t('registration.steps.contact')} stepIndex={3} onEdit={setStep}>
                        {renderField(t('auth.mobileLabel'), formData.mobile)}
                        {renderField(t('registration.fields.email'), formData.email)}
                    </SummarySection>
                </div>

                <div className="lg:col-span-1 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>{t('registration.summary.eventDetails')}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <dl className="space-y-2">
                                {renderField(t('registration.summary.eventTitle'), eventTitle)}
                                {renderField(t('registration.summary.eventDate'), getFormattedDateTime(new Date(event.startDateTime), language))}
                                {renderField(t('registration.summary.ticketType'), selectedTicket ? t(`tickets.${selectedTicket.type.toLowerCase()}`) : ticketType)}
                            </dl>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>{t('admin.discounts.title')}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex gap-2">
                                <Input
                                    placeholder={t('admin.discounts.form.code')}
                                    value={discountCode}
                                    onChange={(e) => setDiscountCode(e.target.value)}
                                    disabled={isApplyingCode || !!appliedCodeDiscount}
                                />
                                {appliedCodeDiscount ? (
                                    <Button variant="ghost" size="icon" onClick={handleRemoveCode}>
                                        <X className="h-4 w-4" />
                                    </Button>
                                ) : (
                                    <Button onClick={handleApplyCode} disabled={isApplyingCode || !discountCode}>
                                        {isApplyingCode && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        {t('admin.discounts.applyButton')}
                                    </Button>
                                )}
                            </div>
                            {discountError && <p className="text-sm text-destructive">{(discountError as any).message || 'Invalid code'}</p>}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>{t('registration.summary.finalPriceTitle')}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <dl className="space-y-2">
                                <div className="flex justify-between">
                                    <dt className="text-muted-foreground">{t('registration.summary.subtotal')}</dt>
                                    <dd>{getFormattedPrice(originalPrice, selectedTicket.currency, t)}</dd>
                                </div>
                                {publicDiscount && (
                                    <div className="flex justify-between text-green-600">
                                        <dt className="flex items-center gap-1"><TicketPercent className="h-4 w-4" />{t('admin.discounts.publicDiscount')}</dt>
                                        <dd>- {publicDiscount.type === 'PERCENT' ? `${publicDiscount.value}%` : getFormattedPrice(publicDiscount.value, selectedTicket.currency, t)}</dd>
                                    </div>
                                )}
                                {appliedCodeDiscount && (
                                    <div className="flex justify-between text-green-600">
                                        <dt className="flex items-center gap-1"><TicketPercent className="h-4 w-4" />{t('admin.discounts.codeApplied', { code: appliedCodeDiscount.code! })}</dt>
                                        <dd>- {appliedCodeDiscount.type === 'PERCENT' ? `${appliedCodeDiscount.value}%` : getFormattedPrice(appliedCodeDiscount.value, selectedTicket.currency, t)}</dd>
                                    </div>
                                )}

                                <Separator />

                                <div className="flex justify-between font-bold text-lg">
                                    <dt>{t('registration.summary.total')}</dt>
                                    <dd>{getFormattedPrice(finalPrice, selectedTicket.currency, t)}</dd>
                                </div>
                            </dl>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}


interface SummarySectionProps {
    title: string;
    stepIndex: number;
    onEdit: (step: number) => void;
    children: React.ReactNode;
}

function SummarySection({ title, stepIndex, onEdit, children }: SummarySectionProps) {
    const { t } = useLanguage();
    return (
        <Card>
            <CardHeader className="flex-row items-center justify-between py-4">
                <CardTitle className="text-base">{title}</CardTitle>
                <Button variant="link" size="sm" onClick={() => onEdit(stepIndex)} className="p-0 h-auto">
                    {t('registration.summary.edit')}
                </Button>
            </CardHeader>
            <CardContent>
                <dl className="divide-y divide-border">
                    {React.Children.toArray(children).filter(Boolean).length > 0 ? children : <p className="text-sm text-muted-foreground py-2">{t('registration.summary.noInfo')}</p>}
                </dl>
            </CardContent>
        </Card>
    )
}
