-- Migration: Create brand_profiles, brand_samples, and brand_embeddings tables
-- Created: 2025-01-XX
-- Description: Tables for managing multiple brand voices with embeddings support

-- ============================================================================
-- ENABLE pgvector EXTENSION
-- ============================================================================

-- Tentar criar extensão (pode falhar se não tiver permissão)
DO $$
BEGIN
  CREATE EXTENSION IF NOT EXISTS vector;
EXCEPTION
  WHEN OTHERS THEN
    -- Log erro mas não quebrar migration
    RAISE NOTICE 'pgvector não disponível: %', SQLERRM;
END $$;

-- Função helper para verificar disponibilidade
CREATE OR REPLACE FUNCTION pgvector_available()
RETURNS boolean
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM pg_extension WHERE extname = 'vector'
  );
END;
$$;

-- ============================================================================
-- BRAND_PROFILES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.brand_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text,
  is_default boolean DEFAULT false,
  model_provider text NOT NULL DEFAULT 'openai',
  model_name text NOT NULL DEFAULT 'gpt-4o',
  metadata jsonb,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  
  CONSTRAINT brand_profiles_model_provider_check CHECK (model_provider IN ('openai', 'anthropic'))
);

-- Constraint única com WHERE (deve ser criada como índice único parcial)
CREATE UNIQUE INDEX IF NOT EXISTS brand_profiles_user_default_unique 
  ON brand_profiles(user_id, is_default) 
  WHERE is_default = true;

-- Índices
CREATE INDEX IF NOT EXISTS brand_profiles_user_id_idx ON brand_profiles(user_id);
CREATE INDEX IF NOT EXISTS brand_profiles_user_default_idx ON brand_profiles(user_id, is_default) 
  WHERE is_default = true;

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION set_updated_at_brand_profiles()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at_brand_profiles
  BEFORE UPDATE ON brand_profiles
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at_brand_profiles();

-- RLS Policies
ALTER TABLE brand_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own brand profiles"
  ON brand_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own brand profiles"
  ON brand_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own brand profiles"
  ON brand_profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own brand profiles"
  ON brand_profiles FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- BRAND_SAMPLES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.brand_samples (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_profile_id uuid REFERENCES brand_profiles(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  text_content text NOT NULL,
  source_type text,
  source_asset_id uuid REFERENCES assets(id) ON DELETE SET NULL,
  metadata jsonb,
  created_at timestamptz DEFAULT now() NOT NULL,
  
  CONSTRAINT brand_samples_text_length CHECK (char_length(text_content) >= 50)
);

-- Índices
CREATE INDEX IF NOT EXISTS brand_samples_brand_profile_id_idx ON brand_samples(brand_profile_id);
CREATE INDEX IF NOT EXISTS brand_samples_user_id_idx ON brand_samples(user_id);

-- RLS Policies
ALTER TABLE brand_samples ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own brand samples"
  ON brand_samples FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own brand samples"
  ON brand_samples FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own brand samples"
  ON brand_samples FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own brand samples"
  ON brand_samples FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- BRAND_EMBEDDINGS TABLE (Vector Store)
-- ============================================================================

-- Verificar se pgvector está disponível antes de criar tabela com vector
DO $$
BEGIN
  IF pgvector_available() THEN
    -- Criar tabela com vector se pgvector estiver disponível
    EXECUTE '
    CREATE TABLE IF NOT EXISTS public.brand_embeddings (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      brand_profile_id uuid REFERENCES brand_profiles(id) ON DELETE CASCADE NOT NULL,
      brand_sample_id uuid REFERENCES brand_samples(id) ON DELETE CASCADE NOT NULL,
      user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
      embedding vector(1536) NOT NULL,
      text_chunk text NOT NULL,
      chunk_index integer DEFAULT 0,
      created_at timestamptz DEFAULT now() NOT NULL
    );
    
    -- Índices
    CREATE INDEX IF NOT EXISTS brand_embeddings_brand_profile_id_idx ON brand_embeddings(brand_profile_id);
    CREATE INDEX IF NOT EXISTS brand_embeddings_user_id_idx ON brand_embeddings(user_id);
    
    -- Vector index (ivfflat)
    CREATE INDEX IF NOT EXISTS brand_embeddings_vector_idx ON brand_embeddings 
      USING ivfflat (embedding vector_cosine_ops) 
      WITH (lists = 100);
    ';
  ELSE
    -- Criar tabela sem vector se pgvector não estiver disponível
    CREATE TABLE IF NOT EXISTS public.brand_embeddings (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      brand_profile_id uuid REFERENCES brand_profiles(id) ON DELETE CASCADE NOT NULL,
      brand_sample_id uuid REFERENCES brand_samples(id) ON DELETE CASCADE NOT NULL,
      user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
      embedding jsonb NOT NULL, -- Fallback: armazenar como JSONB
      text_chunk text NOT NULL,
      chunk_index integer DEFAULT 0,
      created_at timestamptz DEFAULT now() NOT NULL
    );
    
    -- Índices básicos
    CREATE INDEX IF NOT EXISTS brand_embeddings_brand_profile_id_idx ON brand_embeddings(brand_profile_id);
    CREATE INDEX IF NOT EXISTS brand_embeddings_user_id_idx ON brand_embeddings(user_id);
    
    RAISE NOTICE 'Tabela brand_embeddings criada sem pgvector. Use JSONB como fallback.';
  END IF;
END $$;

-- RLS Policies para brand_embeddings
ALTER TABLE brand_embeddings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own brand embeddings"
  ON brand_embeddings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own brand embeddings"
  ON brand_embeddings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own brand embeddings"
  ON brand_embeddings FOR DELETE
  USING (auth.uid() = user_id);

-- IMPORTANTE: brand_embeddings não deve ter UPDATE (imutável)
-- Embeddings são regenerados, não atualizados

-- ============================================================================
-- FUNCTION: match_brand_embeddings (Busca por Similaridade)
-- ============================================================================

-- Função para buscar embeddings similares (apenas se pgvector estiver disponível)
DO $$
BEGIN
  IF pgvector_available() THEN
    EXECUTE '
    CREATE OR REPLACE FUNCTION match_brand_embeddings(
      query_embedding vector(1536),
      profile_id uuid,
      match_threshold float DEFAULT 0.7,
      match_count int DEFAULT 5
    )
    RETURNS TABLE (
      id uuid,
      brand_sample_id uuid,
      text_chunk text,
      similarity float
    )
    LANGUAGE plpgsql
    AS $$
    BEGIN
      RETURN QUERY
      SELECT
        be.id,
        be.brand_sample_id,
        be.text_chunk,
        1 - (be.embedding <=> query_embedding) as similarity
      FROM brand_embeddings be
      WHERE be.brand_profile_id = profile_id
        AND 1 - (be.embedding <=> query_embedding) > match_threshold
      ORDER BY be.embedding <=> query_embedding
      LIMIT match_count;
    END;
    $$;
    ';
  ELSE
    RAISE NOTICE 'Função match_brand_embeddings não criada: pgvector não disponível';
  END IF;
END $$;

-- ============================================================================
-- UPDATE profiles TABLE (Compatibilidade)
-- ============================================================================

-- Adicionar campo para referenciar voz padrão (opcional)
ALTER TABLE profiles 
  ADD COLUMN IF NOT EXISTS default_brand_profile_id uuid 
  REFERENCES brand_profiles(id) ON DELETE SET NULL;

-- Manter brand_voice JSONB existente para compatibilidade
-- Não remover, apenas não usar mais como fonte primária

