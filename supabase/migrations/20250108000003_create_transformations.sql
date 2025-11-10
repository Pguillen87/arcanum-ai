-- Migration: Criar tabela transformations
-- Jobs de transformação de conteúdo (texto, vídeo)
begin;

-- Criar enum para tipo de transformação
create type public.transformation_type as enum ('post', 'resumo', 'newsletter', 'roteiro', 'video_short');

-- Criar enum para status de transformação
create type public.transformation_status as enum ('queued', 'processing', 'completed', 'failed');

-- Criar tabela transformations
create table if not exists public.transformations (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade not null,
  source_asset_id uuid references public.assets(id) on delete set null,
  user_id uuid references auth.users(id) on delete cascade not null,
  type public.transformation_type not null,
  params jsonb not null default '{}'::jsonb,
  outputs jsonb,
  status public.transformation_status default 'queued' not null,
  error text,
  cost_credits numeric(10, 2) default 0,
  idempotency_key text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  
  constraint transformations_cost_non_negative check (cost_credits >= 0)
);

-- Habilitar RLS
alter table public.transformations enable row level security;

-- Políticas RLS: owner-only
create policy transformations_select_owner
  on public.transformations for select
  to authenticated
  using (auth.uid() = user_id);

create policy transformations_insert_owner
  on public.transformations for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy transformations_update_owner
  on public.transformations for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy transformations_delete_owner
  on public.transformations for delete
  to authenticated
  using (auth.uid() = user_id);

-- Índices para performance
create index if not exists transformations_project_id_idx on public.transformations(project_id);
create index if not exists transformations_user_id_idx on public.transformations(user_id);
create index if not exists transformations_user_id_status_idx on public.transformations(user_id, status);
create index if not exists transformations_idempotency_key_idx on public.transformations(idempotency_key) where idempotency_key is not null;
create index if not exists transformations_source_asset_id_idx on public.transformations(source_asset_id) where source_asset_id is not null;

-- Índice GIN para busca em jsonb (params e outputs)
create index if not exists transformations_params_gin_idx on public.transformations using gin(params);
create index if not exists transformations_outputs_gin_idx on public.transformations using gin(outputs) where outputs is not null;

-- Trigger para atualizar updated_at
drop trigger if exists set_updated_at_transformations on public.transformations;
create trigger set_updated_at_transformations
  before update on public.transformations
  for each row
  execute function public.set_updated_at();

commit;

