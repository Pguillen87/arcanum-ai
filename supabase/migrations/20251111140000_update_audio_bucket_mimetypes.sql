-- Migration: update_audio_bucket_mimetypes
-- Created: 2025-11-11
-- Description: garante que o bucket 'audio' aceite formatos usados na nova experiência (webm/mp4/m4a/m4b)

UPDATE storage.buckets
SET allowed_mime_types = ARRAY[
    'audio/mpeg',
    'audio/mp3',
    'audio/wav',
    'audio/x-wav',
    'audio/webm',
    'video/webm',
    'audio/mp4',
    'video/mp4',
    'audio/m4a',
    'audio/x-m4a',
    'audio/m4b',
    'audio/x-m4b',
    'audio/ogg',
    'audio/aac',
    'audio/flac'
  ]
WHERE id = 'audio';
