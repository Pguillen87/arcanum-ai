-- ============================================================================
-- Arcanum AI - Database Schema (PRD v3) - CORRECTED
-- Complete database structure for multimodal creative transformation platform
-- ============================================================================

-- ============================================================================
-- 1. EXTENSION
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 2. ENUMS
-- ============================================================================

-- Asset types
CREATE TYPE asset_type AS ENUM ('audio', 'video', 'text');

-- Asset status
CREATE TYPE asset_status AS ENUM ('uploading', 'processing', 'ready', 'failed');

-- Job status for transcriptions and transformations
CREATE TYPE job_status AS ENUM ('queued', 'processing', 'completed', 'failed');

-- Transformation types
CREATE TYPE transformation_type AS ENUM ('post', 'summary', 'newsletter', 'script', 'custom');

-- Transformation length
CREATE TYPE transformation_length AS ENUM ('short', 'medium', 'long');

-- Transformation tone
CREATE TYPE transformation_tone AS ENUM ('professional', 'casual', 'friendly', 'formal', 'inspirational');

-- Notification types
CREATE TYPE notification_type AS ENUM (
  'transcription_complete',
  'transcription_failed',
  'transformation_complete', 
  'transformation_failed',
  'credits_low',
  'credits_debited',
  'welcome'
);

-- Source type for transformation history
CREATE TYPE source_type AS ENUM ('audio', 'video', 'text');

-- ============================================================================
-- 3. PROFILES TABLE (extends auth.users)
-- ============================================================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  brand_voice JSONB DEFAULT '{}'::jsonb,
  preferences JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.profiles IS 'User profiles extending auth.users with brand voice and preferences';
COMMENT ON COLUMN public.profiles.brand_voice IS 'User brand voice preferences and style';
COMMENT ON COLUMN public.profiles.preferences IS 'User UI and workflow preferences';

-- ============================================================================
-- 4. PROJECTS TABLE
-- ============================================================================
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (length(name) >= 1 AND length(name) <= 200),
  description TEXT CHECK (length(description) <= 1000),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.projects IS 'User projects for organizing assets and transformations';

-- ============================================================================
-- 5. ASSETS TABLE
-- ============================================================================
CREATE TABLE public.assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  type asset_type NOT NULL,
  status asset_status NOT NULL DEFAULT 'uploading',
  size_bytes BIGINT NOT NULL CHECK (size_bytes >= 0),
  duration_seconds NUMERIC(10,2) CHECK (duration_seconds >= 0),
  mimetype TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.assets IS 'Uploaded files (audio, video, text) with metadata';
COMMENT ON COLUMN public.assets.storage_path IS 'Path in Supabase Storage bucket';
COMMENT ON COLUMN public.assets.duration_seconds IS 'Duration for audio/video files';

-- ============================================================================
-- 6. TRANSCRIPTIONS TABLE
-- ============================================================================
CREATE TABLE public.transcriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  asset_id UUID NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  job_id TEXT,
  status job_status NOT NULL DEFAULT 'queued',
  language TEXT DEFAULT 'pt',
  text TEXT,
  error TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.transcriptions IS 'Audio/video transcription jobs (Whisper)';
COMMENT ON COLUMN public.transcriptions.job_id IS 'External job ID for tracking';
COMMENT ON COLUMN public.transcriptions.text IS 'Transcribed text result';

-- ============================================================================
-- 7. CHARACTERS TABLE (Brand Voice Personas)
-- ============================================================================
CREATE TABLE public.characters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (length(name) >= 1 AND length(name) <= 100),
  description TEXT CHECK (length(description) <= 500),
  is_default BOOLEAN NOT NULL DEFAULT false,
  
  -- Personality dimensions (0-100 scale)
  formality INTEGER NOT NULL DEFAULT 50 CHECK (formality >= 0 AND formality <= 100),
  creativity INTEGER NOT NULL DEFAULT 50 CHECK (creativity >= 0 AND creativity <= 100),
  enthusiasm INTEGER NOT NULL DEFAULT 50 CHECK (enthusiasm >= 0 AND enthusiasm <= 100),
  empathy INTEGER NOT NULL DEFAULT 50 CHECK (empathy >= 0 AND empathy <= 100),
  assertiveness INTEGER NOT NULL DEFAULT 50 CHECK (assertiveness >= 0 AND assertiveness <= 100),
  humor INTEGER NOT NULL DEFAULT 50 CHECK (humor >= 0 AND humor <= 100),
  detail_level INTEGER NOT NULL DEFAULT 50 CHECK (detail_level >= 0 AND detail_level <= 100),
  technicality INTEGER NOT NULL DEFAULT 50 CHECK (technicality >= 0 AND technicality <= 100),
  
  refinement_rules JSONB NOT NULL DEFAULT '[]'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.characters IS 'Brand voice personas with 8-dimensional personality';
COMMENT ON COLUMN public.characters.refinement_rules IS 'Additional transformation rules as JSON array';

-- ============================================================================
-- 8. TRANSFORMATIONS TABLE
-- ============================================================================
CREATE TABLE public.transformations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  source_asset_id UUID REFERENCES public.assets(id) ON DELETE SET NULL,
  type transformation_type NOT NULL,
  tone transformation_tone,
  length transformation_length,
  character_id UUID REFERENCES public.characters(id) ON DELETE SET NULL,
  input_text TEXT NOT NULL,
  output_text TEXT,
  variants JSONB DEFAULT '[]'::jsonb,
  status job_status NOT NULL DEFAULT 'queued',
  error TEXT,
  cost_credits INTEGER DEFAULT 0 CHECK (cost_credits >= 0),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.transformations IS 'Text transformation jobs (GPT)';
COMMENT ON COLUMN public.transformations.variants IS 'Alternative generated versions';
COMMENT ON COLUMN public.transformations.cost_credits IS 'Credits consumed for this transformation';

-- ============================================================================
-- 9. TRANSCRIPTION_HISTORY TABLE
-- ============================================================================
CREATE TABLE public.transcription_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  transcription_id UUID REFERENCES public.transcriptions(id) ON DELETE CASCADE,
  source_type source_type NOT NULL,
  source_asset_id UUID REFERENCES public.assets(id) ON DELETE SET NULL,
  original_text TEXT NOT NULL,
  transformed_text TEXT,
  character_id UUID REFERENCES public.characters(id) ON DELETE SET NULL,
  transformation_type transformation_type,
  transformation_length transformation_length,
  cost_dracmas INTEGER DEFAULT 0 CHECK (cost_dracmas >= 0),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.transcription_history IS 'Historical record of transcriptions and transformations';
COMMENT ON COLUMN public.transcription_history.cost_dracmas IS 'Alternative currency (Dracmas) cost';

-- ============================================================================
-- 10. CREDITS SYSTEM (Ledger)
-- ============================================================================

-- Credits balance (cache)
CREATE TABLE public.credits (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  balance INTEGER NOT NULL DEFAULT 0 CHECK (balance >= 0),
  is_unlimited BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.credits IS 'User credit balance (cache table)';
COMMENT ON COLUMN public.credits.is_unlimited IS 'Premium users with unlimited credits';

-- Credits ledger (source of truth)
CREATE TABLE public.credit_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  balance_after INTEGER NOT NULL CHECK (balance_after >= 0),
  reason TEXT NOT NULL,
  ref_type TEXT,
  ref_id UUID,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  CONSTRAINT unique_transaction UNIQUE (user_id, ref_type, ref_id)
);

COMMENT ON TABLE public.credit_transactions IS 'Immutable credit transaction ledger';
COMMENT ON COLUMN public.credit_transactions.ref_type IS 'Type of transaction (e.g., transcription, transformation)';
COMMENT ON COLUMN public.credit_transactions.ref_id IS 'Reference to related entity ID';

-- ============================================================================
-- 11. NOTIFICATIONS TABLE
-- ============================================================================
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}'::jsonb,
  read BOOLEAN NOT NULL DEFAULT false,
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.notifications IS 'User notifications for job completion, credits, etc.';
COMMENT ON COLUMN public.notifications.data IS 'Additional notification data as JSON';

-- ============================================================================
-- 12. PROTECTION_SETTINGS TABLE
-- ============================================================================
CREATE TABLE public.protection_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  auto_moderation BOOLEAN NOT NULL DEFAULT false,
  offensive_filter BOOLEAN NOT NULL DEFAULT false,
  brand_verification BOOLEAN NOT NULL DEFAULT false,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  CONSTRAINT one_setting_per_user UNIQUE (user_id)
);

COMMENT ON TABLE public.protection_settings IS 'Content protection and moderation settings per user';

-- ============================================================================
-- 13. BRAND VOICE SYSTEM (Training & Samples)
-- ============================================================================

-- Brand profiles for voice training
CREATE TABLE public.brand_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (length(name) >= 1 AND length(name) <= 100),
  description TEXT CHECK (length(description) <= 500),
  is_default BOOLEAN NOT NULL DEFAULT false,
  model_provider TEXT DEFAULT 'openai' CHECK (model_provider IN ('openai', 'anthropic')),
  model_name TEXT,
  training_status TEXT DEFAULT 'not_trained' CHECK (training_status IN ('not_trained', 'training', 'trained', 'failed')),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.brand_profiles IS 'Brand voice profiles for training';

-- Brand samples for training
CREATE TABLE public.brand_samples (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_profile_id UUID NOT NULL REFERENCES public.brand_profiles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (length(content) >= 10),
  source_url TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.brand_samples IS 'Sample texts for training brand voice';

-- ============================================================================
-- 14. INDICES FOR PERFORMANCE
-- ============================================================================

-- Profiles
CREATE INDEX idx_profiles_created_at ON public.profiles(created_at);

-- Projects
CREATE INDEX idx_projects_user_id ON public.projects(user_id);
CREATE INDEX idx_projects_created_at ON public.projects(created_at DESC);

-- Assets
CREATE INDEX idx_assets_user_id ON public.assets(user_id);
CREATE INDEX idx_assets_project_id ON public.assets(project_id);
CREATE INDEX idx_assets_status ON public.assets(status);
CREATE INDEX idx_assets_type ON public.assets(type);
CREATE INDEX idx_assets_created_at ON public.assets(created_at DESC);

-- Transcriptions
CREATE INDEX idx_transcriptions_asset_id ON public.transcriptions(asset_id);
CREATE INDEX idx_transcriptions_user_id ON public.transcriptions(user_id);
CREATE INDEX idx_transcriptions_status ON public.transcriptions(status);
CREATE INDEX idx_transcriptions_created_at ON public.transcriptions(created_at DESC);

-- Characters
CREATE INDEX idx_characters_user_id ON public.characters(user_id);
-- Unique partial index for one default character per user
CREATE UNIQUE INDEX idx_characters_one_default_per_user ON public.characters(user_id, is_default) WHERE is_default = true;

-- Transformations
CREATE INDEX idx_transformations_user_id ON public.transformations(user_id);
CREATE INDEX idx_transformations_project_id ON public.transformations(project_id);
CREATE INDEX idx_transformations_status ON public.transformations(status);
CREATE INDEX idx_transformations_created_at ON public.transformations(created_at DESC);

-- Transcription History
CREATE INDEX idx_history_user_id ON public.transcription_history(user_id);
CREATE INDEX idx_history_project_id ON public.transcription_history(project_id);
CREATE INDEX idx_history_created_at ON public.transcription_history(created_at DESC);

-- Credits
CREATE INDEX idx_credit_transactions_user_id ON public.credit_transactions(user_id);
CREATE INDEX idx_credit_transactions_created_at ON public.credit_transactions(created_at DESC);

-- Notifications
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_read ON public.notifications(user_id, read);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);

-- Protection Settings
CREATE INDEX idx_protection_settings_user_id ON public.protection_settings(user_id);

-- Brand Profiles
CREATE INDEX idx_brand_profiles_user_id ON public.brand_profiles(user_id);
-- Unique partial index for one default brand profile per user
CREATE UNIQUE INDEX idx_brand_profiles_one_default_per_user ON public.brand_profiles(user_id, is_default) WHERE is_default = true;

-- Brand Samples
CREATE INDEX idx_brand_samples_profile_id ON public.brand_samples(brand_profile_id);
CREATE INDEX idx_brand_samples_user_id ON public.brand_samples(user_id);

-- ============================================================================
-- 15. ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transcriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transformations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transcription_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.protection_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_samples ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Projects policies
CREATE POLICY "Users can view own projects" ON public.projects FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own projects" ON public.projects FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own projects" ON public.projects FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own projects" ON public.projects FOR DELETE USING (auth.uid() = user_id);

-- Assets policies
CREATE POLICY "Users can view own assets" ON public.assets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own assets" ON public.assets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own assets" ON public.assets FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own assets" ON public.assets FOR DELETE USING (auth.uid() = user_id);

-- Transcriptions policies
CREATE POLICY "Users can view own transcriptions" ON public.transcriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own transcriptions" ON public.transcriptions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own transcriptions" ON public.transcriptions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own transcriptions" ON public.transcriptions FOR DELETE USING (auth.uid() = user_id);

-- Characters policies
CREATE POLICY "Users can view own characters" ON public.characters FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own characters" ON public.characters FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own characters" ON public.characters FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own characters" ON public.characters FOR DELETE USING (auth.uid() = user_id);

-- Transformations policies
CREATE POLICY "Users can view own transformations" ON public.transformations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own transformations" ON public.transformations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own transformations" ON public.transformations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own transformations" ON public.transformations FOR DELETE USING (auth.uid() = user_id);

-- Transcription History policies
CREATE POLICY "Users can view own history" ON public.transcription_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own history" ON public.transcription_history FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Credits policies
CREATE POLICY "Users can view own credits" ON public.credits FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own credits" ON public.credits FOR UPDATE USING (auth.uid() = user_id);

-- Credit Transactions policies
CREATE POLICY "Users can view own transactions" ON public.credit_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own transactions" ON public.credit_transactions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Notifications policies
CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own notifications" ON public.notifications FOR DELETE USING (auth.uid() = user_id);

-- Protection Settings policies
CREATE POLICY "Users can view own settings" ON public.protection_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own settings" ON public.protection_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own settings" ON public.protection_settings FOR UPDATE USING (auth.uid() = user_id);

-- Brand Profiles policies
CREATE POLICY "Users can view own brand profiles" ON public.brand_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own brand profiles" ON public.brand_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own brand profiles" ON public.brand_profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own brand profiles" ON public.brand_profiles FOR DELETE USING (auth.uid() = user_id);

-- Brand Samples policies
CREATE POLICY "Users can view own brand samples" ON public.brand_samples FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own brand samples" ON public.brand_samples FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own brand samples" ON public.brand_samples FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- 16. FUNCTIONS AND TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to all relevant tables
CREATE TRIGGER set_updated_at_profiles
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER set_updated_at_projects
  BEFORE UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER set_updated_at_assets
  BEFORE UPDATE ON public.assets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER set_updated_at_transcriptions
  BEFORE UPDATE ON public.transcriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER set_updated_at_characters
  BEFORE UPDATE ON public.characters
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER set_updated_at_transformations
  BEFORE UPDATE ON public.transformations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER set_updated_at_credits
  BEFORE UPDATE ON public.credits
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER set_updated_at_protection_settings
  BEFORE UPDATE ON public.protection_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER set_updated_at_brand_profiles
  BEFORE UPDATE ON public.brand_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Create profile
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
  );
  
  -- Initialize credits with 100 free credits
  INSERT INTO public.credits (user_id, balance)
  VALUES (NEW.id, 100);
  
  -- Record initial credit transaction
  INSERT INTO public.credit_transactions (user_id, amount, balance_after, reason, ref_type)
  VALUES (NEW.id, 100, 100, 'Welcome bonus - 100 free credits', 'signup');
  
  -- Create welcome notification
  INSERT INTO public.notifications (user_id, type, title, message, priority)
  VALUES (
    NEW.id,
    'welcome',
    'Bem-vindo ao Arcanum AI! ✨',
    'Você recebeu 100 créditos gratuitos para começar sua jornada de transmutação criativa.',
    'high'
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- 17. STORAGE BUCKETS
-- ============================================================================

-- Audio files bucket (50MB limit)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'audio-files',
  'audio-files',
  false,
  52428800,
  ARRAY['audio/mpeg', 'audio/wav', 'audio/webm', 'audio/mp3', 'audio/mp4', 'audio/ogg', 'audio/aac', 'audio/flac', 'audio/m4a']
) ON CONFLICT (id) DO NOTHING;

-- Video files bucket (500MB limit)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'video-files',
  'video-files',
  false,
  524288000,
  ARRAY['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo', 'video/mpeg']
) ON CONFLICT (id) DO NOTHING;

-- Text files bucket (10MB limit)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'text-files',
  'text-files',
  false,
  10485760,
  ARRAY['text/plain', 'text/markdown', 'application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
) ON CONFLICT (id) DO NOTHING;

-- RLS Policies for Storage

-- Audio bucket policies
CREATE POLICY "Users can view own audio files" ON storage.objects FOR SELECT USING (
  bucket_id = 'audio-files' AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can upload own audio files" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'audio-files' AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update own audio files" ON storage.objects FOR UPDATE USING (
  bucket_id = 'audio-files' AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete own audio files" ON storage.objects FOR DELETE USING (
  bucket_id = 'audio-files' AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Video bucket policies
CREATE POLICY "Users can view own video files" ON storage.objects FOR SELECT USING (
  bucket_id = 'video-files' AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can upload own video files" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'video-files' AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update own video files" ON storage.objects FOR UPDATE USING (
  bucket_id = 'video-files' AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete own video files" ON storage.objects FOR DELETE USING (
  bucket_id = 'video-files' AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Text bucket policies
CREATE POLICY "Users can view own text files" ON storage.objects FOR SELECT USING (
  bucket_id = 'text-files' AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can upload own text files" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'text-files' AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update own text files" ON storage.objects FOR UPDATE USING (
  bucket_id = 'text-files' AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete own text files" ON storage.objects FOR DELETE USING (
  bucket_id = 'text-files' AND auth.uid()::text = (storage.foldername(name))[1]
);