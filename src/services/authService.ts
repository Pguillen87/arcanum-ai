// Service de autenticação centralizado
// Abstrai lógica de auth (email, username, OAuth) para facilitar testes e manutenção
import { supabase } from '@/integrations/supabase/client';
import { Session } from '@supabase/supabase-js';
import { Observability } from '@/lib/observability';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://giozhrukzcqoopssegby.supabase.co';

export interface AuthService {
  signInWithEmail: (email: string, password: string, persistSession?: boolean) => Promise<{ data: Session | null; error: any }>;
  signInWithUsername: (username: string, password: string, persistSession?: boolean) => Promise<{ data: Session | null; error: any }>;
  signInWithGoogle: (redirectTo?: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ data: any; error: any }>;
  resetPasswordForEmail: (email: string) => Promise<{ error: any }>;
  isUsernameAvailable: (username: string) => Promise<{ available: boolean; suggestion?: string; error?: any }>;
}

// Heurística: determina se input é email ou username
export function isEmail(input: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(input.trim());
}

// Normaliza username (lowercase + NFKC)
export function normalizeUsername(username: string): string {
  return username.trim().toLowerCase().normalize('NFKC');
}

export const authService: AuthService = {
  async signInWithEmail(email: string, password: string, persistSession: boolean = true) {
    try {
      // Configurar storage baseado em persistSession
      // Se persistSession = false, usar sessionStorage (limpa ao fechar navegador)
      // Se persistSession = true, usar localStorage (padrão)
      if (!persistSession) {
        // Criar client temporário com sessionStorage
        const { createClient } = await import('@supabase/supabase-js');
        const { Database } = await import('@/integrations/supabase/types');
        const tempClient = createClient<Database>(
          SUPABASE_URL,
          import.meta.env.VITE_SUPABASE_ANON_KEY || '',
          {
            auth: {
              storage: window.sessionStorage,
              persistSession: false,
              autoRefreshToken: true,
            }
          }
        );
        const { data, error } = await tempClient.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        // Se login bem-sucedido, copiar sessão para o client principal
        if (data?.session && !error) {
          await supabase.auth.setSession({
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token,
          });
        }
        return { data, error };
      } else {
        // Usar client padrão com localStorage
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        return { data, error };
      }
    } catch (error: any) {
      Observability.trackError(error);
      return { data: null, error };
    }
  },

  async signInWithUsername(username: string, password: string, persistSession: boolean = true) {
    try {
      const normalized = normalizeUsername(username);
      const edgeUrl = `${SUPABASE_URL}/functions/v1/username-login`;
      
      const response = await fetch(edgeUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: normalized, password, persistSession }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ code: 'UNKNOWN', message: 'Erro desconhecido' }));
        return { data: null, error: errorData };
      }

      const { session } = await response.json();
      
      // Definir sessão no client Supabase
      if (session) {
        const { error: setError } = await supabase.auth.setSession({
          access_token: session.access_token,
          refresh_token: session.refresh_token,
        });
        if (setError) {
          return { data: null, error: setError };
        }
        return { data: session, error: null };
      }

      return { data: null, error: { code: 'NO_SESSION', message: 'Sessão não retornada' } };
    } catch (error: any) {
      Observability.trackError(error);
      return { data: null, error };
    }
  },

  async signInWithGoogle(redirectTo?: string) {
    try {
      const redirectUrl = redirectTo || `${window.location.origin}/`;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
        },
      });
      return { error };
    } catch (error: any) {
      Observability.trackError(error);
      return { error };
    }
  },

  async signUp(email: string, password: string, fullName: string) {
    try {
      const redirectUrl = `${window.location.origin}/`;
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: fullName,
          },
        },
      });
      return { data, error };
    } catch (error: any) {
      Observability.trackError(error);
      return { data: null, error };
    }
  },

  async resetPasswordForEmail(email: string) {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/auth?reset=true`,
      });
      return { error };
    } catch (error: any) {
      Observability.trackError(error);
      return { error };
    }
  },

  async isUsernameAvailable(username: string) {
    try {
      const normalized = normalizeUsername(username);
      const { data, error } = await supabase.rpc('auth_username_available', {
        p_username: normalized,
      });
      
      if (error) {
        return { available: false, error };
      }

      const available = data === true;
      
      // Se não disponível, sugerir alternativa
      let suggestion: string | undefined;
      if (!available) {
        const { data: suggestionData } = await supabase.rpc('username_suggest', {
          base_name: normalized,
        });
        suggestion = suggestionData || undefined;
      }

      return { available, suggestion };
    } catch (error: any) {
      Observability.trackError(error);
      return { available: false, error };
    }
  },
};

