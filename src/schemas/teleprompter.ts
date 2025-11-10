// src/schemas/teleprompter.ts
// Schemas Zod para validação de sessões de teleprompter

import { z } from 'zod';

/**
 * Sanitiza strings para prevenir XSS
 */
function sanitizeString(str: string): string {
  return str
    .trim()
    .replace(/[<>]/g, '') // Remover tags HTML básicas
    .slice(0, 100000); // Limitar tamanho máximo para conteúdo
}

/**
 * Validação de cor hexadecimal
 */
const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;

/**
 * Schema para Teleprompter Session
 */
export const TeleprompterSessionSchema = z.object({
  id: z.string().uuid().optional(),
  user_id: z.string().uuid().optional(),
  project_id: z.string().uuid().optional().nullable(),
  content_text: z.string()
    .min(1, 'Conteúdo não pode estar vazio')
    .transform(sanitizeString),
  content_source: z.enum(['project', 'transcription', 'manual', 'file']).optional(),
  source_id: z.string().uuid().optional().nullable(),
  
  // Configurações da sessão
  scroll_speed: z.number().int().min(0).max(100).default(50),
  font_size: z.number().int().min(12).max(72).default(24),
  text_color: z.string()
    .regex(hexColorRegex, 'Cor deve ser um código hexadecimal válido')
    .default('#ffffff'),
  background_color: z.string()
    .regex(hexColorRegex, 'Cor deve ser um código hexadecimal válido')
    .default('#000000'),
  mirror_mode: z.boolean().default(false),
  
  // Detecção de pausa
  speech_detection_enabled: z.boolean().default(true),
  silence_threshold_ms: z.number().int().min(100).max(5000).default(500),
  volume_threshold: z.number().int().min(0).max(100).default(30),
  resume_delay_ms: z.number().int().min(0).max(5000).default(1000),
  
  // Gravação
  video_url: z.string().url().optional().nullable(),
  video_storage_path: z.string().optional().nullable(),
  duration_seconds: z.number().int().min(0).optional().nullable(),
  file_size_bytes: z.number().int().positive().optional().nullable(),
});

export type TeleprompterSession = z.infer<typeof TeleprompterSessionSchema>;

/**
 * Schema para criação de Teleprompter Session
 */
export const CreateTeleprompterSessionSchema = TeleprompterSessionSchema.omit({ 
  id: true, 
  user_id: true,
});

export type CreateTeleprompterSession = z.infer<typeof CreateTeleprompterSessionSchema>;

/**
 * Schema para atualização de Teleprompter Session
 */
export const UpdateTeleprompterSessionSchema = TeleprompterSessionSchema.partial().required({ id: true });

export type UpdateTeleprompterSession = z.infer<typeof UpdateTeleprompterSessionSchema>;

/**
 * Schema para configurações de teleprompter
 */
export const TeleprompterSettingsSchema = z.object({
  scrollSpeed: z.number().int().min(0).max(100).default(50),
  fontSize: z.number().int().min(12).max(72).default(24),
  textColor: z.string().regex(hexColorRegex).default('#ffffff'),
  backgroundColor: z.string().regex(hexColorRegex).default('#000000'),
  mirrorMode: z.boolean().default(false),
  speechDetectionEnabled: z.boolean().default(true),
  silenceThresholdMs: z.number().int().min(100).max(5000).default(500),
  volumeThreshold: z.number().int().min(0).max(100).default(30),
  resumeDelayMs: z.number().int().min(0).max(5000).default(1000),
});

export type TeleprompterSettings = z.infer<typeof TeleprompterSettingsSchema>;

/**
 * Schema para carregar conteúdo de projeto
 */
export const LoadProjectContentSchema = z.object({
  projectId: z.string().uuid('ID de projeto inválido'),
  transcriptionId: z.string().uuid().optional(), // Se quiser carregar transcrição específica
});

export type LoadProjectContent = z.infer<typeof LoadProjectContentSchema>;

/**
 * Schema para gravação de vídeo
 */
export const VideoRecordingSchema = z.object({
  sessionId: z.string().uuid(),
  startTime: z.number().optional(),
  endTime: z.number().optional(),
});

export type VideoRecording = z.infer<typeof VideoRecordingSchema>;
