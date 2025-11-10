-- Migration: Data retention policies
-- Created: 2025-01-08
-- Description: Implementa políticas de retenção de dados conforme PRD

-- ============================================================================
-- FUNÇÕES DE RETENÇÃO
-- ============================================================================

-- Função: Limpar jobs falhados antigos (> 30 dias)
create or replace function public.cleanup_failed_jobs()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  deleted_count integer;
begin
  -- Limpar transformações falhadas antigas
  with deleted_transformations as (
    delete from public.transformations
    where status = 'failed'
      and created_at < now() - interval '30 days'
    returning id
  )
  select count(*) into deleted_count from deleted_transformations;
  
  -- Limpar transcrições falhadas antigas
  with deleted_transcriptions as (
    delete from public.transcriptions
    where status = 'failed'
      and created_at < now() - interval '30 days'
    returning id
  )
  select count(*) + deleted_count into deleted_count from deleted_transcriptions;
  
  return deleted_count;
end;
$$;

-- Função: Limpar notificações lidas antigas (> 90 dias)
create or replace function public.cleanup_read_notifications()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  deleted_count integer;
begin
  delete from public.notifications
  where read_at is not null
    and read_at < now() - interval '90 days';
  
  get diagnostics deleted_count = row_count;
  return deleted_count;
end;
$$;

-- Função: Limpar assets órfãos (sem referências em projetos ativos)
create or replace function public.cleanup_orphan_assets()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  deleted_count integer;
begin
  -- Assets sem projeto válido ou criados há mais de 90 dias sem referências
  delete from public.assets
  where (
    -- Asset sem projeto válido
    project_id not in (select id from public.projects)
    or
    -- Asset antigo sem referências em jobs ativos
    (
      created_at < now() - interval '90 days'
      and id not in (
        select distinct source_asset_id from public.transformations where source_asset_id is not null
        union
        select distinct asset_id from public.transcriptions
      )
    )
  );
  
  get diagnostics deleted_count = row_count;
  return deleted_count;
end;
$$;

-- Função: Limpeza geral (executa todas as limpezas)
create or replace function public.run_retention_cleanup()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  result jsonb;
  failed_jobs_count integer;
  notifications_count integer;
  orphan_assets_count integer;
begin
  -- Executar limpezas
  select cleanup_failed_jobs() into failed_jobs_count;
  select cleanup_read_notifications() into notifications_count;
  select cleanup_orphan_assets() into orphan_assets_count;
  
  -- Retornar resultado
  result := jsonb_build_object(
    'timestamp', now(),
    'failed_jobs_deleted', failed_jobs_count,
    'notifications_deleted', notifications_count,
    'orphan_assets_deleted', orphan_assets_count,
    'total_deleted', failed_jobs_count + notifications_count + orphan_assets_count
  );
  
  return result;
end;
$$;

-- ============================================================================
-- COMENTÁRIOS
-- ============================================================================

comment on function public.cleanup_failed_jobs() is 'Remove jobs falhados com mais de 30 dias';
comment on function public.cleanup_read_notifications() is 'Remove notificações lidas com mais de 90 dias';
comment on function public.cleanup_orphan_assets() is 'Remove assets órfãos (sem referências válidas)';
comment on function public.run_retention_cleanup() is 'Executa todas as limpezas de retenção e retorna estatísticas';

-- ============================================================================
-- NOTA: CRON JOB
-- ============================================================================
-- Para executar automaticamente, configurar cron job no Supabase:
-- pg_cron.schedule('retention-cleanup', '0 2 * * *', 'SELECT public.run_retention_cleanup();');
-- (Executa diariamente às 2h da manhã)

