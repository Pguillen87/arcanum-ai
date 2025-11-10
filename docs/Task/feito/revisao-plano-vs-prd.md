# Revisão do Plano Implementado vs PRD — Arcanum AI

**Data da Revisão:** 2025-01-08  
**Revisor:** Agente Arcanum AI  
**Status:** Análise Comparativa Completa

---

## Resumo Executivo

Este documento compara o plano de implementação (`plano_backend_arcanum_ai.md`) com os requisitos do PRD (`PRD — Arcanum AI.txt`) para identificar:
- ✅ Conformidade com requisitos do PRD
- ⚠️ Lacunas ou inconsistências
- 📋 Itens marcados como concluídos que precisam validação
- 🔄 Alinhamento com princípios de testabilidade do PRD

---

## 1. Conformidade com Requisitos do PRD

### 1.1 Escopo Funcional (PRD Seção 3)

| Requisito PRD | Status no Plano | Observações |
|--------------|-----------------|-------------|
| **Upload & Ingestão** | ✅ Implementado | Buckets criados, `FileUpload` component, `assetsService` |
| **Transcrição (Whisper)** | ⚠️ Parcial | Edge Function `transcribe_audio` criada, mas testes pendentes |
| **Transformação de Texto** | ✅ Implementado | `transform_text` Edge Function, `TransformTextPortal` UI, `openaiAdapter` |
| **Vídeos Curtos** | ⚠️ Mock | Edge Function `video_short` com mock inicial |
| **Voz da Marca** | ❌ Não Implementado | Campo `brand_voice` mencionado no DDL, mas CRUD não implementado |
| **Créditos & Assinaturas** | ✅ Estrutura Criada | `credits`, `credit_transactions`, `subscriptions` tables; serviços criados |
| **Notificações** | ❌ Não Implementado | Tabela não criada, serviço não implementado |

### 1.2 Modelo de Dados (PRD Seção 7)

| Entidade PRD | Status no Plano | Observações |
|--------------|-----------------|-------------|
| `users` (auth) | ✅ Via Supabase Auth | Integrado |
| `profiles` | ✅ Implementado | Com `username`, `brand_voice` (jsonb), triggers |
| `projects` | ✅ Implementado | DDL criado, service e hook implementados |
| `assets` | ✅ Implementado | DDL criado, service e hook implementados |
| `transcriptions` | ✅ DDL Criado | Tabela criada, Edge Function criada, testes pendentes |
| `transformations` | ✅ Implementado | DDL criado, Edge Function implementada |
| `credits` | ✅ Implementado | DDL criado, triggers de ledger implementados |
| `credit_transactions` | ✅ Implementado | DDL criado, triggers funcionando |
| `subscriptions` | ✅ DDL Criado | Tabela criada, serviço criado, integração pendente |
| `usage_limits` | ❌ Não Implementado | Não mencionado no plano |
| `payments` | ✅ DDL Criado | Tabela criada, Edge Function webhook criada, integração pendente |
| `notifications` | ❌ Não Implementado | Não mencionado no plano |

### 1.3 APIs Essenciais (PRD Seção 8)

| Endpoint PRD | Status no Plano | Observações |
|--------------|-----------------|-------------|
| `POST /api/upload` | ✅ Via Supabase Storage | Upload direto implementado |
| `GET /api/assets/:id` | ✅ Implementado | Via `assetsService.getAsset()` |
| `POST /api/transcriptions` | ✅ Edge Function Criada | `transcribe_audio` implementada |
| `GET/PUT /api/transcriptions/:jobId` | ⚠️ Parcial | Consulta via PostgREST, atualização pendente |
| `POST /api/transform/text` | ✅ Implementado | `transform_text` Edge Function |
| `GET /api/transform/text/:jobId` | ⚠️ Parcial | Consulta via PostgREST |
| `POST /api/transform/video` | ⚠️ Mock | `video_short` Edge Function com mock |
| `GET /api/transform/video/:jobId` | ⚠️ Parcial | Consulta via PostgREST |
| `POST/GET /api/brand-profiles` | ❌ Não Implementado | CRUD não implementado |
| `POST/GET /api/projects` | ✅ Implementado | Via `projectsService` |
| `GET /api/credits` | ✅ Implementado | Via `creditsService` |
| `POST /api/credits/purchase` | ❌ Não Implementado | RPC `purchase_credits` não criada |
| `POST /api/payments/webhooks` | ✅ Edge Function Criada | `payments/webhooks` implementada |

### 1.4 Segurança e Privacidade (PRD Seção 10)

| Requisito PRD | Status no Plano | Observações |
|--------------|-----------------|-------------|
| **RLS owner-only** | ✅ Implementado | Políticas RLS aplicadas em todas as tabelas |
| **Criptografia em trânsito** | ✅ Via Supabase | HTTPS obrigatório |
| **Sanitização inputs** | ✅ Implementado | DOMPurify no frontend |
| **Logs auditáveis** | ✅ Implementado | `audit_log` em Edge Functions, PII scrubbing |
| **Webhooks idempotentes** | ✅ Implementado | `event_id` único, verificação de assinatura planejada |
| **LGPD/GDPR** | ⚠️ Parcial | Estrutura de retenção criada, mas processos de exportação/exclusão não implementados |

---

## 2. Alinhamento com Princípios de Testabilidade (PRD Seção 19)

### 2.1 Divisão Incremental (PRD 19.1)

✅ **Conforme**: O plano divide implementações em fases (A-H) e módulos incrementais.

**Exemplo Positivo:**
- Upload & Ingestão: UI básica → progresso → metadados → validações ✅
- Transformação de Texto: construtor de prompt → preview → ajustes → exportação ✅

**Exemplo Negativo:**
- Vídeos Curtos: mock inicial criado, mas etapas incrementais não detalhadas ⚠️

### 2.2 Estratégias de Teste (PRD 19.2)

✅ **Conforme**: O plano inclui estratégias de teste unitário e integração por módulo.

**Status:**
- ✅ Testes unitários planejados para cada módulo
- ✅ Testes de integração planejados (RLS, Edge + DB, webhooks)
- ⚠️ Testes e2e mencionados, mas não detalhados
- ❌ Testes de carga (k6) mencionados, mas não implementados

### 2.3 Código Testável (PRD 19.3)

✅ **Conforme**: O plano define camadas isoladas (services/adapters + hooks).

**Implementação:**
- ✅ `authService`, `projectsService`, `assetsService`, `creditsService` criados
- ✅ `openaiAdapter` criado (isolado, testável)
- ✅ Hooks (`useProjects`, `useAssets`, `useCredits`, `useTransformation`) criados
- ⚠️ `stripeAdapter`/`mpAdapter` não criados (pendentes)
- ⚠️ `emailAdapter` não criado (pendente)

### 2.4 Edge Cases (PRD 19.4)

✅ **Conforme**: O plano considera edge cases.

**Cobertura:**
- ✅ Upload: validações de tamanho/formato, tratamento de erros de rede
- ✅ Pagamentos: idempotência por `event_id`, reconciliação planejada
- ✅ Auth: rate limiting, auditoria, tratamento de token expirado
- ⚠️ PWA offline: mencionado, mas fallback não detalhado
- ⚠️ Performance: modo reduzido de movimento mencionado, mas não implementado

### 2.5 Testes Específicos (PRD 19.5)

✅ **Conforme**: O plano identifica partes que merecem testes específicos.

**Identificados:**
- ✅ Ledger (justiça): testes de idempotência e não permitir saldo negativo
- ✅ RLS (privacidade): testes owner-only planejados
- ✅ Idempotência (duplicidades): `event_id` único implementado
- ⚠️ Pipeline de jobs (confiabilidade): testes de estados FSM mencionados, mas não implementados
- ⚠️ Storage policies (owner-only): testes mencionados, mas não implementados

---

## 3. Validação de Itens Marcados como Concluídos

### 3.1 Itens Validados ✅

| Item | Arquivo/Evidência | Status |
|------|------------------|--------|
| `transform_text` Edge Function | `supabase/functions/transform_text/index.ts` | ✅ Implementado |
| `username-login` Edge Function | `supabase/functions/username-login/index.ts` | ✅ Implementado |
| `transcribe_audio` Edge Function | `supabase/functions/transcribe_audio/index.ts` | ✅ Criado |
| `video_short` Edge Function | `supabase/functions/video_short/index.ts` | ✅ Mock Criado |
| `payments/webhooks` Edge Function | `supabase/functions/payments/webhooks/index.ts` | ✅ Criado |
| DDL `projects` | `supabase/migrations/20250108000000_create_projects.sql` | ✅ Criado |
| DDL `assets` | `supabase/migrations/20250108000001_create_assets.sql` | ✅ Criado |
| DDL `transcriptions` | `supabase/migrations/20250108000002_create_transcriptions.sql` | ✅ Criado |
| DDL `transformations` | `supabase/migrations/20250108000003_create_transformations.sql` | ✅ Criado |
| DDL `credits` | `supabase/migrations/20250108000004_create_credits_ledger.sql` | ✅ Criado |
| DDL Storage Buckets | `supabase/migrations/20250108000005_create_storage_buckets.sql` | ✅ Criado |
| DDL `subscriptions`/`payments` | `supabase/migrations/20250108000006_create_subscriptions_and_payments.sql` | ✅ Criado |
| `projectsService` | `src/services/projectsService.ts` | ✅ Implementado |
| `assetsService` | `src/services/assetsService.ts` | ✅ Implementado |
| `creditsService` | `src/services/creditsService.ts` | ✅ Implementado |
| `openaiAdapter` | `src/adapters/openaiAdapter.ts` | ✅ Implementado |
| `TransformTextPortal` | `src/components/transform/TransformTextPortal.tsx` | ✅ Implementado |
| `FileUpload` | `src/components/upload/FileUpload.tsx` | ✅ Implementado |
| `authService` | `src/services/authService.ts` | ✅ Implementado |
| Integração Google OAuth | `src/pages/Auth.tsx` | ✅ Implementado |

### 3.2 Itens que Precisam Validação ⚠️

| Item | Status no Plano | Evidência Necessária |
|------|-----------------|---------------------|
| VIEW `public_profiles` | ✅ Marcado como concluído | Verificar migração SQL |
| RPC `auth_username_available` | ✅ Marcado como concluído | Verificar migração SQL |
| Trigger `handle_new_user()` | ⚠️ Parcial | Verificar se cria username único automaticamente |
| RPC `username_suggest()` | ❌ Não marcado | Verificar se existe |
| Testes de RLS | ❌ Não marcado | Verificar se existem testes |
| Testes de integração | ❌ Não marcado | Verificar se existem testes |
| OpenAPI v1 | ⚠️ Parcial | Verificar se `docs/api/openapi-v1.yaml` está completo |
| CI/CD GitHub Actions | ❌ Não marcado | Verificar se `.github/workflows/ci.yml` existe |

---

## 4. Lacunas Identificadas

### 4.1 Funcionalidades do PRD Não Implementadas

1. **Voz da Marca (Brand Voice)**
   - ❌ CRUD de `brand_profiles` não implementado
   - ❌ Aplicação da voz da marca nas transformações não implementada
   - ⚠️ Campo `brand_voice` jsonb existe em `profiles`, mas não é utilizado

2. **Notificações**
   - ❌ Tabela `notifications` não criada
   - ❌ Serviço `notificationsService` não criado
   - ❌ Integração com Supabase Realtime não implementada

3. **Usage Limits**
   - ❌ Tabela `usage_limits` não mencionada no plano
   - ❌ Lógica de limites mensais não implementada

4. **Exportações**
   - ⚠️ Exportação DOC/PDF/SRT mencionada no PRD, mas não implementada
   - ⚠️ Exportação de vídeos curtos não implementada

### 4.2 Testes Não Implementados

1. **Testes Unitários**
   - ❌ Testes de triggers/RPCs não implementados
   - ❌ Testes de serviços não implementados
   - ❌ Testes de adapters não implementados

2. **Testes de Integração**
   - ⚠️ Testes de RLS parcialmente implementados (`tests/integration/rls_profiles.spec.tsx`)
   - ❌ Testes de Edge Functions não implementados
   - ❌ Testes de webhooks não implementados

3. **Testes E2E**
   - ❌ Testes de fluxos principais não implementados
   - ❌ Testes de Playwright não configurados

4. **Testes de Carga**
   - ❌ k6 não configurado
   - ❌ EXPLAIN ANALYZE não executado

### 4.3 Documentação Pendente

1. **OpenAPI**
   - ⚠️ `docs/api/openapi-v1.yaml` criado, mas precisa validação de completude

2. **ADRs**
   - ✅ ADRs criados (`docs/adr/001-username-login-via-edge.md`, etc.)
   - ⚠️ ADR de Voz da Marca não criado

3. **DDL Detalhada**
   - ⚠️ DDL detalhada por tabela mencionada no plano, mas não criada como anexo

---

## 5. Inconsistências e Desalinhamentos

### 5.1 Cronograma vs Implementação

**Problema:** O plano marca várias tarefas da Fase A como concluídas, mas algumas ainda estão pendentes:

- ❌ "Definir enums, tabelas, índices, constraints" — marcado como `[ ]`, mas migrações foram criadas
- ❌ "Criar migrations iniciais + ER diagram" — marcado como `[ ]`, mas migrações existem
- ⚠️ "Criar VIEW public_profiles" — marcado como `[x]` em outra seção, mas `[ ]` na Fase A

**Recomendação:** Atualizar o plano para refletir o estado real das migrações.

### 5.2 PRD vs Plano: Prioridades

**PRD Fase 1:** Autenticação + Dashboard + Transformação de Texto  
**Plano:** Implementa todas as fases simultaneamente

**Observação:** O plano não segue estritamente o roadmap do PRD, mas isso pode ser intencional para acelerar o desenvolvimento.

### 5.3 Testabilidade: Gaps

**PRD Requisito 19.2:** "Para cada solução proposta, inclua também estratégias de teste unitário e integração."

**Status:** Estratégias estão planejadas, mas testes não foram implementados na maioria dos módulos.

---

## 6. Recomendações

### 6.1 Prioridades Imediatas

1. **Completar Testes de Integração**
   - Implementar testes de RLS para todas as tabelas
   - Implementar testes de Edge Functions (`username-login`, `transform_text`, `transcribe_audio`)
   - Implementar testes de webhooks (`payments/webhooks`)

2. **Implementar Voz da Marca**
   - Criar CRUD de `brand_profiles` (ou usar `profiles.brand_voice`)
   - Implementar aplicação da voz da marca nas transformações
   - Criar testes de aplicação

3. **Implementar Notificações**
   - Criar tabela `notifications`
   - Criar serviço `notificationsService`
   - Integrar com Supabase Realtime

4. **Completar Exportações**
   - Implementar exportação DOC/PDF/SRT para transcrições
   - Implementar exportação de vídeos curtos

### 6.2 Melhorias no Plano

1. **Sincronizar Status**
   - Atualizar Fase A para refletir migrações criadas
   - Marcar itens concluídos consistentemente em todas as seções

2. **Adicionar Métricas de Progresso**
   - Incluir porcentagem de conclusão por fase
   - Incluir porcentagem de cobertura de testes

3. **Documentar Decisões**
   - Criar ADR para Voz da Marca
   - Documentar por que `usage_limits` não foi implementado

### 6.3 Alinhamento com PRD

1. **Seguir Roadmap do PRD**
   - Priorizar Fase 1 do PRD (Autenticação + Dashboard + Transformação de Texto)
   - Adiar Fase 3 (Vídeo curto) até Fase 2 estar completa

2. **Implementar KPIs**
   - Configurar métricas de latência (SLOs do PRD)
   - Configurar dashboards de observabilidade

---

## 7. Conclusão

### 7.1 Pontos Fortes ✅

1. **Arquitetura Bem Definida:** Camadas claras, responsabilidades bem separadas
2. **Segurança Robusta:** RLS implementado, PII scrubbing, rate limiting
3. **Código Testável:** Services/adapters isolados, hooks bem estruturados
4. **Documentação Inicial:** ADRs criados, OpenAPI iniciado

### 7.2 Pontos de Atenção ⚠️

1. **Testes Atrasados:** Estratégias planejadas, mas implementação pendente
2. **Funcionalidades Incompletas:** Voz da Marca, Notificações, Usage Limits
3. **Exportações Pendentes:** DOC/PDF/SRT não implementadas
4. **Cronograma Desatualizado:** Status não sincronizado entre seções

### 7.3 Conformidade Geral

**Conformidade com PRD:** ~75%  
**Conformidade com Testabilidade:** ~60% (planejado, mas não implementado)  
**Conformidade com Segurança:** ~90%

### 7.4 Próximos Passos Recomendados

1. ✅ Validar itens marcados como concluídos
2. ⚠️ Implementar testes de integração críticos
3. ⚠️ Completar funcionalidades da Fase 1 do PRD
4. ⚠️ Sincronizar status do plano com implementação real

---

**Fim da Revisão**

