
'use client';

import { useRouter } from 'next/navigation';
import { useLanguage } from '@/lib/i18n/language-provider';
import { useToast } from '@/hooks/use-toast';
import { useDiscountQuery, useUpdateDiscountMutation } from '@/hooks/use-discount-queries';
import { DiscountForm } from '@/components/admin/discount-form';
import type { DiscountFormData } from '@/lib/types';
import { Loader2 } from 'lucide-react';

export default function EditDiscountPage({ params }: { params: { discountId: string } }) {
  const router = useRouter();
  const { t } = useLanguage();
  const { toast } = useToast();
  const { data: discount, isLoading, error } = useDiscountQuery(params.discountId);
  const { mutate: updateDiscount, isPending } = useUpdateDiscountMutation();

  const handleSubmit = (data: DiscountFormData) => {
    updateDiscount({ id: params.discountId, data }, {
        onSuccess: (updatedDiscount) => {
            toast({
                title: t('admin.discounts.edit.successTitle'),
                description: t('admin.discounts.edit.successDescription', { discountName: updatedDiscount.name }),
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
    });
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }
  
  if (error || !discount) {
    return <p className="text-destructive">{t('errors.genericTitle')}</p>
  }

  return (
    <div className="space-y-6">
       <div>
        <h1 className="text-2xl font-bold">{t('admin.discounts.edit.title')}</h1>
        <p className="mt-2 text-muted-foreground">{t('admin.discounts.edit.subtitle', { discountName: discount.name })}</p>
      </div>
      <DiscountForm initialData={discount} onSubmit={handleSubmit} isSubmitting={isPending} />
    </div>
  );
}
