-- Migration: phase3_transcription_hardening
-- Created: 2025-11-10
-- Description: reforça RLS, índices e triggers para assets/transcriptions/transcription_history/transformations

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transcriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transcription_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transformations ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='assets' AND policyname='assets_owner_select') THEN
    CREATE POLICY assets_owner_select ON public.assets FOR SELECT USING (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='assets' AND policyname='assets_owner_insert') THEN
    CREATE POLICY assets_owner_insert ON public.assets FOR INSERT WITH CHECK (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='assets' AND policyname='assets_owner_update') THEN
    CREATE POLICY assets_owner_update ON public.assets FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='assets' AND policyname='assets_owner_delete') THEN
    CREATE POLICY assets_owner_delete ON public.assets FOR DELETE USING (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='transcriptions' AND policyname='transcriptions_owner_select') THEN
    CREATE POLICY transcriptions_owner_select ON public.transcriptions FOR SELECT USING (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='transcriptions' AND policyname='transcriptions_owner_insert') THEN
    CREATE POLICY transcriptions_owner_insert ON public.transcriptions FOR INSERT WITH CHECK (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='transcriptions' AND policyname='transcriptions_owner_update') THEN
    CREATE POLICY transcriptions_owner_update ON public.transcriptions FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='transcriptions' AND policyname='transcriptions_owner_delete') THEN
    CREATE POLICY transcriptions_owner_delete ON public.transcriptions FOR DELETE USING (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='transcription_history' AND policyname='history_owner_select') THEN
    CREATE POLICY history_owner_select ON public.transcription_history FOR SELECT USING (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='transcription_history' AND policyname='history_owner_insert') THEN
    CREATE POLICY history_owner_insert ON public.transcription_history FOR INSERT WITH CHECK (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='transcription_history' AND policyname='history_owner_update') THEN
    CREATE POLICY history_owner_update ON public.transcription_history FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='transcription_history' AND policyname='history_owner_delete') THEN
    CREATE POLICY history_owner_delete ON public.transcription_history FOR DELETE USING (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='transformations' AND policyname='transformations_owner_select') THEN
    CREATE POLICY transformations_owner_select ON public.transformations FOR SELECT USING (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='transformations' AND policyname='transformations_owner_insert') THEN
    CREATE POLICY transformations_owner_insert ON public.transformations FOR INSERT WITH CHECK (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='transformations' AND policyname='transformations_owner_update') THEN
    CREATE POLICY transformations_owner_update ON public.transformations FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='transformations' AND policyname='transformations_owner_delete') THEN
    CREATE POLICY transformations_owner_delete ON public.transformations FOR DELETE USING (user_id = auth.uid());
  END IF;
END;
$$;

CREATE INDEX IF NOT EXISTS idx_transcriptions_status_updated_at ON public.transcriptions (status, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_transcriptions_user_created_at ON public.transcriptions (user_id, created_at DESC);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='transcription_history' AND column_name='user_id'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_transcription_history_user_created_at ON public.transcription_history (user_id, created_at DESC);
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='transcription_history' AND column_name='transcription_id'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_transcription_history_transcription_id ON public.transcription_history (transcription_id);
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='transcription_history' AND column_name='source_asset_id'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_transcription_history_asset_id ON public.transcription_history (source_asset_id);
  END IF;
END;
$$;

CREATE OR REPLACE TRIGGER set_updated_at_assets
  BEFORE UPDATE ON public.assets
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE TRIGGER set_updated_at_transcriptions
  BEFORE UPDATE ON public.transcriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE TRIGGER set_updated_at_transcription_history
  BEFORE UPDATE ON public.transcription_history
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE TRIGGER set_updated_at_transformations
  BEFORE UPDATE ON public.transformations
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();
