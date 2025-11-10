import { describe, it, expect } from 'vitest';
import { t } from '@/lib/i18n';
import { getLabel } from '@/lib/glossario';

describe('i18n básico', () => {
  it('retorna strings em pt-BR e en', () => {
    expect(t('hero.start', 'pt-BR')).toBe('Iniciar Jornada');
    expect(t('hero.start', 'en')).toBe('Start Journey');
  });
  it('usa glossário místico quando solicitado', () => {
    expect(getLabel('auth.login', { mystical: true, locale: 'pt-BR' })).toBe('Abrir o Portal');
    expect(getLabel('auth.login', { mystical: false, locale: 'pt-BR' })).toBe('Entrar');
    expect(getLabel('auth.login', { mystical: true, locale: 'en' })).toBe('Open the Portal');
  });
});

