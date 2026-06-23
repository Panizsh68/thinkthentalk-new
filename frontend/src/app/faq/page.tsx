'use client';

import { useLanguage } from '@/lib/i18n/language-provider';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

export default function FAQPage() {
  const { t } = useLanguage();

  const sections = [
    {
      category: 'general',
      items: ['whatIs', 'howToJoin'],
    },
    {
      category: 'registration',
      items: ['isRegistrationRequired', 'howToPay'],
    },
    {
      category: 'events',
      items: ['onlineOrOffline', 'refundPolicy'],
    },
  ];

  return (
    <div className="container max-w-4xl py-12 md:py-20">
      <div className="mb-12 space-y-4 text-center">
        <h1 className="text-h1">{t('faq.title')}</h1>
        <p className="mx-auto max-w-2xl text-muted-foreground sm:text-lg">
          {t('faq.subtitle')}
        </p>
      </div>

      <div className="space-y-12">
        {sections.map((section) => (
          <section key={section.category} className="space-y-6">
            <h2 className="text-2xl font-bold tracking-tight">
              {t(`faq.categories.${section.category}`)}
            </h2>
            <Accordion type="single" collapsible className="w-full">
              {section.items.map((key) => (
                <AccordionItem key={key} value={key} className="border-b-0 mb-4 rounded-lg border bg-card px-4">
                  <AccordionTrigger className="text-left font-semibold hover:no-underline py-4">
                    {t(`faq.questions.${key}.q`)}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed pb-4">
                    {t(`faq.questions.${key}.a`)}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </section>
        ))}
      </div>
    </div>
  );
}
