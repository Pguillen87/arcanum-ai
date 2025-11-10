# Apresentação: Plano de Refatoração e Melhoria — Arcanum AI

**Data:** 2025-01-08  
**Duração Total:** 12-15 dias úteis  
**Objetivo:** Corrigir inconsistências, completar funcionalidades críticas e alinhar com PRD

---

## 🎯 Visão Geral

Este plano aborda **4 áreas críticas** identificadas na revisão:

1. **Sincronização** (1 dia) - Corrigir inconsistências do plano atual
2. **Testes Críticos** (3-4 dias) - Garantir qualidade e segurança
3. **Funcionalidades Faltantes** (4-5 dias) - Completar PRD Fase 1
4. **Melhorias** (2-3 dias) - Otimizar e documentar

---

## 📊 Status Atual vs Alvo

| Métrica | Atual | Alvo | Gap |
|---------|-------|------|-----|
| **Conformidade PRD** | 75% | 95% | +20% |
| **Cobertura de Testes** | ~10% | 90% | +80% |
| **Funcionalidades Fase 1** | 60% | 100% | +40% |
| **Documentação** | 50% | 95% | +45% |

---

## 🚀 Fase 0: Sincronização (1 dia)

**Objetivo:** Validar estado real e corrigir inconsistências

### Tarefas Principais:
- ✅ Validar todas as migrações criadas
- ✅ Validar todas as Edge Functions
- ✅ Validar todos os Services e Hooks
- ✅ Atualizar plano original (sincronizar status)
- ✅ Criar checklist de validação

### Entregáveis:
- Documento de validação completo
- Plano sincronizado (sem inconsistências)
- Checklist de conformidade PRD

---

## 🧪 Fase 1: Testes Críticos (3-4 dias)

**Objetivo:** Implementar testes essenciais antes de novas funcionalidades

### 1.1 Testes de RLS (1 dia)
- ✅ `profiles` (owner-only + VIEW pública)
- ✅ `projects` (owner-only)
- ✅ `assets` (owner-only + Storage)
- ✅ `credits` (owner-only)
- ✅ `transformations`/`transcriptions` (owner-only)

**Meta:** 100% de cobertura de políticas RLS

### 1.2 Testes de Edge Functions (1-2 dias)
- ✅ `username-login` (sucesso, falha, rate limit)
- ✅ `transform_text` (validação, idempotência, débito)
- ✅ `transcribe_audio` (validação, idempotência, débito)
- ✅ `payments/webhooks` (assinatura, idempotência, reconciliação)

**Meta:** 100% de cobertura de casos de uso

### 1.3 Testes Unitários (1 dia)
- ✅ `authService` (90%+ cobertura)
- ✅ `creditsService` (90%+ cobertura)
- ✅ `openaiAdapter` (90%+ cobertura)

**Meta:** 90%+ de cobertura de código crítico

---

## 🎨 Fase 2: Funcionalidades Faltantes (4-5 dias)

**Objetivo:** Completar PRD Fase 1

### 2.1 Voz da Marca (2 dias)
- ✅ CRUD de `brand_voice` (jsonb em `profiles`)
- ✅ Aplicação em transformações (modificar prompts)
- ✅ UI de configuração
- ✅ Testes completos

**Entregáveis:**
- `brandVoiceService` + `useBrandVoice` hook
- `BrandVoiceSettings` component
- Integração com `transform_text`

### 2.2 Notificações (2 dias)
- ✅ DDL `notifications` (tabela + RLS + índices)
- ✅ `notificationsService` + `useNotifications` hook
- ✅ Integração com Supabase Realtime
- ✅ Emissão automática (jobs, créditos, pagamentos)
- ✅ UI de notificações
- ✅ Testes completos

**Entregáveis:**
- Tabela completa
- Serviço + hook + UI
- Integração Realtime funcionando

### 2.3 Exportações (1 dia)
- ✅ Exportação DOC/PDF/SRT (transcrições)
- ✅ Exportação MD/TXT/JSON (transformações)
- ✅ UI de exportação
- ✅ Testes completos

**Entregáveis:**
- `exportService` completo
- `ExportButton` component

---

## 📚 Fase 3: Melhorias (2-3 dias)

**Objetivo:** Otimizar e documentar

### 3.1 Documentação (1 dia)
- ✅ Completar OpenAPI v1 (todos os endpoints)
- ✅ Criar ADR de Voz da Marca
- ✅ Criar DDL detalhada (tabelas, índices, triggers, RPCs)
- ✅ Melhorar documentação de APIs

### 3.2 Performance (1-2 dias)
- ✅ Análise de queries (`EXPLAIN ANALYZE`)
- ✅ Otimização de índices (compostos)
- ✅ Retenção de dados automática
- ✅ Limpeza de Storage órfão

**Meta:** Queries críticas <100ms

### 3.3 Observabilidade (1 dia)
- ✅ Integração Sentry/LogRocket completa
- ✅ Dashboards básicos (métricas, créditos, jobs)
- ✅ Alertas configurados (falhas, latência, APIs externas)

---

## 🔄 Fase 4: CI/CD (1-2 dias)

**Objetivo:** Automatizar qualidade e deploy

### 4.1 Pipeline CI/CD (1 dia)
- ✅ GitHub Actions (lint, testes, build)
- ✅ Aplicar migrações em CI (teste + rollback)
- ✅ Deploy automático (staging + produção)

### 4.2 Qualidade (1 dia)
- ✅ Pre-commit hooks (lint + format)
- ✅ Coverage reports automáticos (threshold 80%)
- ✅ Code review checklist

---

## 📈 Cronograma Visual

```
Semana 1:
├─ Dia 1: Fase 0 (Sincronização)
├─ Dia 2-3: Fase 1.1-1.2 (Testes RLS + Edge Functions)
└─ Dia 4-5: Fase 1.3 (Testes Unitários)

Semana 2:
├─ Dia 6-7: Fase 2.1 (Voz da Marca)
├─ Dia 8-9: Fase 2.2 (Notificações)
└─ Dia 10: Fase 2.3 (Exportações)

Semana 3:
├─ Dia 11: Fase 3.1 (Documentação)
├─ Dia 12: Fase 3.2 (Performance)
├─ Dia 13: Fase 3.3 (Observabilidade)
└─ Dia 14-15: Fase 4 (CI/CD)
```

---

## ✅ Critérios de Sucesso

### Técnicos:
- ✅ **95%+ conformidade PRD** (Fase 1 completa)
- ✅ **90%+ cobertura de testes** (código crítico)
- ✅ **Zero bugs críticos** (código revisado)
- ✅ **Queries <100ms** (performance otimizada)
- ✅ **RLS 100% coberto** (segurança garantida)

### Qualidade:
- ✅ **OpenAPI completo** (todos os endpoints)
- ✅ **ADRs atualizados** (decisões documentadas)
- ✅ **DDL detalhada** (schema completo)
- ✅ **CI/CD funcionando** (deploy automático)

---

## 🎯 Priorização

### 🔴 Alta Prioridade (Bloqueadores):
1. **Fase 0:** Sincronização (base para tudo)
2. **Fase 1:** Testes Críticos (qualidade mínima)
3. **Fase 2.1-2.2:** Voz da Marca + Notificações (PRD Fase 1)

### 🟡 Média Prioridade (Importante):
4. **Fase 2.3:** Exportações (completar PRD Fase 1)
5. **Fase 3:** Melhorias (otimização)
6. **Fase 4:** CI/CD (automação)

### 🟢 Baixa Prioridade (Futuro):
- Fase 5 do PRD (Vídeo Curto produção)
- Fase 6 do PRD (Analytics Emocional)

---

## 📋 Checklist de Execução

### Antes de Começar:
- [ ] Revisar plano completo
- [ ] Validar ambiente de desenvolvimento
- [ ] Configurar variáveis de ambiente
- [ ] Confirmar acesso ao Supabase

### Durante Execução:
- [ ] Marcar tarefas como `[x]` ao concluir
- [ ] Executar testes após cada fase
- [ ] Documentar decisões importantes
- [ ] Atualizar ADRs quando necessário

### Após Conclusão:
- [ ] Validar todos os critérios de sucesso
- [ ] Executar suite completa de testes
- [ ] Revisar documentação
- [ ] Preparar deploy para staging

---

## 🚨 Riscos e Mitigações

| Risco | Mitigação |
|-------|-----------|
| Testes demorarem mais | Priorizar testes críticos, adiar não essenciais |
| Realtime complexo | Usar exemplos Supabase, testar incrementalmente |
| Performance não otimizável | Análise prévia, índices compostos, particionamento |
| Deploy falhar | Testar em staging primeiro, rollback manual |

---

## 📞 Próximos Passos

1. **Revisar e Aprovar:** Validar plano com equipe
2. **Iniciar Fase 0:** Sincronização e validação
3. **Executar Sequencialmente:** Fases 1 → 2 → 3 → 4
4. **Validar Critérios:** Após cada fase, verificar sucesso

---

**Plano Completo:** `docs/Task/Atual/plano-refatoracao-melhoria.md`  
**Revisão Base:** `docs/Task/Atual/revisao-plano-vs-prd.md`

