# Plano de Adequação do Banco — Módulo de Transcrição

> Objetivo: alinhar o schema Supabase ao PRD — Arcanum.AI (v3), sanar o erro de persistência de personagens (`refinement_rules`), destravar o pipeline de transcrição (áudio hoje, vídeo em seguida) e preparar terreno para futuros insumos (upload direto, gravação in-app, ingestão YouTube).

## Visão Geral do Diagnóstico Atual
- **Erro crítico**: `characters.refinement_rules` ausente no schema (UI bloqueia salvamento). ✅ _Corrigido (migration 20251110093000 aplicada)_
- **Pipeline travado**: jobs ficam em `queued`/`processing` sem completar; overlay fica em 85%. Causas prováveis: worker sem permissões via service role, RLS incoerente ou migrations divergentes. ✅ _Worker agora retorna falhas com mensagem; falta aprimorar UX_
- **Migrations existentes**: múltiplos arquivos versionados em Git; precisamos confirmar aplicação real no banco.
- **Foco imediato**: transcrição de áudio. Vídeo e gravação direta entram como follow-up no plano.

## Fase 1 — Inventário e Validação do Estado Atual
- 📌 **Objetivo**: medir a distância entre o que está versionado e o que roda no banco remoto/local.
- 🔍 **Passos**:
  1. `supabase status --debug` para listar migrações aplicadas vs. pendentes.
  2. `supabase db diff` (ou `db remote commit`) para gerar diff do schema real → apontar drift.
  3. Query de introspecção: `SELECT column_name FROM information_schema.columns WHERE table_name='characters';` (confirmar ausência de `refinement_rules`).
  4. Verificar se os tipos ENUM citados no PRD existem (`pg_enum`).
  5. Validar policies atuais: `SELECT * FROM pg_policies WHERE schemaname='public';`.
- 🧪 **Critérios**: planilha comparativa schema real × PRD, lista de migrations faltantes ou quebradas.

## Fase 2 — Correção Urgente: `characters` e Perfis
- 📌 **Objetivo**: restaurar salvamento de personagens e perfis.
- 🔧 **Tasks**:
  1. Criar migration incremental `20251110093000_add_refinement_rules_to_characters.sql` com:
     - `ALTER TABLE public.characters ADD COLUMN refinement_rules jsonb NOT NULL DEFAULT '[]'::jsonb;`
     - Comentário de coluna (`COMMENT ON COLUMN`).
     - `touch_updated_at` se necessário.
  2. Rodar `supabase db push` em ambiente de staging/local.
  3. Atualizar `supabase/functions/_shared` (se depender do campo) e regenerar tipos TS (`supabase gen types typescript --local`).
  4. Validar via UI: salvar personagem; confirmar ausência de erros → logar no Fastify.
- 🧪 **Teste**: inserir via SQL `INSERT INTO public.characters (...)` com JSON válido; verificar RLS (`auth.uid()` = dono).
- ✅ _Status_: migration aplicada e salvamento funcionando.

## Fase 3 — Pipeline de Transcrição (Áudio)
- 📌 **Objetivo**: garantir fluxo queued → processing → completed.
- 🔧 **Tasks**:
  1. Conferir Edge `transcribe_audio` e `whisper_processor` se usam `SERVICE_ROLE_KEY` (busca por `createClient(url, serviceRole)`). ✅
  2. Validar variáveis em `.env`/Supabase Dashboard (SERVICE_ROLE_KEY, WORKER_TOKEN). ✅
  3. Revisar RLS de `transcriptions`, `assets`, `transcription_history` — confirmar políticas owner-only. ✅
  4. Garantir triggers `touch_updated_at` ativos (`pg_trigger`). Se ausentes, criar migration específica. ✅ _Migration `20251110094500_phase3_transcription_hardening` aplicada_
  5. Adicionar/confirmar índices: `idx_transcriptions_status_updated_at`, `idx_transcriptions_asset_id`, `idx_transcriptions_user_created_at`. ✅
  6. Smoke test: upload `.mp3` curto → monitor `/rest/v1/transcriptions` e logs do worker (Supabase Functions → Logs). ⏳
  7. Caso jobs continuem travando, instrumentar `whisper_processor` com logs extra e habilitar reprocessamento manual (`supabase functions deploy` se necessário). ✅
- 🧪 **Critérios**: job encerra com `text` preenchido ≤120s, overlay some automaticamente, histórico criado.
- ✅ _Status parcial_: worker agora marca `failed` com mensagem quando o formato é inválido. Falta ajustar overlay e concluir smoke test com arquivo válido.

### Ação adicional concluída
- Migration `20251110103000_add_updated_at_to_assets.sql` aplicada → `assets.updated_at` e trigger garantidos. Falta retestar uploads para confirmar `status=ready`.

## Fase 4 — Estruturação Completa do Schema de Transcrição
- 📌 **Objetivo**: alinhar tabelas/enums/triggers ao PRD de forma modular e auditável.
- 🔧 **Sub-fases (migrations dedicadas)**:
  - **4.1 Enums & Comentários**: migration apenas com criação/ajuste de enums ausentes + `COMMENT ON TYPE`.
  - **4.2 Tabelas base**: `projects`, `assets`, `transcriptions`, `transformations`, `transcription_history`, `notifications` (somente se algo faltar em produção). Cada migration pequena, sem `IF NOT EXISTS`, com comentários por coluna.
  - **4.3 Índices**: migration específica de performance.
  - **4.4 RLS**: migration com `ALTER TABLE ENABLE ROW LEVEL SECURITY` + políticas owner-only.
  - **4.5 Triggers**: migration centralizando `touch_updated_at` e `touch_updated_at_<table>`.
  - **4.6 Backfill**: se necessário, scripts de ajuste (ex.: popular `transcription_history` a partir de `transcriptions`).
- 🧪 **Critérios**: `supabase db diff` retorna vazio após aplicar; ERD atualizado/documentado.

## Fase 5 — Observabilidade, Reprocessamento e Fail-Safes
- 📌 **Objetivo**: detectar e recuperar jobs travados.
- 🔧 **Tasks**:
  1. Criar função SQL ou Edge cron para reprocessar transcrições onde `status IN ('queued','processing')` e `updated_at < now() - interval '2 minutes'`. ✅ Função RPC `retry_stale_transcriptions` criada na migration `20251110095500_transcription_retry_observability.sql`.
  2. Adicionar coluna `attempt_count` em `transcriptions` (default 0) + índice (status, updated_at). ✅
  3. Registrar eventos no `observability` (`metric.audio_transcription_success_rate`). ✅
  4. Checklist pós-migração: queries de contagem, latência, logs do worker. ⏳ _Aplicar quando smoke test concluir_.
- 🧪 **Validação**: simular falha (chave incorreta) e confirmar reprocessador reencaminha; dashboards registram métricas.
- ✅ _Status parcial_: RPC criada e utilizada manualmente. Falta automatizar cron e finalizar checklist.

## Fase 6 — Preparação para Vídeo & Gravação Direta
- 📌 **Objetivo**: estruturar schema e permissões para ingestão adicional.
- 🔧 **Tasks**:
  1. Confirmar bucket `video` no Storage e path `{userId}/{projectId}/...`.
  2. Extender `assets` para capturar metadados de vídeo (`frame_rate`, `resolution`?) — planejar migration.
  3. Definir tabela auxiliar para uploads temporários se implementarmos gravação in-app (ex.: `live_recordings`).
  4. Para YouTube ingest: planejar tabela `external_sources` (id, user_id, project_id, provider, payload_json, status).
  5. Testar transcrição de arquivo `.mp4` curto (via pipeline atual) após garantir conversão ffmpeg no worker.
- 🧪 **Critérios**: asset de vídeo salva, job de transcrição retorna texto (apenas áudio do vídeo) sem travar.
- 🔄 **Ação em andamento**: Implementação de gravação direta via microfone (UI) — prioridade após smoke test.

## Fase 7 — Documentação, Testes e Governance
- 📌 **Objetivo**: manter rastreabilidade e garantir que alterações futuras sigam padrões.
- 🔧 **Tasks**:
  1. Atualizar `docs/ddl/schema-summary.md` e gerar ERD textual.
  2. Criar testes de integração (Vitest/Playwright) cobrindo upload+transcrição (happy path/falha).
  3. Checklist de deploy: backup (`pg_dump`), `supabase db push` em staging, smoke tests, PR com descrição e plano de rollback.
  4. Adicionar monitoramento de métricas (latência, falhas) e alertas básicos.
- 🧪 **Critérios**: checklist preenchido, testes passando na pipeline, documentação versionada.

## Roadmap de Execução (Prioridade Alta → Média)
1. **Fase 3** — Finalizar smoke test com arquivo válido, ajustar overlay e botões (em andamento).
2. **Gravação via microfone** — implementar capturador, integração com upload e validações.
3. **Fase 4** — normalizar schema com migrations modulares restantes.
4. **Fase 5** — cron/reprocessamento automático.
5. **Fase 6** — preparar ingestões futuras (vídeo + gravação direta concluída).
6. **Fase 7** — documentação, testes, governança contínua.

## Estratégia de Testes
- Unitários: hooks/services (`useTranscription`, `assetsService`) com MSW simulando RLS.
- Integração: Edge Functions via Supabase CLI (`supabase functions serve`) + banco local.
- E2E: Playwright → upload .mp3 (happy path + falha de formato), validação de overlay e histórico.
- SQL smoke tests pós-deploy (contagens, amostras, policies `EXPLAIN` para índices).

## Riscos e Mitigações
- **Drift severo**: uso de `supabase db diff`/`status` antes de aplicar migrations; sempre em staging primeiro.
- **Hooks Husky interrompendo workflow**: permitir `HUSKY=0` somente em emergências, rodar lint/test manual depois.
- **SERVICE_ROLE vazando**: garantir que apenas Edge Functions usam; auditar `.env` do frontend.
- **Timeouts de Whisper**: implementar reprocessador (Fase 5) e logs estruturados. ✅
- **Escalonamento de features futuras**: manter migrations pequenas e comentadas, evitar combos grandes (`IF NOT EXISTS`).

---

> Próximas ações imediatas:
> 1. Validar que `assets.status` passa para `ready` após a migration `updated_at`.
> 2. Ajustar overlay/UI para exibir falhas e permitir gravação direta via microfone (MediaRecorder) integrando com `assetsService.uploadFile`.
> 3. Repetir smoke test com áudio válido e registrar resultado.
