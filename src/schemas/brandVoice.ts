// src/schemas/brandVoice.ts
// Schemas Zod para validação e sanitização de Brand Voice

import { z } from 'zod';

/**
 * Sanitiza strings para prevenir XSS
 */
function sanitizeString(str: string): string {
  return str
    .trim()
    .replace(/[<>]/g, '') // Remover tags HTML básicas
    .slice(0, 10000); // Limitar tamanho máximo
}

/**
 * Schema para estrutura de Brand Voice
 */
export const BrandVoiceSchema = z.object({
  tone: z.string()
    .max(100)
    .transform(sanitizeString)
    .optional(),
  style: z.string()
    .max(100)
    .transform(sanitizeString)
    .optional(),
  examples: z.array(
    z.string()
      .min(1) // Mínimo de 1 caractere (apenas não vazio)
      .max(10000)
      .transform(sanitizeString)
  )
    .max(50) // Limite máximo de exemplos
    .optional(),
  preferences: z.object({
    length: z.enum(['short', 'medium', 'long']).optional(),
    formality: z.enum(['formal', 'neutral', 'casual']).optional(),
    creativity: z.enum(['low', 'medium', 'high']).optional(),
  }).optional(),
});

export type BrandVoice = z.infer<typeof BrandVoiceSchema>;

/**
 * Schema para requisição de treinamento de Brand Voice
 */
export const TrainBrandVoiceRequestSchema = z.object({
  brandProfileId: z.string().uuid().optional(),
  name: z.string()
    .min(1)
    .max(100)
    .transform(sanitizeString),
  description: z.string()
    .max(500)
    .transform(sanitizeString)
    .optional(),
  samples: z.array(
    z.string()
      .min(1) // Mínimo de 1 caractere (apenas não vazio)
      .max(10000)
      .transform(sanitizeString)
  )
    .min(1) // Pelo menos 1 sample
    .max(50), // Máximo de 50 samples
  isDefault: z.boolean().optional(),
  modelProvider: z.enum(['openai', 'anthropic']).optional(),
  modelName: z.string()
    .max(100)
    .transform(sanitizeString)
    .optional(),
});

export type TrainBrandVoiceRequest = z.infer<typeof TrainBrandVoiceRequestSchema>;

/**
 * Schema para requisição de transformação com Brand Voice
 */
export const TransformWithBrandVoiceRequestSchema = z.object({
  brandProfileId: z.string().uuid(),
  inputText: z.string()
    .min(10)
    .max(50000)
    .transform(sanitizeString),
  transformationType: z.enum(['post', 'resumo', 'newsletter', 'roteiro']),
  tone: z.string()
    .max(100)
    .transform(sanitizeString)
    .optional(),
  length: z.enum(['short', 'medium', 'long']).optional(),
  useSimilaritySearch: z.boolean().optional().default(true),
  similarityThreshold: z.number()
    .min(0)
    .max(1)
    .optional()
    .default(0.7),
  maxSimilarChunks: z.number()
    .min(1)
    .max(20)
    .optional()
    .default(5),
});

export type TransformWithBrandVoiceRequest = z.infer<typeof TransformWithBrandVoiceRequestSchema>;

/**
 * Valida estrutura JSONB antes de inserir
 */
export function validateBrandVoiceJSONB(data: any): BrandVoice {
  return BrandVoiceSchema.parse(data);
}

