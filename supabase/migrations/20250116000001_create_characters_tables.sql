-- Migration: Create characters, character_samples, and character_embeddings tables
-- Created: 2025-01-16
-- Description: Tables for managing RPG-style characters with 8 personality dimensions

-- ============================================================================
-- ENABLE pgvector EXTENSION (reutilizar função existente se disponível)
-- ============================================================================

-- Função helper para verificar disponibilidade (criar se não existir)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'pgvector_available') THEN
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
  END IF;
END $$;

-- ============================================================================
-- CHARACTERS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.characters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text,
  avatar_url text,
  is_default boolean DEFAULT false,
  
  -- 8 Dimensões de Personalidade
  personality_core jsonb NOT NULL DEFAULT '{
    "traits": [],
    "robotic_human": 50,
    "clown_serious": 50
  }'::jsonb,
  
  communication_tone jsonb NOT NULL DEFAULT '{
    "formality": "neutral",
    "enthusiasm": "medium",
    "style": [],
    "use_emojis": false,
    "use_slang": false,
    "use_metaphors": false
  }'::jsonb,
  
  motivation_focus jsonb NOT NULL DEFAULT '{
    "focus": "help",
    "seeks": "harmony"
  }'::jsonb,
  
  social_attitude jsonb NOT NULL DEFAULT '{
    "type": "reactive",
    "curiosity": "medium",
    "reserved_expansive": 50
  }'::jsonb,
  
  cognitive_speed jsonb NOT NULL DEFAULT '{
    "speed": "medium",
    "depth": "medium"
  }'::jsonb,
  
  vocabulary_style jsonb NOT NULL DEFAULT '{
    "style": "neutral",
    "complexity": "medium",
    "use_figures": false
  }'::jsonb,
  
  emotional_state jsonb DEFAULT '{
    "current": "neutral",
    "variability": "medium"
  }'::jsonb,
  
  values_tendencies jsonb NOT NULL DEFAULT '["neutral", "pragmatic"]'::jsonb,
  
  -- Metadados técnicos
  model_provider text NOT NULL DEFAULT 'openai',
  model_name text NOT NULL DEFAULT 'gpt-4o',
  metadata jsonb,
  
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  
  CONSTRAINT characters_model_provider_check CHECK (model_provider IN ('openai', 'anthropic')),
  CONSTRAINT characters_name_length CHECK (char_length(name) >= 1 AND char_length(name) <= 100),
  CONSTRAINT characters_description_length CHECK (description IS NULL OR (char_length(description) >= 0 AND char_length(description) <= 500))
);

-- Constraint única: apenas um personagem padrão por usuário
CREATE UNIQUE INDEX IF NOT EXISTS characters_user_default_unique 
  ON characters(user_id, is_default) 
  WHERE is_default = true;

-- Índices
CREATE INDEX IF NOT EXISTS characters_user_id_idx ON characters(user_id);
CREATE INDEX IF NOT EXISTS characters_user_default_idx ON characters(user_id, is_default) 
  WHERE is_default = true;

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION set_updated_at_characters()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at_characters
  BEFORE UPDATE ON characters
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at_characters();

-- RLS Policies
ALTER TABLE characters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own characters"
  ON characters FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own characters"
  ON characters FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own characters"
  ON characters FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own characters"
  ON characters FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- CHARACTER_SAMPLES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.character_samples (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id uuid REFERENCES characters(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  text_content text NOT NULL,
  source_type text,
  source_asset_id uuid REFERENCES assets(id) ON DELETE SET NULL,
  metadata jsonb,
  created_at timestamptz DEFAULT now() NOT NULL,
  
  CONSTRAINT character_samples_text_length CHECK (char_length(text_content) >= 50)
);

-- Índices
CREATE INDEX IF NOT EXISTS character_samples_character_id_idx ON character_samples(character_id);
CREATE INDEX IF NOT EXISTS character_samples_user_id_idx ON character_samples(user_id);

-- RLS Policies
ALTER TABLE character_samples ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own character samples"
  ON character_samples FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own character samples"
  ON character_samples FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own character samples"
  ON character_samples FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own character samples"
  ON character_samples FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- CHARACTER_EMBEDDINGS TABLE (Vector Store)
-- ============================================================================

-- Verificar se pgvector está disponível antes de criar tabela com vector
DO $$
BEGIN
  IF pgvector_available() THEN
    -- Criar tabela com vector se pgvector estiver disponível
    EXECUTE '
    CREATE TABLE IF NOT EXISTS public.character_embeddings (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      character_id uuid REFERENCES characters(id) ON DELETE CASCADE NOT NULL,
      character_sample_id uuid REFERENCES character_samples(id) ON DELETE CASCADE NOT NULL,
      user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
      embedding vector(1536) NOT NULL,
      text_chunk text NOT NULL,
      chunk_index integer DEFAULT 0,
      created_at timestamptz DEFAULT now() NOT NULL
    );
    
    -- Índices
    CREATE INDEX IF NOT EXISTS character_embeddings_character_id_idx ON character_embeddings(character_id);
    CREATE INDEX IF NOT EXISTS character_embeddings_user_id_idx ON character_embeddings(user_id);
    
    -- Vector index (ivfflat)
    CREATE INDEX IF NOT EXISTS character_embeddings_vector_idx ON character_embeddings 
      USING ivfflat (embedding vector_cosine_ops) 
      WITH (lists = 100);
    ';
  ELSE
    -- Criar tabela sem vector se pgvector não estiver disponível
    CREATE TABLE IF NOT EXISTS public.character_embeddings (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      character_id uuid REFERENCES characters(id) ON DELETE CASCADE NOT NULL,
      character_sample_id uuid REFERENCES character_samples(id) ON DELETE CASCADE NOT NULL,
      user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
      embedding jsonb NOT NULL, -- Fallback: armazenar como JSONB
      text_chunk text NOT NULL,
      chunk_index integer DEFAULT 0,
      created_at timestamptz DEFAULT now() NOT NULL
    );
    
    -- Índices básicos
    CREATE INDEX IF NOT EXISTS character_embeddings_character_id_idx ON character_embeddings(character_id);
    CREATE INDEX IF NOT EXISTS character_embeddings_user_id_idx ON character_embeddings(user_id);
    
    RAISE NOTICE 'Tabela character_embeddings criada sem pgvector. Use JSONB como fallback.';
  END IF;
END $$;

-- RLS Policies para character_embeddings
ALTER TABLE character_embeddings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own character embeddings"
  ON character_embeddings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own character embeddings"
  ON character_embeddings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own character embeddings"
  ON character_embeddings FOR DELETE
  USING (auth.uid() = user_id);

-- IMPORTANTE: character_embeddings não deve ter UPDATE (imutável)
-- Embeddings são regenerados, não atualizados

-- ============================================================================
-- FUNCTION: match_character_embeddings (Busca por Similaridade)
-- ============================================================================

-- Função para buscar embeddings similares (apenas se pgvector estiver disponível)
DO $$
BEGIN
  IF pgvector_available() THEN
    EXECUTE '
    CREATE OR REPLACE FUNCTION match_character_embeddings(
      query_embedding vector(1536),
      character_id_param uuid,
      match_threshold float DEFAULT 0.7,
      match_count int DEFAULT 5
    )
    RETURNS TABLE (
      id uuid,
      character_sample_id uuid,
      text_chunk text,
      similarity float
    )
    LANGUAGE plpgsql
    AS $$
    BEGIN
      RETURN QUERY
      SELECT
        ce.id,
        ce.character_sample_id,
        ce.text_chunk,
        1 - (ce.embedding <=> query_embedding) as similarity
      FROM character_embeddings ce
      WHERE ce.character_id = character_id_param
        AND 1 - (ce.embedding <=> query_embedding) > match_threshold
      ORDER BY ce.embedding <=> query_embedding
      LIMIT match_count;
    END;
    $$;
    ';
  ELSE
    RAISE NOTICE 'Função match_character_embeddings não criada: pgvector não disponível';
  END IF;
END $$;

-- ============================================================================
-- UPDATE profiles TABLE (Compatibilidade)
-- ============================================================================

-- Adicionar campo para referenciar personagem padrão (opcional)
ALTER TABLE profiles 
  ADD COLUMN IF NOT EXISTS default_character_id uuid 
  REFERENCES characters(id) ON DELETE SET NULL;
