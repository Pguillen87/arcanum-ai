-- Create storage buckets for audio, video, and assets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  (
    'audio-files',
    'audio-files',
    false,
    52428800, -- 50MB
    ARRAY['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/m4a', 'audio/ogg', 'audio/webm']
  ),
  (
    'video-files',
    'video-files',
    false,
    524288000, -- 500MB
    ARRAY['video/mp4', 'video/mpeg', 'video/webm', 'video/quicktime', 'video/x-msvideo']
  ),
  (
    'text-files',
    'text-files',
    false,
    10485760, -- 10MB
    ARRAY['text/plain', 'text/markdown', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
  );

-- RLS policies for audio-files bucket
CREATE POLICY "Users can upload own audio files"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'audio-files' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view own audio files"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'audio-files' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update own audio files"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'audio-files' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete own audio files"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'audio-files' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- RLS policies for video-files bucket
CREATE POLICY "Users can upload own video files"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'video-files' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view own video files"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'video-files' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update own video files"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'video-files' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete own video files"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'video-files' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- RLS policies for text-files bucket
CREATE POLICY "Users can upload own text files"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'text-files' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view own text files"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'text-files' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update own text files"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'text-files' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete own text files"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'text-files' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );