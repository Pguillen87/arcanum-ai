# Plano de Ajustes — Experiência de Gravação e Importação de Áudio

## Fase 0 — Diagnóstico Atual
- **[x]** Playback bloqueado por CSP (`blob:` não permitido) gera `NotSupportedError` e impede ouvir/baixar. _Resolvido com CSP atualizada e fallback no player._
- **[x]** Gravação via navegador cria arquivo vazio (`00:00`), indicando problema na captura/conversão dos chunks. _Detectamos blobs vazios e exibimos mensagem imediata no seletor._
- **[x]** Worker Supabase rejeita `.m4a/.mp4` (erro “Formato de áudio não suportado”), apesar da UI permitir. _convertToWav ampliado + bucket configurado._
- **[ ]** Drift de schema em `transcription_history` (colunas `transcription_id`, `cost_dracmas` ausentes) impede histórico.

## Fase 1 — Correção da CSP e Playback
- **[x]** Atualizar CSP para permitir `media-src blob:` e `connect-src blob:`; validar reprodução local.
- **[x]** Ajustar `useAudioPlayer` para capturar e tratar erros (`NotSupportedError`) mostrando fallback.

## Fase 2 — Consistência da Gravação
- **[x]** Inspecionar blobs (`size`, `chunksRef`) antes de salvar; garantir `MediaRecorder` usa codec suportado (`webm` prioritário).
- **[ ]** Manter `AudioPreviewCard` apenas quando o arquivo tiver conteúdo; remover logs após confirmação.

## Fase 3 — Upload e Pré-visualização
- **[x]** Centralizar estado (`currentAudioSource`) com URL válida e permitir baixar/ouvir/remover sem exceções.
- **[x]** Bloquear formato inválido imediatamente na UI (mensagem clara) sem depender do backend.

## Fase 4 — Backend e Pipeline Supabase
- **[x]** Instrumentar `whisper_processor` com logs temporários para checar `asset.mimetype` real.
- **[x]** Estender `convertToWav` para mp4/m4a/m4b/quicktime, testar `ffmpeg` em staging e remover logs.
- **[x]** Atualizar bucket `audio` para aceitar novos MIME types (webm/mp4/m4a/m4b) e alinhar `asset.mimetype` no upload.
- **[x]** Criar/aplicar migrations para alinhar `transcription_history` (colunas ausentes) com rollback/smoke test; regerar tipos TS.

## Fase 5 — Validação Final
- **[ ]** Gravação → ouvir → salvar → transcrever (texto preenchido, histórico criado).
- **[ ]** Upload `.m4a` real → ouvir → transcrever → histórico OK.
- **[ ]** Upload inválido (`.avi`) → bloqueio imediato; conferir ausência de erros no console e nos logs Supabase.
- **[ ]** Remover logs temporários e atualizar observabilidade (eventos `audio_transcription_*`).
