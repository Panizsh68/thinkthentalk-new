import { create } from 'zustand';
import type { User, Event, TicketType } from '@/lib/types';
import { produce } from 'immer';

export interface RegistrationFormData {
  // Personal Info
  firstNameFa: string;
  lastNameFa: string;
  firstNameEn?: string;
  lastNameEn?: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  age?: number;

  // Education & Employment
  educationLevel?: string;
  fieldOfStudy?: string;
  isEmployed: boolean;
  jobTitle?: string;
  
  // Language & Referral
  languageLevel?: string;
  referralSource?: string;
  referrerName?: string;
  otherReferralSource?: string;

  // Contact
  email?: string;
  mobile: string;
  
  // Rules
  acceptedRules: boolean;
}

const initialFormData: RegistrationFormData = {
  firstNameFa: '',
  lastNameFa: '',
  firstNameEn: '',
  lastNameEn: '',
  gender: undefined,
  age: undefined,
  educationLevel: '',
  fieldOfStudy: '',
  isEmployed: false,
  jobTitle: '',
  languageLevel: '',
  referralSource: '',
  referrerName: '',
  otherReferralSource: '',
  mobile: '',
  email: '',
  acceptedRules: false,
};


interface RegistrationWizardState {
  eventId: string;
  ticketType: TicketType;
  currentStep: number;
  totalSteps: number;
  stepsValidity: boolean[];
  formData: RegistrationFormData;
  isInitialized: boolean;
  finalAmount: number;
  init: (user: User, event: Event, ticketType: string, totalSteps: number, jumpToStep?: number) => void;
  setFormData: (data: Partial<RegistrationFormData>) => void;
  nextStep: () => void;
  prevStep: () => void;
  setStep: (step: number) => void;
  setStepValidity: (step: number, isValid: boolean) => void;
  isStepValid: (step: number) => boolean;
  setFinalAmount: (amount: number) => void;
  reset: (user: User, event: Event, ticketType: string, totalSteps: number) => void;
}

const getLocalStorageKey = (eventId: string, ticketType: string) => `registration-wizard-${eventId}-${ticketType}`;

const clearPlaceholderName = (value?: string | null): string => {
  if (!value) return '';
  const normalized = value.trim().toLowerCase();
  const placeholders = ['نام', 'نام خانوادگی', 'name', 'first name', 'last name'];
  return placeholders.includes(normalized) ? '' : value;
};

export const useRegistrationWizardStore = create<RegistrationWizardState>((set, get) => ({
  eventId: '',
  ticketType: 'STANDARD',
  currentStep: 0,
  totalSteps: 0,
  stepsValidity: [],
  formData: initialFormData,
  isInitialized: false,
  finalAmount: 0,
  
  init: (user, event, ticketType, totalSteps, jumpToStep) => {
    if (get().isInitialized) return;

    const storageKey = getLocalStorageKey(event.id, ticketType);
    const savedState = localStorage.getItem(storageKey);

    if (savedState) {
        try {
            const { formData, currentStep, stepsValidity } = JSON.parse(savedState);
            set({
                eventId: event.id,
                ticketType: ticketType as TicketType,
                totalSteps,
                formData,
                currentStep: jumpToStep !== undefined ? jumpToStep : currentStep,
                stepsValidity,
                isInitialized: true,
            });
        } catch (e) {
            console.error("Failed to parse saved state from localStorage", e);
            localStorage.removeItem(storageKey);
            // Fallback to default init
            get().reset(user, event, ticketType, totalSteps);
        }
    } else {
        // No saved state, perform a fresh initialization
        get().reset(user, event, ticketType, totalSteps);
    }
  },
  
  reset: (user, event, ticketType, totalSteps) => {
     const storageKey = getLocalStorageKey(event.id, ticketType);
     localStorage.removeItem(storageKey);

     const firstNameFa = clearPlaceholderName(user.firstNameFa);
     const lastNameFa = clearPlaceholderName(user.lastNameFa);
     const firstNameEn = clearPlaceholderName(user.firstNameEn);
     const lastNameEn = clearPlaceholderName(user.lastNameEn);

     set({
        eventId: event.id,
        ticketType: ticketType as TicketType,
        currentStep: 0,
        totalSteps,
        stepsValidity: Array(totalSteps).fill(false),
        formData: {
            ...initialFormData,
            firstNameFa: firstNameFa || '',
            lastNameFa: lastNameFa || '',
            firstNameEn: firstNameEn || '',
            lastNameEn: lastNameEn || '',
            gender: user.gender || undefined,
            age: user.age || undefined,
            educationLevel: user.educationLevel || '',
            fieldOfStudy: user.fieldOfStudy || '',
            isEmployed: user.isEmployed || false,
            jobTitle: user.jobTitle || '',
            languageLevel: user.languageLevel || '',
            mobile: user.mobile,
            email: user.email || '',
        },
        isInitialized: true,
     });
  },

  setFormData: (data) => {
    set(
      produce((state: RegistrationWizardState) => {
        state.formData = { ...state.formData, ...data };
        const storageKey = getLocalStorageKey(state.eventId, state.ticketType);
        if (state.isInitialized) {
            localStorage.setItem(storageKey, JSON.stringify({
                formData: state.formData,
                currentStep: state.currentStep,
                stepsValidity: state.stepsValidity,
            }));
        }
      })
    );
  },

  setStep: (step) => {
     set(
      produce((state: RegistrationWizardState) => {
        state.currentStep = Math.max(0, Math.min(step, state.totalSteps - 1));
        const storageKey = getLocalStorageKey(state.eventId, state.ticketType);
        if (state.isInitialized) {
            localStorage.setItem(storageKey, JSON.stringify({
                formData: state.formData,
                currentStep: state.currentStep,
                stepsValidity: state.stepsValidity,
            }));
        }
      })
    );
  },

  nextStep: () => get().setStep(get().currentStep + 1),
  prevStep: () => get().setStep(get().currentStep - 1),

  setStepValidity: (step, isValid) => {
    set(
      produce((state: RegistrationWizardState) => {
        state.stepsValidity[step] = isValid;
        const storageKey = getLocalStorageKey(state.eventId, state.ticketType);
        if (state.isInitialized) {
            localStorage.setItem(storageKey, JSON.stringify({
                formData: state.formData,
                currentStep: state.currentStep,
                stepsValidity: state.stepsValidity,
            }));
        }
      })
    );
  },
  
  isStepValid: (step) => get().stepsValidity[step],
  setFinalAmount: (amount) => set({ finalAmount: amount }),
}));
