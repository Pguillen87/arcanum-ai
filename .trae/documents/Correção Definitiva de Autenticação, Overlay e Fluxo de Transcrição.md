## Visão Geral
- Problema: chamadas ao `trigger_whisper` sem `Authorization: Bearer` causam 401 ("Missing authorization header"). O navegador não está autenticado, e o front ainda cria requisições sem token em pelo menos um caminho (pós-`transcribeAudio`). Há também `ERR_ABORTED` em `profiles` (efeito de navegação/refresh), e avisos do React Router (não críticos).
- Objetivo: nunca enviar requests sem token, guiar re-login quando faltando, estabilizar overlay/UX, manter segurança e qualidade.

## Compreensão do Código Existente
- Front:
  - `AudioTranscribeTab.tsx`: cria job, aciona worker (trigger inicial) e implementa `forceWorkerProcessing` (retry). Overlay tem “Tentar novamente” e “Fechar”. Polling via hook `useTranscriptionStatus`.
  - `AuthContext.tsx`: obtém sessão e carrega `profiles`; pode cancelar requests (ERR_ABORTED) quando navega.
- Back:
  - `trigger_whisper`: valida `Authorization` com `admin.auth.getUser(jwt)`; rate limit; forward com `WORKER_TOKEN`.
  - `whisper_processor`: valida `x-edge-token`; processa, atualiza `transcriptions`, cria `transcription_history`.
- Padrões/convenções: uso de `supabase-js v2`, headers explícitos, logs estruturados, overlay com guardes.

## Causas Raiz (listadas)
1. Sessão ausente no browser (login via CLI não cria sessão do `supabase-js` no navegador).
2. Caminho pós-`transcribeAudio` envia trigger sem verificar token (headers criados mesmo quando `bearer` é `null`).
3. Fluxo de retry manual está ok (aborta sem token), mas precisa CTA claro de re-login.
4. `ERR_ABORTED` em `profiles` é efeito colateral de cancelamento; não é causa principal.

## Análise Abrangente
- Sem `Authorization`, o backend corretamente nega acesso (segurança). A experiência precisa evitar tais chamadas e instruir o usuário a entrar.
- Overlay deve respeitar a intenção do usuário ao fechar (sem status visual de processamento). Polling continua, mas UI não deve sugerir processamento.

## Correções Propostas (sem alterar segurança)
- Front:
  - Gating absoluto: em todos os `fetch` para `trigger_whisper`, só enviar se `getValidAccessToken()` retornar token; caso contrário, mostrar toast “Sessão inválida” com ação “Entrar novamente” (navegar para `/auth`).
  - No trigger inicial (pós-`transcribeAudio`): remover a chamada quando `bearer===null`; manter apenas polling ou oferecer “Entrar” no overlay.
  - `forceWorkerProcessing`: manter o abort quando sem token e adicionar CTA explícito de re-login.
  - Overlay: desabilitar “Tentar novamente” quando `getValidAccessToken()` retornar `null` (estado `isRetrying` ou flag `hasSession`).
- Back:
  - Sem mudanças: manter exigência de `Authorization` e validação; rate limit e logs.

## Logs/Pontos de Depuração
- Front (DevTools → Network):
  - Verificar headers dos `POST /functions/v1/trigger_whisper` (sempre `Authorization`, `apikey`).
  - Confirmar cURL do request que falha com 401.
- Back (Dashboard → Functions):
  - Logs de `trigger_whisper`: `request_received`, `session_validation_failed`, `forward_payload {userId, transcriptionId}`.
  - Logs de `whisper_processor`: se recebeu a chamada.

## Abordagens e Comparação
- A1 (Recomendada): Gating no front + validação no back.
  - Prós: segura, auditável, não envia requests inválidos.
  - Contras: requer re-login quando sessão expira.
- A2: Permitir trigger sem user token (apenas `WORKER_TOKEN`).
  - Prós: elimina 401 no dev.
  - Contras: inseguro; rejeitado.
- A3: Sessão via cookie e confiar no cookie.
  - Prós: menos cabeçalhos.
  - Contras: mais frágil em dev/CORS; não alinha com padrão atual.

## Gargalos/Performance
- Evitar múltiplos cliques e chamadas redundantes (guard por refs e `disabled`).
- Polling com backoff moderado quando `queued/processing`.
- Rate limit no back já protege contra abuso; logs ajudam na investigação.

## Testes
- Fluxo feliz: transcrever → 90% → “Tentar novamente” (com sessão) → worker aciona → `completed`.
- Sessão inválida: “Tentar novamente” mostra CTA “Entrar novamente”; após login, funciona.
- Overlay: “Fechar” retorna à tela sem “Processando…”.

## Documentação/Manutenibilidade
- Adicionar nota no README: login do app é necessário; login via CLI não cria sessão do browser.
- Registrar comportamento dos toasts e CTA de re-login.

## Próximas Ações
1) Aplicar gating absoluto no trigger inicial: não enviar sem token; CTA de re-login.
2) Manter/validar gating no retry manual com CTA.
3) Validar no Network que `Authorization` aparece sempre; coletar cURL e logs em caso de falha.
4) Se necessário, suavizar `AuthContext` para cancelar `profiles` com `AbortController` e evitar `ERR_ABORTED` visível.

Aprovar para eu aplicar os ajustes no front e validar com os testes acima.