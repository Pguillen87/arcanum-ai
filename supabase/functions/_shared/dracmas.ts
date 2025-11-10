// Utilitário compartilhado para gerenciar Dracmas em Edge Functions
// Suporta Dracmas ilimitados em desenvolvimento e para o criador

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Verificar se Dracmas ilimitados estão ativos (apenas desenvolvimento)
const UNLIMITED_DRACMAS_ENABLED = Deno.env.get("UNLIMITED_CREDITS_DEV") === "true";

// Email do criador da aplicação (acesso total)
const CREATOR_EMAIL = "pguillen551@gmail.com";

/**
 * Verifica se o usuário é o criador da aplicação
 */
async function isCreator(userId: string): Promise<boolean> {
  try {
    const admin = createClient(supabaseUrl, supabaseServiceKey);
    const { data: { user }, error } = await admin.auth.admin.getUserById(userId);
    
    if (error || !user) {
      return false;
    }
    
    return user.email === CREATOR_EMAIL;
  } catch (error) {
    console.error("Erro ao verificar se é criador:", error);
    return false;
  }
}

interface DracmaBalance {
  user_id: string;
  balance: number;
  updated_at: string;
  isUnlimited?: boolean;
}

/**
 * Obtém o saldo de Dracmas do usuário
 * Retorna saldo ilimitado se UNLIMITED_CREDITS_DEV=true (apenas dev) ou se for criador
 */
export async function getDracmasBalance(userId: string): Promise<{ data: DracmaBalance | null; error: any }> {
  try {
    // Verificar se é criador (acesso total)
    const creatorCheck = await isCreator(userId);
    
    // Se Dracmas ilimitados estão ativos (apenas dev) OU se é criador, retornar saldo ilimitado
    if (UNLIMITED_DRACMAS_ENABLED || creatorCheck) {
      return {
        data: {
          user_id: userId,
          balance: Number.MAX_SAFE_INTEGER, // Valor máximo para indicar ilimitado
          updated_at: new Date().toISOString(),
          isUnlimited: true,
        },
        error: null,
      };
    }

    const admin = createClient(supabaseUrl, supabaseServiceKey);

    const { data, error } = await admin
      .from("credits")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error) {
      // Se não existe registro, criar com saldo zero
      if (error.code === "PGRST116") {
        const { data: newData, error: insertError } = await admin
          .from("credits")
          .insert({ user_id: userId, balance: 0 })
          .select()
          .single();

        if (insertError) {
          console.error("Erro ao criar registro de Dracmas:", insertError);
          return { data: null, error: insertError };
        }

        return { data: newData as DracmaBalance, error: null };
      }

      console.error("Erro ao buscar saldo de Dracmas:", error);
      return { data: null, error };
    }

    return { data: data as DracmaBalance, error: null };
  } catch (error: any) {
    console.error("Erro inesperado ao buscar saldo:", error);
    return { data: null, error };
  }
}

/**
 * Verifica se o usuário tem Dracmas suficientes
 * Retorna true se Dracmas ilimitados estão ativos (apenas dev) ou se for criador
 */
export async function checkDracmasBalance(
  userId: string,
  requiredAmount: number
): Promise<{ hasEnough: boolean; currentBalance: number; error?: any }> {
  try {
    // Verificar se é criador (acesso total)
    const creatorCheck = await isCreator(userId);
    
    // Se Dracmas ilimitados estão ativos (apenas dev) OU se é criador, sempre retornar true
    if (UNLIMITED_DRACMAS_ENABLED || creatorCheck) {
      return {
        hasEnough: true,
        currentBalance: Number.MAX_SAFE_INTEGER,
      };
    }

    const { data: balance, error } = await getDracmasBalance(userId);

    if (error || !balance) {
      return {
        hasEnough: false,
        currentBalance: 0,
        error: error || { message: "Não foi possível verificar saldo" },
      };
    }

    return {
      hasEnough: balance.balance >= requiredAmount,
      currentBalance: balance.balance,
    };
  } catch (error: any) {
    console.error("Erro ao verificar saldo:", error);
    return {
      hasEnough: false,
      currentBalance: 0,
      error,
    };
  }
}

/**
 * Debita Dracmas do usuário
 * Não debita se Dracmas ilimitados estão ativos (apenas dev) ou se for criador
 */
export async function debitDracmas(
  userId: string,
  amount: number,
  reason: string,
  refType: 'transformation' | 'transcription' | 'video_short' | 'purchase' | 'refund' | 'bonus' | 'brand_voice_training' | 'brand_voice_transform',
  refId: string
): Promise<{ data: DracmaBalance | null; error: any }> {
  try {
    // Verificar se é criador (acesso total)
    const creatorCheck = await isCreator(userId);
    
    // Se Dracmas ilimitados estão ativos (apenas dev) OU se é criador, não debitar
    if (UNLIMITED_DRACMAS_ENABLED || creatorCheck) {
      return await getDracmasBalance(userId);
    }

    const admin = createClient(supabaseUrl, supabaseServiceKey);

    // Verificar saldo antes de debitar
    const { data: balanceData, error: balanceError } = await getDracmasBalance(userId);
    if (balanceError || !balanceData) {
      return { data: null, error: balanceError || { message: "Não foi possível verificar saldo" } };
    }

    if (balanceData.balance < amount) {
      return {
        data: null,
        error: {
          message: `Saldo insuficiente. Saldo atual: ${balanceData.balance}, necessário: ${amount}`,
          code: "INSUFFICIENT_BALANCE",
        },
      };
    }

    // Inserir transação (trigger atualiza saldo automaticamente)
    const { data: transactionData, error: transactionError } = await admin
      .from("credit_transactions")
      .insert({
        user_id: userId,
        delta: -amount, // Negativo para débito
        reason,
        ref_type: refType,
        ref_id: refId,
      })
      .select()
      .single();

    if (transactionError) {
      // Se erro de idempotência, retornar saldo atual
      if (transactionError.code === "23505") {
        return await getDracmasBalance(userId);
      }

      console.error("Erro ao debitar Dracmas:", transactionError);
      return { data: null, error: transactionError };
    }

    // Obter saldo atualizado
    return await getDracmasBalance(userId);
  } catch (error: any) {
    console.error("Erro inesperado ao debitar Dracmas:", error);
    return { data: null, error };
  }
}

// Manter funções antigas para compatibilidade durante transição
export const getCreditsBalance = getDracmasBalance;
export const checkCreditsBalance = checkDracmasBalance;
export const debitCredits = debitDracmas;

