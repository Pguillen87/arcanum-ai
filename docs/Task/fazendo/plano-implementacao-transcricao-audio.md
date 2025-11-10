# Plano de Implementação — Transcrição de Áudio (Cards + Polling + Worker Whisper)

Este plano consolida e operacionaliza os pontos dos documentos:
- docs/fazendo/plano-ajustes-transcricao-audio.md (diagnóstico detalhado de UX/validação/observabilidade)
- docs/fazendo/plano-transcricao-audio.md (necessidade do worker Whisper, contrato e histórico)

Visão geral
- Problema: A Edge Function `transcribe_audio` atualmente retorna apenas um `jobId` (assíncrono) sem popular `text` em `transcriptions`. O frontend espera `text` ou faz polling, mas como o texto nunca é gravado, a UI não mostra os dois cards.
- Solução: Implementar um worker/edge que consuma os jobs e grave `text/status`, alinhar o contrato da API, adicionar polling no frontend, e renderizar os dois cards (Original em Markdown + Personagem com Refresh) com UX refinada (scrollbar, hint, microtextos).

Objetivos
- Garantir que todo áudio transcrito resulte em:
  - Registro persistido em `transcriptions` com `text`, `status` e `user_id`.
  - Registro em `transcription_history` (original + transformado quando disponível).
  - Exibição automática de dois cards: “Transcrição Original” (Markdown) e “Versão do Personagem” (com Refresh).
  - Fluxo observável (traceId, métricas e logs) e UX acessível (tooltip do botão desabilitado, scrollbar discreta).

Decisões confirmadas e parâmetros (conforme orientação do usuário)
- Whisper: usar OpenAI Whisper API (pago) como padrão — melhor custo/benefício e qualidade para MVP; arquitetura permitirá substituição por implantação local futura.
- Project-ref Supabase: `giozhrukzcqoopssegby` (link confirmado via CLI e arquivos .temp/config.toml).
- Contrato de resposta: preferir assíncrono com polling; opcional síncrono para arquivos pequenos (threshold configurável), sem bloquear a UI.
- Transformação com personagem: automática quando “aplicar personagem” estiver marcado; caso contrário, manual via botão Refresh no card.
- Limite de tamanho: 200 MB no MVP (alinhado ao cálculo de custo; parametrizado para ajuste futuro).
- Observabilidade: usar Console + Supabase Dashboard, com eventos estruturados e métrica de latência; arquitetura preparada para evolução (por ex., OpenTelemetry) sem acoplamento forte.

Diagrama de fluxo (alto nível)

Cliente (AudioTranscribeTab) -> Upload (assetsService) -> Edge transcribe_audio -> Tabela transcriptions (queued)
                                                                  |
                                                                  v
                                         Worker Whisper (processa, grava text/status)
                                                                  |
                                                                  v
                                         Frontend polling (useTranscriptionStatus) -> cria transcription_history -> Cards UI

Fases e entregáveis

Fase 0 — Pré-requisitos e acesso
- Obter SUPABASE_ACCESS_TOKEN e realizar `supabase login` no ambiente de dev.
- Vincular CLI ao projeto remoto: `npx supabase link --project-ref <project-ref>` (ex.: giozhrukzcqoopssegby).
- Validar schema local/remoto: `supabase db pull` (para ler remoto) e/ou `supabase db push` (se for necessário aplicar migrações).
- Mapear variáveis sensíveis: OPENAI_API_KEY (para Whisper), URL/KEY do Supabase, política de RLS para `transcriptions` e `transcription_history`.
- Definir limites de tamanho dos arquivos e formatos aceitos (conforme mediaFormats).

Critérios de aceitação F0
- CLI conectado ao projeto Supabase; schemas conhecidos e versionados.
- Segredos e variáveis mapeados em `.env.local` (sem commit) e no ambiente Supabase.

Fase 1 — Backend: Worker/Edge Whisper
- Implementar um Worker (Edge Function ou serviço programado) que:
  - Consuma jobs da tabela `transcriptions` com `status in ('queued','processing')`.
  - Baixe o asset do Storage, execute Whisper (OpenAI/locally), e grave:
    - `text` (string completa da transcrição)
    - `duration_seconds` (quando disponível)
    - `status` (`completed` ou `failed`) e `error` (quando aplicável)
    - `user_id` (propagar via Authorization Bearer; validar RLS)
  - Seja idempotente (reprocessa apenas quando necessário; marca tentativas/retries).
- Observabilidade: logar `worker_start`, `worker_success`, `worker_failure`, com `traceId` e tempos de execução.

Estratégias de teste (F1)
- Unitários: funções utilitárias (download do asset, normalização de MIME, escrita idempotente de status/text), com mocks de I/O.
- Integração: invocar o worker com um `jobId` real em dev, validar transição `queued` → `completed` e persistência de `text`.
- Edge cases: asset ausente, OpenAI rate limit/timeout, áudio inválido, falta de Authorization; garantir `failed` com `error` útil.

Critérios de aceitação F1
- Jobs em `queued` passam a `processing` e, após Whisper, ficam em `completed` com `text` preenchido.
- Em falha, ficam em `failed` com `error` descritivo.
- Logs do worker acessíveis e correlacionáveis via `traceId`/`job_id`.

Fase 2 — Contrato da Edge e segurança
- Manter `POST /functions/v1/transcribe_audio` retornando `{ jobId, status: 'queued' }` (assíncrono) como padrão.
- Opcional (MVP curto): se Whisper rodar inline, retornar `{ transcriptionId, text }` (síncrono) quando o arquivo for pequeno.
- Criar endpoint/consulta de status (via PostgREST) para obter `transcriptions` por `jobId/transcriptionId` com RLS:
  - RLS garante que apenas o `user_id` do Bearer visualize.
- Garantir que o `user_id` está presente em todas as inserções.

Estratégias de teste (F2)
- Unitários: validação do Bearer/JWT e extração de `user_id`.
- Integração: chamada ao endpoint `transcribe_audio` retornando `{ jobId }` e consulta/status via PostgREST respeitando RLS.
- Edge cases: Bearer ausente/expirado; restrição de acesso entre usuários; auditoria de políticas RLS com consultas negativas.

Critérios de aceitação F2
- Resposta da Edge padronizada; documentação atualizada em docs/api.
- Consultas de status seguras e filtradas por `user_id`.

Fase 3 — Frontend: Polling, histórico e cards
- Integrar `useTranscriptionStatus(jobId)` com backoff controlado (até 2–5 min máx.).
- Ao detectar `status='completed'` e `text` presente:
  - Criar/atualizar `transcription_history` (original_text, timestamps, `user_id`).
  - Disparar transformação com personagem apenas quando o usuário solicitar (Refresh) ou quando a opção “aplicar personagem” estiver marcada.
- UI dos dois cards:
  - Card “Transcrição Original”: exibir `MarkdownPreview` (toggle on/off), com botões copiar/exportar.
  - Card “Versão do Personagem”: mostrar texto transformado e botão “Refresh” para regenerar.
- Mensagens de estado claras: “Processando transcrição… os cards aparecerão quando concluído”.

Estratégias de teste (F3)
- Unitários: hook `useTranscriptionStatus` com backoff; criação de histórico quando detectar `completed`.
- Integração: simular transição de status e verificar render dos dois cards, com toggle Markdown e Refresh.
- Edge cases: polling excedendo tempo máximo; fallback visual; transformação sem personagem selecionado.

Critérios de aceitação F3
- Polling funcional: após o job concluir, UI mostra os dois cards automaticamente.
- Histórico populado com `user_id`; transformation dispara quando configurado.

Fase 4 — UX refinada (scrollbar, hint, microcopy)
- Scrollbar discreta conforme tema (classes utilitárias), evitando barras “brutas”.
- Tooltip/Hint no botão “Transcrever Áudio” desabilitado, com causas mapeadas:
  - Arquivo ausente, tipo inválido, tamanho excedido, processo em andamento, projeto não selecionado.
- Microtextos nos cards: formatos aceitos, limite de tamanho e mensagens de progresso.

Estratégias de teste (F4)
- Integração/UI: verificar tooltip acessível (hover e focus), estilos de scrollbar discretos, sem overflow indesejado.
- Acessibilidade: navegação por teclado e foco visível nos elementos interativos.

Critérios de aceitação F4
- Scrollbar seguindo padrão visual do tema; sem overflow excessivo.
- Tooltip acessível por foco/hover descrevendo a causa do bloqueio e ação sugerida.

Fase 5 — Observabilidade e métricas
- Instrumentar eventos no frontend: `audio_transcription_attempt/success/failure`, com `traceId`, MIME, sizeMB, `applyTransformation`.
- Métricas: `metric.audio_transcription_success_rate`, latência entre `queued` e `completed`.
- Logs do worker com correlação por `job_id`.

Estratégias de teste (F5)
- Integração: confirmar emissão dos eventos no console e registro no Supabase Dashboard; validar cálculo de latência queued→completed.
- Edge cases: falhas gerando `audio_transcription_failure` com `requestId`/`jobId`.

Critérios de aceitação F5
- Eventos e métricas visíveis no console/painel; correlação consistente entre cliente e backend.

Fase 6 — Testes e qualidade
- Unitários: validação (tipos/tamanho), hooks (`useTranscriptionStatus`), serviços.
- Integração: fluxo completo com simulação de status (`queued` → `completed`).
- E2E: upload real em ambiente de teste, verificação de cards e tooltips.
- Testes de carga/latência (jobs simultâneos).

Estratégias de teste (F6)
- Unitários e integração cobrem fluxos principais e falhas.
- E2E: fluxo completo em dev, incluindo upload, polling e cards.
- Carga: disparar múltiplos jobs pequenos e medir latência e estabilidade.

Critérios de aceitação F6
- Suite de testes passando; cenários principais cobertos.

Fase 7 — Deploy, feature flag e rollback
- Habilitar feature de transcrição com flag (para liberar gradualmente).
- Plano de rollback se o worker falhar (desativar processamento, manter UI informativa).
- Smoke tests pós-deploy.

Critérios de aceitação F7
- Deploy sem regressões; rollback documentado; smoke tests ok.

Riscos e mitigação
- Processamento demorado/custos: limitar tamanho, compressão, paralelismo, retries com backoff.
- Inconsistência de dados: transação/locks leves; histórico criado somente após `completed`.
- Segurança/RLS: validar Bearer em cada operação e aplicar políticas de linha.

Checklist de tarefas (alto nível) — Progresso
- [x] Fase 0: Pré-requisitos (parcial)
  - [x] Supabase CLI login
  - [x] Link ao projeto (`giozhrukzcqoopssegby`)
  - [x] Migration repair (histórico alinhado)
  - [ ] `db push` definitivo (timeout no pooler; reexecutar quando o serviço estiver estável)
  - [ ] Variáveis de ambiente mapeadas (OPENAI_API_KEY) — precisa configurar via `supabase secrets set`
- [x] Fase 1: Worker Whisper (MVP)
  - [x] Edge Function `supabase/functions/whisper_processor/index.ts` criada
  - [ ] Testes de integração no ambiente (dependem de OPENAI_API_KEY)
- [ ] Fase 2: Contrato e segurança
  - [x] Acionamento automático do worker após `transcribe_audio` (best-effort)
  - [x] Proteção simples do worker com token via cabeçalho `x-edge-token`
  - [ ] Documentar status/consulta (PostgREST RLS confirmada)
- [ ] Fase 3: Frontend
  - [x] Polling integrado (useTranscriptionStatus) e dois cards (Original Markdown + Personagem com Refresh)
  - [x] Transformação automática quando “aplicar personagem” estiver marcado (hook já dispara ao `completed`)
  - [ ] Confirmar criação de histórico automática ao `completed` (via worker) em ambiente com OPENAI_API_KEY
- [ ] Fase 4: UX
  - [ ] Scrollbar discreta padronizada e tooltip acessível (hover/focus)
- [ ] Fase 5: Observabilidade
  - [ ] Métrica de latência queued→completed consolidada
- [ ] Fase 6: Testes
  - [ ] Unitários/integrados/e2e/carga cobrindo fluxos principais e falhas
- [ ] Fase 7: Deploy/flag/rollback
  - [x] Deploy das funções: `transcribe_audio` e `whisper_processor`
  - [ ] Flag de rollout, smoke tests e plano de rollback

Critérios de aceite finais (End-to-End)
- Ao subir um `.mp3/.wav/.m4a` válido, o botão habilita, o job é criado e processado pelo worker.
- O frontend inicia o polling, e quando `completed`, exibe:
  - Card “Transcrição Original” com toggle Markdown e ações copiar/exportar.
  - Card “Versão do Personagem” com botão Refresh.
- O histórico do usuário contém o registro com `original_text` e, se transformado, `transformed_text`.
- Tooltip explica claramente por que o botão está desabilitado, quando aplicável.
- Logs e métricas mostram sucesso/falha e latência dentro de faixas aceitáveis.

Status atual
- Backend implantado (Edge Functions) e contrato assíncrono ajustado (acionamento automático do worker).
- Segredos principais presentes no Dashboard (PROJECT_URL, SERVICE_ROLE_KEY, OPENAI_API_KEY). WORKER_TOKEN opcional a critério de segurança.
- UI com dois cards e polling pronta. Faltam smoke tests com um arquivo real e configuração do WORKER_TOKEN (se desejar).

Após sua aprovação e respostas, sigo para a execução faseada conforme acima.
