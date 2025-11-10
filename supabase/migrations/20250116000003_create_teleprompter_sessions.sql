-- Migration: Create teleprompter_sessions table
-- Created: 2025-01-16
-- Description: Table for managing teleprompter sessions

-- ============================================================================
-- TELEPROMPTER_SESSIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.teleprompter_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  project_id uuid REFERENCES projects(id) ON DELETE SET NULL,
  
  -- Conteúdo
  content_text text NOT NULL,
  content_source text CHECK (content_source IN ('project', 'transcription', 'manual', 'file')),
  source_id uuid, -- ID do projeto, transcrição, etc.
  
  -- Configurações da sessão
  scroll_speed integer DEFAULT 50 CHECK (scroll_speed >= 0 AND scroll_speed <= 100),
  font_size integer DEFAULT 24 CHECK (font_size >= 12 AND font_size <= 72),
  text_color text DEFAULT '#ffffff',
  background_color text DEFAULT '#000000',
  mirror_mode boolean DEFAULT false,
  
  -- Detecção de pausa
  speech_detection_enabled boolean DEFAULT true,
  silence_threshold_ms integer DEFAULT 500 CHECK (silence_threshold_ms >= 100 AND silence_threshold_ms <= 5000),
  volume_threshold integer DEFAULT 30 CHECK (volume_threshold >= 0 AND volume_threshold <= 100),
  resume_delay_ms integer DEFAULT 1000 CHECK (resume_delay_ms >= 0 AND resume_delay_ms <= 5000),
  
  -- Gravação
  video_url text, -- URL do vídeo gravado (Supabase Storage)
  video_storage_path text, -- Caminho no storage
  duration_seconds integer CHECK (duration_seconds IS NULL OR duration_seconds >= 0),
  file_size_bytes bigint CHECK (file_size_bytes IS NULL OR file_size_bytes > 0),
  
  -- Metadados
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  
  CONSTRAINT teleprompter_sessions_content_length CHECK (char_length(content_text) >= 1)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS teleprompter_sessions_user_id_idx ON teleprompter_sessions(user_id);
CREATE INDEX IF NOT EXISTS teleprompter_sessions_project_id_idx ON teleprompter_sessions(project_id);
CREATE INDEX IF NOT EXISTS teleprompter_sessions_created_at_idx ON teleprompter_sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS teleprompter_sessions_user_created_idx ON teleprompter_sessions(user_id, created_at DESC);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION set_updated_at_teleprompter_sessions()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at_teleprompter_sessions
  BEFORE UPDATE ON teleprompter_sessions
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at_teleprompter_sessions();

-- RLS Policies
ALTER TABLE teleprompter_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own teleprompter sessions"
  ON teleprompter_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own teleprompter sessions"
  ON teleprompter_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own teleprompter sessions"
  ON teleprompter_sessions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own teleprompter sessions"
  ON teleprompter_sessions FOR DELETE
  USING (auth.uid() = user_id);

-- Política adicional: usuário só pode referenciar seus próprios projetos
CREATE POLICY "Users can only reference own projects"
  ON teleprompter_sessions FOR INSERT
  WITH CHECK (
    project_id IS NULL OR EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = teleprompter_sessions.project_id 
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can only update with own projects"
  ON teleprompter_sessions FOR UPDATE
  WITH CHECK (
    project_id IS NULL OR EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = teleprompter_sessions.project_id 
      AND projects.user_id = auth.uid()
    )
  );
