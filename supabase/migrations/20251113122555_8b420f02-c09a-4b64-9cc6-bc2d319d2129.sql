-- ============================================
-- ARCANUM AI - DATABASE SCHEMA
-- Complete structure with RLS, triggers, and indexes
-- ============================================

-- ============================================
-- ENUMS
-- ============================================

-- Asset types including YouTube support
CREATE TYPE public.asset_type AS ENUM (
  'text',
  'audio',
  'video',
  'youtube'
);

-- Asset status for lifecycle tracking
CREATE TYPE public.asset_status AS ENUM (
  'uploading',
  'uploaded',
  'processing',
  'ready',
  'failed'
);

-- Transcription status
CREATE TYPE public.transcription_status AS ENUM (
  'queued',
  'processing',
  'completed',
  'failed'
);

-- Transformation types
CREATE TYPE public.transformation_type AS ENUM (
  'social_post',
  'summary',
  'newsletter',
  'script',
  'custom'
);

-- Transformation length options
CREATE TYPE public.transformation_length AS ENUM (
  'short',
  'medium',
  'long'
);

-- Credit transaction types
CREATE TYPE public.credit_transaction_type AS ENUM (
  'credit',
  'debit'
);

-- Notification types
CREATE TYPE public.notification_type AS ENUM (
  'transcription_complete',
  'transcription_failed',
  'transformation_complete',
  'transformation_failed',
  'credits_low',
  'credits_debited',
  'credits_added'
);

-- Payment status
CREATE TYPE public.payment_status AS ENUM (
  'pending',
  'completed',
  'failed',
  'refunded'
);

-- Payment provider
CREATE TYPE public.payment_provider AS ENUM (
  'stripe',
  'mercadopago'
);

-- Subscription status
CREATE TYPE public.subscription_status AS ENUM (
  'active',
  'cancelled',
  'expired',
  'past_due'
);

-- ============================================
-- CORE TABLES
-- ============================================

-- Profiles table (extends auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Projects for organizing assets
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (char_length(name) >= 1 AND char_length(name) <= 100),
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Assets table (text, audio, video, YouTube)
CREATE TABLE public.assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  type public.asset_type NOT NULL,
  status public.asset_status NOT NULL DEFAULT 'uploading',
  
  -- File metadata
  file_name TEXT,
  file_size BIGINT CHECK (file_size IS NULL OR file_size > 0),
  mime_type TEXT,
  storage_path TEXT,
  
  -- YouTube specific
  youtube_url TEXT,
  youtube_video_id TEXT,
  
  -- Media metadata
  duration_seconds INTEGER CHECK (duration_seconds IS NULL OR duration_seconds > 0),
  
  -- Additional metadata as JSONB
  metadata JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Constraints
  CHECK (
    (type != 'youtube' AND file_name IS NOT NULL) OR
    (type = 'youtube' AND youtube_url IS NOT NULL)
  )
);

-- Characters table (Brand Voice/Persona)
CREATE TABLE public.characters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (char_length(name) >= 1 AND char_length(name) <= 100),
  description TEXT,
  
  -- Personality dimensions (0-100)
  formality INTEGER DEFAULT 50 CHECK (formality >= 0 AND formality <= 100),
  enthusiasm INTEGER DEFAULT 50 CHECK (enthusiasm >= 0 AND enthusiasm <= 100),
  complexity INTEGER DEFAULT 50 CHECK (complexity >= 0 AND complexity <= 100),
  humor INTEGER DEFAULT 50 CHECK (humor >= 0 AND humor <= 100),
  empathy INTEGER DEFAULT 50 CHECK (empathy >= 0 AND empathy <= 100),
  directness INTEGER DEFAULT 50 CHECK (directness >= 0 AND directness <= 100),
  creativity INTEGER DEFAULT 50 CHECK (creativity >= 0 AND creativity <= 100),
  technical INTEGER DEFAULT 50 CHECK (technical >= 0 AND technical <= 100),
  
  -- Preferences and examples
  tone_preferences JSONB DEFAULT '{}'::jsonb,
  style_examples TEXT[],
  
  -- Default character flag
  is_default BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Transcriptions table
CREATE TABLE public.transcriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  asset_id UUID NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
  
  status public.transcription_status NOT NULL DEFAULT 'queued',
  job_id TEXT,
  
  -- Transcription result
  text TEXT,
  language TEXT,
  
  -- Error handling
  error TEXT,
  retry_count INTEGER DEFAULT 0,
  
  -- Metadata
  processing_time_ms INTEGER,
  metadata JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Transcription history (transformations applied to transcriptions)
CREATE TABLE public.transcription_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  transcription_id UUID REFERENCES public.transcriptions(id) ON DELETE CASCADE,
  character_id UUID REFERENCES public.characters(id) ON DELETE SET NULL,
  
  -- Original and transformed text
  original_text TEXT NOT NULL,
  transformed_text TEXT NOT NULL,
  
  -- Transformation parameters
  transformation_type public.transformation_type NOT NULL,
  transformation_length public.transformation_length DEFAULT 'medium',
  
  -- Cost tracking
  cost_dracmas INTEGER DEFAULT 0 CHECK (cost_dracmas >= 0),
  
  -- Metadata
  processing_time_ms INTEGER,
  metadata JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Credits ledger (double-entry bookkeeping)
CREATE TABLE public.credits_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  transaction_type public.credit_transaction_type NOT NULL,
  amount INTEGER NOT NULL CHECK (amount > 0),
  balance_after INTEGER NOT NULL CHECK (balance_after >= 0),
  
  -- Reference to related entity
  reference_type TEXT,
  reference_id UUID,
  
  -- Reason/description
  reason TEXT NOT NULL,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Subscriptions table
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  plan_name TEXT NOT NULL,
  status public.subscription_status NOT NULL DEFAULT 'active',
  
  credits_per_month INTEGER NOT NULL CHECK (credits_per_month > 0),
  price_cents INTEGER NOT NULL CHECK (price_cents >= 0),
  
  current_period_start TIMESTAMPTZ NOT NULL,
  current_period_end TIMESTAMPTZ NOT NULL,
  
  -- External provider info
  provider public.payment_provider,
  external_subscription_id TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  cancelled_at TIMESTAMPTZ
);

-- Payments table
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE SET NULL,
  
  amount_cents INTEGER NOT NULL CHECK (amount_cents >= 0),
  currency TEXT NOT NULL DEFAULT 'BRL',
  status public.payment_status NOT NULL DEFAULT 'pending',
  
  provider public.payment_provider NOT NULL,
  external_payment_id TEXT,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Notifications table
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  type public.notification_type NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  
  read BOOLEAN DEFAULT false,
  
  -- Reference to related entity
  reference_type TEXT,
  reference_id UUID,
  
  -- Additional data
  data JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- OBSERVABILITY TABLES
-- ============================================

-- Transcription events for detailed tracking
CREATE TABLE public.transcription_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transcription_id UUID NOT NULL REFERENCES public.transcriptions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  event_type TEXT NOT NULL,
  event_data JSONB DEFAULT '{}'::jsonb,
  
  processing_time_ms INTEGER,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Transformation events for detailed tracking
CREATE TABLE public.transformation_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  history_id UUID NOT NULL REFERENCES public.transcription_history(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  event_type TEXT NOT NULL,
  event_data JSONB DEFAULT '{}'::jsonb,
  
  processing_time_ms INTEGER,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Profiles
CREATE INDEX idx_profiles_user_id ON public.profiles(id);

-- Projects
CREATE INDEX idx_projects_user_id ON public.projects(user_id);
CREATE INDEX idx_projects_created_at ON public.projects(created_at DESC);

-- Assets
CREATE INDEX idx_assets_user_id ON public.assets(user_id);
CREATE INDEX idx_assets_project_id ON public.assets(project_id);
CREATE INDEX idx_assets_type ON public.assets(type);
CREATE INDEX idx_assets_status ON public.assets(status);
CREATE INDEX idx_assets_user_project ON public.assets(user_id, project_id);
CREATE INDEX idx_assets_created_at ON public.assets(created_at DESC);

-- Characters
CREATE INDEX idx_characters_user_id ON public.characters(user_id);
CREATE INDEX idx_characters_is_default ON public.characters(user_id, is_default) WHERE is_default = true;

-- Transcriptions
CREATE INDEX idx_transcriptions_user_id ON public.transcriptions(user_id);
CREATE INDEX idx_transcriptions_asset_id ON public.transcriptions(asset_id);
CREATE INDEX idx_transcriptions_status ON public.transcriptions(status);
CREATE INDEX idx_transcriptions_user_status ON public.transcriptions(user_id, status);
CREATE INDEX idx_transcriptions_created_at ON public.transcriptions(created_at DESC);

-- Transcription history
CREATE INDEX idx_history_user_id ON public.transcription_history(user_id);
CREATE INDEX idx_history_transcription_id ON public.transcription_history(transcription_id);
CREATE INDEX idx_history_character_id ON public.transcription_history(character_id);
CREATE INDEX idx_history_user_created ON public.transcription_history(user_id, created_at DESC);

-- Credits ledger
CREATE INDEX idx_credits_user_id ON public.credits_ledger(user_id);
CREATE INDEX idx_credits_user_created ON public.credits_ledger(user_id, created_at DESC);
CREATE INDEX idx_credits_reference ON public.credits_ledger(reference_type, reference_id);

-- Subscriptions
CREATE INDEX idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON public.subscriptions(status);

-- Payments
CREATE INDEX idx_payments_user_id ON public.payments(user_id);
CREATE INDEX idx_payments_subscription_id ON public.payments(subscription_id);
CREATE INDEX idx_payments_status ON public.payments(status);

-- Notifications
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_read ON public.notifications(user_id, read);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);

-- Events
CREATE INDEX idx_transcription_events_transcription_id ON public.transcription_events(transcription_id);
CREATE INDEX idx_transcription_events_user_id ON public.transcription_events(user_id);
CREATE INDEX idx_transformation_events_history_id ON public.transformation_events(history_id);
CREATE INDEX idx_transformation_events_user_id ON public.transformation_events(user_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transcriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transcription_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credits_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transcription_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transformation_events ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Projects policies
CREATE POLICY "Users can view own projects"
  ON public.projects FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own projects"
  ON public.projects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects"
  ON public.projects FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects"
  ON public.projects FOR DELETE
  USING (auth.uid() = user_id);

-- Assets policies
CREATE POLICY "Users can view own assets"
  ON public.assets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own assets"
  ON public.assets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own assets"
  ON public.assets FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own assets"
  ON public.assets FOR DELETE
  USING (auth.uid() = user_id);

-- Characters policies
CREATE POLICY "Users can view own characters"
  ON public.characters FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own characters"
  ON public.characters FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own characters"
  ON public.characters FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own characters"
  ON public.characters FOR DELETE
  USING (auth.uid() = user_id);

-- Transcriptions policies
CREATE POLICY "Users can view own transcriptions"
  ON public.transcriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own transcriptions"
  ON public.transcriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own transcriptions"
  ON public.transcriptions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own transcriptions"
  ON public.transcriptions FOR DELETE
  USING (auth.uid() = user_id);

-- Transcription history policies
CREATE POLICY "Users can view own history"
  ON public.transcription_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own history"
  ON public.transcription_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own history"
  ON public.transcription_history FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own history"
  ON public.transcription_history FOR DELETE
  USING (auth.uid() = user_id);

-- Credits ledger policies
CREATE POLICY "Users can view own credits"
  ON public.credits_ledger FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own credits"
  ON public.credits_ledger FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Subscriptions policies
CREATE POLICY "Users can view own subscriptions"
  ON public.subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscriptions"
  ON public.subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subscriptions"
  ON public.subscriptions FOR UPDATE
  USING (auth.uid() = user_id);

-- Payments policies
CREATE POLICY "Users can view own payments"
  ON public.payments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own payments"
  ON public.payments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Notifications policies
CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notifications"
  ON public.notifications FOR DELETE
  USING (auth.uid() = user_id);

-- Events policies
CREATE POLICY "Users can view own transcription events"
  ON public.transcription_events FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own transformation events"
  ON public.transformation_events FOR SELECT
  USING (auth.uid() = user_id);

-- ============================================
-- TRIGGERS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_assets_updated_at
  BEFORE UPDATE ON public.assets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_characters_updated_at
  BEFORE UPDATE ON public.characters
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_transcriptions_updated_at
  BEFORE UPDATE ON public.transcriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_transcription_history_updated_at
  BEFORE UPDATE ON public.transcription_history
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger on auth.users to create profile
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Function to ensure only one default character per user
CREATE OR REPLACE FUNCTION public.ensure_single_default_character()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_default = true THEN
    UPDATE public.characters
    SET is_default = false
    WHERE user_id = NEW.user_id
      AND id != NEW.id
      AND is_default = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to maintain single default character
CREATE TRIGGER ensure_single_default_character_trigger
  BEFORE INSERT OR UPDATE ON public.characters
  FOR EACH ROW
  WHEN (NEW.is_default = true)
  EXECUTE FUNCTION public.ensure_single_default_character();