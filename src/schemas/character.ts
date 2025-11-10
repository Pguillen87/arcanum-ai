// src/schemas/character.ts
// Schemas Zod para validação e sanitização de Characters

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
 * Schema para Personality Core (Dimensão 1)
 */
export const PersonalityCoreSchema = z.object({
  traits: z.array(z.string().max(50).transform(sanitizeString)).default([]),
  robotic_human: z.number().min(0).max(100).default(50),
  clown_serious: z.number().min(0).max(100).default(50),
});

/**
 * Schema para Communication Tone (Dimensão 2)
 */
export const CommunicationToneSchema = z.object({
  formality: z.enum(['formal', 'neutral', 'casual']).default('neutral'),
  enthusiasm: z.enum(['low', 'medium', 'high']).default('medium'),
  style: z.array(z.string().max(50).transform(sanitizeString)).default([]),
  use_emojis: z.boolean().default(false),
  use_slang: z.boolean().default(false),
  use_metaphors: z.boolean().default(false),
});

/**
 * Schema para Motivation Focus (Dimensão 3)
 */
export const MotivationFocusSchema = z.object({
  focus: z.enum(['help', 'teach', 'entertain', 'inspire', 'sell', 'inform']).default('help'),
  seeks: z.enum(['harmony', 'innovation', 'efficiency', 'creativity', 'clarity']).default('harmony'),
});

/**
 * Schema para Social Attitude (Dimensão 4)
 */
export const SocialAttitudeSchema = z.object({
  type: z.enum(['proactive', 'reactive']).default('reactive'),
  curiosity: z.enum(['low', 'medium', 'high']).default('medium'),
  reserved_expansive: z.number().min(0).max(100).default(50),
});

/**
 * Schema para Cognitive Speed (Dimensão 5)
 */
export const CognitiveSpeedSchema = z.object({
  speed: z.enum(['slow', 'medium', 'fast']).default('medium'),
  depth: z.enum(['shallow', 'medium', 'deep']).default('medium'),
});

/**
 * Schema para Vocabulary Style (Dimensão 6)
 */
export const VocabularyStyleSchema = z.object({
  style: z.enum(['scientific', 'pop', 'literary', 'technical', 'neutral']).default('neutral'),
  complexity: z.enum(['simple', 'medium', 'complex']).default('medium'),
  use_figures: z.boolean().default(false),
});

/**
 * Schema para Emotional State (Dimensão 7)
 */
export const EmotionalStateSchema = z.object({
  current: z.enum(['neutral', 'happy', 'serious', 'playful', 'contemplative']).default('neutral'),
  variability: z.enum(['low', 'medium', 'high']).default('medium'),
});

/**
 * Schema para Values Tendencies (Dimensão 8)
 */
export const ValuesTendenciesSchema = z.array(
  z.enum(['ethical', 'creative', 'pragmatic', 'innovative', 'traditional', 'neutral'])
).default(['neutral', 'pragmatic']);

/**
 * Regras de refinamento pós-transmutação
 */
const RefinementRuleSchema = z.string()
  .min(1, 'Regra deve ter pelo menos 1 caractere')
  .max(240, 'Regra deve ter no máximo 240 caracteres')
  .transform(sanitizeString);

/**
 * Schema completo para Character
 */
export const CharacterSchema = z.object({
  id: z.string().uuid().optional(),
  user_id: z.string().uuid().optional(),
  name: z.string()
    .min(1, 'Nome é obrigatório')
    .max(100, 'Nome deve ter no máximo 100 caracteres')
    .transform(sanitizeString),
  description: z.string()
    .max(500, 'Descrição deve ter no máximo 500 caracteres')
    .transform(sanitizeString)
    .optional()
    .nullable(),
  avatar_url: z.string()
    .url('URL de avatar inválida')
    .optional()
    .nullable(),
  is_default: z.boolean().default(false),
  
  // 8 Dimensões
  personality_core: PersonalityCoreSchema,
  communication_tone: CommunicationToneSchema,
  motivation_focus: MotivationFocusSchema,
  social_attitude: SocialAttitudeSchema,
  cognitive_speed: CognitiveSpeedSchema,
  vocabulary_style: VocabularyStyleSchema,
  emotional_state: EmotionalStateSchema.optional().nullable(),
  values_tendencies: ValuesTendenciesSchema,
  refinement_rules: z.array(RefinementRuleSchema).max(5, 'Use no máximo 5 regras').optional().default([]),
  
  // Metadados técnicos
  model_provider: z.enum(['openai', 'anthropic']).default('openai'),
  model_name: z.string()
    .max(100)
    .transform(sanitizeString)
    .default('gpt-4o'),
  metadata: z.record(z.any()).optional().nullable(),
});

export type Character = z.infer<typeof CharacterSchema>;
export type PersonalityCore = z.infer<typeof PersonalityCoreSchema>;
export type CommunicationTone = z.infer<typeof CommunicationToneSchema>;
export type MotivationFocus = z.infer<typeof MotivationFocusSchema>;
export type SocialAttitude = z.infer<typeof SocialAttitudeSchema>;
export type CognitiveSpeed = z.infer<typeof CognitiveSpeedSchema>;
export type VocabularyStyle = z.infer<typeof VocabularyStyleSchema>;
export type EmotionalState = z.infer<typeof EmotionalStateSchema>;
export type ValuesTendencies = z.infer<typeof ValuesTendenciesSchema>;
export type RefinementRule = z.infer<typeof RefinementRuleSchema>;

/**
 * Schema para criação de Character (sem id)
 */
export const CreateCharacterSchema = CharacterSchema.omit({ id: true, user_id: true });

export type CreateCharacter = z.infer<typeof CreateCharacterSchema>;

/**
 * Schema para atualização de Character (todos campos opcionais exceto id)
 */
export const UpdateCharacterSchema = CharacterSchema.partial().required({ id: true });

export type UpdateCharacter = z.infer<typeof UpdateCharacterSchema>;

/**
 * Schema para Character Sample
 */
export const CharacterSampleSchema = z.object({
  id: z.string().uuid().optional(),
  character_id: z.string().uuid(),
  user_id: z.string().uuid().optional(),
  text_content: z.string()
    .min(50, 'Texto deve ter pelo menos 50 caracteres')
    .max(10000, 'Texto deve ter no máximo 10000 caracteres')
    .transform(sanitizeString),
  source_type: z.string().max(50).transform(sanitizeString).optional().nullable(),
  source_asset_id: z.string().uuid().optional().nullable(),
  metadata: z.record(z.any()).optional().nullable(),
});

export type CharacterSample = z.infer<typeof CharacterSampleSchema>;

/**
 * Schema para requisição de treinamento de Character
 */
export const TrainCharacterRequestSchema = z.object({
  characterId: z.string().uuid().optional(),
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
      .min(1)
      .max(10000)
      .transform(sanitizeString)
  )
    .min(1, 'Adicione pelo menos um exemplo')
    .max(50, 'Máximo de 50 exemplos'),
  isDefault: z.boolean().optional(),
  modelProvider: z.enum(['openai', 'anthropic']).optional(),
  modelName: z.string().max(100).transform(sanitizeString).optional(),
  // 8 Dimensões opcionais (se não fornecidas, usar defaults)
  personalityCore: PersonalityCoreSchema.optional(),
  communicationTone: CommunicationToneSchema.optional(),
  motivationFocus: MotivationFocusSchema.optional(),
  socialAttitude: SocialAttitudeSchema.optional(),
  cognitiveSpeed: CognitiveSpeedSchema.optional(),
  vocabularyStyle: VocabularyStyleSchema.optional(),
  emotionalState: EmotionalStateSchema.optional(),
  valuesTendencies: ValuesTendenciesSchema.optional(),
});

export type TrainCharacterRequest = z.infer<typeof TrainCharacterRequestSchema>;

/**
 * Schema para transformação com Character
 */
export const TransformWithCharacterRequestSchema = z.object({
  characterId: z.string().uuid(),
  inputText: z.string()
    .min(10, 'Texto deve ter pelo menos 10 caracteres')
    .max(50000, 'Texto deve ter no máximo 50000 caracteres')
    .transform(sanitizeString),
  transformationType: z.enum(['post', 'resumo', 'newsletter', 'roteiro']),
  tone: z.string().max(100).transform(sanitizeString).optional(),
  length: z.enum(['short', 'medium', 'long']).optional(),
  useSimilaritySearch: z.boolean().optional().default(true),
  similarityThreshold: z.number().min(0).max(1).optional().default(0.7),
  maxSimilarChunks: z.number().min(1).max(20).optional().default(5),
  traceId: z.string().uuid().optional(),
  refinementHints: z.array(RefinementRuleSchema).max(5, 'Use no máximo 5 instruções de refinamento').optional(),
  isRefresh: z.boolean().optional().default(false),
});

export type TransformWithCharacterRequest = z.infer<typeof TransformWithCharacterRequestSchema>;

/**
 * Valida estrutura JSONB antes de inserir
 */
export function validateCharacterJSONB(data: any): Character {
  return CharacterSchema.parse(data);
}
