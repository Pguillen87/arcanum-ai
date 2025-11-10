-- Migration: Add refinement_rules to characters
-- Created: 2025-11-09
-- Description: Stores optional guidance notes for refresh refinements

ALTER TABLE public.characters
ADD COLUMN IF NOT EXISTS refinement_rules jsonb DEFAULT '[]'::jsonb;

UPDATE public.characters
SET refinement_rules = '[]'::jsonb
WHERE refinement_rules IS NULL;

ALTER TABLE public.characters
ALTER COLUMN refinement_rules SET NOT NULL;

