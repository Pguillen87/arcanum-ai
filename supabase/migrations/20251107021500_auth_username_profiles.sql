-- Migração incremental: username em profiles, funções de auth, triggers completas e view pública
begin;

-- Extensões auxiliares
create extension if not exists pgcrypto;
create extension if not exists "uuid-ossp";

-- Função genérica de atualização de timestamp
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Adicionar coluna username e constraint única (lowercase)
alter table public.profiles
  add column if not exists username text;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'profiles_username_unique'
  ) then
    alter table public.profiles add constraint profiles_username_unique unique (lower(username));
  end if;
end $$;

-- VIEW pública controlada (apenas campos seguros)
create or replace view public.public_profiles as
select username, avatar_url from public.profiles where username is not null;

-- Sugerir username único
create or replace function public.username_suggest(base_name text)
returns text
language plpgsql stable
as $$
declare suggestion text;
begin
  suggestion := lower(regexp_replace(coalesce(base_name,''), '[^a-zA-Z0-9._-]', '', 'g'));
  if suggestion is null or suggestion = '' then suggestion := 'user'; end if;
  if not exists (select 1 from public.profiles where lower(username)=lower(suggestion)) then
    return suggestion;
  end if;
  suggestion := suggestion || '-' || substr(md5(gen_random_uuid()::text), 1, 6);
  return suggestion;
end; $$;

-- Username disponível (RPC pública segura)
create or replace function public.auth_username_available(p_username text)
returns boolean
language sql stable security definer set search_path = public as $$
  select not exists(
    select 1 from public.profiles where lower(username)=lower(p_username)
  );
$$;

-- Username padrão derivado de meta/email (security definer)
create or replace function public.default_username(_id uuid)
returns text
language plpgsql stable security definer set search_path = public as $$
declare raw_meta jsonb; email text; base text;
begin
  select u.raw_user_meta_data, u.email into raw_meta, email from auth.users u where u.id = _id;
  base := coalesce(raw_meta->>'username', raw_meta->>'full_name', split_part(email, '@', 1), 'user');
  return public.username_suggest(base);
end; $$;

-- Trigger: criar perfil mínimo ao registrar
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, username, full_name, avatar_url)
  values (
    new.id,
    default_username(new.id),
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Triggers set_updated_at
drop trigger if exists set_updated_at_profiles on public.profiles;
create trigger set_updated_at_profiles
  before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_protection on public.protection_settings;
create trigger set_updated_at_protection
  before update on public.protection_settings
  for each row execute function public.set_updated_at();

-- Trigger: role padrão 'user' ao criar perfil
create or replace function public.handle_new_user_role()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.user_roles (user_id, role) values (new.id, 'user');
  return new;
end; $$;

drop trigger if exists on_profile_created_add_role on public.profiles;
create trigger on_profile_created_add_role
  after insert on public.profiles
  for each row execute procedure public.handle_new_user_role();

-- Trigger: configurações de proteção padrão ao criar perfil
create or replace function public.handle_new_user_protection_settings()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.protection_settings (user_id) values (new.id);
  return new;
end; $$;

drop trigger if exists on_profile_created_add_protection_settings on public.profiles;
create trigger on_profile_created_add_protection_settings
  after insert on public.profiles
  for each row execute procedure public.handle_new_user_protection_settings();

-- Ajuste RLS: owner-only (remover política ampla se existir)
do $$ begin
  if exists (select 1 from pg_policies where schemaname='public' and tablename='profiles' and policyname='Perfis são visíveis para todos usuários autenticados') then
    drop policy "Perfis são visíveis para todos usuários autenticados" on public.profiles;
  end if;
end $$;

create policy profiles_select_owner
  on public.profiles for select to authenticated using (auth.uid() = id);

create policy profiles_update_owner
  on public.profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

commit;

