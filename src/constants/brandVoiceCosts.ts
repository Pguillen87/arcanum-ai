// src/constants/brandVoiceCosts.ts
// Custos em Dracmas para operações de Brand Voice

export const BRAND_VOICE_COSTS = {
  training: {
    base: 10, // 10 Dracmas base
    perSample: 1, // +1 Dracma por sample
  },
  transformation: {
    base: 5, // 5 Dracmas base
    perChunk: 1, // +1 Dracma por chunk de similaridade usado
  },
  embedding: {
    perSample: 1, // 1 Dracma por sample processado
  },
} as const;

/**
 * Calcula o custo de treinamento baseado no número de samples
 */
export function getTrainingCost(samplesCount: number): number {
  return BRAND_VOICE_COSTS.training.base + (BRAND_VOICE_COSTS.training.perSample * samplesCount);
}

/**
 * Calcula o custo de transformação baseado no número de chunks
 */
export function getTransformationCost(
  similarityChunksUsed: number = 0
): number {
  return BRAND_VOICE_COSTS.transformation.base + (BRAND_VOICE_COSTS.transformation.perChunk * similarityChunksUsed);
}

/**
 * Calcula o custo de embedding baseado no número de samples
 */
export function getEmbeddingCost(samplesCount: number): number {
  return BRAND_VOICE_COSTS.embedding.perSample * samplesCount;
}

