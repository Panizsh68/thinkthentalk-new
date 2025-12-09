
'use client';

import { useLanguage } from '@/lib/i18n/language-provider';
import { Button } from '@/components/ui/button';

export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  const toggleLanguage = () => {
    const newLang = language === 'en' ? 'fa' : 'en';
    setLanguage(newLang);
  };

  return (
    <Button variant="ghost" size="sm" onClick={toggleLanguage} className="w-16 text-xs">
      {language === 'en' ? 'فارسی' : 'English'}
    </Button>
  );
}
