// src/schemas/transcription.ts
// Schemas Zod para validação de transcrições e histórico

import { z } from 'zod';
import { AUDIO_MIME_TYPES, VIDEO_MIME_TYPES } from '@/constants/mediaFormats';

/**
 * Sanitiza strings para prevenir XSS
 */
function sanitizeString(str: string): string {
  return str
    .trim()
    .replace(/[<>]/g, '') // Remover tags HTML básicas
    .slice(0, 100000); // Limitar tamanho máximo para transcrições
}

/**
 * Schema para Transcription History
 */
export const TranscriptionHistorySchema = z.object({
  id: z.string().uuid().optional(),
  user_id: z.string().uuid().optional(),
  source_type: z.enum(['text', 'audio', 'video']),
  source_asset_id: z.string().uuid().optional().nullable(),
  transcription_id: z.string().uuid().optional().nullable(),
  project_id: z.string().uuid().optional().nullable(),
  original_text: z.string()
    .min(1, 'Texto original não pode estar vazio')
    .transform(sanitizeString),
  character_id: z.string().uuid().optional().nullable(),
  transformation_type: z.enum(['post', 'resumo', 'newsletter', 'roteiro']).optional().nullable(),
  transformation_length: z.enum(['short', 'medium', 'long']).optional().nullable(),
  transformed_text: z.string().transform(sanitizeString).optional().nullable(),
  status: z.enum(['processing', 'completed', 'failed']).default('completed'),
  error_message: z.string().max(1000).transform(sanitizeString).optional().nullable(),
  cost_dracmas: z.number().int().min(0).default(0),
});

export type TranscriptionHistory = z.infer<typeof TranscriptionHistorySchema>;

/**
 * Schema para criação de Transcription History
 */
export const CreateTranscriptionHistorySchema = TranscriptionHistorySchema.omit({ 
  id: true, 
  user_id: true,
});

export type CreateTranscriptionHistory = z.infer<typeof CreateTranscriptionHistorySchema>;

/**
 * Schema para requisição de transcrição de áudio/vídeo
 */
export const TranscribeRequestSchema = z.object({
  assetId: z.string().uuid('ID de asset inválido'),
  language: z.string().length(2).optional().default('pt'),
  characterId: z.string().uuid().optional(), // Personagem para aplicar após transcrição
  applyTransformation: z.boolean().optional().default(false),
  transformationType: z.enum(['post', 'resumo', 'newsletter', 'roteiro']).optional(),
  transformationLength: z.enum(['short', 'medium', 'long']).optional(),
});

export type TranscribeRequest = z.infer<typeof TranscribeRequestSchema>;

/**
 * Schema para upload de arquivo de áudio/vídeo
 */
export const AudioVideoUploadSchema = z.object({
  file: z.instanceof(File)
    .refine((file) => file.size <= 100 * 1024 * 1024, 'Arquivo deve ter no máximo 100MB')
    .refine(
      (file) => [...AUDIO_MIME_TYPES, ...VIDEO_MIME_TYPES].includes(file.type),
      'Formato de arquivo não suportado'
    ),
  projectId: z.string().uuid().optional(),
});

export type AudioVideoUpload = z.infer<typeof AudioVideoUploadSchema>;

/**
 * Schema para resultado de transcrição
 */
export const TranscriptionResultSchema = z.object({
  transcriptionId: z.string().uuid(),
  text: z.string(),
  language: z.string().optional(),
  duration: z.number().optional(),
  status: z.enum(['queued', 'processing', 'completed', 'failed']),
  error: z.string().optional().nullable(),
});

export type TranscriptionResult = z.infer<typeof TranscriptionResultSchema>;

/**
 * Schema para transformação de transcrição
 */
export const TransformTranscriptionSchema = z.object({
  transcriptionId: z.string().uuid(),
  characterId: z.string().uuid(),
  transformationType: z.enum(['post', 'resumo', 'newsletter', 'roteiro']),
  transformationLength: z.enum(['short', 'medium', 'long']).optional().default('medium'),
  tone: z.string().max(100).transform(sanitizeString).optional(),
});

export type TransformTranscription = z.infer<typeof TransformTranscriptionSchema>;
