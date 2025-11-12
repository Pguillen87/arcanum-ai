import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, SUPABASE_PUBLISHABLE_KEY } from '@/integrations/supabase/client';
import { Profile } from '@/types/auth';
import { useToast } from '@/hooks/use-toast';
import { Observability } from '@/lib/observability';
import { authService, isEmail } from '@/services/authService';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signInWithEmail: (email: string, password: string, persistSession?: boolean) => Promise<{ error: any }>;
  signInWithUsername: (username: string, password: string, persistSession?: boolean) => Promise<{ error: any }>;
  signIn: (login: string, password: string, persistSession?: boolean) => Promise<{ error: any }>; // Heurística automática
  signInWithGoogle: (redirectTo?: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  updateProfile: (fullName: string) => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Load profile data
  const loadProfile = async (userId: string) => {
    try {
      if (!SUPABASE_PUBLISHABLE_KEY) {
        return;
      }
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      Observability.trackError(error);
    }
  };

  useEffect(() => {
    let mounted = true;
    let timeoutId: NodeJS.Timeout;

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mounted) return;
        setSession(session);
        setUser(session?.user ?? null);
        
        // Load profile when session changes
        if (session?.user) {
          setTimeout(() => {
            if (mounted) {
              loadProfile(session.user.id);
            }
          }, 0);
        } else {
          setProfile(null);
        }
      }
    );

    // THEN check for existing session with timeout
    const sessionPromise = supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (!mounted) return;
      
      if (error) {
        console.error("[AuthContext] Erro ao obter sessão:", error);
        setLoading(false);
        return;
      }
      
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user && SUPABASE_PUBLISHABLE_KEY) {
        loadProfile(session.user.id);
      }
      setLoading(false);
    }).catch((error) => {
      if (!mounted) return;
      console.error("[AuthContext] Erro crítico ao inicializar:", error);
      setLoading(false);
    });

    // Timeout de segurança: se após 5 segundos não resolver, definir loading como false
    timeoutId = setTimeout(() => {
      if (mounted) {
        console.warn("[AuthContext] Timeout ao obter sessão - continuando sem autenticação");
        setLoading(false);
      }
    }, 5000);

    // Limpar timeout quando promise resolver
    sessionPromise.finally(() => {
      if (timeoutId) clearTimeout(timeoutId);
    });

    return () => {
      mounted = false;
      if (timeoutId) clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, []);

  const signInWithEmail = async (email: string, password: string, persistSession: boolean = true) => {
    try {
      const { data, error } = await authService.signInWithEmail(email, password, persistSession);

      if (error) {
        toast({
          title: 'Erro ao fazer login',
          description: error.message || 'Credenciais inválidas',
          variant: 'destructive',
        });
        return { error };
      }

      toast({
        title: 'Login realizado com sucesso!',
        description: 'Bem-vindo de volta.',
      });
      return { error: null };
    } catch (error: any) {
      toast({
        title: 'Erro ao fazer login',
        description: error.message || 'Erro desconhecido',
        variant: 'destructive',
      });
      return { error };
    }
  };

  const signInWithUsername = async (username: string, password: string, persistSession: boolean = true) => {
    try {
      const { data, error } = await authService.signInWithUsername(username, password, persistSession);

      if (error) {
        toast({
          title: 'Erro ao fazer login',
          description: error.message || 'Credenciais inválidas',
          variant: 'destructive',
        });
        return { error };
      }

      toast({
        title: 'Login realizado com sucesso!',
        description: 'Bem-vindo de volta.',
      });
      return { error: null };
    } catch (error: any) {
      toast({
        title: 'Erro ao fazer login',
        description: error.message || 'Erro desconhecido',
        variant: 'destructive',
      });
      return { error };
    }
  };

  // Heurística automática: email ou username
  const signIn = async (login: string, password: string, persistSession: boolean = true) => {
    if (isEmail(login)) {
      return signInWithEmail(login, password, persistSession);
    } else {
      return signInWithUsername(login, password, persistSession);
    }
  };

  const signInWithGoogle = async (redirectTo?: string) => {
    try {
      const { error } = await authService.signInWithGoogle(redirectTo);

      if (error) {
        toast({
          title: 'Erro ao iniciar login com Google',
          description: error.message || 'Não foi possível conectar com Google',
          variant: 'destructive',
        });
        return { error };
      }

      // OAuth redireciona, então não mostramos toast de sucesso aqui
      return { error: null };
    } catch (error: any) {
      toast({
        title: 'Erro ao iniciar login com Google',
        description: error.message || 'Erro desconhecido',
        variant: 'destructive',
      });
      return { error };
    }
  };

  const isUsernameAvailable = async (username: string) => {
    return authService.isUsernameAvailable(username);
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      const { data, error } = await authService.signUp(email, password, fullName);

      if (error) {
        toast({
          title: 'Erro ao criar conta',
          description: error.message || 'Não foi possível criar a conta',
          variant: 'destructive',
        });
        return { error };
      }

      toast({
        title: 'Conta criada com sucesso!',
        description: 'Verifique seu email para confirmar sua conta.',
      });
      return { error: null };
    } catch (error: any) {
      toast({
        title: 'Erro ao criar conta',
        description: error.message || 'Erro desconhecido',
        variant: 'destructive',
      });
      return { error };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      // Limpa caches e storage relevantes (sem PII)
      try {
        // Cache Storage
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
        // LocalStorage preferences
        ['arcanoMentorPrefs','high_contrast','modo_suave','locale','mysticalLanguage','theme'].forEach((k) => {
          try { localStorage.removeItem(k); } catch {}
        });
      } catch {}
      
      toast({
        title: 'Logout realizado',
        description: 'Até logo!',
      });
    } catch (error: any) {
      toast({
        title: 'Erro ao fazer logout',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const updateProfile = async (fullName: string) => {
    if (!user) return { error: new Error('Usuário não autenticado') };

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: fullName })
        .eq('id', user.id);

      if (error) throw error;

      setProfile(prev => prev ? { ...prev, full_name: fullName } : null);
      
      toast({
        title: 'Perfil atualizado!',
        description: 'Suas alterações foram salvas.',
      });
      return { error: null };
    } catch (error: any) {
      toast({
        title: 'Erro ao atualizar perfil',
        description: error.message,
        variant: 'destructive',
      });
      return { error };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        loading,
        signInWithEmail,
        signInWithUsername,
        signIn,
        signInWithGoogle,
        signUp,
        signOut,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
