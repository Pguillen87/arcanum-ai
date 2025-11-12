## Visão Geral
- Problema: chamadas ao `trigger_whisper` saem sem `Authorization: Bearer`, resultando em 401 (“Missing authorization header”). Ocorre no acionamento inicial (pós-`transcribeAudio`) e no “Tentar novamente”. Além disso, surgiram avisos do React Router e foi registrado um erro de Hooks (já endereçado removendo hook fora de contexto).
- Meta: nunca enviar requests sem token, orientar re-login quando sessão estiver ausente/expirada, manter overlay/UX estáveis.

## Causas Prováveis
- Sessão não estabelecida no browser (o login via CLI não autentica o `supabase-js` no navegador).
- Refresh sem sessão (retorna nulo), e o front ainda enviava request sem atualizar o token.
- Guardas não aplicados em todos os caminhos de trigger.

## Correções Frontend (semântica e UX)
1) Helper de token sem Hooks
- Criar uma função assíncrona simples (sem Hooks) para obter/renovar token: `getValidAccessToken()`
  - `getSession()` → se `null`, `refreshSession()` → `getSession()` novamente;
  - Retorna token ou `null`.

2) Gating de requests
- Em TODOS os pontos que chamam `trigger_whisper`:
  - Se `token === null`, NÃO enviar request; mostrar toast “Sessão inválida” com CTA de re-login.
  - Incluir `apikey: VITE_SUPABASE_ANON_KEY` nos headers (compatibilidade Supabase Edge).
- Aplicar nas duas rotas:
  - Trigger após `transcribeAudio` (pós-queued);
  - `forceWorkerProcessing` (retry manual, incluindo retry após 401).

3) Overlay e estado
- Manter supressão de reabertura após “Fechar”; parar progresso/polling e resetar para o estado pré-transcrição.
- Botão “Tentar novamente” fica disabled quando não há sessão ativa (opcional: exibir um botão “Entrar” ao lado).

4) UX para re-login
- Quando `getValidAccessToken()` retorna `null`, mostrar toast com ação “Entrar novamente” que navega para `/auth` (ou chama `signIn`/magic link conforme fluxo).

## Backend (Supabase Functions)
- Manter exigência de `Authorization: Bearer` em `trigger_whisper` e validação via `admin.auth.getUser(jwt)`.
- Mensagens e logs já estão claros (401/429 com `hint`, e `forward_payload` com `userId/transcriptionId`).
- Secrets verificados no projeto `giozhrukzcqoopssegby`: `PROJECT_URL`, `SERVICE_ROLE_KEY`, `WORKER_TOKEN`, `SUPABASE_ANON_KEY`.

## Testes
- Fluxo feliz: gravar/importar → transcrever → 90% → “Tentar novamente”; Network mostra `Authorization` presente; worker aciona; status progride a `completed`.
- Sessão inválida: “Tentar novamente” exibe toast de re-login; após re-login, funciona.
- Overlay: “Fechar” volta ao estado pré-transcrição sem barra “Processando áudio…” nem reabertura.

## Checklist de Confirmação
- `.env` do front aponta para `https://giozhrukzcqoopssegby.supabase.co` e `VITE_SUPABASE_ANON_KEY` correspondente.
- Browser está autenticado (não apenas CLI): ver `localStorage`/DevTools Application → token presente.
- Todas as chamadas a `functions/v1/trigger_whisper` têm `Authorization`.

## Entregáveis
- Patches no `AudioTranscribeTab.tsx` com helper sem Hooks e gating de requests (inicial + retry), toasts de re-login e inclusão de `apikey`.
- Sem alterações adicionais no backend.

Aprovando, aplico os patches finais e validamos com o plano acima para encerrar o 401 definitivamente.