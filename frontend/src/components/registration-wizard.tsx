
'use client';
import React, { useEffect, useRef } from 'react';
import { ArrowLeft, ArrowRight, Check, Loader2, RefreshCcw } from 'lucide-react';
import { useLanguage } from '@/lib/i18n/language-provider';
import { useRegistrationWizardStore } from '@/hooks/use-registration-wizard-store';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';
import { PersonalInfoStep } from './registration-steps/personal-info-step';
import { EducationEmploymentStep } from './registration-steps/education-employment-step';
import { LanguageReferralStep } from './registration-steps/language-referral-step';
import { ContactStep } from './registration-steps/contact-step';
import { RulesStep } from './registration-steps/rules-step';
import { SummaryStep } from './registration-steps/summary-step';
import { useAuth } from '@/lib/auth/auth-provider';
import { useEventQuery } from '@/hooks/use-event-queries';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Separator } from './ui/separator';
import { useCreatePaymentMutation } from '@/hooks/use-payment-queries';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import type { EventTicketConfig } from '@/lib/types';

export interface StepComponentProps {
  // Can add props here if steps need them
}

export interface StepRef {
  validate: () => Promise<boolean>;
}


// Map steps to components
const steps = [
  { id: 'personal', component: PersonalInfoStep, hasValidation: true },
  { id: 'education', component: EducationEmploymentStep, hasValidation: true },
  { id: 'language', component: LanguageReferralStep, hasValidation: true },
  { id: 'contact', component: ContactStep, hasValidation: true },
  { id: 'rules', component: RulesStep, hasValidation: true },
  { id: 'summary', component: SummaryStep, hasValidation: false },
];


export function RegistrationWizard({ eventId, ticketType, jumpToStep }: { eventId?: string; ticketType?: string, jumpToStep?: number }) {
  const { t } = useLanguage();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { isAuthenticated, currentUser, isLoading: isAuthLoading } = useAuth();
  const { data: event, isLoading: isLoadingEvent } = useEventQuery(eventId!);
  const { mutate: createPayment, isPending: isCreatingPayment } = useCreatePaymentMutation();

  const stepRefs = useRef<Array<React.RefObject<StepRef>>>(steps.map(() => React.createRef()));

  const {
    currentStep,
    init,
    nextStep,
    prevStep,
    setStep,
    isStepValid,
    isInitialized,
    reset,
    formData,
    finalAmount,
  } = useRegistrationWizardStore();

  useEffect(() => {
    if (currentUser && event && ticketType && !isInitialized) {
      init(currentUser, event, ticketType, steps.length, jumpToStep);
    }
  }, [currentUser, event, ticketType, init, isInitialized, jumpToStep]);

  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      const currentUrl = `${pathname}${searchParams?.toString() ? `?${searchParams.toString()}` : ''}`;
      router.replace(`/login?redirect=${encodeURIComponent(currentUrl)}`);
    }
  }, [isAuthenticated, isAuthLoading, pathname, searchParams, router]);

  if (!isAuthenticated) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  if (isLoadingEvent || !isInitialized) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>
  }

  if (!event || !ticketType) {
    return <p>{t('registration.errors.missingInfo')}</p>;
  }

  const selectedTicket = event.tickets.find(t => t.type === ticketType);

  const handleNext = async () => {
    if (steps[currentStep].hasValidation) {
      const currentStepRef = stepRefs.current[currentStep].current;
      if (currentStepRef) {
        const isValid = await currentStepRef.validate();
        if (isValid) {
          nextStep();
        }
      } else {
        // Should not happen for steps with validation
        console.warn(`Step ${currentStep} has no validate function.`);
        nextStep();
      }
    } else {
      // For steps without validation (like summary), just proceed
      nextStep();
    }
  };

  const handleStepClick = async (stepIndex: number) => {
    // Allow navigation to summary page only if all previous steps are valid
    if (stepIndex === steps.length - 1) {
      let allPreviousValid = true;
      for (let i = 0; i < steps.length - 1; i++) {
        const stepRef = stepRefs.current[i].current;
        if (stepRef && !(await stepRef.validate())) {
          allPreviousValid = false;
          // If a step is invalid, navigate to it
          setStep(i);
          break;
        }
      }

      if (allPreviousValid) {
        setStep(stepIndex);
      }
      return;
    }

    // Allow jumping back to any previous step
    if (stepIndex < currentStep) {
      setStep(stepIndex);
      return;
    }

    // For navigating forward, validate the current step first, then proceed if valid
    if (stepIndex > currentStep) {
      if (steps[currentStep].hasValidation) {
        const isValid = await stepRefs.current[currentStep].current?.validate();
        if (isValid) {
          setStep(stepIndex);
        }
      } else {
        setStep(stepIndex);
      }
    }
  };

  const handleReset = () => {
    if (window.confirm(t('registration.confirmReset'))) {
      reset(currentUser!, event, ticketType!, steps.length);
    }
  }

  const stepLabels = [
    t('registration.steps.personal'),
    t('registration.steps.education'),
    t('registration.steps.language'),
    t('registration.steps.contact'),
    t('registration.steps.rules'),
    t('registration.steps.summary'),
  ];

  const handleFinish = () => {
    if (!selectedTicket || !currentUser) return;

    // Final check on all steps before proceeding
    let allValid = true;
    for (let i = 0; i < steps.length - 1; i++) {
      if (!isStepValid(i)) {
        allValid = false;
        toast({
          variant: 'destructive',
          title: t('errors.genericTitle'),
          description: t('registration.errors.incompleteSteps')
        })
        setStep(i);
        break;
      }
    }

    if (!allValid) return;

    createPayment({
      eventId: event.id,
      ticketType: selectedTicket.type,
      amount: finalAmount,
      currency: selectedTicket.currency,
      formData: formData,
    }, {
      onSuccess: (payment) => {
        if (payment.redirectUrl) {
          window.location.href = payment.redirectUrl;
          return;
        }

        if (payment.status === 'SUCCESS') {
          router.push(`/payment/callback?paymentId=${payment.id}&Status=OK`);
          return;
        }

        router.push(`/payment/mock-gateway?paymentId=${payment.id}`);
      },
      onError: (error) => {
        toast({
          variant: 'destructive',
          title: t('errors.genericTitle'),
          description: "Could not initiate payment. Please try again."
        })
        console.error("Payment creation failed", error);
      }
    });
  };


  return (
    <Card className="w-full max-w-4xl mx-auto" data-testid="registration-wizard">
      <CardHeader>
        <CardTitle className="text-center text-h2 mb-4">{t('registration.title')}</CardTitle>
        <div className="flex items-center justify-center">
          <div className="flex items-center w-full max-w-2xl">
            {stepLabels.map((label, index) => (
              <React.Fragment key={index}>
                <div
                  className={cn(
                    'flex flex-col items-center gap-2 cursor-pointer',
                  )}
                  onClick={() => handleStepClick(index)}
                  data-testid={`wizard-step-indicator-${index}`}
                >
                  <div className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors',
                    isStepValid(index) ? 'bg-primary text-primary-foreground hover:bg-primary/80' :
                      index === currentStep ? 'border-2 border-primary bg-background text-primary' :
                        'border bg-muted text-muted-foreground'
                  )}>
                    {isStepValid(index) ? <Check className="h-5 w-5" /> : index + 1}
                  </div>
                  <p className={cn("hidden md:block text-xs text-center", index === currentStep && "font-semibold text-primary")}>
                    {label}
                  </p>
                </div>
                {index < stepLabels.length - 1 && (
                  <div className={cn("w-full h-0.5 mb-8", isStepValid(index) ? "bg-primary" : "bg-muted")} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="py-8 min-h-[350px]">
        {steps.map((step, index) => (
          <div key={step.id} style={{ display: index === currentStep ? 'block' : 'none' }} data-testid={`wizard-step-content-${index}`}>
            <step.component ref={stepRefs.current[index]} />
          </div>
        ))}
      </CardContent>
      <Separator />
      <CardFooter className="flex justify-between py-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={prevStep} disabled={currentStep === 0 || isCreatingPayment} data-testid="wizard-back-button">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('actions.back')}
          </Button>
          <Button variant="ghost" size="sm" onClick={handleReset} disabled={isCreatingPayment}>
            <RefreshCcw className="mr-2 h-4 w-4" />
            {t('actions.reset')}
          </Button>
        </div>
        {currentStep < steps.length - 1 ? (
          <Button onClick={handleNext} disabled={isCreatingPayment} data-testid="wizard-next-button">
            {t('actions.next')}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={handleFinish} disabled={isCreatingPayment} data-testid="wizard-finish-button">
            {isCreatingPayment && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t('registration.summary.paymentButton')}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
