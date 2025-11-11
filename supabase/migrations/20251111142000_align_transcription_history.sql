-- Migration: align_transcription_history
-- Created: 2025-11-11
-- Description: garante que transcription_history possua colunas e índices esperados pelo app

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'transcription_history'
      AND column_name = 'transcription_id'
  ) THEN
    ALTER TABLE public.transcription_history
      ADD COLUMN transcription_id uuid REFERENCES public.transcriptions(id) ON DELETE SET NULL;
  END IF;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'transcription_history'
      AND column_name = 'cost_dracmas'
  ) THEN
    ALTER TABLE public.transcription_history
      ADD COLUMN cost_dracmas integer DEFAULT 0;
  END IF;
END;
$$;

ALTER TABLE public.transcription_history
  ALTER COLUMN cost_dracmas SET DEFAULT 0;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'transcription_history_cost_non_negative'
      AND conrelid = 'public.transcription_history'::regclass
  ) THEN
    ALTER TABLE public.transcription_history
      ADD CONSTRAINT transcription_history_cost_non_negative CHECK (cost_dracmas >= 0);
  END IF;
END;
$$;

CREATE INDEX IF NOT EXISTS transcription_history_transcription_id_idx ON public.transcription_history(transcription_id);
