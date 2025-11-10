-- Migration: Criar tabela assets
-- Armazena metadados de arquivos de mídia (texto, áudio, vídeo)
begin;

-- Criar enum para tipo de asset
create type public.asset_type as enum ('text', 'audio', 'video');

-- Criar enum para status de asset
create type public.asset_status as enum ('uploading', 'processing', 'ready', 'failed');

-- Criar tabela assets
create table if not exists public.assets (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  storage_path text not null,
  type public.asset_type not null,
  size_bytes bigint not null,
  duration_seconds numeric(10, 2),
  mimetype text,
  status public.asset_status default 'uploading' not null,
  created_at timestamptz default now() not null,
  
  constraint assets_size_positive check (size_bytes > 0),
  constraint assets_duration_positive check (duration_seconds is null or duration_seconds >= 0)
);

-- Habilitar RLS
alter table public.assets enable row level security;

-- Políticas RLS: owner-only
create policy assets_select_owner
  on public.assets for select
  to authenticated
  using (auth.uid() = user_id);

create policy assets_insert_owner
  on public.assets for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy assets_update_owner
  on public.assets for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy assets_delete_owner
  on public.assets for delete
  to authenticated
  using (auth.uid() = user_id);

-- Índices para performance
create index if not exists assets_project_id_idx on public.assets(project_id);
create index if not exists assets_user_id_idx on public.assets(user_id);
create index if not exists assets_user_id_status_idx on public.assets(user_id, status);
create index if not exists assets_type_idx on public.assets(type);

commit;

