// supabase/functions/_shared/auth.ts
// Validação de autenticação para Edge Functions

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

export interface AuthResult {
  userId: string;
  email?: string;
  plan: 'free' | 'premium';
  isValid: boolean;
  isCreator?: boolean; // Flag para indicar se é o criador da aplicação
}

/**
 * Valida token de autenticação e retorna informações do usuário
 */
export async function validateAuth(
  authHeader: string | null
): Promise<AuthResult> {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Token de autenticação ausente ou inválido');
  }

  const token = authHeader.replace('Bearer ', '');
  
  // Criar cliente Supabase com service role para validar token
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  // Verificar token e obter usuário
  const { data: { user }, error } = await supabase.auth.getUser(token);
  
  if (error || !user) {
    throw new Error('Token inválido ou expirado');
  }

  // Obter plano do usuário (simplificado - pode ser expandido)
  // Por enquanto, assumir free se não houver subscription ativa
  const plan = await getUserPlan(user.id);
  
  // Verificar se é o criador da aplicação
  const isCreator = user.email === 'pguillen551@gmail.com';

  return {
    userId: user.id,
    email: user.email,
    plan,
    isValid: true,
    isCreator,
  };
}

/**
 * Helper para validar autenticação em Edge Functions
 */
export async function requireAuth(request: Request): Promise<AuthResult> {
  const authHeader = request.headers.get('Authorization');
  
  try {
    return await validateAuth(authHeader);
  } catch (error: any) {
    throw new Error(`Autenticação falhou: ${error.message}`);
  }
}

/**
 * Determina plano do usuário (simplificado para Edge Functions)
 * TODO: Integrar com subscriptionsService quando disponível em Edge Functions
 */
async function getUserPlan(userId: string): Promise<'free' | 'premium'> {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  try {
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('plan_code, status')
      .eq('user_id', userId)
      .in('status', ['active', 'trialing'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    if (!subscription) {
      return 'free';
    }
    
    // Planos premium têm plan_code começando com 'premium_' ou 'pro_'
    const premiumPlans = ['premium_monthly', 'premium_yearly', 'pro_monthly', 'pro_yearly'];
    return premiumPlans.includes(subscription.plan_code) ? 'premium' : 'free';
  } catch (error) {
    // Em caso de erro, assumir plano free por segurança
    console.error('Erro ao determinar plano do usuário:', error);
    return 'free';
  }
}

