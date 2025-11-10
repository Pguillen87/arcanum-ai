-- Migration: Add brand_voice column to profiles if not exists
-- Created: 2025-01-08
-- Description: Adds brand_voice jsonb column to profiles table for storing brand voice preferences

-- Adicionar coluna brand_voice se não existir
alter table public.profiles
  add column if not exists brand_voice jsonb;

-- Comentário na coluna
comment on column public.profiles.brand_voice is 'Brand voice preferences (tone, style, examples, preferences) stored as JSONB';

