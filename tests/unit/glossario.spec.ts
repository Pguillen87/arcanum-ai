import { describe, it, expect } from 'vitest';
import { getLabel } from '@/lib/glossario';

describe('Glossário místico', () => {
  it('retorna rótulos místicos por padrão (pt-BR)', () => {
    expect(getLabel('auth.login')).toBe('Abrir o Portal');
    expect(getLabel('profile.title')).toBe('Essência Pessoal');
  });

  it('aplica fallback neutral quando mystical=false', () => {
    expect(getLabel('auth.login', { mystical: false })).toBe('Entrar');
    expect(getLabel('profile.title', { mystical: false })).toBe('Meu Perfil');
  });

  it('suporta locale en com fallback místico/neutral', () => {
    expect(getLabel('auth.login', { locale: 'en' })).toBe('Open the Portal');
    expect(getLabel('auth.login', { locale: 'en', mystical: false })).toBe('Sign in');
  });
});