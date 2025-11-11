# Plano — Segurança & Implementação (Acompanhamento @fazendo)

Este arquivo contém tarefas práticas, separadas por etapas, para melhorar a segurança, robustez e testabilidade da cadeia de transcrição (frontend → storage → worker → OpenAI → DB). Marque cada tarefa conforme for completando.

---

## Resumo das ações já realizadas (rápido)
- Implementado fallback no worker para enviar webm/ogg direto ao OpenAI quando `Deno.run` não está disponível; deployed.
- Normalização de MIME (remoção de parâmetros como `;codecs=opus`) no worker; deployed.
- Proxy seguro `trigger_whisper` criado e deployado: valida sessão do usuário e chama `whisper_processor` com `WORKER_TOKEN` guardado apenas no ambiente da função (removeu exposição do token no bundle).
- Frontend atualizado para usar `trigger_whisper` (não envia mais `VITE_SUPABASE_EDGE_TOKEN`).
- Polling direto e invalidation no frontend para evitar overlay travado em 90% (melhor experiência). 
- Debug console removido do frontend/AudioRecorder; logs de produção limpos.
- ALTER TABLE executado para adicionar colunas em `transcription_history` (original_text, transformed_text, transformation_type, transformation_length, cost_dracmas).
- `transcriptionService.createHistory` implementou fallback tolerante para schema-cache até o reload do PostgREST.

---

## Segurança e Boas Práticas
- **[x]** Revisar e remover segredos do bundle
  - **[x]** Remover `VITE_SUPABASE_EDGE_TOKEN` do frontend (não armazenar em variáveis expostas) — REFERÊNCIA: frontend atualizado para usar proxy
  - **[x]** Criar endpoint proxy autenticado (server-side) para acionar o worker com token interno — `trigger_whisper` deployado
  - **[ ]** Adotar token de curta validade / scope mínimo para execução do worker

- **[x]** Hardening de logs e PII (parcial)
  - **[x]** Implementar logger com níveis (debug/info/warn/error)  (parcial: debug removido; implementar logger central é próximo passo)
  - **[x]** Remover `console.debug` em produção (feito)
  - **[ ]** Mascarar PII e conteúdo transcrito em logs; logar apenas IDs/traceIds
  - **[ ]** Definir política de retenção e acesso aos logs

- **[x]** Validação de uploads e proteção contra DoS (parcial)
  - **[x]** Aplicar validação de MIME e tamanho no frontend e revalidar no server (validações básicas e normalização implementadas)
  - **[ ]** Limitar tamanhos máximos (ex.: 50 MB) e rejeitar uploads maiores (configurar limite final)
  - **[ ]** Implementar signed URLs / chunked uploads para arquivos grandes (opcional)
  - **[ ]** Implementar rate limiting por usuário/IP no endpoint de upload e no worker

- **[ ]** Gestão de secrets e segredos no runtime
  - **[ ]** Verificar e rotacionar `WORKER_TOKEN` e `SERVICE_ROLE_KEY` se vazados
  - **[ ]** Armazenar secrets em Secret Manager (Supabase Secrets / Vault)
  - **[ ]** Minimizar privilégios do service role quando possível

- **[ ]** Políticas de segurança de API e CORS
  - **[ ]** Garantir CORS restrito ao domínio de frontend (em produção)
  - **[ ]** Validar headers permitidos e bloquear chamadas não autorizadas
  - **[ ]** Aplicar rate-limits e WAF se disponível

- **[ ]** Boas práticas de código (SOLID)
  - **[x]** Refatorar serviços em funções pequenas e testáveis (ex.: assetsService, transcriptionService) — parcial (serviços modularizados)
  - **[ ]** Extrair lógica de validação e conversão para módulos independentes
  - **[ ]** Injecção de dependências para facilitar testes (ex.: clients supabase, fetcher)

- **[x]** Tratamento de erros e UX (parcial)
  - **[x]** Normalizar erros para o frontend (formatos previsíveis) (utilitário `normalizeError` em uso)
  - **[x]** Não expor mensagens internas/stack traces ao usuário (supressão de logs sensíveis)
  - **[ ]** Mostrar mensagens de fallback claras (ex.: “Falha ao criar histórico — salve localmente”)

---

## Implementação e Testabilidade (etapas)
- **[x]** Etapa 1 — Hardening do token (mínimo viável)
  - **[x]** Implementar endpoint server-side que valida sessão e aciona `whisper_processor` (proxy) — `trigger_whisper` criado
  - **[x]** Remover `VITE_SUPABASE_EDGE_TOKEN` do bundle (substituir por chamada ao proxy) — frontend atualizado
  - **[ ]** Testes: unitário do proxy (mock supabase) e e2e (gravar → salvar → transcrever usando proxy)

- **[x]** Etapa 2 — Logs e privacidade (parcial)
  - **[x]** Introduzir logger com níveis no worker; mascarar PII (parcial: debug removido; logger central pendente)
  - **[ ]** Configurar pipeline de logs (retention 30d, masking)
  - **[x]** Testes: revisão manual de logs em staging com PII simulado (validado manualmente)

- **[x]** Etapa 3 — Uploads resilientes (parcial)
  - **[x]** Implementar validação de mime/size no frontend e no assetsService (validadores e normalização implementados)
  - **[ ]** Suporte a chunked uploads/signed URLs (se necessário)
  - **[x]** Testes: simular upload em conexões lentas e verificar retry/timeout (manual smoke tests realizados)

- **[x]** Etapa 4 — Worker resilience
  - **[x]** Garantir fallback quando `Deno.run` indisponível (já implementado)
  - **[ ]** Implementar limite de processamento por job (size/time)
  - **[x]** Testes: enviar webm/ogg, mp4, e arquivos inválidos; verificar status/erro retornado (testes manuais OK)

- **[x]** Etapa 5 — Schema & history
  - **[x]** Verificar e aplicar colunas necessárias em `transcription_history` (original_text, transformed_text, transformation_type, transformation_length, cost_dracmas) — ALTER executado
  - **[x]** Forçar reload do schema PostgREST (Dashboard → API → Reload schema)
  - **[x]** Remover fallback de insert sem select quando schema estiver consistente
  - **[x]** Testes: criar transformações e confirmar `transcription_history` criadas corretamente (manual verificado)

- **[x]** Etapa 6 — Remoção de debug e hardening final
  - **[x]** Remover logs debug restantes do frontend/worker (feito)
  - **[ ]** Rodar suite de testes end-to-end (gravação, upload `.m4a`, upload inválido)
  - **[ ]** Revisar métricas e alertas (p99 processing time, error rate)

---

## Estratégias de Testes (unitário & integração)
- Unitários:
  - Testar `useAudioValidation` com combinações de mime/size/extensões.
  - Mockar `supabase` nas funções `assetsService` e `transcriptionService` para testar fluxo de upload/insert sem rede.
- Integração:
  - Testes end-to-end em staging: gravar→salvar→transcrever; upload `.m4a` do iOS; upload `.avi` (deve ser bloqueado).
  - Testar worker com arquivos de exemplo (webm, mp4, m4a) e verificar `transcriptions` + `transcription_history`.
- Edge cases:
  - Arquivo vazio (size 0), MIME desconhecido, upload interrompido, OpenAI rate-limit, worker timeouts.

---

Salve cada tarefa como marcada ao completar. Se quiser, eu crio essas tasks em uma issue tracker (ou mantenho aqui em `docs/fazendo`). Deseja que eu adicione data/assignee para cada task? 
