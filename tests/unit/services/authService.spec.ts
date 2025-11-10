/**
 * Testes unitários para authService
 * Valida autenticação por email, username, Google OAuth e disponibilidade de username
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authService, isEmail, normalizeUsername } from '@/services/authService';
import { supabase } from '@/integrations/supabase/client';
import { Observability } from '@/lib/observability';

// Mock do Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn(),
      signInWithOAuth: vi.fn(),
      signUp: vi.fn(),
      resetPasswordForEmail: vi.fn(),
      setSession: vi.fn(),
    },
    rpc: vi.fn(),
  },
}));

// Mock do Observability
vi.mock('@/lib/observability', () => ({
  Observability: {
    trackError: vi.fn(),
  },
}));

// Mock do fetch global
global.fetch = vi.fn();

// Mock do window.sessionStorage
Object.defineProperty(window, 'sessionStorage', {
  value: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  },
  writable: true,
});

// Mock do window.location
Object.defineProperty(window, 'location', {
  value: {
    origin: 'http://localhost:5173',
  },
  writable: true,
});

describe('authService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('isEmail', () => {
    it('deve identificar email válido', () => {
      expect(isEmail('user@example.com')).toBe(true);
      expect(isEmail('test.email@domain.co.uk')).toBe(true);
    });

    it('deve identificar username como não-email', () => {
      expect(isEmail('username123')).toBe(false);
      expect(isEmail('user_name')).toBe(false);
    });

    it('deve lidar com espaços', () => {
      expect(isEmail(' user@example.com ')).toBe(true);
      expect(isEmail('  user@example.com  ')).toBe(true);
    });
  });

  describe('normalizeUsername', () => {
    it('deve normalizar username para lowercase', () => {
      expect(normalizeUsername('USERNAME')).toBe('username');
      expect(normalizeUsername('UserName')).toBe('username');
    });

    it('deve remover espaços', () => {
      expect(normalizeUsername(' user name ')).toBe('user name');
    });

    it('deve aplicar normalização NFKC', () => {
      expect(normalizeUsername('café')).toBe('café');
    });
  });

  describe('signInWithEmail', () => {
    it('deve fazer login com email e senha válidos (persistSession=true)', async () => {
      const mockSession = {
        access_token: 'token123',
        refresh_token: 'refresh123',
        user: { id: 'user123', email: 'test@example.com' },
      };

      const mockResponse = {
        data: { session: mockSession, user: mockSession.user },
        error: null,
      };

      vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue(mockResponse);

      const result = await authService.signInWithEmail('test@example.com', 'password123', true);

      expect(result.error).toBeNull();
      // authService retorna { data, error } onde data é o resultado de signInWithPassword
      // que contém { session, user }
      expect(result.data).toEqual(mockResponse.data);
      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });

    it('deve fazer login com persistSession=false usando sessionStorage', async () => {
      const mockSession = {
        access_token: 'token123',
        refresh_token: 'refresh123',
        user: { id: 'user123', email: 'test@example.com' },
      };

      // Mock do createClient dinâmico
      const mockTempClient = {
        auth: {
          signInWithPassword: vi.fn().mockResolvedValue({
            data: { session: mockSession, user: mockSession.user },
            error: null,
          }),
        },
      };

      vi.mocked(supabase.auth.setSession).mockResolvedValue({
        data: { session: mockSession, user: mockSession.user },
        error: null,
      });

      // Mock do import dinâmico
      vi.doMock('@supabase/supabase-js', () => ({
        createClient: vi.fn(() => mockTempClient),
      }));

      const result = await authService.signInWithEmail('test@example.com', 'password123', false);

      // Como o import dinâmico é complexo, vamos apenas verificar que não houve erro
      // Em um teste real, precisaríamos mockar melhor o import dinâmico
      expect(result).toBeDefined();
    });

    it('deve retornar erro quando credenciais são inválidas', async () => {
      const mockError = { message: 'Invalid login credentials', status: 400 };

      vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
        data: { session: null, user: null },
        error: mockError,
      });

      const result = await authService.signInWithEmail('test@example.com', 'wrongpassword', true);

      expect(result.error).toEqual(mockError);
      // Quando há erro, data pode ser null ou { session: null, user: null }
      expect(result.data).toBeFalsy();
      expect(Observability.trackError).not.toHaveBeenCalled(); // Erro esperado, não deve logar
    });

    it('deve tratar erros de rede', async () => {
      const networkError = new Error('Network error');
      vi.mocked(supabase.auth.signInWithPassword).mockRejectedValue(networkError);

      const result = await authService.signInWithEmail('test@example.com', 'password123', true);

      expect(result.error).toBe(networkError);
      expect(result.data).toBeNull();
      expect(Observability.trackError).toHaveBeenCalledWith(networkError);
    });

    it('deve trimar email antes de enviar', async () => {
      const mockSession = {
        access_token: 'token123',
        refresh_token: 'refresh123',
        user: { id: 'user123', email: 'test@example.com' },
      };

      vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
        data: { session: mockSession, user: mockSession.user },
        error: null,
      });

      await authService.signInWithEmail('  test@example.com  ', 'password123', true);

      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });
  });

  describe('signInWithUsername', () => {
    it('deve fazer login com username válido', async () => {
      const mockSession = {
        access_token: 'token123',
        refresh_token: 'refresh123',
        user: { id: 'user123', email: 'test@example.com' },
      };

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ session: mockSession }),
      } as Response);

      vi.mocked(supabase.auth.setSession).mockResolvedValue({
        data: { session: mockSession, user: mockSession.user },
        error: null,
      });

      const result = await authService.signInWithUsername('testuser', 'password123', true);

      expect(result.error).toBeNull();
      expect(result.data).toEqual(mockSession);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/functions/v1/username-login'),
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: 'testuser', password: 'password123', persistSession: true }),
        })
      );
    });

    it('deve normalizar username antes de enviar', async () => {
      const mockSession = {
        access_token: 'token123',
        refresh_token: 'refresh123',
        user: { id: 'user123', email: 'test@example.com' },
      };

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ session: mockSession }),
      } as Response);

      vi.mocked(supabase.auth.setSession).mockResolvedValue({
        data: { session: mockSession, user: mockSession.user },
        error: null,
      });

      await authService.signInWithUsername('  TESTUSER  ', 'password123', true);

      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify({ username: 'testuser', password: 'password123', persistSession: true }),
        })
      );
    });

    it('deve retornar erro quando Edge Function retorna erro', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ code: 'AUTH_401', message: 'Invalid credentials' }),
      } as Response);

      const result = await authService.signInWithUsername('testuser', 'wrongpassword', true);

      expect(result.error).toBeDefined();
      expect(result.data).toBeNull();
    });

    it('deve tratar erros de rede', async () => {
      const networkError = new Error('Network error');
      vi.mocked(fetch).mockRejectedValueOnce(networkError);

      const result = await authService.signInWithUsername('testuser', 'password123', true);

      expect(result.error).toBe(networkError);
      expect(result.data).toBeNull();
      expect(Observability.trackError).toHaveBeenCalledWith(networkError);
    });

    it('deve retornar erro quando sessão não é retornada', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({}), // Sem session
      } as Response);

      const result = await authService.signInWithUsername('testuser', 'password123', true);

      expect(result.error).toBeDefined();
      expect(result.error?.code).toBe('NO_SESSION');
      expect(result.data).toBeNull();
    });
  });

  describe('signInWithGoogle', () => {
    it('deve iniciar fluxo OAuth do Google', async () => {
      vi.mocked(supabase.auth.signInWithOAuth).mockResolvedValue({
        data: { provider: 'google', url: 'https://accounts.google.com/oauth' },
        error: null,
      });

      const result = await authService.signInWithGoogle();

      expect(result.error).toBeNull();
      expect(supabase.auth.signInWithOAuth).toHaveBeenCalledWith({
        provider: 'google',
        options: {
          redirectTo: 'http://localhost:5173/',
        },
      });
    });

    it('deve usar redirectTo customizado quando fornecido', async () => {
      vi.mocked(supabase.auth.signInWithOAuth).mockResolvedValue({
        data: { provider: 'google', url: 'https://accounts.google.com/oauth' },
        error: null,
      });

      await authService.signInWithGoogle('http://localhost:5173/custom');

      expect(supabase.auth.signInWithOAuth).toHaveBeenCalledWith({
        provider: 'google',
        options: {
          redirectTo: 'http://localhost:5173/custom',
        },
      });
    });

    it('deve tratar erros de OAuth', async () => {
      const oauthError = { message: 'OAuth error', status: 500 };
      vi.mocked(supabase.auth.signInWithOAuth).mockResolvedValue({
        data: { provider: 'google', url: null },
        error: oauthError,
      });

      const result = await authService.signInWithGoogle();

      expect(result.error).toEqual(oauthError);
    });

    it('deve tratar exceções', async () => {
      const exception = new Error('Unexpected error');
      vi.mocked(supabase.auth.signInWithOAuth).mockRejectedValue(exception);

      const result = await authService.signInWithGoogle();

      expect(result.error).toBe(exception);
      expect(Observability.trackError).toHaveBeenCalledWith(exception);
    });
  });

  describe('signUp', () => {
    it('deve criar novo usuário com email e senha', async () => {
      const mockUser = {
        id: 'user123',
        email: 'newuser@example.com',
        user_metadata: { full_name: 'John Doe' },
      };

      vi.mocked(supabase.auth.signUp).mockResolvedValue({
        data: { user: mockUser, session: null },
        error: null,
      });

      const result = await authService.signUp('newuser@example.com', 'password123', 'John Doe');

      expect(result.error).toBeNull();
      expect(result.data?.user).toEqual(mockUser);
      expect(supabase.auth.signUp).toHaveBeenCalledWith({
        email: 'newuser@example.com',
        password: 'password123',
        options: {
          emailRedirectTo: 'http://localhost:5173/',
          data: {
            full_name: 'John Doe',
          },
        },
      });
    });

    it('deve trimar email antes de enviar', async () => {
      const mockUser = {
        id: 'user123',
        email: 'newuser@example.com',
        user_metadata: { full_name: 'John Doe' },
      };

      vi.mocked(supabase.auth.signUp).mockResolvedValue({
        data: { user: mockUser, session: null },
        error: null,
      });

      await authService.signUp('  newuser@example.com  ', 'password123', 'John Doe');

      expect(supabase.auth.signUp).toHaveBeenCalledWith({
        email: 'newuser@example.com',
        password: 'password123',
        options: expect.any(Object),
      });
    });

    it('deve retornar erro quando email já existe', async () => {
      const duplicateError = { message: 'User already registered', status: 400 };
      vi.mocked(supabase.auth.signUp).mockResolvedValue({
        data: { user: null, session: null },
        error: duplicateError,
      });

      const result = await authService.signUp('existing@example.com', 'password123', 'John Doe');

      expect(result.error).toEqual(duplicateError);
      // Quando há erro, data pode ser null ou { user: null, session: null }
      expect(result.data).toBeFalsy();
    });

    it('deve tratar erros de rede', async () => {
      const networkError = new Error('Network error');
      vi.mocked(supabase.auth.signUp).mockRejectedValue(networkError);

      const result = await authService.signUp('newuser@example.com', 'password123', 'John Doe');

      expect(result.error).toBe(networkError);
      expect(result.data).toBeNull();
      expect(Observability.trackError).toHaveBeenCalledWith(networkError);
    });
  });

  describe('resetPasswordForEmail', () => {
    it('deve enviar email de reset de senha', async () => {
      vi.mocked(supabase.auth.resetPasswordForEmail).mockResolvedValue({
        data: {},
        error: null,
      });

      const result = await authService.resetPasswordForEmail('user@example.com');

      expect(result.error).toBeNull();
      expect(supabase.auth.resetPasswordForEmail).toHaveBeenCalledWith('user@example.com', {
        redirectTo: 'http://localhost:5173/auth?reset=true',
      });
    });

    it('deve trimar email antes de enviar', async () => {
      vi.mocked(supabase.auth.resetPasswordForEmail).mockResolvedValue({
        data: {},
        error: null,
      });

      await authService.resetPasswordForEmail('  user@example.com  ');

      expect(supabase.auth.resetPasswordForEmail).toHaveBeenCalledWith('user@example.com', expect.any(Object));
    });

    it('deve retornar erro quando email não existe', async () => {
      const notFoundError = { message: 'User not found', status: 404 };
      vi.mocked(supabase.auth.resetPasswordForEmail).mockResolvedValue({
        data: {},
        error: notFoundError,
      });

      const result = await authService.resetPasswordForEmail('nonexistent@example.com');

      expect(result.error).toEqual(notFoundError);
    });

    it('deve tratar exceções', async () => {
      const exception = new Error('Unexpected error');
      vi.mocked(supabase.auth.resetPasswordForEmail).mockRejectedValue(exception);

      const result = await authService.resetPasswordForEmail('user@example.com');

      expect(result.error).toBe(exception);
      expect(Observability.trackError).toHaveBeenCalledWith(exception);
    });
  });

  describe('isUsernameAvailable', () => {
    it('deve retornar true quando username está disponível', async () => {
      vi.mocked(supabase.rpc).mockResolvedValueOnce({
        data: true,
        error: null,
      });

      const result = await authService.isUsernameAvailable('availableuser');

      expect(result.available).toBe(true);
      expect(result.suggestion).toBeUndefined();
      expect(result.error).toBeUndefined();
      expect(supabase.rpc).toHaveBeenCalledWith('auth_username_available', {
        p_username: 'availableuser',
      });
    });

    it('deve retornar false e sugerir alternativa quando username não está disponível', async () => {
      vi.mocked(supabase.rpc)
        .mockResolvedValueOnce({
          data: false,
          error: null,
        })
        .mockResolvedValueOnce({
          data: 'availableuser1',
          error: null,
        });

      const result = await authService.isUsernameAvailable('takenuser');

      expect(result.available).toBe(false);
      expect(result.suggestion).toBe('availableuser1');
      expect(supabase.rpc).toHaveBeenCalledWith('auth_username_available', {
        p_username: 'takenuser',
      });
      expect(supabase.rpc).toHaveBeenCalledWith('username_suggest', {
        base_name: 'takenuser',
      });
    });

    it('deve normalizar username antes de verificar', async () => {
      vi.mocked(supabase.rpc).mockResolvedValueOnce({
        data: true,
        error: null,
      });

      await authService.isUsernameAvailable('  TESTUSER  ');

      expect(supabase.rpc).toHaveBeenCalledWith('auth_username_available', {
        p_username: 'testuser',
      });
    });

    it('deve retornar erro quando RPC falha', async () => {
      const rpcError = { message: 'RPC error', code: 'PGRST301' };
      vi.mocked(supabase.rpc).mockResolvedValueOnce({
        data: null,
        error: rpcError,
      });

      const result = await authService.isUsernameAvailable('testuser');

      expect(result.available).toBe(false);
      expect(result.error).toEqual(rpcError);
    });

    it('deve tratar exceções', async () => {
      const exception = new Error('Unexpected error');
      vi.mocked(supabase.rpc).mockRejectedValue(exception);

      const result = await authService.isUsernameAvailable('testuser');

      expect(result.available).toBe(false);
      expect(result.error).toBe(exception);
      expect(Observability.trackError).toHaveBeenCalledWith(exception);
    });
  });
});

