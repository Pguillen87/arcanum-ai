// Sem jest-dom para evitar dependências extras; usamos asserts nativos

// Mock do AuthContext para evitar chamadas reais ao Supabase nas páginas
import { vi } from 'vitest';

// Mock do ResizeObserver para testes de UI
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
} as any;

vi.mock('@/contexts/AuthContext', async () => {
  const stub = {
    user: null,
    profile: null,
    signInWithEmail: async () => ({ error: null }),
    signUp: async () => ({ error: null }),
    updateProfile: async () => ({ error: null }),
  };

  const useAuth = () => stub;
  return { useAuth };
});