'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useEffect, useState, useMemo } from 'react';
import { Loader2, ShieldCheck, Mail, Phone, Link2, CheckCircle2 } from 'lucide-react';

import { useLanguage } from '@/lib/i18n/language-provider';
import { useAuth } from '@/lib/auth/auth-provider';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

import { useUser, useAuth as useFirebase } from '@/firebase';
import { useAuthIdentity } from '@/hooks/use-auth-identity';
import { EmailAuthProvider, PhoneAuthProvider, RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import { cn } from '@/lib/utils';

const placeholderNames = ['نام', 'نام خانوادگی', 'name', 'first name', 'last name'];
const clearPlaceholderName = (value?: string | null): string => {
  if (!value) return '';
  const normalized = value.trim().toLowerCase();
  return placeholderNames.includes(normalized) ? '' : value;
};

const getProfileSchema = (t: (key: string) => string) => z.object({
  firstNameFa: z.string().min(1, t('registration.validation.required')),
  lastNameFa: z.string().min(1, t('registration.validation.required')),
  firstNameEn: z.string().optional(),
  lastNameEn: z.string().optional(),
  age: z.coerce.number({ invalid_type_error: t('registration.validation.positiveNumber') }).int().positive(t('registration.validation.positiveNumber')).optional().or(z.literal('')),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
  mobile: z.string(),
  email: z.string().email({ message: t('registration.validation.invalidEmail') }).optional().or(z.literal('')),
  educationLevel: z.string().optional(),
  fieldOfStudy: z.string().optional(),
  isEmployed: z.boolean().default(false),
  jobTitle: z.string().optional(),
  avatarUrl: z.string().optional(),
  languageLevel: z.string().optional(),
}).refine(data => {
  if (data.isEmployed) {
    return !!data.jobTitle && data.jobTitle.length > 0;
  }
  return true;
}, {
  message: t('registration.validation.required'),
  path: ['jobTitle'],
});

type ProfileFormValues = z.infer<ReturnType<typeof getProfileSchema>>;

export default function UserProfilePage() {
  const { t, language } = useLanguage();
  const isRTL = language === 'fa';
  const { currentUser, updateUserProfile, isLoading: isAuthLoading } = useAuth();
  const auth = useFirebase();
  const { status, linkMethod } = useAuthIdentity();
  const { toast } = useToast();

  const [linkEmailOpen, setLinkEmailOpen] = useState(false);
  const [emailToLink, setEmailToLink] = useState('');
  const [passwordToLink, setPasswordToLink] = useState('');
  
  const [linkPhoneOpen, setLinkPhoneOpen] = useState(false);
  const [phoneToLink, setPhoneToLink] = useState('');
  const [phoneOtp, setPhoneOtp] = useState('');
  const [verificationId, setVerificationId] = useState('');
  const [linkingStep, setLinkingStep] = useState<'input' | 'otp'>('input');
  const [isLoadingLinking, setIsLoadingLinking] = useState(false);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(getProfileSchema(t)),
    defaultValues: {
      firstNameFa: '',
      lastNameFa: '',
      firstNameEn: '',
      lastNameEn: '',
      age: '' as any,
      gender: undefined,
      mobile: '',
      email: '',
      educationLevel: '',
      fieldOfStudy: '',
      isEmployed: false,
      jobTitle: '',
      avatarUrl: '',
      languageLevel: '',
    },
    mode: 'onTouched',
  });

  useEffect(() => {
    if (currentUser) {
      form.reset({
        firstNameFa: clearPlaceholderName(currentUser.firstNameFa),
        lastNameFa: clearPlaceholderName(currentUser.lastNameFa),
        firstNameEn: clearPlaceholderName(currentUser.firstNameEn),
        lastNameEn: clearPlaceholderName(currentUser.lastNameEn),
        age: (currentUser.age || '') as any,
        gender: currentUser.gender || undefined,
        mobile: currentUser.mobile || '',
        email: currentUser.email || '',
        educationLevel: currentUser.educationLevel || '',
        fieldOfStudy: currentUser.fieldOfStudy || '',
        isEmployed: currentUser.isEmployed || false,
        jobTitle: currentUser.jobTitle || '',
        avatarUrl: (currentUser as any).avatarUrl || '',
        languageLevel: currentUser.languageLevel || '',
      });
    }
  }, [currentUser?.id, form]);

  // Determine linked status based on both Firebase and our Backend DB
  const identityStatus = useMemo(() => {
    return {
      hasEmail: !!currentUser?.email || !!status?.hasEmail,
      hasPhone: !!currentUser?.mobile || !!status?.hasPhone,
    };
  }, [currentUser, status]);

  async function onSubmit(values: ProfileFormValues) {
    if (!currentUser) return;
    try {
      const { mobile, ...updateData } = values;
      await updateUserProfile(updateData as any);
      toast({ title: t('profile.updateSuccessTitle'), description: t('profile.updateSuccessDescription') });
    } catch (error: any) {
      toast({ variant: 'destructive', title: t('errors.genericTitle'), description: error.message });
    }
  }

  const handleLinkEmail = async () => {
    if (!emailToLink || !passwordToLink) return;
    setIsLoadingLinking(true);
    try {
      const credential = EmailAuthProvider.credential(emailToLink, passwordToLink);
      await linkMethod(credential);
      toast({ title: t('profile.identity.linkSuccess') });
      setLinkEmailOpen(false);
    } catch (e: any) {
      toast({ variant: 'destructive', title: t('errors.genericTitle'), description: e.message });
    } finally {
      setIsLoadingLinking(false);
    }
  };

  const handleSendPhoneOtp = async () => {
    if (!phoneToLink || !auth) return;
    setIsLoadingLinking(true);
    try {
      const verifier = new RecaptchaVerifier(auth, 'recaptcha-container', { size: 'invisible' });
      const confirmation = await signInWithPhoneNumber(auth, phoneToLink, verifier);
      setVerificationId(confirmation.verificationId);
      setLinkingStep('otp');
    } catch (e: any) {
      toast({ variant: 'destructive', title: t('errors.genericTitle'), description: e.message });
    } finally {
      setIsLoadingLinking(false);
    }
  };

  const handleVerifyPhone = async () => {
    if (!phoneOtp || !verificationId) return;
    setIsLoadingLinking(true);
    try {
      const credential = PhoneAuthProvider.credential(verificationId, phoneOtp);
      await linkMethod(credential);
      toast({ title: t('profile.identity.linkSuccess') });
      setLinkPhoneOpen(false);
      setLinkingStep('input');
    } catch (e: any) {
      toast({ variant: 'destructive', title: t('errors.genericTitle'), description: e.message });
    } finally {
      setIsLoadingLinking(false);
    }
  };

  const isEmployed = form.watch('isEmployed');
  const educationLevels = ['high-school', 'associate', 'bachelor', 'master', 'phd', 'other'];
  const languageLevels = ['beginner', 'intermediate', 'advanced', 'native'];

  if (isAuthLoading || !currentUser) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className={cn("mb-6", isRTL && "text-right")}>
        <h1 className="text-2xl font-bold">{t('profile.title')}</h1>
        <p className="text-muted-foreground">{t('profile.subtitle')}</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8" data-testid="profile-form">
          {/* Account Security & Identity Linking - Moved higher for visibility */}
          <Card className="border-primary/20 bg-primary/5 shadow-sm">
            <CardHeader className={cn(isRTL && "text-right")}>
              <CardTitle className={cn("flex items-center gap-2 text-primary", isRTL && "flex-row-reverse")}>
                <ShieldCheck className="h-5 w-5" />
                {t('profile.identity.title')}
              </CardTitle>
              <CardDescription>{t('profile.identity.subtitle')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Email Linking Status */}
                <div className={cn("flex items-center justify-between p-4 bg-background rounded-lg border", isRTL && "flex-row-reverse")}>
                  <div className={cn("flex items-center gap-3", isRTL && "flex-row-reverse")}>
                    <div className="p-2 bg-muted rounded-full">
                      <Mail className="h-5 w-5" />
                    </div>
                    <div className={cn(isRTL && "text-right")}>
                      <p className="text-sm font-semibold">{t('registration.fields.email')}</p>
                      {identityStatus.hasEmail ? (
                        <p className="text-xs text-green-600 flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          {t('profile.identity.linked')}
                        </p>
                      ) : (
                        <p className="text-xs text-muted-foreground">{t('profile.identity.notLinked')}</p>
                      )}
                    </div>
                  </div>
                  {!identityStatus.hasEmail && (
                    <Button variant="outline" size="sm" type="button" onClick={() => setLinkEmailOpen(true)}>
                      <Link2 className="h-4 w-4 mr-2" />
                      {t('profile.identity.linkButton')}
                    </Button>
                  )}
                </div>

                {/* Phone Linking Status */}
                <div className={cn("flex items-center justify-between p-4 bg-background rounded-lg border", isRTL && "flex-row-reverse")}>
                  <div className={cn("flex items-center gap-3", isRTL && "flex-row-reverse")}>
                    <div className="p-2 bg-muted rounded-full">
                      <Phone className="h-5 w-5" />
                    </div>
                    <div className={cn(isRTL && "text-right")}>
                      <p className="text-sm font-semibold">{t('auth.mobileLabel')}</p>
                      {identityStatus.hasPhone ? (
                        <p className="text-xs text-green-600 flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          {t('profile.identity.linked')}
                        </p>
                      ) : (
                        <p className="text-xs text-muted-foreground">{t('profile.identity.notLinked')}</p>
                      )}
                    </div>
                  </div>
                  {!identityStatus.hasPhone && (
                    <Button variant="outline" size="sm" type="button" onClick={() => setLinkPhoneOpen(true)}>
                      <Link2 className="h-4 w-4 mr-2" />
                      {t('profile.identity.linkButton')}
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-8">
              {/* Personal Card */}
              <Card>
                <CardHeader className={cn(isRTL && "text-right")}>
                  <CardTitle>{t('registration.steps.personal')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 gap-4">
                    <FormField control={form.control} name="firstNameFa" render={({ field }) => (<FormItem><FormLabel>{t('registration.fields.firstNameFa')}</FormLabel><FormControl><Input placeholder={t('registration.placeholders.firstNameFa')} {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="lastNameFa" render={({ field }) => (<FormItem><FormLabel>{t('registration.fields.lastNameFa')}</FormLabel><FormControl><Input placeholder={t('registration.placeholders.lastNameFa')} {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="firstNameEn" render={({ field }) => (<FormItem><FormLabel>{t('registration.fields.firstNameEn')}</FormLabel><FormControl><Input placeholder={t('registration.placeholders.firstNameEn')} {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="lastNameEn" render={({ field }) => (<FormItem><FormLabel>{t('registration.fields.lastNameEn')}</FormLabel><FormControl><Input placeholder={t('registration.placeholders.lastNameEn')} {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="age" render={({ field }) => (<FormItem><FormLabel>{t('registration.fields.age')}</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="gender" render={({ field }) => (
                      <FormItem className="space-y-3"><FormLabel>{t('registration.fields.gender')}</FormLabel>
                        <FormControl>
                          <RadioGroup onValueChange={field.onChange} value={field.value} className={cn("flex items-center gap-4", isRTL && "flex-row-reverse")}>
                            <FormItem className={cn("flex items-center space-x-2 space-y-0", isRTL && "space-x-reverse")}><FormControl><RadioGroupItem value="MALE" /></FormControl><FormLabel className="font-normal">{t('registration.fields.genderMale')}</FormLabel></FormItem>
                            <FormItem className={cn("flex items-center space-x-2 space-y-0", isRTL && "space-x-reverse")}><FormControl><RadioGroupItem value="FEMALE" /></FormControl><FormLabel className="font-normal">{t('registration.fields.genderFemale')}</FormLabel></FormItem>
                            <FormItem className={cn("flex items-center space-x-2 space-y-0", isRTL && "space-x-reverse")}><FormControl><RadioGroupItem value="OTHER" /></FormControl><FormLabel className="font-normal">{t('registration.fields.genderOther')}</FormLabel></FormItem>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                </CardContent>
              </Card>

              {/* Contact Card */}
              <Card>
                <CardHeader className={cn(isRTL && "text-right")}><CardTitle>{t('registration.steps.contact')}</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <FormField control={form.control} name="mobile" render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('auth.mobileLabel')}</FormLabel>
                      <FormControl><Input {...field} readOnly disabled dir="ltr" className="bg-muted/50" /></FormControl>
                      <FormDescription className={cn(isRTL && "text-right")}>{t('profile.mobileReadOnly')}</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="email" render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('registration.fields.email')}</FormLabel>
                      <FormControl><Input dir="ltr" {...field} data-testid="profile-email-input" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </CardContent>
              </Card>
            </div>

            <div className="space-y-8">
              {/* Education Card */}
              <Card>
                <CardHeader className={cn(isRTL && "text-right")}><CardTitle>{t('registration.steps.education')}</CardTitle></CardHeader>
                <CardContent className="space-y-6">
                  <FormField control={form.control} name="educationLevel" render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('registration.fields.educationLevel')}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder={t('registration.placeholders.educationLevel')} /></SelectTrigger></FormControl>
                        <SelectContent dir={isRTL ? "rtl" : "ltr"}>
                          {educationLevels.map(level => <SelectItem key={level} value={level}>{t(`registration.fields.educationLevels.${level}`)}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="fieldOfStudy" render={({ field }) => (<FormItem><FormLabel>{t('registration.fields.fieldOfStudy')}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                  
                  <Separator />
                  
                  <FormField control={form.control} name="isEmployed" render={({ field }) => (
                    <FormItem className={cn("flex flex-row items-center justify-between rounded-lg border p-4", isRTL && "flex-row-reverse")}>
                      <FormLabel className="text-base cursor-pointer">{t('registration.fields.isEmployed')}</FormLabel>
                      <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                    </FormItem>
                  )} />
                  {isEmployed && (
                    <FormField control={form.control} name="jobTitle" render={({ field }) => (
                      <FormItem className="animate-in slide-in-from-top-2 duration-300"><FormLabel>{t('registration.fields.jobTitle')}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                  )}

                  <Separator />

                  <FormField control={form.control} name="languageLevel" render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('registration.fields.languageLevel')}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder={t('registration.placeholders.languageLevel')} /></SelectTrigger></FormControl>
                        <SelectContent dir={isRTL ? "rtl" : "ltr"}>
                          {languageLevels.map(level => <SelectItem key={level} value={level}>{t(`registration.fields.languageLevelsList.${level}`)}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                </CardContent>
              </Card>
            </div>
          </div>

          <div className={cn("flex justify-start pt-4", isRTL && "justify-end")}>
            <Button type="submit" size="lg" className="px-12" disabled={form.formState.isSubmitting} data-testid="profile-save-button">
              {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('profile.saveButton')}
            </Button>
          </div>
        </form>
      </Form>

      {/* Email Link Dialog */}
      <Dialog open={linkEmailOpen} onOpenChange={setLinkEmailOpen}>
        <DialogContent className={isRTL ? "font-vazir" : ""}>
          <DialogHeader className={cn(isRTL && "text-right")}>
            <DialogTitle>{t('profile.identity.linkEmailTitle')}</DialogTitle>
            <DialogDescription>{t('profile.identity.linkEmailDesc')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{t('registration.fields.email')}</Label>
              <Input value={emailToLink} onChange={(e) => setEmailToLink(e.target.value)} placeholder="user@example.com" dir="ltr" />
            </div>
            <div className="space-y-2">
              <Label>Password</Label>
              <Input type="password" value={passwordToLink} onChange={(e) => setPasswordToLink(e.target.value)} placeholder="••••••••" dir="ltr" />
            </div>
          </div>
          <DialogFooter className={cn(isRTL && "flex-row-reverse gap-2")}>
            <Button variant="ghost" onClick={() => setLinkEmailOpen(false)}>{t('actions.back')}</Button>
            <Button onClick={handleLinkEmail} disabled={isLoadingLinking}>
              {isLoadingLinking && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('profile.identity.linkButton')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Phone Link Dialog */}
      <Dialog open={linkPhoneOpen} onOpenChange={setLinkPhoneOpen}>
        <DialogContent className={isRTL ? "font-vazir" : ""}>
          <DialogHeader className={cn(isRTL && "text-right")}>
            <DialogTitle>{t('profile.identity.linkPhoneTitle')}</DialogTitle>
            <DialogDescription>{t('profile.identity.linkPhoneDesc')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {linkingStep === 'input' ? (
              <div className="space-y-2">
                <Label>{t('auth.mobileLabel')}</Label>
                <Input value={phoneToLink} onChange={(e) => setPhoneToLink(e.target.value)} placeholder="+989123456789" dir="ltr" />
                <p className="text-xs text-muted-foreground">Use international format (e.g., +98...)</p>
              </div>
            ) : (
              <div className="space-y-2">
                <Label>{t('auth.otpLabel')}</Label>
                <Input value={phoneOtp} onChange={(e) => setPhoneOtp(e.target.value)} placeholder="123456" dir="ltr" maxLength={6} />
              </div>
            )}
            <div id="recaptcha-container"></div>
          </div>
          <DialogFooter className={cn(isRTL && "flex-row-reverse gap-2")}>
            <Button variant="ghost" onClick={() => { setLinkPhoneOpen(false); setLinkingStep('input'); }}>{t('actions.back')}</Button>
            {linkingStep === 'input' ? (
              <Button onClick={handleSendPhoneOtp} disabled={isLoadingLinking}>
                {isLoadingLinking && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t('auth.sendOtpButton')}
              </Button>
            ) : (
              <Button onClick={handleVerifyPhone} disabled={isLoadingLinking}>
                {isLoadingLinking && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t('auth.verifyButton')}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
