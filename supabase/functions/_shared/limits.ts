// Utilitário compartilhado para validar limites de Brand Voice por plano
// Usado em Edge Functions para validar operações antes de processar

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const admin = createClient(supabaseUrl, supabaseServiceKey);

// Limites por plano
export const LIMITS = {
  free: {
    maxProfiles: 1,
    maxSamplesPerTraining: 10,
    maxTrainingsPerDay: 2,
    maxTransformationsPerDay: 50,
    maxSimilarityChunks: 3,
  },
  premium: {
    maxProfiles: 10,
    maxSamplesPerTraining: 50,
    maxTrainingsPerDay: 20,
    maxTransformationsPerDay: 500,
    maxSimilarityChunks: 10,
  },
} as const;

export interface LimitValidationResult {
  allowed: boolean;
  reason?: string;
}

/**
 * Valida limites de Brand Voice para uma operação específica
 * NOTA: Validações de plano removidas - apenas Dracmas são necessários
 */
export async function validateBrandVoiceLimits(
  userId: string,
  plan: 'free' | 'premium',
  operation: 'training' | 'transformation',
  params?: {
    samplesCount?: number;
    similarityChunks?: number;
  }
): Promise<LimitValidationResult> {
  // Sempre permitir operações - apenas Dracmas são necessários
  return { allowed: true };
}

