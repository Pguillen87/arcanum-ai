## Visão Geral
Você confirmou possuir a anon key e que os secrets principais existem, mas há dúvida se o `WORKER_TOKEN` é o mesmo em todas as funções. O erro 401 (“Missing authorization header”) indica ausência de JWT no gateway ou token interno ausente/divergente no worker. O plano corrige `.env` do frontend, alinha `WORKER_TOKEN` entre `trigger_whisper`, `transcribe_audio` e `whisper_processor`, verifica RLS/Policies, e valida o fluxo fim-a-fim com observabilidade moderada.

## Hipóteses e Causas Possíveis
1. `WORKER_TOKEN` divergente entre funções: worker rejeita (`401`), mesmo com JWT correto no gateway.
2. `.env` sem `VITE_SUPABASE_ANON_KEY`/`VITE_SUPABASE_URL`: cliente Supabase instável e sessões falhas.
3. Sessão JWT ausente/expirada no navegador: gateway recusa sem `Authorization: Bearer`.
4. Policies RLS impedem leitura no frontend (polling) ou escrita incorreta: bloqueios intermitentes.
5. CORS/future flags irrelevantes para 401, mas podem gerar ruído; considerar ajustes depois.

## Plano de Ação por Fases
### Fase 0 — Preparação do Frontend
- Inserir a anon key real em `c:\app\arcanum-ai\.env`:
  - `VITE_SUPABASE_URL="https://giozhrukzcqoopssegby.supabase.co"`
  - `VITE_SUPABASE_ANON_KEY="<anon key pública do projeto>"`
- Reiniciar `npm run dev`.
- Validar login `/auth` e existência de `access_token` em `localStorage`.

### Fase 1 — Alinhamento de Secrets nas Edge Functions
- No Supabase Dashboard → Edge Functions → Secrets, para cada função:
  - `trigger_whisper`: `PROJECT_URL`, `SERVICE_ROLE_KEY`, `WORKER_TOKEN`.
  - `transcribe_audio`: `PROJECT_URL`, `SERVICE_ROLE_KEY`, `WORKER_TOKEN`.
  - `whisper_processor`: `PROJECT_URL`, `SERVICE_ROLE_KEY`, `WORKER_TOKEN`, `OPENAI_API_KEY`.
- Confirmar que `WORKER_TOKEN` é IGUAL nas três.
- Redeploy das três funções.

### Fase 2 — Verificação de RLS/Policies
- Objetivo: garantir que o frontend consiga ler suas próprias transcrições e que o worker (service role) consiga atualizar.
- Políticas sugeridas (se não existirem):
  - `transcriptions`: `SELECT` para usuários autenticados onde `user_id = auth.uid()`. `INSERT/UPDATE` via service role (sem RLS por service role client).
  - `assets`: `SELECT` onde `owner_id = auth.uid()`. Atualizações pelo worker via service role.
  - `worker_rate_limits`: acesso apenas por service role; sem permissões para usuário final.
- Validar que o worker usa `SERVICE_ROLE_KEY` (bypass de RLS). O frontend usa JWT do usuário (policies exigem `auth.uid()`).

### Fase 3 — Observabilidade e Logs Moderados
- Gateway `trigger_whisper`:
  - Confirmar logs `request_received (authorizationPresent)` e `forwarding { workerTokenConfigured, includeEdgeToken }`.
- Worker `whisper_processor`:
  - Confirmar `edgeTokenPresent: true` e progressão `queued → processing → completed`.
- Frontend:
  - Aproveitar toasts/overlay para estados: sessão ausente, config ausente, processamento lento.

### Fase 4 — Testes Funcionais e de Regressão
- Positivo: upload curto (webm/mp3/wav); verificar que polling passa de 90% e texto é gravado.
- Negativo: deslogar e tentar; overlay deve pedir “Entrar”. Errar `WORKER_TOKEN`; esperar `401` no worker.
- Carga moderada: 3–5 uploads seguidos para observar rate-limit no gateway.
- Edge cases: áudio com mimetype incomum; validação em `whisper_processor`.

### Fase 5 — Segurança e Boas Práticas
- Secrets somente no Dashboard (nunca commit). Rotacionar `WORKER_TOKEN` periodicamente.
- CORS: manter permissões mínimas necessárias.
- Não logar tokens/segredos; logs apenas com flags (present/true/false).

### Fase 6 — Performance e Escalabilidade
- Retry com backoff exponencial (já há retry básico no cliente; manter simples).
- Rate-limit por usuário (tabela `worker_rate_limits`) revisado e ativo.
- Conversão de áudio (ffmpeg) só quando runtime suporta; fallback para formatos aceitos pelo OpenAI.

### Fase 7 — Critérios de Aceite
- Sem `401` nos logs do worker/gateway após alinhamento.
- Overlay sai de 90% → 100% e fecha; transcrição gravada.
- Sessão inválida: overlay mostra CTA “Entrar”. Config ausente: instrução para anon key.

### Fase 8 — Timeline
- Hoje: atualizar `.env`, alinhar `WORKER_TOKEN`, redeploy funções, validar fluxo.
- Amanhã: revisar policies RLS e testes de carga moderada.

## Próximos Passos
- Autorizar a aplicação da anon key no `.env` e a conferência/ajuste do `WORKER_TOKEN` nas três funções.
- Após confirmação, executo as fases, reportando conclusão de cada etapa, próximos passos e fases restantes.