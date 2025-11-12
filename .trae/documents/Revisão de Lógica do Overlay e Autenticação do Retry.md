## Diagnóstico
- O botão "Tentar novamente" retorna 401 com toast “Sessão inválida”; `trigger_whisper` está recusando a sessão.
- O botão "Fechar" fecha e logo reabre o overlay: o efeito de polling reativa o overlay quando `status in ['queued','processing']`.

## Causas Prováveis
- Token ausente/expirado no client: `forceWorkerProcessing` às vezes envia sem `Authorization`.
- Mismatch de projeto/URL: `VITE_SUPABASE_URL` usado pelo client não corresponde ao `PROJECT_URL` das Edge Functions (sessão válida em um projeto, inválida no outro).
- Reabertura do overlay: `useEffect` força `setIsProcessing(true)` toda vez que status é `queued/processing` (mesmo após ação "Fechar").

## Correções Propostas
### 1) Overlay: suprimir reabertura após "Fechar"
- `src/components/transcription/AudioTranscribeTab.tsx:208–213` — só chamar `setIsProcessing(true)` se um flag `overlaySuppressed` estiver falso.
- `handleCloseOverlay` marcar `overlaySuppressed = true`; limpar ao concluir (`completed/failed`) ou ao usuário iniciar nova transcrição.
- Resultado: "Fechar" mantém o overlay oculto enquanto o job continua, sem reabrir sozinho.

### 2) Retry: robustez de autenticação + UX
- Detecção de 401 no `forceWorkerProcessing`: além do toast, exibir CTA “Entrar novamente” (ou instrução explícita de re-login).
- Garantir envio de `Authorization: Bearer <access_token>` sempre; se ausente, não disparar request e mostrar aviso imediato.
- Logar `projectUrlClient` vs `projectUrlFunction` para detectar inconsistência (mostrado em console: `VITE_SUPABASE_URL` e `PROJECT_URL`).

### 3) Backend: validação e observability
- `supabase/functions/trigger_whisper/index.ts` — já migrou para `admin.auth.getUser(jwt)`. Adicionar log do `userId` resolvido e do `transcriptionId` do payload para correlacionar.
- Em 401, retornar `error_code` e `hint` específicos para dev (“token ausente”, “token expirado”, “projeto incorreto”), para guiar correções.

## Testes
- Caso feliz: com sessão válida, "Tentar novamente" aciona o worker e o overlay não reabre após "Fechar".
- Sessão inválida: retry gera 401 e CTA de re-login; após re-login, retry funciona.
- Polling: continua atualizando estado, mas overlay fica suprimido até `completed/failed`.

## Entregáveis
- Patch no `AudioTranscribeTab` com `overlaySuppressed` e ajustes no retry.
- Pequena melhoria de logs no `trigger_whisper` (abrangência e correlação).

Aprovar para aplicar os patches e validar com os testes acima?