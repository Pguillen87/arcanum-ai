import React from 'react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/contexts/I18nContext';

export const LanguageToggle: React.FC = () => {
  const { locale, setLocale, mystical, setMystical } = useI18n();
  const toggleLocale = () => setLocale(locale === 'pt-BR' ? 'en' : 'pt-BR');
  const toggleMystical = () => setMystical(!mystical);

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" onClick={toggleLocale} aria-label="Alternar idioma">
        {locale === 'pt-BR' ? 'pt-BR' : 'en'}
      </Button>
      <Button variant="outline" size="sm" onClick={toggleMystical} aria-label="Alternar linguagem mística">
        {mystical ? 'Místico' : 'Neutro'}
      </Button>
    </div>
  );
};

