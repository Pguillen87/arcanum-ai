-- Migration: fix_characters_refinement_rules
-- Created: 2025-11-10
-- Description: garante que a coluna refinement_rules exista com default, not null e comentário

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'characters'
      AND column_name = 'refinement_rules'
  ) THEN
    ALTER TABLE public.characters
      ADD COLUMN refinement_rules jsonb NOT NULL DEFAULT '[]'::jsonb;
  END IF;
END;
$$;

COMMENT ON COLUMN public.characters.refinement_rules IS 'Lista de regras de refinamento aplicadas automaticamente após a geração de texto.';

-- garantir que registros existentes tenham valor padrão
UPDATE public.characters
SET refinement_rules = COALESCE(refinement_rules, '[]'::jsonb);

-- assegurar trigger de atualização
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'touch_updated_at_characters'
  ) THEN
    CREATE TRIGGER touch_updated_at_characters
      BEFORE UPDATE ON public.characters
      FOR EACH ROW
      EXECUTE FUNCTION public.touch_updated_at();
  END IF;
END;
$$;
