# Plano de Correção - Tela Preta no Dashboard

## Problema Identificado

Após login, a tela do dashboard fica completamente preta, sem renderização de elementos visuais. Isso indica falha crítica na renderização do React ou problemas com CSS/estilos.

## Causas Prováveis Identificadas

1. **AuthContext travado em `loading: true`**: Se o Supabase não conseguir inicializar, o `getSession()` pode nunca resolver, mantendo `loading: true` indefinidamente
2. **Erro JavaScript silencioso**: Um erro em algum componente pode estar impedindo a renderização sem mostrar mensagem
3. **CSS não carregado**: O `bg-background` pode não estar sendo aplicado corretamente
4. **Problema com cliente Supabase mock**: O cliente mock pode estar causando erros que impedem a inicialização

## Estratégia de Correção

### Fase 1: Corrigir AuthContext - Timeout e Tratamento de Erro (PRIORIDADE ALTA)

**Arquivo:** `src/contexts/AuthContext.tsx`

**Problema:** O `getSession()` pode nunca resolver se o Supabase não estiver configurado corretamente, mantendo `loading: true` indefinidamente.

**Solução:**
- Adicionar timeout no `getSession()` para garantir que `loading` seja definido como `false` após um tempo máximo
- Adicionar tratamento de erro robusto para garantir que erros do Supabase não travem a aplicação
- Garantir que `loading` sempre seja definido como `false` em algum momento

**Código a aplicar:**
```typescript
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
          loadProfile(session.user.id);
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
    
    if (session?.user) {
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
```

### Fase 2: Adicionar Error Boundary (PRIORIDADE ALTA)

**Arquivo:** `src/components/ErrorBoundary.tsx` (novo)

**Problema:** Erros não tratados podem quebrar toda a aplicação sem feedback visual.

**Solução:** Criar Error Boundary para capturar erros e exibir mensagem amigável.

**Código a criar:**
```typescript
import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary] Erro capturado:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <div className="max-w-md w-full glass-cosmic p-6 rounded-lg">
            <h2 className="text-2xl font-bold mb-4 text-destructive">
              Algo deu errado
            </h2>
            <p className="text-muted-foreground mb-4">
              Ocorreu um erro ao carregar a aplicação. Por favor, recarregue a página.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg"
            >
              Recarregar Página
            </button>
            {this.state.error && (
              <details className="mt-4">
                <summary className="cursor-pointer text-sm text-muted-foreground">
                  Detalhes do erro
                </summary>
                <pre className="mt-2 text-xs bg-destructive/10 p-2 rounded overflow-auto">
                  {this.state.error.toString()}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
```

### Fase 3: Melhorar ProtectedRoute com Fallback Visual (PRIORIDADE MÉDIA)

**Arquivo:** `src/components/auth/ProtectedRoute.tsx`

**Problema:** Se `loading` ficar `true` indefinidamente, o usuário vê apenas um spinner infinito.

**Solução:** Adicionar timeout visual e melhorar o feedback.

**Código a aplicar:**
```typescript
export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();
  const [showTimeout, setShowTimeout] = useState(false);

  useEffect(() => {
    if (loading) {
      const timeout = setTimeout(() => {
        setShowTimeout(true);
      }, 10000); // 10 segundos
      return () => clearTimeout(timeout);
    } else {
      setShowTimeout(false);
    }
  }, [loading]);

  // Bypass de autenticação para e2e de UI (apenas em ambiente de teste)
  if (import.meta.env.VITE_TEST_AUTH_BYPASS === 'true') {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          {showTimeout && (
            <div className="mt-4">
              <p className="text-muted-foreground mb-2">
                Carregamento está demorando mais que o esperado...
              </p>
              <button
                onClick={() => window.location.reload()}
                className="text-sm text-primary hover:underline"
              >
                Recarregar página
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
};
```

### Fase 4: Adicionar Fallback Visual no Index.tsx (PRIORIDADE MÉDIA)

**Arquivo:** `src/pages/Index.tsx`

**Problema:** Se algum componente crítico falhar, a tela pode ficar preta.

**Solução:** Adicionar fallback visual e garantir que sempre haja algo renderizado.

**Código a aplicar (no início do return):**
```typescript
return (
  <div className="min-h-screen bg-background relative overflow-hidden">
    {/* Fallback visual - sempre visível mesmo se outros componentes falharem */}
    <style>{`
      body { background-color: hsl(var(--background)); }
      #root { min-height: 100vh; }
    `}</style>
    
    {/* ... resto do código ... */}
```

### Fase 5: Verificar e Corrigir Cliente Supabase (PRIORIDADE ALTA)

**Arquivo:** `src/integrations/supabase/client.ts`

**Problema:** O cliente mock pode estar causando erros que impedem a inicialização.

**Solução:** Melhorar tratamento de erro e garantir que o cliente sempre seja válido.

**Código a aplicar:**
```typescript
// Garantir que sempre há um cliente válido, mesmo que mock
try {
  if (SUPABASE_PUBLISHABLE_KEY) {
    supabaseClient = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
      auth: {
        storage: typeof window !== 'undefined' ? localStorage : undefined,
        persistSession: true,
        autoRefreshToken: true,
      }
    });
  } else if (import.meta.env.DEV) {
    console.warn("[Supabase] Criando cliente mock para desenvolvimento...");
    supabaseClient = createClient<Database>(
      SUPABASE_URL,
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0",
      {
        auth: {
          storage: typeof window !== 'undefined' ? localStorage : undefined,
          persistSession: false,
          autoRefreshToken: false,
        }
      }
    );
  } else {
    throw new Error("Supabase não configurado: defina VITE_SUPABASE_ANON_KEY no ambiente.");
  }
} catch (error) {
  console.error("[Supabase] Erro ao criar cliente:", error);
  // Em desenvolvimento, criar cliente mínimo mesmo com erro
  if (import.meta.env.DEV) {
    console.warn("[Supabase] Continuando com cliente mínimo devido a erro...");
    supabaseClient = createClient<Database>(
      "https://placeholder.supabase.co",
      "placeholder-key",
      { auth: { persistSession: false } }
    );
  } else {
    throw error;
  }
}
```

## Ordem de Implementação

1. ✅ Fase 1: Corrigir AuthContext (timeout e tratamento de erro)
2. ✅ Fase 2: Criar ErrorBoundary
3. ✅ Fase 5: Melhorar cliente Supabase
4. ✅ Fase 3: Melhorar ProtectedRoute
5. ✅ Fase 4: Adicionar fallback visual no Index

## Validação

Após cada fase:
- Verificar se a tela não fica mais preta
- Verificar console do navegador por erros
- Testar login e acesso ao dashboard
- Verificar se elementos visuais aparecem corretamente

