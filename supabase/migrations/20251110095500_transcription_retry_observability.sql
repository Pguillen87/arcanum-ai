-- Migration: transcription_retry_observability
-- Created: 2025-11-10
-- Description: acrescenta metadados de tentativa e função de reprocesso para jobs de transcrição

ALTER TABLE public.transcriptions
  ADD COLUMN IF NOT EXISTS attempt_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_attempt_at timestamptz;

COMMENT ON COLUMN public.transcriptions.attempt_count IS 'Número de tentativas de processamento do job pela função de transcrição.';
COMMENT ON COLUMN public.transcriptions.last_attempt_at IS 'Timestamp da última tentativa de processamento pelo worker.';

UPDATE public.transcriptions
SET last_attempt_at = COALESCE(last_attempt_at, updated_at)
WHERE last_attempt_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_transcriptions_status_attempt ON public.transcriptions (status, attempt_count);

CREATE OR REPLACE FUNCTION public.retry_stale_transcriptions(
  cutoff interval DEFAULT interval '2 minutes',
  max_attempts integer DEFAULT 3
)
RETURNS TABLE (transcription_id uuid, attempt integer)
LANGUAGE plpgsql
AS $$
DECLARE
  rec record;
BEGIN
  FOR rec IN
    SELECT id, attempt_count
    FROM public.transcriptions
    WHERE status IN ('queued', 'processing')
      AND updated_at < now() - cutoff
      AND attempt_count < max_attempts
    ORDER BY updated_at ASC
    FOR UPDATE SKIP LOCKED
  LOOP
    UPDATE public.transcriptions
    SET status = 'queued',
        attempt_count = rec.attempt_count + 1,
        last_attempt_at = now(),
        updated_at = now()
    WHERE id = rec.id;

    transcription_id := rec.id;
    attempt := rec.attempt_count + 1;
    RETURN NEXT;
  END LOOP;

  RETURN;
END;
$$;

COMMENT ON FUNCTION public.retry_stale_transcriptions(interval, integer) IS 'Reencaminha jobs de transcrição estagnados para processamento. Retorna os IDs reprocessados e o número de tentativas.';
