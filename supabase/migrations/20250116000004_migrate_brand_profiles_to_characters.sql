-- Migration: Migrate brand_profiles to characters
-- Created: 2025-01-16
-- Description: Migrate existing brand_profiles data to new characters table with default personality dimensions

-- ============================================================================
-- MIGRATION FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION migrate_brand_profiles_to_characters()
RETURNS TABLE (
  migrated_count integer,
  skipped_count integer,
  error_count integer
) 
LANGUAGE plpgsql
AS $$
DECLARE
  v_migrated integer := 0;
  v_skipped integer := 0;
  v_error integer := 0;
  v_brand_profile RECORD;
  v_character_id uuid;
BEGIN
  -- Iterar sobre todos os brand_profiles
  FOR v_brand_profile IN 
    SELECT * FROM brand_profiles
    ORDER BY created_at ASC
  LOOP
    BEGIN
      -- Verificar se já existe um character com mesmo nome para este usuário
      -- (evitar duplicatas)
      IF EXISTS (
        SELECT 1 FROM characters 
        WHERE user_id = v_brand_profile.user_id 
        AND name = v_brand_profile.name
      ) THEN
        v_skipped := v_skipped + 1;
        CONTINUE;
      END IF;
      
      -- Criar character com valores padrão para as 8 dimensões
      -- Os valores padrão serão usados já que brand_profiles não tem essas dimensões
      INSERT INTO characters (
        user_id,
        name,
        description,
        is_default,
        model_provider,
        model_name,
        metadata,
        created_at,
        updated_at
      ) VALUES (
        v_brand_profile.user_id,
        v_brand_profile.name,
        v_brand_profile.description,
        v_brand_profile.is_default,
        v_brand_profile.model_provider,
        v_brand_profile.model_name,
        jsonb_build_object(
          'migrated_from_brand_profile', true,
          'original_brand_profile_id', v_brand_profile.id,
          'migration_date', now()
        ),
        v_brand_profile.created_at,
        v_brand_profile.updated_at
      )
      RETURNING id INTO v_character_id;
      
      -- Migrar samples associados
      INSERT INTO character_samples (
        character_id,
        user_id,
        text_content,
        source_type,
        source_asset_id,
        metadata,
        created_at
      )
      SELECT 
        v_character_id,
        bs.user_id,
        bs.text_content,
        bs.source_type,
        bs.source_asset_id,
        jsonb_build_object(
          'migrated_from_brand_sample', true,
          'original_brand_sample_id', bs.id
        ),
        bs.created_at
      FROM brand_samples bs
      WHERE bs.brand_profile_id = v_brand_profile.id;
      
      -- Migrar embeddings associados (se pgvector disponível)
      IF pgvector_available() THEN
        INSERT INTO character_embeddings (
          character_id,
          character_sample_id,
          user_id,
          embedding,
          text_chunk,
          chunk_index,
          created_at
        )
        SELECT 
          v_character_id,
          cs.id, -- character_sample_id (já migrado acima)
          be.user_id,
          be.embedding::text::vector(1536), -- Converter para vector
          be.text_chunk,
          be.chunk_index,
          be.created_at
        FROM brand_embeddings be
        INNER JOIN brand_samples bs ON be.brand_sample_id = bs.id
        INNER JOIN character_samples cs ON cs.metadata->>'original_brand_sample_id' = bs.id::text
        WHERE be.brand_profile_id = v_brand_profile.id
        AND cs.character_id = v_character_id;
      ELSE
        -- Fallback: migrar como JSONB
        INSERT INTO character_embeddings (
          character_id,
          character_sample_id,
          user_id,
          embedding,
          text_chunk,
          chunk_index,
          created_at
        )
        SELECT 
          v_character_id,
          cs.id,
          be.user_id,
          CASE 
            WHEN jsonb_typeof(be.embedding) = 'array' THEN be.embedding
            ELSE be.embedding
          END,
          be.text_chunk,
          be.chunk_index,
          be.created_at
        FROM brand_embeddings be
        INNER JOIN brand_samples bs ON be.brand_sample_id = bs.id
        INNER JOIN character_samples cs ON cs.metadata->>'original_brand_sample_id' = bs.id::text
        WHERE be.brand_profile_id = v_brand_profile.id
        AND cs.character_id = v_character_id;
      END IF;
      
      v_migrated := v_migrated + 1;
      
    EXCEPTION WHEN OTHERS THEN
      -- Log erro mas continuar migração
      RAISE WARNING 'Erro ao migrar brand_profile %: %', v_brand_profile.id, SQLERRM;
      v_error := v_error + 1;
    END;
  END LOOP;
  
  RETURN QUERY SELECT v_migrated, v_skipped, v_error;
END;
$$;

-- ============================================================================
-- EXECUTAR MIGRAÇÃO
-- ============================================================================

-- Executar migração e retornar estatísticas
DO $$
DECLARE
  v_result RECORD;
BEGIN
  SELECT * INTO v_result FROM migrate_brand_profiles_to_characters();
  
  RAISE NOTICE 'Migração concluída:';
  RAISE NOTICE '  - Migrados: %', v_result.migrated_count;
  RAISE NOTICE '  - Ignorados (duplicatas): %', v_result.skipped_count;
  RAISE NOTICE '  - Erros: %', v_result.error_count;
END;
$$;

-- ============================================================================
-- VALIDAÇÃO DE INTEGRIDADE
-- ============================================================================

-- Verificar se todos os brand_profiles foram migrados (exceto duplicatas)
DO $$
DECLARE
  v_brand_count integer;
  v_character_count integer;
BEGIN
  SELECT COUNT(*) INTO v_brand_count FROM brand_profiles;
  SELECT COUNT(*) INTO v_character_count FROM characters 
    WHERE metadata->>'migrated_from_brand_profile' = 'true';
  
  IF v_character_count < v_brand_count THEN
    RAISE WARNING 'Atenção: Nem todos os brand_profiles foram migrados. Brand: %, Characters: %', 
      v_brand_count, v_character_count;
  ELSE
    RAISE NOTICE 'Validação OK: Todos os brand_profiles foram migrados ou já existiam como characters.';
  END IF;
END;
$$;

-- ============================================================================
-- ATUALIZAR default_character_id EM profiles
-- ============================================================================

-- Atualizar profiles.default_character_id com o character padrão migrado
UPDATE profiles p
SET default_character_id = c.id
FROM characters c
WHERE c.user_id = p.id
  AND c.is_default = true
  AND c.metadata->>'migrated_from_brand_profile' = 'true'
  AND p.default_character_id IS NULL;

-- ============================================================================
-- LIMPEZA (OPCIONAL - COMENTADO POR SEGURANÇA)
-- ============================================================================

-- IMPORTANTE: Não deletar brand_profiles ainda!
-- Manter durante período de transição para compatibilidade
-- Descomentar apenas após validação completa e período de estabilização

-- DROP TABLE IF EXISTS brand_embeddings CASCADE;
-- DROP TABLE IF EXISTS brand_samples CASCADE;
-- DROP TABLE IF EXISTS brand_profiles CASCADE;
