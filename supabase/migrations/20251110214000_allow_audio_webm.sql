-- Migration: allow_audio_webm
-- Created: 2025-11-10
-- Description: atualiza bucket de áudio para aceitar formatos gravados via MediaRecorder (webm, ogg, mp4)

UPDATE storage.buckets
SET allowed_mime_types = ARRAY[
    'audio/mpeg',
    'audio/mp3',
    'audio/wav',
    'audio/x-wav',
    'audio/ogg',
    'audio/webm',
    'audio/mp4',
    'audio/x-m4a',
    'audio/m4a',
    'audio/aac',
    'audio/flac'
  ]
WHERE id = 'audio';
