-- Migration: Criar tabela transcriptions
-- Jobs de transcrição de áudio/vídeo usando Whisper
begin;

-- Criar enum para status de transcrição
create type public.transcription_status as enum ('queued', 'processing', 'completed', 'failed');

-- Criar tabela transcriptions
create table if not exists public.transcriptions (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid references public.assets(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  language text default 'pt' not null,
  status public.transcription_status default 'queued' not null,
  text text,
  error text,
  job_id uuid unique,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Habilitar RLS
alter table public.transcriptions enable row level security;

-- Políticas RLS: owner-only
create policy transcriptions_select_owner
  on public.transcriptions for select
  to authenticated
  using (auth.uid() = user_id);

create policy transcriptions_insert_owner
  on public.transcriptions for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy transcriptions_update_owner
  on public.transcriptions for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy transcriptions_delete_owner
  on public.transcriptions for delete
  to authenticated
  using (auth.uid() = user_id);

-- Índices para performance
create index if not exists transcriptions_asset_id_idx on public.transcriptions(asset_id);
create index if not exists transcriptions_user_id_idx on public.transcriptions(user_id);
create index if not exists transcriptions_user_id_status_idx on public.transcriptions(user_id, status);
create index if not exists transcriptions_job_id_idx on public.transcriptions(job_id);

-- Trigger para atualizar updated_at
drop trigger if exists set_updated_at_transcriptions on public.transcriptions;
create trigger set_updated_at_transcriptions
  before update on public.transcriptions
  for each row
  execute function public.set_updated_at();

commit;

