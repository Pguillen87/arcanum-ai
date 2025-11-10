-- Migration: Optimize indexes for performance
-- Created: 2025-01-08
-- Description: Cria índices compostos para otimizar queries críticas identificadas na análise de performance

-- ============================================================================
-- ÍNDICES COMPOSTOS PARA PERFORMANCE
-- ============================================================================

-- Transformações: por usuário, status e data (para dashboard e filtros)
create index if not exists transformations_user_status_created_idx 
on public.transformations(user_id, status, created_at desc);

-- Transcrições: por usuário, status e data (para dashboard e filtros)
create index if not exists transcriptions_user_status_created_idx 
on public.transcriptions(user_id, status, created_at desc);

-- Assets: por projeto e tipo (para listagem filtrada)
create index if not exists assets_project_type_idx 
on public.assets(project_id, type);

-- Projects: por usuário e data (já existe, mas garantindo)
create index if not exists projects_user_created_idx 
on public.projects(user_id, created_at desc);

-- Notificações: por usuário e data (para ordenação)
create index if not exists notifications_user_created_idx 
on public.notifications(user_id, created_at desc);

-- Credit transactions: por usuário e tipo de referência (para consultas específicas)
create index if not exists credit_transactions_user_ref_idx 
on public.credit_transactions(user_id, ref_type, created_at desc);

-- ============================================================================
-- COMENTÁRIOS
-- ============================================================================

comment on index transformations_user_status_created_idx is 'Otimiza consultas de transformações filtradas por status e ordenadas por data';
comment on index transcriptions_user_status_created_idx is 'Otimiza consultas de transcrições filtradas por status e ordenadas por data';
comment on index assets_project_type_idx is 'Otimiza listagem de assets por tipo em um projeto';
comment on index projects_user_created_idx is 'Otimiza listagem de projetos ordenados por data';
comment on index notifications_user_created_idx is 'Otimiza listagem de notificações ordenadas por data';
comment on index credit_transactions_user_ref_idx is 'Otimiza consultas de transações por tipo de referência';

