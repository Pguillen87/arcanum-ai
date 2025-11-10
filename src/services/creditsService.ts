// Service para gerenciar créditos (ledger)
// Sistema justo: débito apenas após entrega concluída
import { supabase } from '@/integrations/supabase/client';
import { Observability } from '@/lib/observability';

export type CreditRefType = 'transformation' | 'transcription' | 'video_short' | 'purchase' | 'refund' | 'bonus' | 'brand_voice_training' | 'brand_voice_transform';

export interface CreditBalance {
  user_id: string;
  balance: number;
  updated_at: string;
  isUnlimited?: boolean; // Flag para indicar créditos ilimitados (apenas dev)
}

// Verificar se créditos ilimitados estão ativos (apenas desenvolvimento)
const UNLIMITED_CREDITS_ENABLED = import.meta.env.VITE_UNLIMITED_CREDITS === 'true' && import.meta.env.DEV;

// Email do criador da aplicação (acesso total)
const CREATOR_EMAIL = 'pguillen551@gmail.com';

/**
 * Verifica se o usuário é o criador da aplicação
 */
async function isCreator(): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    return user?.email === CREATOR_EMAIL;
  } catch (error) {
    return false;
  }
}

export interface CreditTransaction {
  id: string;
  user_id: string;
  delta: number;
  reason: string;
  ref_type: CreditRefType;
  ref_id: string | null;
  created_at: string;
}

export interface DebitCreditsParams {
  amount: number;
  ref: {
    ref_type: CreditRefType;
    ref_id: string;
  };
  reason: string;
}

export interface CreditCreditsParams {
  amount: number;
  reason: string;
  ref?: {
    ref_type: CreditRefType;
    ref_id: string;
  };
}

export interface CreditsService {
  getBalance: () => Promise<{ data: CreditBalance | null; error: any }>;
  debitCredits: (params: DebitCreditsParams) => Promise<{ data: CreditBalance | null; error: any }>;
  creditCredits: (params: CreditCreditsParams) => Promise<{ data: CreditBalance | null; error: any }>;
  getTransactions: (limit?: number) => Promise<{ data: CreditTransaction[] | null; error: any }>;
}

// Validações
function validateAmount(amount: number): { valid: boolean; error?: string } {
  if (amount <= 0) {
    return { valid: false, error: 'Valor deve ser maior que zero' };
  }
  if (amount > 1000000) {
    return { valid: false, error: 'Valor muito alto (máximo: 1.000.000)' };
  }
  return { valid: true };
}

export const creditsService: CreditsService = {
  async getBalance() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { data: null, error: { message: 'Usuário não autenticado' } };
      }
      
      // Verificar se é criador (acesso total)
      const creatorCheck = await isCreator();
      
      // Se créditos ilimitados estão ativos (apenas dev) OU se é criador, retornar saldo ilimitado
      if (UNLIMITED_CREDITS_ENABLED || creatorCheck) {
        return {
          data: {
            user_id: user.id,
            balance: Number.MAX_SAFE_INTEGER, // Valor máximo para indicar ilimitado
            updated_at: new Date().toISOString(),
            isUnlimited: true,
          },
          error: null,
        };
      }

      const { data, error } = await supabase
        .from('credits')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        // Se não existe registro, criar com saldo zero
        if (error.code === 'PGRST116') {
          const { data: newData, error: insertError } = await supabase
            .from('credits')
            .insert({ user_id: user.id, balance: 0 })
            .select()
            .single();

          if (insertError) {
            Observability.trackError(insertError);
            return { data: null, error: insertError };
          }

          return { data: newData as CreditBalance, error: null };
        }

        Observability.trackError(error);
        return { data: null, error };
      }

      return { data: data as CreditBalance, error: null };
    } catch (error: any) {
      Observability.trackError(error);
      return { data: null, error };
    }
  },

  async debitCredits(params) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { data: null, error: { message: 'Usuário não autenticado' } };
      }
      
      // Verificar se é criador (acesso total)
      const creatorCheck = await isCreator();
      
      // Se créditos ilimitados estão ativos (apenas dev) OU se é criador, não debitar
      if (UNLIMITED_CREDITS_ENABLED || creatorCheck) {
        const { data: balanceData } = await this.getBalance();
        return { data: balanceData, error: null };
      }

      // Validações
      const amountValidation = validateAmount(params.amount);
      if (!amountValidation.valid) {
        return { data: null, error: { message: amountValidation.error } };
      }

      // Verificar saldo antes de debitar
      const { data: balanceData, error: balanceError } = await this.getBalance();
      if (balanceError || !balanceData) {
        return { data: null, error: balanceError || { message: 'Não foi possível verificar saldo' } };
      }

      if (balanceData.balance < params.amount) {
        return {
          data: null,
          error: {
            message: `Saldo insuficiente. Saldo atual: ${balanceData.balance}, necessário: ${params.amount}`,
            code: 'INSUFFICIENT_BALANCE',
          },
        };
      }

      // Inserir transação (trigger atualiza saldo automaticamente)
      const { data: transactionData, error: transactionError } = await supabase
        .from('credit_transactions')
        .insert({
          user_id: user.id,
          delta: -params.amount, // Negativo para débito
          reason: params.reason,
          ref_type: params.ref.ref_type,
          ref_id: params.ref.ref_id,
        })
        .select()
        .single();

      if (transactionError) {
        // Se erro de idempotência, retornar saldo atual
        if (transactionError.code === '23505') {
          const { data: updatedBalance } = await this.getBalance();
          return { data: updatedBalance?.data || null, error: null };
        }

        Observability.trackError(transactionError);
        return { data: null, error: transactionError };
      }

      // Obter saldo atualizado
      const { data: updatedBalance } = await this.getBalance();
      return { data: updatedBalance?.data || null, error: null };
    } catch (error: any) {
      Observability.trackError(error);
      return { data: null, error };
    }
  },

  async creditCredits(params) {
    try {
      // Validações
      const amountValidation = validateAmount(params.amount);
      if (!amountValidation.valid) {
        return { data: null, error: { message: amountValidation.error } };
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { data: null, error: { message: 'Usuário não autenticado' } };
      }

      // Inserir transação (trigger atualiza saldo automaticamente)
      const { data: transactionData, error: transactionError } = await supabase
        .from('credit_transactions')
        .insert({
          user_id: user.id,
          delta: params.amount, // Positivo para crédito
          reason: params.reason,
          ref_type: params.ref?.ref_type || 'bonus',
          ref_id: params.ref?.ref_id || null,
        })
        .select()
        .single();

      if (transactionError) {
        Observability.trackError(transactionError);
        return { data: null, error: transactionError };
      }

      // Obter saldo atualizado
      const { data: updatedBalance } = await this.getBalance();
      return { data: updatedBalance?.data || null, error: null };
    } catch (error: any) {
      Observability.trackError(error);
      return { data: null, error };
    }
  },

  async getTransactions(limit: number = 50) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { data: null, error: { message: 'Usuário não autenticado' } };
      }

      const { data, error } = await supabase
        .from('credit_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        Observability.trackError(error);
        return { data: null, error };
      }

      return { data: data as CreditTransaction[], error: null };
    } catch (error: any) {
      Observability.trackError(error);
      return { data: null, error };
    }
  },
};

