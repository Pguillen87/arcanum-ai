## Visão Geral

* Problema: 401 em `trigger_whisper` por requisições sem `Authorization: Bearer` e sessão ausente no navegador. Overlay reabre/permanece em estado inadequado.

* Solução: Gating absoluto no front, CTA explícito de re-login, validação robusta no backend com `admin.auth.getUser(jwt)`, observabilidade e rate-limit por usuário.

## Arquitetura Atual (Resumo)

* Frontend: React/Vite, `@supabase/supabase-js v2`, overlay de transcrição com ações “Tentar novamente/Fechar”. Código principal em `src/components/transcription/AudioTranscribeTab.tsx` e `src/components/transcription/TranscriptionOverlay.tsx`.

* Backend: Supabase Edge Functions — `trigger_whisper` (autorização, rate-limit, proxy) e `whisper_processor` (processamento/atualização de DB). Migrations incluindo `worker_rate_limits`.

* Segurança: `WORKER_TOKEN` e `SERVICE_ROLE_KEY` apenas no servidor. Front envia `Authorization: Bearer` do usuário.

## Causas Raiz

* Sessão do navegador ausente (login via CLI não cria sessão do `supabase-js` no browser).

* Trigger inicial pós-`transcribeAudio` envia `fetch` sem verificar token.

* Retry manual em 401 nem sempre atualiza/usa novo token; UI permite cliques sem sessão.

## Logs e Depuração (Obrigatórios)

* Front/Network: capturar `POST /functions/v1/trigger_whisper` (método, URL, headers `Authorization`/`apikey`, body e status). Copiar como cURL.

* Supabase Functions: `trigger_whisper` — `request_received`, `session_validation_failed`, `forward_payload {userId, transcriptionId}`; `whisper_processor` — recebimento/execução.

* DB: linhas em `transcriptions` e `transcription_history` para `transcriptionId` testado.

## Abordagens (Comparação)

* A1 (adotada): Gating no front + validação no back com `admin.auth.getUser(jwt)`. Prós: segura, auditável; Contras: exige re-login quando expira.

* A2: Permitir sem token (apenas `WORKER_TOKEN`). Prós: simples; Contras: inseguro — rejeitado.

* A3: Cookies de sessão. Prós: menos headers; Contras: frágil em dev/CORS — não preferida.

## Plano de Implantação (Passo a Passo)

### Fase 1 — Preparação

* Verificar `.env` do front:

  * `VITE_SUPABASE_URL=https://<ref>.supabase.co`

  * `VITE_SUPABASE_ANON_KEY=<anon do mesmo projeto>`

* Supabase Secrets no projeto `<giozhrukzcqoopssegby>`:

  * `PROJECT_URL`, `SERVICE_ROLE_KEY`, `WORKER_TOKEN`, `SUPABASE_ANON_KEY`.

### Fase 2 — Backend (Functions)

* `trigger_whisper`:

  * Validar sessão via `admin.auth.getUser(jwt)` (já preparado).

  * Respostas claras: 401/429 com `hint` amigável.

  * Logs estruturados: `request_received`, `session_validation_failed`, `forward_payload`.

* `whisper_processor`:

  * Validar `x-edge-token` contra `WORKER_TOKEN`.

  * Logs de entrada, processamento, atualização de `transcriptions` e `transcription_history`.

* Publicar Functions no projeto `giozhrukzcqoopssegby`.

### Fase 3 — Frontend (Gating + UX)

* `AudioTranscribeTab.tsx`:

  * Implementar helper `getValidAccessToken()` (sem hooks) para obter/renovar token.

  * Gating absoluto no trigger inicial: se `!token`, **não** enviar `fetch`; mostrar toast “Sessão inválida — Entrar”.

  * `forceWorkerProcessing`: usar helper antes do envio; em 401, tentar refresh e usar helper novamente; abortar se sem token; incluir `apikey` quando presente.

  * “Fechar”: suprimir reabertura do overlay, parar progresso/polling e retornar ao estado anterior.

* `TranscriptionOverlay.tsx`:

  * Manter apenas “Tentar novamente” e “Fechar”; desabilitar “Tentar novamente” quando `!hasSession`; rótulo opcional “Entrar para processar”.

### Fase 4 — Observabilidade

* Front: logs `console.debug/warn/error` em pontos críticos; toasts claros para 401/429.

* Back: logs estruturados com `userId`, `transcriptionId`, status e `hint`.

* Coletar métricas: taxa de sucesso, 401/429 por usuário.

### Fase 5 — Testes

* Cenário feliz: transcrever → 90% → “Tentar novamente” (com sessão) → `completed`.

* Sessão inválida: “Tentar novamente” → toast de re-login; após login, fluxo avança.

* Rate-limit: disparar em excesso → 429 com `hint`; front não envia múltiplos.

* UI: “Fechar” não reabre overlay; sem barra “Processando…” no fundo.

### Fase 6 — Segurança (Hardening)

* Confirmar que nenhuma chave privilegiada aparece no bundle (inspecionar `dist`).

* Impedir qualquer request sem `Authorization` para functions sensíveis.

* Revisar CORS/Origins no Supabase para origens conhecidas.

* Garantir `UUID v4` e MIME válidos em uploads.

### Fase 7 — Performance & Escala

* Ajustar polling com backoff exponencial (2s → 5s → 10s) quando `queued/processing`.

* Planejar migração do trigger síncrono para fila (Supabase Queue) em volume mais alto.

### Fase 8 — Documentação

* README: destacar que o **login via CLI não autentica o navegador**; usar `/auth` no front.

* Descrever comportamento dos toasts e CTA de re-login.

### Fase 9 — Rollout & Rollback

* Rollout: publicar functions, atualizar front, testar nos ambientes dev/test antes de prod.

* Rollback: manter versão anterior das functions e front; usar feature-flag para exibir CTA de re-login.

## Critérios de Aceite

* 100% das chamadas a `trigger_whisper` têm `Authorization`.

* “Tentar novamente” só habilita com sessão válida.

* Nenhuma reabertura automática do overlay após “Fechar”.

* Logs mostram correlação `userId/transcriptionId` e encaminhamento ao worker.

* Fluxo completo até `completed` sem 401 quando autenticado.

## Coleta Final (para encerramento)

* cURL de `POST /functions/v1/trigger_whisper` com headers.

* Logs de `trigger_whisper/whisper_processor` no timestamp do teste.

* Snapshot de `transcriptions` e `transcription_history` para o `transcriptionId` testado.

