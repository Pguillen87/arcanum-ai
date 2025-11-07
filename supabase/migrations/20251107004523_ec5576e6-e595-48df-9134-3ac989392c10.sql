-- Criar tabela de perfis com dados do Google
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Habilitar RLS
alter table public.profiles enable row level security;

-- Políticas RLS: usuários podem ler todos os perfis mas só atualizar o próprio
create policy "Perfis são visíveis para todos usuários autenticados"
  on public.profiles for select
  to authenticated
  using (true);

create policy "Usuários podem atualizar apenas seu próprio perfil"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Trigger para criar perfil automaticamente ao registrar
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Trigger para atualizar updated_at
create trigger set_updated_at_profiles
  before update on public.profiles
  for each row
  execute function public.set_updated_at();

-- Criar enum para roles
create type public.app_role as enum ('admin', 'moderator', 'user');

-- Criar tabela de roles (separada para segurança)
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null default 'user',
  created_at timestamptz default now(),
  unique (user_id, role)
);

-- Habilitar RLS
alter table public.user_roles enable row level security;

-- Função security definer para verificar roles (evita recursão)
create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = _user_id and role = _role
  )
$$;

-- Política RLS: usuários podem ver suas próprias roles
create policy "Usuários podem ver suas próprias roles"
  on public.user_roles for select
  to authenticated
  using (auth.uid() = user_id);

-- Trigger para criar role padrão 'user' ao criar perfil
create or replace function public.handle_new_user_role()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.user_roles (user_id, role)
  values (new.id, 'user');
  return new;
end;
$$;

create trigger on_profile_created_add_role
  after insert on public.profiles
  for each row execute procedure public.handle_new_user_role();

-- Criar tabela de configurações de proteção
create table public.protection_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null unique,
  auto_moderation boolean default true,
  offensive_filter boolean default true,
  brand_verification boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Habilitar RLS
alter table public.protection_settings enable row level security;

-- Políticas RLS
create policy "Usuários podem ver apenas suas próprias configurações"
  on public.protection_settings for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Usuários podem atualizar apenas suas próprias configurações"
  on public.protection_settings for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Usuários podem inserir apenas suas próprias configurações"
  on public.protection_settings for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Trigger para atualizar updated_at
create trigger set_updated_at_protection
  before update on public.protection_settings
  for each row
  execute function public.set_updated_at();

-- Trigger para criar configurações padrão ao criar perfil
create or replace function public.handle_new_user_protection_settings()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.protection_settings (user_id)
  values (new.id);
  return new;
end;
$$;

create trigger on_profile_created_add_protection_settings
  after insert on public.profiles
  for each row execute procedure public.handle_new_user_protection_settings();