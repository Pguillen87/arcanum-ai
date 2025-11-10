-- Migration: Criar buckets de storage e políticas
-- Buckets privados para text, audio e video
begin;

-- Criar buckets (via RPC storage.create_bucket se disponível, ou manualmente via dashboard)
-- Nota: Em produção, criar buckets via Supabase Dashboard ou API
-- Esta migration documenta a estrutura esperada

-- Políticas de storage (owner-only)
-- Bucket: text
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'text',
  'text',
  false,
  2097152, -- 2MB
  ARRAY['text/plain', 'text/markdown', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
on conflict (id) do nothing;

-- Bucket: audio
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'audio',
  'audio',
  false,
  209715200, -- 200MB
  ARRAY['audio/mpeg', 'audio/wav', 'audio/m4a', 'audio/x-m4a', 'audio/mp4']
)
on conflict (id) do nothing;

-- Bucket: video
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'video',
  'video',
  false,
  2147483648, -- 2GB
  ARRAY['video/mp4', 'video/quicktime', 'video/x-msvideo']
)
on conflict (id) do nothing;

-- Políticas RLS para storage.objects
-- Permitir upload apenas para usuários autenticados (owner-only)
create policy "Users can upload to their own folders"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id IN ('text', 'audio', 'video') AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Permitir leitura apenas para o dono
create policy "Users can read their own files"
  on storage.objects for select
  to authenticated
  using (
    bucket_id IN ('text', 'audio', 'video') AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Permitir atualização apenas para o dono
create policy "Users can update their own files"
  on storage.objects for update
  to authenticated
  using (
    bucket_id IN ('text', 'audio', 'video') AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Permitir deleção apenas para o dono
create policy "Users can delete their own files"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id IN ('text', 'audio', 'video') AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

commit;

