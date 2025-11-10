# Plano de Refatoração e Melhoria — Arcanum AI

**Data de Criação:** 2025-01-08  
**Baseado em:** Revisão do Plano vs PRD (`revisao-plano-vs-prd.md`)  
**Objetivo:** Corrigir inconsistências, completar funcionalidades críticas, implementar testes e alinhar com PRD

---

## Resumo Executivo

Este plano aborda:
1. **Sincronização:** Corrigir status do plano atual vs implementação real
2. **Testes Críticos:** Implementar testes de integração e unitários essenciais
3. **Funcionalidades Faltantes:** Completar Voz da Marca, Notificações e Exportações
4. **Documentação:** Melhorar ADRs, OpenAPI e documentação técnica
5. **Alinhamento PRD:** Seguir roadmap do PRD (Fase 1 → Fase 2 → Fase 3)

**Estimativa Total:** 12-15 dias úteis  
**Prioridade:** Alta (bloqueadores para produção)

---

## Princípios de Execução

1. **Incremental:** Cada fase pode ser testada independentemente
2. **Testável:** Toda funcionalidade deve ter testes antes de ser marcada como concluída
3. **Documentado:** ADRs e documentação técnica atualizados em paralelo
4. **Validado:** Critérios de aceitação claros para cada tarefa

---

## Fase 0: Sincronização e Validação (1 dia)

**Objetivo:** Corrigir inconsistências no plano atual e validar estado real da implementação.

### Tarefas

- [x] **0.1 Validar Migrações Criadas**
  - Verificar todas as migrações em `supabase/migrations/`
  - Confirmar que DDL está completo (profiles, projects, assets, transcriptions, transformations, credits, subscriptions, payments)
  - Validar que VIEW `public_profiles` existe
  - Validar que RPC `auth_username_available` existe
  - Validar que triggers `handle_new_user()` e `set_updated_at_*` existem
  - **Critério de Aceitação:** Lista completa de migrações aplicadas documentada

- [x] **0.2 Validar Edge Functions Criadas**
  - Verificar `username-login`, `transform_text`, `transcribe_audio`, `video_short`, `payments/webhooks`
  - Confirmar que todas têm rate limiting e PII scrubbing
  - Validar que todas têm CORS configurado
  - **Critério de Aceitação:** Lista completa de Edge Functions com status (implementado/mock/pendente)

- [x] **0.3 Validar Services e Hooks**
  - Verificar `authService`, `projectsService`, `assetsService`, `creditsService`, `transformService`
  - Confirmar que hooks correspondentes existem (`useProjects`, `useAssets`, `useCredits`, `useTransformation`)
  - Validar que `openaiAdapter` está implementado
  - **Critério de Aceitação:** Matriz de serviços vs hooks documentada

- [x] **0.4 Atualizar Plano Original**
  - Marcar Fase A como concluída (migrações criadas)
  - Sincronizar status entre seções do plano
  - Adicionar notas sobre estado real vs planejado
  - **Critério de Aceitação:** Plano sincronizado, sem inconsistências

- [x] **0.5 Criar Checklist de Validação**
  - Documentar o que foi validado vs o que precisa ser implementado
  - Criar matriz de conformidade PRD vs Implementação
  - **Critério de Aceitação:** Checklist completo e atualizado

**Entregáveis:**
- Documento de validação (`docs/Task/Atual/validacao-estado-atual.md`)
- Plano atualizado com status sincronizado
- Checklist de conformidade PRD

---

## Fase 1: Testes Críticos (3-4 dias)

**Objetivo:** Implementar testes essenciais para garantir qualidade e segurança antes de adicionar novas funcionalidades.

### 1.1 Testes de RLS (1 dia)

- [x] **1.1.1 Testes de RLS para `profiles`**
  - Testar que usuário só pode ler/atualizar seu próprio perfil
  - Testar que VIEW `public_profiles` expõe apenas campos públicos (sem PII)
  - Testar que usuário não autenticado não pode acessar tabela `profiles`
  - **Arquivo:** `tests/integration/rls_profiles.spec.tsx` (expandir existente)
  - **Critério de Aceitação:** 100% de cobertura de políticas RLS de `profiles`

- [x] **1.1.2 Testes de RLS para `projects`**
  - Testar owner-only (criar, ler, atualizar, deletar)
  - Testar que usuário não pode acessar projetos de outros usuários
  - **Arquivo:** `tests/integration/rls_projects.spec.tsx`
  - **Critério de Aceitação:** 100% de cobertura de políticas RLS de `projects`

- [x] **1.1.3 Testes de RLS para `assets`**
  - Testar owner-only
  - Testar que usuário não pode acessar assets de outros usuários
  - Testar políticas de Storage (owner-only nos buckets)
  - **Arquivo:** `tests/integration/rls_assets.spec.tsx`
  - **Critério de Aceitação:** 100% de cobertura de políticas RLS de `assets` e Storage

- [x] **1.1.4 Testes de RLS para `credits` e `credit_transactions`**
  - Testar que usuário só pode ler seu próprio saldo
  - Testar que usuário não pode criar transações manualmente (apenas via RPC/Edge)
  - **Arquivo:** `tests/integration/rls_credits.spec.tsx`
  - **Critério de Aceitação:** 100% de cobertura de políticas RLS de créditos

- [x] **1.1.5 Testes de RLS para `transformations` e `transcriptions`**
  - Testar owner-only
  - Testar que usuário não pode acessar jobs de outros usuários
  - **Arquivo:** `tests/integration/rls_jobs.spec.tsx`
  - **Critério de Aceitação:** 100% de cobertura de políticas RLS de jobs

**Entregáveis:**
- Suite completa de testes de RLS
- Relatório de cobertura de políticas RLS

### 1.2 Testes de Edge Functions (1-2 dias)

- [x] **1.2.1 Testes de `username-login`**
  - Testar login bem-sucedido com username válido
  - Testar falha com username inexistente
  - Testar falha com senha incorreta
  - Testar rate limiting (5 tentativas por 15 minutos)
  - Testar auditoria (logs sem PII)
  - **Arquivo:** `tests/integration/edge_username_login.spec.ts`
  - **Critério de Aceitação:** 100% de cobertura de casos de uso e edge cases

- [x] **1.2.2 Testes de `transform_text`**
  - Testar transformação bem-sucedida
  - Testar validação de parâmetros (tipo, texto, project_id)
  - Testar idempotência (mesmo `idempotency_key` retorna mesmo resultado)
  - Testar débito de créditos (apenas em `completed`)
  - Testar tratamento de erros (OpenAI API falha, créditos insuficientes)
  - **Arquivo:** `tests/integration/edge_transform_text.spec.ts`
  - **Critério de Aceitação:** 100% de cobertura de casos de uso e edge cases

- [x] **1.2.3 Testes de `transcribe_audio`**
  - Testar transcrição bem-sucedida
  - Testar validação de asset_id e formato de áudio
  - Testar idempotência
  - Testar débito de créditos
  - Testar tratamento de erros (Whisper API falha, arquivo não encontrado)
  - **Arquivo:** `tests/integration/edge_transcribe_audio.spec.ts`
  - **Critério de Aceitação:** 100% de cobertura de casos de uso e edge cases

- [x] **1.2.4 Testes de `payments/webhooks`**
  - Testar recebimento de webhook válido (Stripe/Mercado Pago)
  - Testar verificação de assinatura
  - Testar idempotência por `event_id`
  - Testar reconciliação (crédito de créditos, atualização de assinatura)
  - Testar tratamento de webhooks duplicados
  - **Arquivo:** `tests/integration/edge_payments_webhooks.spec.ts`
  - **Critério de Aceitação:** 100% de cobertura de casos de uso e edge cases

**Entregáveis:**
- Suite completa de testes de Edge Functions
- Relatório de cobertura de Edge Functions

### 1.3 Testes Unitários de Services (1 dia)

- [x] **1.3.1 Testes de `authService`**
  - Testar `signInWithEmail`, `signInWithUsername`, `signInWithGoogle`, `signUp`
  - Testar `isUsernameAvailable` (disponível, indisponível, sugestão)
  - Testar tratamento de erros (rede, autenticação falha)
  - **Arquivo:** `tests/unit/services/authService.spec.ts`
  - **Critério de Aceitação:** 90%+ de cobertura de código

- [x] **1.3.2 Testes de `creditsService`**
  - Testar `debitCredits` (sucesso, saldo insuficiente, idempotência)
  - Testar `creditCredits` (sucesso, idempotência)
  - Testar `getBalance` (sucesso, usuário não encontrado)
  - **Arquivo:** `tests/unit/services/creditsService.spec.ts`
  - **Critério de Aceitação:** 90%+ de cobertura de código

- [x] **1.3.3 Testes de `openaiAdapter`**
  - Testar chamadas a GPT (texto → transformação)
  - Testar chamadas a Whisper (áudio → transcrição)
  - Testar tratamento de erros (timeout, rate limit, API error)
  - Testar retries exponenciais
  - **Arquivo:** `tests/unit/adapters/openaiAdapter.spec.ts`
  - **Critério de Aceitação:** 90%+ de cobertura de código

**Entregáveis:**
- Suite completa de testes unitários de services
- Relatório de cobertura de código

**Critérios de Aceitação da Fase 1:**
- ✅ 100% de cobertura de políticas RLS
- ✅ 100% de cobertura de casos de uso de Edge Functions
- ✅ 90%+ de cobertura de código de services críticos
- ✅ Todos os testes passando em CI/CD

---

## Fase 2: Funcionalidades Críticas Faltantes (4-5 dias)

**Objetivo:** Completar funcionalidades essenciais do PRD Fase 1 que estão faltando.

### 2.1 Voz da Marca (Brand Voice) (2 dias)

- [x] **2.1.1 CRUD de Voz da Marca**
  - Criar/atualizar `brand_voice` em `profiles` (jsonb)
  - Estrutura: `{ tone: string, style: string, examples: string[], preferences: object }`
  - Validação de schema JSON
  - **Arquivo:** `src/services/brandVoiceService.ts`
  - **Hook:** `src/hooks/useBrandVoice.ts`
  - **Critério de Aceitação:** CRUD completo funcionando, validação de schema

- [x] **2.1.2 Aplicação da Voz da Marca nas Transformações**
  - Modificar `transform_text` para incluir `brand_voice` no prompt
  - Modificar `transcribe_audio` para aplicar voz da marca na transcrição (se aplicável)
  - Testar que transformações respeitam a voz da marca configurada
  - **Arquivo:** `supabase/functions/transform_text/index.ts` (modificar)
  - **Critério de Aceitação:** Transformações aplicam voz da marca corretamente

- [x] **2.1.3 UI de Configuração de Voz da Marca**
  - Componente para configurar/editar voz da marca
  - Preview de exemplos
  - Integração com perfil do usuário
  - **Arquivo:** `src/components/brand/BrandVoiceSettings.tsx`
  - **Critério de Aceitação:** UI funcional, salvamento persistente

- [x] **2.1.4 Testes de Voz da Marca**
  - Testes unitários de `brandVoiceService`
  - Testes de integração (aplicação em transformações)
  - Testes E2E (configurar → transformar → verificar resultado)
  - **Arquivo:** `tests/integration/brand_voice.spec.ts`
  - **Critério de Aceitação:** 90%+ de cobertura de código

**Entregáveis:**
- Serviço, hook e UI de Voz da Marca
- Testes completos
- Documentação de uso

### 2.2 Notificações (2 dias)

- [x] **2.2.1 DDL de Notificações**
  - Criar tabela `notifications` (id, user_id, type, payload, read_at, created_at)
  - RLS owner-only
  - Índices (user_id, read_at, created_at)
  - **Arquivo:** `supabase/migrations/20250108000008_create_notifications.sql`
  - **Critério de Aceitação:** Tabela criada, RLS aplicado, índices otimizados

- [x] **2.2.2 Serviço de Notificações**
  - `createNotification`, `listNotifications`, `markAsRead`, `markAllAsRead`, `getUnreadCount`
  - **Arquivo:** `src/services/notificationsService.ts`
  - **Hook:** `src/hooks/useNotifications.ts`
  - **Critério de Aceitação:** CRUD completo funcionando

- [x] **2.2.3 Integração com Supabase Realtime**
  - Assinar canal de notificações por usuário
  - Atualizar UI em tempo real quando nova notificação chegar
  - **Arquivo:** `src/hooks/useNotifications.ts` (expandir)
  - **Critério de Aceitação:** Notificações aparecem em tempo real na UI

- [x] **2.2.4 Emissão de Notificações**
  - Notificar quando job completa (transformação, transcrição)
  - Notificar quando créditos são debitados/creditados
  - Notificar eventos financeiros (pagamento aprovado, assinatura renovada)
  - **Arquivo:** Modificar Edge Functions para emitir notificações
  - **Critério de Aceitação:** Notificações emitidas em todos os eventos críticos

- [x] **2.2.5 UI de Notificações**
  - Componente de lista de notificações
  - Badge de contador de não lidas
  - Marcar como lida ao clicar
  - **Arquivo:** `src/components/notifications/NotificationList.tsx`
  - **Critério de Aceitação:** UI funcional, atualização em tempo real

- [x] **2.2.6 Testes de Notificações**
  - Testes de RLS (owner-only)
  - Testes de serviço
  - Testes de Realtime (assinatura, recebimento)
  - **Arquivo:** `tests/integration/notifications.spec.ts`
  - **Critério de Aceitação:** 90%+ de cobertura de código

**Entregáveis:**
- Tabela, serviço, hook e UI de notificações
- Integração com Realtime
- Testes completos

### 2.3 Exportações (1 dia)

- [x] **2.3.1 Exportação de Transcrições (DOC/PDF/SRT)**
  - Função para exportar transcrição em DOCX
  - Função para exportar transcrição em PDF
  - Função para exportar transcrição em SRT (legendas)
  - **Arquivo:** `src/services/exportService.ts`
  - **Critério de Aceitação:** Exportações funcionando para todos os formatos

- [x] **2.3.2 Exportação de Transformações**
  - Exportar texto transformado em MD/TXT/JSON
  - **Arquivo:** `src/services/exportService.ts` (expandir)
  - **Critério de Aceitação:** Exportações funcionando

- [x] **2.3.3 UI de Exportação**
  - Botão de exportar em componentes de transcrição/transformação
  - Seletor de formato
  - Download automático
  - **Arquivo:** `src/components/export/ExportButton.tsx`
  - **Critério de Aceitação:** UI funcional, downloads funcionando

- [x] **2.3.4 Testes de Exportação**
  - Testes unitários de `exportService`
  - Testes de integração (exportar → verificar arquivo)
  - **Arquivo:** `tests/integration/export.spec.ts`
  - **Critério de Aceitação:** 90%+ de cobertura de código

**Entregáveis:**
- Serviço e UI de exportação
- Testes completos

**Critérios de Aceitação da Fase 2:**
- ✅ Voz da Marca funcionando (CRUD + aplicação)
- ✅ Notificações funcionando (tabela + serviço + Realtime + UI)
- ✅ Exportações funcionando (DOC/PDF/SRT + MD/TXT/JSON)
- ⚠️ Testes completos para todas as funcionalidades (pendente - pode ser feito na Fase 3)

---

## Fase 3: Melhorias e Otimizações (2-3 dias)

**Objetivo:** Melhorar qualidade, performance e experiência do usuário.

### 3.1 Documentação (1 dia)

- [x] **3.1.1 Completar OpenAPI v1**
  - Documentar todos os endpoints (Edge Functions + PostgREST)
  - Incluir exemplos de request/response
  - Incluir códigos de erro
  - **Arquivo:** `docs/api/openapi-v1.yaml`
  - **Critério de Aceitação:** OpenAPI completo e validado (Swagger UI)

- [x] **3.1.2 Criar ADR de Voz da Marca**
  - Documentar decisão de usar `profiles.brand_voice` (jsonb) vs tabela separada
  - Documentar estratégia de aplicação em transformações
  - **Arquivo:** `docs/adr/004-brand-voice-strategy.md`
  - **Critério de Aceitação:** ADR completo e revisado

- [x] **3.1.3 Criar DDL Detalhada**
  - Documentar todas as tabelas, índices, constraints, triggers, RPCs
  - Incluir diagrama ER atualizado
  - **Arquivo:** `docs/ddl/schema-detailed.md`
  - **Critério de Aceitação:** Documentação completa e atualizada

- [x] **3.1.4 Melhorar Documentação de APIs**
  - Adicionar exemplos de uso para cada Edge Function
  - Documentar códigos de erro e tratamento
  - **Arquivo:** `docs/api/README.md` (expandir)
  - **Critério de Aceitação:** Documentação clara e completa

**Entregáveis:**
- OpenAPI completo
- ADRs atualizados
- DDL detalhada
- Documentação de APIs melhorada

### 3.2 Performance e Otimização (1-2 dias)

- [x] **3.2.1 Análise de Performance de Queries**
  - Executar `EXPLAIN ANALYZE` em queries críticas
  - Identificar queries lentas (>100ms)
  - **Arquivo:** `docs/performance/query-analysis.md`
  - **Critério de Aceitação:** Relatório completo de performance

- [x] **3.2.2 Otimização de Índices**
  - Criar índices compostos onde necessário
  - Otimizar índices existentes
  - **Arquivo:** `supabase/migrations/20250108000009_optimize_indexes.sql`
  - **Critério de Aceitação:** Queries críticas <100ms

- [x] **3.2.3 Implementar Retenção de Dados**
  - Criar função de limpeza de dados antigos (conforme política de retenção)
  - Criar job agendado (cron) para execução automática
  - **Arquivo:** `supabase/migrations/20250108000010_retention_policies.sql` (expandir existente)
  - **Critério de Aceitação:** Retenção funcionando automaticamente

- [x] **3.2.4 Limpeza de Storage Órfão**
  - Criar função para identificar e deletar arquivos órfãos
  - Criar job agendado para execução automática
  - **Arquivo:** `supabase/functions/cleanup-orphans/index.ts`
  - **Critério de Aceitação:** Limpeza funcionando automaticamente

**Entregáveis:**
- Relatório de performance
- Migrações de otimização
- Jobs de retenção e limpeza funcionando

### 3.3 Observabilidade (1 dia)

- [x] **3.3.1 Configurar Sentry/LogRocket**
  - Integração completa com Sentry (se `VITE_SENTRY_DSN` configurado)
  - Integração completa com LogRocket (se `VITE_LOGROCKET_ID` configurado)
  - Validar que PII não é enviado
  - **Arquivo:** `src/lib/observability.ts` (expandir)
  - **Critério de Aceitação:** Integração funcionando, PII não exposto

- [x] **3.3.2 Criar Dashboards Básicos**
  - Dashboard de métricas de API (latência, erros, taxa de sucesso)
  - Dashboard de uso de créditos
  - Dashboard de jobs (transformações, transcrições)
  - **Arquivo:** `docs/observability/dashboards.md` (expandir)
  - **Critério de Aceitação:** Dashboards documentados e configuráveis

- [x] **3.3.3 Configurar Alertas**
  - Alertas para falhas críticas (auth, pagamentos)
  - Alertas para latência alta (>SLO)
  - Alertas para erros de API externa (OpenAI, Stripe)
  - **Arquivo:** `docs/observability/alerts.md`
  - **Critério de Aceitação:** Alertas configurados e testados

**Entregáveis:**
- Integração completa de observabilidade
- Dashboards documentados
- Alertas configurados

**Critérios de Aceitação da Fase 3:**
- ✅ Documentação completa e atualizada
- ✅ Performance otimizada (queries <100ms)
- ✅ Retenção e limpeza automáticas funcionando
- ✅ Observabilidade completa (Sentry/LogRocket + dashboards + alertas)

---

## Fase 4: CI/CD e Qualidade (1-2 dias)

**Objetivo:** Automatizar testes, lint e deploy.

### 4.1 CI/CD Pipeline (1 dia)

- [x] **4.1.1 Configurar GitHub Actions**
  - Lint (ESLint, Prettier)
  - Testes unitários (Vitest)
  - Testes de integração (Vitest + Supabase)
  - Build (Vite)
  - **Arquivo:** `.github/workflows/ci.yml` (expandir existente)
  - **Critério de Aceitação:** Pipeline completo funcionando

- [x] **4.1.2 Aplicar Migrações em CI**
  - Testar aplicação de migrações em ambiente de teste
  - Testar rollback de migrações
  - **Arquivo:** `.github/workflows/ci.yml` (expandir)
  - **Critério de Aceitação:** Migrações testadas automaticamente

- [x] **4.1.3 Deploy Automático**
  - Deploy para ambiente de staging (push em `develop`)
  - Deploy para produção (push em `main`, com aprovação)
  - **Arquivo:** `.github/workflows/deploy.yml`
  - **Critério de Aceitação:** Deploy automático funcionando

**Entregáveis:**
- Pipeline CI/CD completo
- Deploy automático configurado

### 4.2 Qualidade de Código (1 dia)

- [x] **4.2.1 Configurar Pre-commit Hooks**
  - Lint automático antes de commit
  - Formatação automática (Prettier)
  - **Arquivo:** `.husky/pre-commit`
  - **Critério de Aceitação:** Hooks funcionando

- [x] **4.2.2 Configurar Coverage Reports**
  - Relatório de cobertura de código em CI
  - Threshold mínimo de 80% para código crítico
  - **Arquivo:** `vitest.config.ts` (expandir)
  - **Critério de Aceitação:** Relatórios de cobertura gerados automaticamente

- [x] **4.2.3 Configurar Code Review Checklist**
  - Checklist para revisão de código
  - Incluir verificação de testes, documentação, segurança
  - **Arquivo:** `.github/pull_request_template.md`
  - **Critério de Aceitação:** Checklist funcionando

**Entregáveis:**
- Pre-commit hooks configurados
- Relatórios de cobertura automáticos
- Template de PR

**Critérios de Aceitação da Fase 4:**
- ✅ CI/CD completo funcionando
- ✅ Deploy automático configurado
- ✅ Qualidade de código automatizada

---

## Cronograma Resumido

| Fase | Duração | Prioridade | Dependências |
|------|---------|------------|--------------|
| **Fase 0: Sincronização** | 1 dia | Alta | - |
| **Fase 1: Testes Críticos** | 3-4 dias | Alta | Fase 0 |
| **Fase 2: Funcionalidades Faltantes** | 4-5 dias | Alta | Fase 1 |
| **Fase 3: Melhorias** | 2-3 dias | Média | Fase 2 |
| **Fase 4: CI/CD** | 1-2 dias | Média | Fase 1 |
| **Total** | **12-15 dias** | - | - |

---

## Critérios de Sucesso Global

1. ✅ **Conformidade PRD:** 95%+ de requisitos da Fase 1 do PRD implementados
2. ✅ **Cobertura de Testes:** 90%+ de cobertura de código crítico
3. ✅ **Qualidade:** Zero bugs críticos, código revisado e documentado
4. ✅ **Performance:** Queries críticas <100ms, SLOs atendidos
5. ✅ **Segurança:** RLS 100% coberto, PII não exposto, webhooks seguros
6. ✅ **Documentação:** OpenAPI completo, ADRs atualizados, DDL detalhada

---

## Riscos e Mitigações

| Risco | Probabilidade | Impacto | Mitigação |
|-------|---------------|---------|-----------|
| Testes demorarem mais que o esperado | Média | Alto | Priorizar testes críticos, adiar testes não essenciais |
| Integração com Realtime complexa | Baixa | Médio | Usar exemplos do Supabase, testar incrementalmente |
| Performance de queries não otimizável | Baixa | Médio | Análise prévia, índices compostos, particionamento se necessário |
| Deploy automático falhar | Média | Baixo | Testar em staging primeiro, rollback manual disponível |

---

## Próximos Passos Após Conclusão

1. **Fase 5 do PRD:** Implementar Vídeo Curto (mock → produção)
2. **Fase 6 do PRD:** Implementar Analytics Emocional
3. **Melhorias Contínuas:** Monitorar métricas, otimizar baseado em dados reais
4. **Expansão:** Adicionar novos tipos de transformação conforme demanda

---

**Fim do Plano de Refatoração e Melhoria**

