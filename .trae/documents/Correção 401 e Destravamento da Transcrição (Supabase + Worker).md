## Visão Geral
O fluxo de transcrição trava em 90% e o botão "Tentar novamente" não avança. Os logs indicam `401 Missing authorization header` no worker e "forwarded (status: 401)" no gateway `trigger_whisper`. A arquitetura atual usa: cliente com JWT → gateway `trigger_whisper` → worker `whisper_processor` com `x-edge-token` (WORKER_TOKEN). O plano corrige configuração de ambiente (frontend e Supabase), garante coerência do `WORKER_TOKEN` e adiciona validações/observabilidade para confirmar execução fim-a-fim.

## Hipótese de Causa Raiz
- Ausência/mismatch do `WORKER_TOKEN` entre funções, causando `401` no `whisper_processor`.
- Ausência de `VITE_SUPABASE_ANON_KEY`/`VITE_SUPABASE_URL` no frontend, causando sessão instável/abort de chamadas.
- Sessão do usuário ausente/expirada no cliente, levando o gateway a recusar (`Missing Authorization header`).

## Perguntas de Esclarecimento (responder antes de executar)
1. Você possui a anon key pública do projeto e autoriza adicioná-la ao `.env` do frontend?
2. O `WORKER_TOKEN` já foi criado e está configurado com o MESMO valor nas funções `trigger_whisper`, `transcribe_audio` e `whisper_processor`?
3. O `whisper_processor` possui `PROJECT_URL`, `SERVICE_ROLE_KEY` e `OPENAI_API_KEY` definidos nos secrets?
4. O login via `/auth` está funcional e você vê um `access_token` válido no `localStorage`?
5. As tabelas `transcriptions`, `assets` e `worker_rate_limits` estão com RLS/Policies compatíveis com `service_role`?
6. Confirma que deseja habilitar logs de diagnóstico (moderados) no gateway para validar forwarding e tokens?

## Arquitetura Atual (referências de código)
- Cliente chama gateway com JWT e tenta refresh: `src/components/transcription/AudioTranscribeTab.tsx:567–586`, `792–837`.
- Overlay exibe causas de travamento: `src/components/transcription/AudioTranscribeTab.tsx:691–699`, `870–884`.
- Gateway valida JWT e encaminha com `x-edge-token`: `supabase/functions/trigger_whisper/index.ts:82–93`.
- Worker valida `WORKER_TOKEN`: `supabase/functions/whisper_processor/index.ts:103–131`.

## Plano de Correção
### Fase 1 — Configuração do Frontend
- Adicionar ao `.env` do frontend:
  - `VITE_SUPABASE_URL="https://giozhrukzcqoopssegby.supabase.co"`
  - `VITE_SUPABASE_ANON_KEY="<anon key pública do projeto>"`
- Reiniciar ambiente de desenvolvimento.
- Verificar sessão JWT no navegador (login `/auth`).

### Fase 2 — Alinhamento de Secrets nas Edge Functions
- Em Supabase Dashboard (cada função):
  - `trigger_whisper`: `PROJECT_URL`, `SERVICE_ROLE_KEY`, `WORKER_TOKEN` (mesmo valor nas três).
  - `transcribe_audio`: `PROJECT_URL`, `SERVICE_ROLE_KEY`, `WORKER_TOKEN` (mesmo valor).
  - `whisper_processor`: `PROJECT_URL`, `SERVICE_ROLE_KEY`, `WORKER_TOKEN` (mesmo valor), `OPENAI_API_KEY`.
- Redeploy das três funções.

### Fase 3 — Validações e Testes
- Teste cliente:
  - Login válido; upload de áudio.
  - Ver o gateway aceitar com JWT e "forwarding" com `x-edge-token`.
- Teste de worker:
  - Logs devem mostrar `edgeTokenPresent: true` e transição `queued → processing → completed`.
- Regressão do 90%:
  - Polling deve avançar e o overlay fechar quando `completed`.

### Fase 4 — Observabilidade e Diagnóstico
- Confirmar logs no gateway: `trigger_whisper` com `workerTokenConfigured: true` e `includeEdgeToken: true` (`supabase/functions/trigger_whisper/index.ts:82–93`).
- Confirmar logs no worker: `authHeaderPresent` irrelevante; `edgeTokenPresent: true` (`supabase/functions/whisper_processor/index.ts:115–123`).
- Métricas no cliente: status de sucesso/erro (já emitidas em `AudioTranscribeTab`).

### Fase 5 — Critérios de Aceite
- Sem `401` nos logs de `whisper_processor` e `trigger_whisper`.
- Transcrição conclui sem travar em 90%; botão "Tentar novamente" aciona worker com sucesso.
- Sessão inválida: overlay exibe "Sessão ausente" e CTA "Entrar".
- Configuração ausente: overlay exibe instrução para configurar a anon key.

### Fase 6 — Riscos, Rollback e Segurança
- Riscos: token divergente, chave OpenAI inválida, policies RLS incorretas.
- Rollback: desabilitar worker temporariamente e usar fluxo síncrono (se disponível), ou pausar reprocessamentos.
- Segurança: manter `WORKER_TOKEN` apenas em secrets; não expor anon/service role no repositório.

### Fase 7 — Timeline e Responsáveis
- Dia 1: Configurar `.env` e secrets; redeploy.
- Dia 1: Validar fluxos, corrigir casos de `401` restantes.
- Dia 2: Monitorar logs e métricas; ajustar mensagens/UX se necessário.

### Notas Técnicas Complementares
- Referências adicionais para navegação:
  - Cliente Supabase/flags: `src/integrations/supabase/client.ts:11–12`.
  - Forwarding/diagnóstico: `supabase/functions/trigger_whisper/index.ts:82–93`.
  - Validação do edge token: `supabase/functions/whisper_processor/index.ts:103–131`.

---
Solicito sua confirmação para executar este plano (inserir anon key no `.env`, ajustar secrets no Supabase e redeploy das funções). Após aprovação, implemento cada fase, reportando concluído, próximos passos e fases restantes.