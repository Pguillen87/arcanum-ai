-- Migration: Create transcription_history table
-- Created: 2025-01-16
-- Description: Table for storing transcription and transformation history

-- ============================================================================
-- TRANSCRIPTION_HISTORY TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.transcription_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Fonte
  source_type text NOT NULL CHECK (source_type IN ('text', 'audio', 'video')),
  source_asset_id uuid REFERENCES assets(id) ON DELETE SET NULL,
  transcription_id uuid REFERENCES transcriptions(id) ON DELETE SET NULL,
  project_id uuid REFERENCES projects(id) ON DELETE SET NULL,
  
  -- Texto original
  original_text text NOT NULL,
  
  -- Personagem usado
  character_id uuid REFERENCES characters(id) ON DELETE SET NULL,
  
  -- Transformação aplicada
  transformation_type text CHECK (transformation_type IN ('post', 'resumo', 'newsletter', 'roteiro')),
  transformation_length text CHECK (transformation_length IN ('short', 'medium', 'long')),
  
  -- Resultado
  transformed_text text,
  
  -- Metadados
  status text DEFAULT 'completed' CHECK (status IN ('processing', 'completed', 'failed')),
  error_message text,
  cost_dracmas integer DEFAULT 0,
  
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  
  CONSTRAINT transcription_history_original_text_length CHECK (char_length(original_text) >= 1),
  CONSTRAINT transcription_history_cost_non_negative CHECK (cost_dracmas >= 0)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS transcription_history_user_id_idx ON transcription_history(user_id);
CREATE INDEX IF NOT EXISTS transcription_history_character_id_idx ON transcription_history(character_id);
CREATE INDEX IF NOT EXISTS transcription_history_project_id_idx ON transcription_history(project_id);
CREATE INDEX IF NOT EXISTS transcription_history_source_type_idx ON transcription_history(source_type);
CREATE INDEX IF NOT EXISTS transcription_history_created_at_idx ON transcription_history(created_at DESC);
CREATE INDEX IF NOT EXISTS transcription_history_user_created_idx ON transcription_history(user_id, created_at DESC);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION set_updated_at_transcription_history()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at_transcription_history
  BEFORE UPDATE ON transcription_history
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at_transcription_history();

-- RLS Policies
ALTER TABLE transcription_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transcription history"
  ON transcription_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transcription history"
  ON transcription_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own transcription history"
  ON transcription_history FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own transcription history"
  ON transcription_history FOR DELETE
  USING (auth.uid() = user_id);

-- Política adicional: usuário só pode usar seus próprios personagens
CREATE POLICY "Users can only use own characters"
  ON transcription_history FOR INSERT
  WITH CHECK (
    character_id IS NULL OR EXISTS (
      SELECT 1 FROM characters 
      WHERE characters.id = transcription_history.character_id 
      AND characters.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can only update with own characters"
  ON transcription_history FOR UPDATE
  WITH CHECK (
    character_id IS NULL OR EXISTS (
      SELECT 1 FROM characters 
      WHERE characters.id = transcription_history.character_id 
      AND characters.user_id = auth.uid()
    )
  );
