-- Migration: create_worker_rate_limits
-- Created: 2025-11-11
-- Description: table to track per-user rate limits for trigger_whisper

CREATE TABLE IF NOT EXISTS public.worker_rate_limits (
  user_id uuid PRIMARY KEY,
  window_start timestamptz NOT NULL,
  request_count integer NOT NULL DEFAULT 0,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS worker_rate_limits_window_start_idx ON public.worker_rate_limits(window_start);
