-- Migration: Criar tabela projects
-- Agrupa assets e transformations logicamente por usuário
begin;

-- Criar enum para status (se necessário no futuro)
-- Por enquanto, projetos não têm status, apenas existem

-- Criar tabela projects
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  description text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  
  constraint projects_name_not_empty check (char_length(trim(name)) > 0)
);

-- Habilitar RLS
alter table public.projects enable row level security;

-- Políticas RLS: owner-only
create policy projects_select_owner
  on public.projects for select
  to authenticated
  using (auth.uid() = user_id);

create policy projects_insert_owner
  on public.projects for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy projects_update_owner
  on public.projects for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy projects_delete_owner
  on public.projects for delete
  to authenticated
  using (auth.uid() = user_id);

-- Índices para performance
create index if not exists projects_user_id_idx on public.projects(user_id);
create index if not exists projects_user_id_created_at_idx on public.projects(user_id, created_at desc);

-- Trigger para atualizar updated_at
drop trigger if exists set_updated_at_projects on public.projects;
create trigger set_updated_at_projects
  before update on public.projects
  for each row
  execute function public.set_updated_at();

commit;

