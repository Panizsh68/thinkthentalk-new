
'use client';
import { Suspense } from 'react';
import { useSearchParams, useParams } from 'next/navigation';
import { RegistrationWizard } from '@/components/registration-wizard';

function RegistrationWizardPageContent() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const ticketType = searchParams.get('ticketType');
  const step = searchParams.get('step');

  return (
    <RegistrationWizard
      eventId={params.id}
      ticketType={ticketType ?? undefined}
      jumpToStep={step ? parseInt(step, 10) : undefined}
    />
  );
}


export default function RegistrationWizardPage() {
  return (
    <div className="container py-12">
      <Suspense fallback={<div>Loading wizard...</div>}>
         <RegistrationWizardPageContent />
      </Suspense>
    </div>
  );
}

    