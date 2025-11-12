## Diagnóstico
- 401 “Missing authorization header” ainda ocorre porque há chamadas ao `trigger_whisper` sem `Authorization` — tanto no acionamento inicial pós-`transcribeAudio` quanto no retry.
- Erro de Hooks “Invalid hook call” aparece pois definimos um helper com `useCallback` e ele pode estar sendo avaliado fora do ciclo de renderização (HMR/execução em módulo). A forma mais segura é não usar hooks nesse helper.

## Objetivo
- Garantir que nenhuma chamada ao `trigger_whisper` saia sem `Authorization` e remover a dependência de hooks em helpers utilitários.
- Manter o overlay estável após “Fechar”, sem reabrir nem manter estado de “Processando áudio…”.

## Alterações Propostas (Front)
1) Substituir `getValidAccessToken()` por uma função assíncrona simples (sem hooks):
- `async function getValidAccessTokenPlain()` que usa `supabase.auth.getSession()` e, se preciso, `refreshSession()`, devolvendo token ou `null`.
- Definir no escopo do componente ou módulo sem usar `useCallback`.

2) Usar `getValidAccessTokenPlain()` em todos os pontos que chamam `trigger_whisper`:
- Acionamento inicial pós-`transcribeAudio` — se `token === null`, não enviar request; emitir toast de re-login; manter apenas polling.
- `forceWorkerProcessing` — antes de montar headers, chamar o helper; em 401 retry, chamar novamente o helper; abortar se `null`.
- Incluir `apikey` (`VITE_SUPABASE_ANON_KEY`) opcional no header.

3) Overlay/UX já corrigidos:
- “Fechar” reseta progresso/polling e retorna à tela pré-transcrição; manter o flag para suprimir reabertura.

## Backend (Supabase)
- Sem mudanças: manter exigência de `Authorization: Bearer` em `trigger_whisper`, validação com `admin.auth.getUser(jwt)` e logs.

## Testes
- Network: confirmar `Authorization` presente em todas as chamadas a `trigger_whisper` (inicial + retry).
- Fluxo feliz: worker acionado; status avança a `completed`.
- Sessão inválida: toast com instrução de login; nenhuma requisição sem token é enviada.
- “Fechar”: sem reabertura ou barra “Processando…”.

## Entregáveis
- Patches no `AudioTranscribeTab.tsx` removendo `useCallback` do helper, atualizando chamadas do trigger/retry e mantendo toasts.
- Sem alterações no backend.

Se aprovado, aplico os patches e valido com os testes descritos.