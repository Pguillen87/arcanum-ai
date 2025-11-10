// Client do Supabase centralizado para o frontend.
// Preferimos ler URL e chave do ambiente (Vite) para suportar dev/test/prod e evitar segredos hardcoded.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Em Vite, variáveis devem começar com VITE_.
const ENV_URL = import.meta.env?.VITE_SUPABASE_URL as string | undefined;
const ENV_ANON = import.meta.env?.VITE_SUPABASE_ANON_KEY as string | undefined;

// Fallback seguro apenas para URL (fornecido pelo usuário). A chave NUNCA deve ter fallback hardcoded.
const SUPABASE_URL = ENV_URL ?? "https://giozhrukzcqoopssegby.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = ENV_ANON;

// Validação em tempo de execução: sem chave anon, não inicializamos o client para evitar uso indevido.
// Em desenvolvimento, permitimos continuar com aviso (mas algumas funcionalidades podem não funcionar)
if (!SUPABASE_PUBLISHABLE_KEY) {
  if (import.meta.env.DEV) {
    console.warn("[Supabase] VITE_SUPABASE_ANON_KEY ausente. Configure a chave anon do projeto em .env para funcionalidades completas.");
    console.warn("[Supabase] Continuando em modo de desenvolvimento limitado...");
  } else {
    // Em produção, lançar erro
    console.error("[Supabase] VITE_SUPABASE_ANON_KEY ausente. Configure a chave anon do projeto em .env.");
    throw new Error("Supabase não configurado: defina VITE_SUPABASE_ANON_KEY no ambiente.");
  }
}

// Import o client assim:
// import { supabase } from "@/integrations/supabase/client";

// Criar cliente apenas se a chave estiver disponível
// Em desenvolvimento sem chave, criar um cliente mock para evitar erros
let supabaseClient: ReturnType<typeof createClient<Database>>;

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
    // Em desenvolvimento, criar cliente mock para evitar erros de importação
    // Isso permite que a aplicação inicie mesmo sem configuração completa
    console.warn("[Supabase] Criando cliente mock para desenvolvimento. Configure .env para funcionalidades completas.");
    // Criar um cliente com valores dummy (não funcionará, mas não quebrará a aplicação)
    supabaseClient = createClient<Database>(
      SUPABASE_URL,
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0", // Chave dummy do Supabase demo
      {
        auth: {
          storage: typeof window !== 'undefined' ? localStorage : undefined,
          persistSession: false,
          autoRefreshToken: false,
        }
      }
    );
  } else {
    // Em produção sem chave, lançar erro (já foi validado acima, mas TypeScript precisa disso)
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

export const supabase = supabaseClient;
