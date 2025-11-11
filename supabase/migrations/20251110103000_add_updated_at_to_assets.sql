-- Migration: add_updated_at_to_assets
-- Created: 2025-11-10
-- Description: adiciona coluna updated_at em public.assets e garante trigger de atualização automática

ALTER TABLE public.assets
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

COMMENT ON COLUMN public.assets.updated_at IS 'Data da última atualização do registro, mantida automaticamente via trigger.';

-- Popular registros existentes caso a coluna tenha sido adicionada agora
UPDATE public.assets
SET updated_at = COALESCE(updated_at, created_at);

-- Garantir função genérica set_updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Garantir trigger em assets
CREATE OR REPLACE TRIGGER set_updated_at_assets
  BEFORE UPDATE ON public.assets
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();
