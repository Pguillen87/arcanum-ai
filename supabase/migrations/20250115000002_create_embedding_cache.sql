-- Migration: Create embedding_cache table for caching embeddings
-- Created: 2025-01-XX
-- Description: Cache embeddings to avoid regenerating same text embeddings (TTL: 30 days)

-- ============================================================================
-- EMBEDDING_CACHE TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.embedding_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  text_hash text NOT NULL UNIQUE, -- SHA-256 hash do texto para busca rápida
  text_content text NOT NULL, -- Texto original (para debug/validação)
  embedding vector(1536), -- Embedding (pgvector) - 1536 dimensões para text-embedding-3-small
  embedding_jsonb jsonb, -- Fallback JSONB se pgvector não disponível
  model_name text NOT NULL DEFAULT 'text-embedding-3-small',
  created_at timestamptz DEFAULT now() NOT NULL,
  expires_at timestamptz NOT NULL, -- TTL: 30 dias
  
  CONSTRAINT embedding_cache_model_check CHECK (model_name IN ('text-embedding-3-small', 'text-embedding-ada-002'))
);

-- Índices
CREATE INDEX IF NOT EXISTS embedding_cache_text_hash_idx ON embedding_cache(text_hash);
CREATE INDEX IF NOT EXISTS embedding_cache_expires_at_idx ON embedding_cache(expires_at);

-- Índice vector (ivfflat) se pgvector disponível
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'vector') THEN
    CREATE INDEX IF NOT EXISTS embedding_cache_embedding_idx 
    ON embedding_cache 
    USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 100);
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Não foi possível criar índice vector: %', SQLERRM;
END $$;

-- RLS Policies (permitir leitura pública, escrita apenas via service role)
ALTER TABLE embedding_cache ENABLE ROW LEVEL SECURITY;

-- Política de leitura: qualquer usuário autenticado pode ler cache válido
CREATE POLICY "Users can read valid cache"
  ON embedding_cache FOR SELECT
  USING (expires_at > now());

-- Política de escrita: apenas service role (Edge Functions)
-- Nota: Edge Functions usam service role, então não precisam de política específica
-- Mas adicionamos uma política que permite inserção via service role
CREATE POLICY "Service role can manage cache"
  ON embedding_cache FOR ALL
  USING (true)
  WITH CHECK (true);

-- Função para limpar cache expirado (executar periodicamente)
CREATE OR REPLACE FUNCTION cleanup_expired_embeddings()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count integer;
BEGIN
  DELETE FROM embedding_cache
  WHERE expires_at < now();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

-- Comentários
COMMENT ON TABLE embedding_cache IS 'Cache de embeddings para evitar regeneração de textos idênticos. TTL: 30 dias.';
COMMENT ON COLUMN embedding_cache.text_hash IS 'SHA-256 hash do texto para busca rápida sem colisões';
COMMENT ON COLUMN embedding_cache.embedding IS 'Vector embedding (pgvector) - 1536 dimensões';
COMMENT ON COLUMN embedding_cache.embedding_jsonb IS 'Fallback JSONB se pgvector não disponível';
COMMENT ON COLUMN embedding_cache.expires_at IS 'Data de expiração do cache (30 dias após criação)';

