## Visão Geral e Diagnóstico
- Causa raiz: 401 no `trigger_whisper` impede o forward ao `whisper_processor`. Evidência no console: "Invalid session".
- Origem provável: validação atual em `supabase/functions/trigger_whisper/index.ts:30–36` usa `auth/v1/user` sem `apikey`, enquanto o padrão confiável no projeto é `admin.auth.getUser(jwt)` (como em `transcribe_audio`).
- UI: Overlay exibe três ações; duas são suficientes. Múltiplos cliques já possuem guard por `isForcingRef`, mas o feedback visual precisa ser consistente.

## Proposta Preferida (Segurança, Qualidade, Eficiência, Rapidez)
### Backend — Validação robusta e respostas claras
- Substituir a chamada REST `auth/v1/user` por `admin.auth.getUser(jwt)` com `SERVICE_ROLE_KEY` em `supabase/functions/trigger_whisper/index.ts:24`.
- Caso queira manter REST, adicionar `headers: { Authorization, apikey: SERVICE_ROLE_KEY }` — menos recomendado.
- Padronizar respostas:
  - 401: `{ code: 'AUTH_401', message, hint }` (sessão expirada/ausente).
  - 429: `{ code: 'RATE_LIMIT', message, hint }` com tempo restante; manter tabela `worker_rate_limits`.
- Logging estruturado (JSON): `request_received`, `validation_result`, `rate_limit_status`, `forwarded`, com `traceId/user_id`.
- Segurança: manter `WORKER_TOKEN` apenas server-side; nunca expor ao cliente; checar `x-edge-token` no `whisper_processor` (já implementado em `supabase/functions/whisper_processor/index.ts:124–133`).

### Frontend — Overlay simplificado e feedback consistente
- `src/components/transcription/TranscriptionOverlay.tsx:59–75`:
  - Exibir apenas dois botões: "Tentar novamente" (`onRetry`) e "Fechar" (`onClose`). Remover "Rechecar status".
  - Manter `disabled={!!isRetrying}` no botão principal; rótulo "Processando..." enquanto aguarda.
- `src/components/transcription/AudioTranscribeTab.tsx`:
  - `forceWorkerProcessing` (`:709–792`): manter lock por `isForcingRef`, logar `tokenExists` e `expires_at`, fazer um único retry em 401; se falhar, toast amigável orientando re-login.
  - Ajustar toasts para 401/429 com base nos novos `hint` retornados do backend.
  - Remover o handler "Rechecar status" do overlay; manter polling automático e invalidation via React Query (`:564–597`).

### Eficiência e Rapidez
- Evitar cliques repetidos e requisições redundantes; o lock e disable resolvem.
- Políticas de polling: manter curto backoff exponencial enquanto `queued/processing` (já há polling de 2s em `useTranscription.ts`, considerar aumentar para 3–5s se necessário).
- Rate limit server-side permanece ativo e audita por usuário; logs ajudam a correlação.

### Qualidade e Segurança
- Centralizar validação de sessão em `trigger_whisper` com `admin.auth.getUser(jwt)`, alinhando com `transcribe_audio` (menos variáveis, menos erros).
- Logging estruturado e mensagens claras melhoram depuração e UX.
- Não expor `WORKER_TOKEN`, manter auditoria por `user_id` e `transcriptionId`.

## Impacto no Código (Referências)
- `supabase/functions/trigger_whisper/index.ts:24, 30–39, 47–75, 77–89`: trocar validação, manter rate limit, melhorar logs/hints.
- `supabase/functions/whisper_processor/index.ts:109–133, 157–176, 387–423`: sem mudanças funcionais; já valida `x-edge-token` e persiste estados.
- `src/components/transcription/TranscriptionOverlay.tsx:59–75`: reduzir para dois botões.
- `src/components/transcription/AudioTranscribeTab.tsx:709–792`: manter lock/logs/retry único e toasts; já envia `Authorization: Bearer`.

## Plano de Testes
- Fluxo feliz: criar job → 90% → "Tentar novamente" aciona worker → `completed` com texto.
- Sessão expirada: "Tentar novamente" → 401 com `hint` → retry único; se falhar, mostrar instrução de re-login.
- Rate limit: 11 cliques em 60s → 429 com `hint`; sem múltiplas requisições concorrentes.
- UI: apenas dois botões; "Fechar" encerra overlay sem navegação; sem reinicializar a transcrição.

## Entregáveis
- Patch no `trigger_whisper` trocando validação para `admin.auth.getUser(jwt)` com logs/hints.
- Patch no `TranscriptionOverlay` reduzindo ações para dois botões.
- Ajustes leves de toasts no `AudioTranscribeTab` para exibir mensagens de 401/429.

Se aprovar, aplico os patches e valido com o plano de testes acima.