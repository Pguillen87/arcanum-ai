# **Documentação das APIs usadas no projeto**

**Arquivo gerado automaticamente pelo assistente — lista de referências oficiais e resumos rápidos para cada API/serviço.**

**MANDATORY RESEARCH COMPLETED** ✅

---

## 1) Supabase JavaScript Client (supabase-js)
- **Link (docs oficiais)**: https://supabase.com/docs/reference/javascript
- **Resumo**: Cliente JavaScript/TypeScript usado para autenticação, Storage, Realtime e chamadas ao PostgREST. Fornece helpers como `supabase.auth.getSession()`, `supabase.storage.from(...).upload()` e `supabase.from('table').select()`.
- **Aplicação no projeto**: autenticação do usuário, upload de arquivos de áudio ao bucket `audio`, chamadas aos endpoints REST e geração de sessões para Edge Functions.

## 2) Supabase Edge Functions
- **Link (docs oficiais)**: https://supabase.com/docs/guides/functions
- **Resumo**: Edge Functions (baseadas em Deno) usadas para lógica server-side: `trigger_whisper` (proxy/validação) e `whisper_processor` (processamento/ffmpeg/transcrição). Suportam secrets, permissões e logs.
- **Aplicação no projeto**: validar sessão do usuário, proteger o `WORKER_TOKEN`, executar transformações de áudio e chamar serviços externos (OpenAI).

## 3) Supabase REST / PostgREST
- **Link (PostgREST docs)**: https://postgrest.org/en/stable/
- **Link (Supabase REST reference)**: https://supabase.com/docs/reference/javascript/postgrest
- **Resumo**: API REST gerada automaticamente sobre o banco Postgres (utilizada via `supabase.from` e endpoints `/.netlify/functions` ou `rest/v1`). Usada para inserir/consultar `transcription`, `transcription_history` e outras tabelas.

## 4) OpenAI — Speech-to-Text / Whisper
- **Link (docs oficiais OpenAI)**: https://platform.openai.com/docs/guides/speech-to-text
- **Resumo**: API para transcrição de áudio (modelos Whisper e endpoints de áudio). O projeto envia blobs/streams de áudio (WAV/webm/ogg/mp4) para o serviço de transcrição quando aplicável. Também possível usar a API de transcrição local/interna dependendo do worker.
- **Observação de uso**: é importante enviar o `content-type` correto e preferir WAV/PCM quando possível; alguns runtimes (Edge) podem aceitar webm/ogg direto.

## 5) FFmpeg
- **Link (docs oficiais)**: https://ffmpeg.org/documentation.html
- **Resumo**: Ferramenta de linha de comando para conversão/normalização de áudio (webm/ogg/mp4 → wav). No worker `whisper_processor` é usada para garantir formato compatível quando `Deno.run`/ffmpeg está disponível.

## 6) MediaRecorder API (Browser)
- **Link (MDN)**: https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder
- **Resumo**: API nativa do browser para gravar áudio (ou vídeo). Produz blobs com `type` como `audio/webm;codecs=opus` ou `audio/ogg`. No projeto, `AudioRecorder.tsx` utiliza MediaRecorder para gerar o `Blob` que vira `File` e é enviado ao Storage.

## 7) Fetch API (Browser / Deno)
- **Link (MDN Fetch API)**: https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API
- **Resumo**: API padrão para requisições HTTP (frontend e também em Edge Functions). Utilizada para chamar `trigger_whisper`, enviar blob para OpenAI, e para interações REST.

## 8) Deno (runtime das Edge Functions)
- **Link (Deno manual — child processes / Deno.run)**: https://deno.land/manual/runtime/child_processes
- **Resumo**: Supabase Edge Functions rodam em Deno. `Deno.run` pode não estar disponível em todos os ambientes; quando ausente, o worker deve ter fallback (ex.: enviar blob diretamente para OpenAI sem conversão local por ffmpeg).

## 9) React Query (TanStack Query)
- **Link (docs TanStack Query v4)**: https://tanstack.com/query/v4/docs/overview
- **Resumo**: Biblioteca para gerenciamento de estado assíncrono (fetching, caching, invalidation). No projeto é usada para buscar status de transcrição, invalidar cache após eventos de processamento, e para re-fetch/polling.

## 10) React (biblioteca UI)
- **Link (docs oficiais React)**: https://reactjs.org/docs/getting-started.html
- **Resumo**: UI principal; hooks como `useState`, `useEffect`, `useRef` são usados em componentes de gravação e player.

## 11) sonner (toasts)
- **Link (repositório / docs sonner)**: https://github.com/sonner-dev/sonner
- **Resumo**: Biblioteca de notificações (toasts) para feedback ao usuário em ações como upload, erro de transcrição, sucesso.

## 12) Content Security Policy (CSP)
- **Link (MDN CSP)**: https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP
- **Resumo**: CSP afeta reprodução de blobs (media-src). No ambiente de desenvolvimento é comum ver bloqueios quando `default-src 'self'` impede `blob:` media sources. Verificar `meta` vs header e ajustar `media-src blob:` conforme necessário em dev/prod.

## 13) MIME types / audio formats references
- **IANA MIME types**: https://www.iana.org/assignments/media-types/media-types.xhtml
- **Resumo**: Importante para validação de uploads (`audio/webm`, `audio/ogg`, `audio/mp4`, `audio/m4a`, `audio/m4b`, `video/webm`, `video/mp4`). O projeto normaliza alguns `video/*` para `audio/*` antes do upload.

---

### Observações finais
- A pesquisa automática via mecanismo MCP/web_search não retornou resultados relevantes em todas as queries durante minha tentativa automatizada; por isso gerei este arquivo com links canônicos e oficiais conhecidos para cada API listada. Se você quiser, eu posso reexecutar buscas MCP específicas (por exemplo, versões específicas do `supabase-js` ou do `@supabase/supabase-js`), ou adicionar mais APIs (e.g., serviços de observability usados no projeto) — informe e eu atualizo o arquivo.

---

*Gerado em: 2025-11-12*
