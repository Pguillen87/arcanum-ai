-- Migration: add_updated_at_to_assets
-- Created: 2025-11-10
-- Description: adiciona coluna updated_at para sincronizar com trigger de atualização automática

ALTER TABLE public.assets
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

UPDATE public.assets
SET updated_at = COALESCE(updated_at, created_at);

ALTER TABLE public.assets
  ALTER COLUMN updated_at SET NOT NULL;

COMMENT ON COLUMN public.assets.updated_at IS 'Atualizado automaticamente quando o asset sofre alterações de status ou metadados.';
