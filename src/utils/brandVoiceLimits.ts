// src/utils/brandVoiceLimits.ts
// Limites e validações para Brand Voice baseados no plano do usuário

import { getUserPlan } from './userPlan';
import { supabase } from '@/integrations/supabase/client';

export const BRAND_VOICE_LIMITS = {
  free: {
    maxProfiles: 1, // Apenas 1 voz (em brand_profiles ou profiles.brand_voice)
    maxSamplesPerTraining: 10,
    maxTrainingsPerDay: 2,
    maxTransformationsPerDay: 50,
    maxSimilarityChunks: 3, // Máximo de chunks similares por transformação
    maxTotalSizeKB: 100, // 100KB total de samples
  },
  premium: {
    maxProfiles: 10,
    maxSamplesPerTraining: 50,
    maxTrainingsPerDay: 20,
    maxTransformationsPerDay: 500,
    maxSimilarityChunks: 10,
    maxTotalSizeKB: 500, // 500KB total de samples
  },
} as const;

export interface ValidationResult {
  allowed: boolean;
  reason?: string;
}

/**
 * Valida limites de Brand Voice para uma operação específica
 * NOTA: Validações de plano removidas - apenas Dracmas são necessários
 */
export async function validateBrandVoiceLimits(
  userId: string,
  operation: 'training' | 'transformation',
  params?: { samplesCount?: number; similarityChunks?: number }
): Promise<ValidationResult> {
  // Sempre permitir operações - apenas Dracmas são necessários
  return { allowed: true };
}

/**
 * Obtém os limites para um plano específico
 */
export function getLimitsForPlan(plan: 'free' | 'premium') {
  return BRAND_VOICE_LIMITS[plan];
}

