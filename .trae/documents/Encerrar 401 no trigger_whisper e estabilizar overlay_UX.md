## Diagnóstico
- 401 persistente no `POST /functions/v1/trigger_whisper` com "Missing authorization header". Acontece em duas rotas do front:
  - Acionamento inicial após `transcribeAudio` (`src/components/transcription/AudioTranscribeTab.tsx:540–551`), que envia sem `Authorization` quando o token não existe.
  - Retry manual (`forceWorkerProcessing`, `:759–787`) já tenta refresh, mas pode montar headers com token antigo se não atualizado.
- Backend está correto por segurança (exige `Authorization: Bearer <jwt>`). Funções já publicadas com `admin.auth.getUser(jwt)` e logs.

## Objetivo
- Garantir que NENHUMA chamada a `trigger_whisper` seja feita sem `Authorization`. Se não houver token, tentar `refreshSession()` uma vez e abortar com mensagem clara se continuar sem token.
- Unificar a obtenção de token em um helper para evitar divergências.
- Manter overlay/leitura do estado consistente.

## Alterações Propostas
### Frontend
1) Criar helper `getValidAccessToken()` em `AudioTranscribeTab.tsx`:
- Tenta `supabase.auth.getSession()`;
- Se faltar token, chama `supabase.auth.refreshSession()` e retorna novo token;
- Se ainda não houver, retorna `null`.
2) Usar o helper em todos os pontos que chamam `trigger_whisper`:
- Acionamento inicial (após `transcribeAudio`) em `:540–559` — se `token === null`, não enviar request; fazer apenas polling e logar aviso/toast.
- `forceWorkerProcessing` — substituir a lógica local por chamada ao helper antes de montar headers; sempre atualizar o token após refresh.
3) Adicionar `apikey` opcional (`VITE_SUPABASE_ANON_KEY`) ao header para compatibilidade.
4) Toasts/UX:
- Quando sem token após refresh, mostrar CTA "Entrar novamente" (toast com ação) e não enviar request.

### Backend
- Manter exigência de `Authorization` (não enfraquecer segurança).
- Logs já mostram `userId` e `transcriptionId`; manter.

## Verificações
- Network: todas chamadas a `trigger_whisper` devem conter `Authorization`.
- Fluxo feliz: worker acionado e status avança.
- Sessão expirada: um refresh, senão CTA de re-login.

## Testes
- Manual: gravar/usar arquivo → transcrever → 90% → "Tentar novamente"; verificar headers e progresso.
- Sem sessão: limpar storage → tentar; ver toast de re-login.

## Entregáveis
- Patches no `AudioTranscribeTab.tsx` (helper + uso em dois pontos + toasts/CTA) mantendo estilo e convenções do projeto.
- Sem alterações no backend, apenas verificação de logs.

Aprovar para eu aplicar as mudanças agora e validar com os testes descritos?