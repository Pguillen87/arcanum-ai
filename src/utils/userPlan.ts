// src/utils/userPlan.ts
// Determinação de plano do usuário baseado em assinaturas

import { subscriptionsService } from '@/services/subscriptionsService';

export type UserPlan = 'free' | 'premium';

/**
 * Determina o plano do usuário baseado em sua assinatura ativa
 * @param userId ID do usuário
 * @returns Plano do usuário ('free' ou 'premium')
 */
export async function getUserPlan(userId: string): Promise<UserPlan> {
  try {
    const { data: subscription } = await subscriptionsService.getActiveSubscription(userId);
    
    if (!subscription || subscription.status !== 'active') {
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

/**
 * Verifica se o usuário pode usar Anthropic (apenas premium)
 * @param userId ID do usuário
 * @returns true se o usuário pode usar Anthropic
 */
export async function canUseAnthropic(userId: string): Promise<boolean> {
  const plan = await getUserPlan(userId);
  return plan === 'premium';
}

