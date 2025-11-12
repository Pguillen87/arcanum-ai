## Estado Atual (Confirmado)
- Supabase Edge Functions acionadas via `https://<VITE_SUPABASE_URL>/functions/v1/trigger_whisper` (sem Netlify).
- Validação de usuário por Bearer no `trigger_whisper` e encaminhamento ao `whisper_processor` com `x-edge-token` (`WORKER_TOKEN`).
- Referências verificadas:
  - `supabase/functions/trigger_whisper/index.ts:24` (Authorization), `:47` (rate limit `worker_rate_limits`), `:77` (forward com `WORKER_TOKEN`), `:90` (logging).
  - `supabase/functions/whisper_processor/index.ts:109` (`x-edge-token`), `:157` (query `transcriptions`), `:387` (finalização e histórico).
  - `src/components/transcription/AudioTranscribeTab.tsx:532` (Bearer via `auth.getSession`), `:669` (recheck), `:701` (fechar overlay), `:709` (`forceWorkerProcessing` com retry 401 e guard por `isForcingRef`).
  - `src/components/transcription/TranscriptionOverlay.tsx:59` (botões “Rechecar status”, “Forçar processamento”, “Fechar”).
  - `package.json:59` (`@supabase/supabase-js` ^2.80.0), `src/integrations/supabase/client.ts:36` (persistSession/autoRefresh), `src/services/transcriptionService.ts:31` (Bearer ao `transcribe_audio`).
  - `supabase/migrations/20251111170000_create_worker_rate_limits.sql:5` (tabela rate limit), `supabase/migrations/20251111142000_align_transcription_history.sql:10`.

## Diagnóstico Provável
- 401 no “Forçar processamento”: validação de Bearer falhando intermitente (token ausente/expirado) em `trigger_whisper` → request rejeitado antes de enfileirar.
- Travamento a 90%: overlay fica aguardando conclusão enquanto o worker não foi acionado (falha na etapa de proxy).
- Múltiplos cliques: apesar de existir `isForcingRef`, há cenários de re-render onde o estado visual não comunica “bloqueado”, induzindo 4 requisições concorrentes.
- “Rechecar status” inativo: handler existe, mas precisa de feedback/logs claros e possível debouncer para evitar spam.

## Evidências a Coletar (Obrigatório)
- Browser/Network (após um 401):
  - Request para `/functions/v1/trigger_whisper`: método, URL, status, body de resposta; headers (`Authorization`, `apikey`, `Cookie`, `x-edge-token` se houver); payload.
  - Copy as cURL e cole aqui.
- Logs Supabase Functions (mesmo timestamp):
  - `trigger_whisper`: `request_received`, resultado da validação (user id, motivo), status do rate limit.
  - `whisper_processor`: confirmar se recebeu ou não.
- Database:
  - Linhas em `transcriptions` e `transcription_history` para o `transcriptionId`; verificar `status/updated_at`.

## Correções Imediatas (Frontend)
- Fortalecer o guard do botão “Forçar processamento” e o feedback visual:
  - `src/components/transcription/AudioTranscribeTab.tsx:709`: manter `isForcingRef` e garantir `disabled` explícito no botão via prop `isRetrying/isProcessing`.
  - Logs detalhados: antes da chamada, logar `tokenExists`, `session.expires_at`; em 401, logar `response.text()`; no retry, `newTokenExists`.
- “Rechecar status”:
  - `:669`: garantir retorno `Promise` e logs do resultado; opcional debouncer leve (300–500ms) para evitar spam.
- “Fechar”:
  - `:701`: não navegar; apenas `setShowOverlay(false)`/`onClose()` (confirmado). Validar que não reinicia a transcrição.

## Ajustes Backend (Supabase Functions)
- `supabase/functions/trigger_whisper/index.ts`:
  - Logging estruturado (JSON) no início: `authorization_header_present`, `validation_result`, `rate_limit_status`, `traceId/user_id`.
  - Mensagens claras: 401 (token ausente/expirado), 403 (sem permissão), 429 (rate limit) com `error_code` e `hint`.
  - Dev/local: aceitar fallback por `Authorization` mesmo sem cookies; evitar exigir `x-edge-token` do cliente.
- `supabase/functions/whisper_processor/index.ts`:
  - Logs de entrada com `traceId`, `transcriptionId/jobId`, `mime`; confirmar atualização de `assets.mimetype` quando necessário.

## Polling/Status
- Confirmar que o polling (`useTranscription.ts:91`) e o recheck manual (`AudioTranscribeTab.tsx:564`) invalidam a cache corretamente e exibem toasts/logs.
- Adotar backoff exponencial quando `status in ['queued','processing']` para reduzir carga.

## Autenticação (Abordagens)
- Abordagem 1 (recomendada): Frontend envia `Authorization: Bearer <userAccessToken>`; `trigger_whisper` valida e encaminha `whisper_processor` com `WORKER_TOKEN`.
  - Prós: seguro e auditável; Contras: leve overhead.
- Abordagem 2: Sem validação do user na função (apenas `WORKER_TOKEN`).
  - Prós: simples; Contras: menos seguro.
- Abordagem 3: Cookies de sessão.
  - Prós: simples em prod; Contras: frágil em dev/local.

## Plano de Testes
- Cenário 1: Fluxo feliz
  - Gravar → transcrever → overlay 90% → “Forçar processamento” (uma vez) → status muda para `completed` e texto aparece.
- Cenário 2: Token expirado
  - Invalidar sessão → requisitar “Forçar” → 401 → retry uma vez → caso falhe, mostrar instrução de re-login.
- Cenário 3: Múltiplos cliques
  - Clicar 4x rapidamente → apenas 1 request sai; botão desabilitado; sem 429.
- Cenário 4: Rate limit
  - Disparar 10+ em 60s → receber 429 no backend; UI exibe mensagem amigável.
- Log verificação: confirmar correlação `traceId` em client/server e atualização em `transcription_history`.

## Respostas Rápidas
- 1) `trigger_whisper` é Supabase Edge Functions: sim, caminho `https://<supabase>/functions/v1/trigger_whisper` (não Netlify).
- 2) Usa `supabase-js` v2 (package.json:59) e autentica via Header `Authorization: Bearer` (não cookies) no browser.
- 3) Posso instruir coleta de logs de Functions; se houver acesso ao painel/CLI, usar `supabase functions logs trigger_whisper --project-ref <ref>`.
- 4) Posso gerar patches exatos (PR) para aplicar direto; após sua aprovação, preparo e envio.

## Próximas Ações
- Você/Trae coleta as evidências acima e compartilha aqui.
- Eu preparo os patches de frontend (guard, logs, UX) e, se necessário, backend (logging/401/429/validação) com instruções claras.
- Executar o plano de testes e ajustar conforme os resultados; fechar com checklist de hardening (token handling, rate limiting, observability).