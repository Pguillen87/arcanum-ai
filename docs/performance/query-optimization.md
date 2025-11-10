# Otimização de Consultas - Arcanum AI

## Análise de Índices

### Índices Existentes (Validados)

Todos os índices críticos estão implementados:

#### Tabelas Principais
- **projects**: `user_id`, `user_id + created_at DESC`
- **assets**: `user_id`, `project_id`, `type`, `user_id + status`
- **transformations**: `user_id`, `project_id`, `user_id + status`, `idempotency_key`, GIN em `params` e `outputs`
- **transcriptions**: `user_id`, `asset_id`, `user_id + status`, `job_id`
- **credit_transactions**: `user_id`, `user_id + created_at DESC`, `ref_type + ref_id`
- **payments**: `user_id`, `provider`, `status`, `provider + event_id` (único)
- **subscriptions**: `user_id`, `status`, `provider_subscription_id`

### Consultas Críticas Identificadas

1. **Listagem de projetos por usuário**
   - Índice: `projects_user_id_created_at_idx` ✅
   - Otimização: Ordenação por `created_at DESC` já indexada

2. **Busca de transformações por status**
   - Índice: `transformations_user_id_status_idx` ✅
   - Otimização: Filtro composto já indexado

3. **Busca em JSONB (params/outputs)**
   - Índices GIN: `transformations_params_gin_idx`, `transformations_outputs_gin_idx` ✅
   - Otimização: Busca eficiente em campos JSONB

4. **Idempotência de pagamentos**
   - Índice único: `payments_event_id_unique` ✅
   - Otimização: Previne duplicatas e acelera lookups

### Recomendações Futuras

1. **Monitorar consultas lentas** (> 100ms)
   - Usar `pg_stat_statements` extension
   - Analisar queries mais executadas

2. **Considerar particionamento** (se volume crescer)
   - `credit_transactions` por mês
   - `transformations` por status (completed vs active)

3. **Vacuum e Analyze** regular
   - Configurar autovacuum adequado
   - Executar ANALYZE após grandes inserções

## Métricas de Performance

### SLOs Definidos
- Transformação de texto: < 15s
- Transcrição (30min áudio): < 7min
- Preview de vídeo: < 10min

### Monitoramento
- Latência p50, p95, p99 por endpoint
- Taxa de timeout
- Throughput (req/s)

