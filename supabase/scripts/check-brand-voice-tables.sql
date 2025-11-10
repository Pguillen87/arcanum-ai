-- Script de Verificação: Tabelas Brand Voice
-- Este script verifica se as tabelas do Brand Voice existem no banco de dados
-- Execute no SQL Editor do Supabase Dashboard para verificação manual

-- ============================================================================
-- 1. VERIFICAR EXISTÊNCIA DAS TABELAS
-- ============================================================================

SELECT 
  table_name,
  CASE 
    WHEN table_name IN ('brand_profiles', 'brand_samples', 'brand_embeddings') THEN '✅ Requerida'
    ELSE 'ℹ️  Outra'
  END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('brand_profiles', 'brand_samples', 'brand_embeddings')
ORDER BY table_name;

-- Resultado esperado: 3 linhas (uma para cada tabela)
-- Se retornar menos de 3 linhas, algumas tabelas estão faltando

-- ============================================================================
-- 2. VERIFICAR ESTRUTURA DAS TABELAS (se existirem)
-- ============================================================================

-- Estrutura de brand_profiles
SELECT 
  'brand_profiles' as tabela,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'brand_profiles'
ORDER BY ordinal_position;

-- Estrutura de brand_samples
SELECT 
  'brand_samples' as tabela,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'brand_samples'
ORDER BY ordinal_position;

-- Estrutura de brand_embeddings
SELECT 
  'brand_embeddings' as tabela,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'brand_embeddings'
ORDER BY ordinal_position;

-- ============================================================================
-- 3. VERIFICAR ÍNDICES
-- ============================================================================

SELECT 
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('brand_profiles', 'brand_samples', 'brand_embeddings')
ORDER BY tablename, indexname;

-- ============================================================================
-- 4. VERIFICAR RLS POLICIES
-- ============================================================================

SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('brand_profiles', 'brand_samples', 'brand_embeddings')
ORDER BY tablename, policyname;

-- Resultado esperado: 
-- - brand_profiles: 4 policies (SELECT, INSERT, UPDATE, DELETE)
-- - brand_samples: 4 policies (SELECT, INSERT, UPDATE, DELETE)
-- - brand_embeddings: 3 policies (SELECT, INSERT, DELETE - sem UPDATE)

-- ============================================================================
-- 5. VERIFICAR EXTENSÃO pgvector
-- ============================================================================

SELECT 
  extname,
  extversion,
  CASE 
    WHEN extname = 'vector' THEN '✅ pgvector disponível'
    ELSE 'ℹ️  Outra extensão'
  END as status
FROM pg_extension
WHERE extname = 'vector';

-- Se não retornar nenhuma linha, pgvector não está disponível
-- Isso é normal em planos gratuitos do Supabase
-- A migration usa JSONB como fallback automaticamente

-- ============================================================================
-- 6. VERIFICAR FUNÇÃO match_brand_embeddings (se pgvector disponível)
-- ============================================================================

SELECT 
  routine_name,
  routine_type,
  data_type as return_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'match_brand_embeddings';

-- Se pgvector não estiver disponível, esta função não existirá
-- Isso é esperado e não impede o funcionamento básico

-- ============================================================================
-- 7. VERIFICAR CONSTRAINT E FOREIGN KEYS
-- ============================================================================

SELECT
  tc.table_name,
  tc.constraint_name,
  tc.constraint_type,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
LEFT JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.table_schema = 'public'
  AND tc.table_name IN ('brand_profiles', 'brand_samples', 'brand_embeddings')
ORDER BY tc.table_name, tc.constraint_type, tc.constraint_name;

-- ============================================================================
-- 8. VERIFICAR TRIGGERS
-- ============================================================================

SELECT
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement,
  action_timing
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND event_object_table IN ('brand_profiles', 'brand_samples', 'brand_embeddings')
ORDER BY event_object_table, trigger_name;

-- Resultado esperado:
-- - set_updated_at_brand_profiles trigger em brand_profiles

-- ============================================================================
-- 9. TESTE RÁPIDO: Contar registros (se houver dados)
-- ============================================================================

-- Apenas para verificar se as tabelas estão acessíveis
-- Não deve retornar erro se as tabelas existirem

SELECT 
  'brand_profiles' as tabela,
  COUNT(*) as total_registros
FROM brand_profiles
UNION ALL
SELECT 
  'brand_samples' as tabela,
  COUNT(*) as total_registros
FROM brand_samples
UNION ALL
SELECT 
  'brand_embeddings' as tabela,
  COUNT(*) as total_registros
FROM brand_embeddings;

-- Se alguma tabela não existir, você verá um erro específico
-- Se todas existirem, verá 3 linhas com contagens (podem ser 0)

-- ============================================================================
-- RESUMO: VERIFICAÇÃO COMPLETA
-- ============================================================================

-- Execute esta query para um resumo rápido:

WITH table_check AS (
  SELECT table_name
  FROM information_schema.tables 
  WHERE table_schema = 'public' 
    AND table_name IN ('brand_profiles', 'brand_samples', 'brand_embeddings')
),
required_tables AS (
  SELECT unnest(ARRAY['brand_profiles', 'brand_samples', 'brand_embeddings']) as table_name
)
SELECT 
  rt.table_name,
  CASE 
    WHEN tc.table_name IS NOT NULL THEN '✅ Existe'
    ELSE '❌ Não existe'
  END as status
FROM required_tables rt
LEFT JOIN table_check tc ON rt.table_name = tc.table_name
ORDER BY rt.table_name;

-- Resultado esperado: 3 linhas, todas com "✅ Existe"
-- Se alguma mostrar "❌ Não existe", execute a migration:
-- supabase/migrations/20250115000001_create_brand_voice_tables.sql

