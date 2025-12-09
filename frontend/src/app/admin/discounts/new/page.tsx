
'use client';

import { useRouter } from 'next/navigation';
import { useLanguage } from '@/lib/i18n/language-provider';
import { useToast } from '@/hooks/use-toast';
import { useCreateDiscountMutation } from '@/hooks/use-discount-queries';
import { DiscountForm } from '@/components/admin/discount-form';
import type { DiscountFormData } from '@/lib/types';


export default function NewDiscountPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const { toast } = useToast();
  const { mutate: createDiscount, isPending } = useCreateDiscountMutation();

  const handleSubmit = (data: DiscountFormData) => {
    createDiscount(data, {
        onSuccess: (newDiscount) => {
            toast({
                title: t('admin.discounts.create.successTitle'),
                description: t('admin.discounts.create.successDescription', { discountName: newDiscount.name }),
            });
            router.push('/admin/discounts');
        },
        onError: (error) => {
            toast({
                variant: 'destructive',
                title: t('errors.genericTitle'),
                description: error.message,
            })
        }
    })
  };

  const initialData: Partial<DiscountFormData> = {
    name: '',
    code: '',
    value: 0,
    applicableEventIds: [],
    maxUses: undefined,
    maxUsesPerUser: undefined,
    minAmount: undefined,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t('admin.discounts.create.title')}</h1>
        <p className="mt-2 text-muted-foreground">{t('admin.discounts.create.subtitle')}</p>
      </div>
      <DiscountForm initialData={initialData} onSubmit={handleSubmit} isSubmitting={isPending} />
    </div>
  );
}
