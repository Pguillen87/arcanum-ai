# Plano de Ajustes — Experiência de Gravação e Importação de Áudio

## Visão Geral
- **Problema**: a tela de transcrição permite gravar e importar áudio, mas não oferece recursos de playback/salvamento locais, não apresenta feedback completo ao importar arquivos e rejeita formatos válidos como `.m4a`, gerando frustração e bloqueios.
- **Objetivo**: entregar uma experiência completa de captura, revisão e envio de áudio (tanto gravado quanto importado) com suporte expandido de formatos, mantendo conformidade com o pipeline Supabase/Whisper e explorabilidade pelos times de produto e conteúdo.

## Diagnóstico Atual
- `AudioRecorder` permite iniciar/parar e descartar, mas não armazena o `Blob` para playback ou download.
- `AudioTranscribeTab` limpa o nome do arquivo após a escolha e não apresenta ações de ouvir/salvar/excluir.
- A validação em `useAudioValidation` limita as extensões suportadas, rejeitando `.m4a` e outros formatos comuns de mobile.
- Na função `whisper_processor` apenas `webm/ogg` são convertidos para `wav`; arquivos `.m4a` retornam "Formato de áudio não suportado" e o job é marcado como `failed`.
- Logs indicam erros 400 ao consultar `transcription_history` (coluna `original_text` ausente), afetando o pós-processamento.

## Objetivos Específicos
1. **UX**: ofertar ações de "Ouvir", "Salvar local" e "Excluir" tanto para gravações quanto para uploads.
2. **Fluxo híbrido**: impedir gravação quando já existir arquivo carregado e apresentar o nome/estado do arquivo.
3. **Compatibilidade**: aceitar `.m4a`/`.aac`/`.mp4` gerados em smartphones, convertendo-os no Edge para Whisper.
4. **Governança**: registrar plano para correção do `transcription_history` garantindo consistência dos dados históricos.
5. **Telemetria**: monitorar novas ações (playback, download, exclusão) e erros de conversão.
6. **Arquitetura & Escalabilidade**: preparar o pipeline para volume crescente de uploads simultâneos, controlando recursos de `ffmpeg`/Supabase Functions.
7. **Manutenibilidade**: organizar a base de código para reduzir duplicidades e facilitar evolução.
8. **Confiabilidade Operacional**: instituir testes de carga e playbooks de rollback antes de novos rollouts.

## Escopo e Tarefas

### Fase 1 — UX e Estado do Frontend
- Centralizar o estado do áudio selecionado (gravado ou importado) em `AudioTranscribeTab`, permitindo controle do lifecycle.
- Refatorar `AudioRecorder` para expor callbacks com o `Blob` gravado.
- Atualizar os cards:
  - Adicionar botões "Ouvir", "Baixar" e "Salvar no histórico" (ou "Enviar" quando aplicável) ao bloco de gravação.
  - Mostrar cronômetro e estado atual (gravando, aguardando, reproduzindo).
- Exibir nome do arquivo importado, tamanho e opções (Ouvir, Salvar, Remover).
- Desabilitar `Iniciar gravação` quando existir arquivo carregado; reabilitar ao remover.
- Criação de estado unificado `currentAudioSource = { origin: 'recording' | 'upload', file, url, duration }`.

### Fase 2 — Playback e Persistência Local
- Implementar reprodutor básico com `HTMLAudioElement` usando `URL.createObjectURL`.
- Reutilizar componente `useAudioPlayer` (se existir) ou criar hook (`usePlaybackController`) com play/pause/stop e clamping de volume.
- Viabilizar download via `URL.createObjectURL` + `<a download>`.
- Definir comportamento do botão "Salvar":
  - **Opção A**: enviar arquivo diretamente (mantendo pipeline atual).
  - **Opção B**: armazenar em histórico local do usuário (avaliar viabilidade). *ASSUMED*: manter envio imediato; ação "Salvar" chama `onRecordingComplete` e atualiza tray de arquivos.

### Fase 3 — Validação e Compatibilidade de Formatos
- Atualizar `useAudioValidation` para incluir `.m4a`, `.aac`, `.mp4` e `.m4b` com limites de tamanho.
- Garantir mensagens de erro claras (por exemplo, bitrate muito alto, duração excedida).
- Ajustar testes unitários do hook (Vitest) cobrindo novos formatos.

### Fase 4 — Edge Function e Pipeline de Transcrição
- Estender `convertToWav` em `whisper_processor` para processar contêineres MP4/M4A via `ffmpeg`.
- Adicionar logs estruturados para diferenciar falhas de download/conversão/Whisper.
- Atualizar migrations se necessário para armazenar metadados do arquivo (codec, bit rate).
- Executar smoke test com `.m4a` real (ex: `docs/0406.m4a`).

### Fase 5 — Correção do Histórico
- Revisar schema de `transcription_history`; migration para incluir coluna `original_text` (ou ajustar consulta frontend).
- Ajustar consultas Ka Supabase REST (evitar 400) e atualizar tipos gerados.

### Fase 6 — Observabilidade e Flags
- Instrumentar eventos: `audio_playback_started`, `audio_downloaded`, `audio_saved_local`, `audio_conversion_failed`.
- Adicionar feature flag (ex.: `VITE_FEATURE_AUDIO_ENHANCED=on`) para rollout gradual.
- Definir alertas Supabase (Função > Logs) para erros de conversão.

### Fase 7 — Arquitetura e Escalabilidade Operacional
- Definir limites de paralelismo para o `whisper_processor`, evitando saturação de CPU durante conversões.
- Provisionar workers com vCPU dedicada para `ffmpeg` (tuning de memória/tempo máximo de execução).
- Implementar filas com retries e backoff exponencial para jobs de conversão/transcrição.
- Medir cold start e latência média das funções; usar métricas para ajustar autoscaling e caching de blobs temporários.
- Considerar CDN/local caching para arquivos temporários quando a volumetria crescer.

### Fase 8 — Manutenibilidade e Estrutura de Código
- Criar pasta `src/components/transcription/player/` para componentes relacionados a playback.
- Consolidar utilitários de blobs/arquivos em `src/utils/media` e reutilizar validações entre frontend e backend.
- Documentar contratos de dados (payloads) entre frontend e `whisper_processor`.
- Estabelecer revisão técnica periódica (code review + lint + checklist de duplicidades) a cada incremento.

### Fase 9 — Governança e Testes de Carga
- Construir suíte de testes sintéticos simulando uploads simultâneos e geração de transcrições.
- Validar throughput (QPS, tempo médio de processamento) antes de liberar em produção.
- Manter playbook de rollback para migrations e mudanças críticas de função.
- Registrar checklists de readiness (infraestrutura + UX) antes de cada rollout.

## Fluxo Proposto
```
[Usuário] --(gravar)--> [AudioRecorder] --(blob)--> [AudioTranscribeTab]
     |                                        |
     |-(play)-> [Playback Hook]                |-(salvar)-> [assetsService.uploadFile]
     |-(download)-> [Blob URL]                 |-(remover)-> [clear currentAudioSource]

[Usuário] --(upload)--> [File Input] --(arquivo)--> [Validação] --(ok)--> [Estado Unificado]
```

## Dependências e Impactos
- **Frontend**: `AudioRecorder.tsx`, `AudioTranscribeTab.tsx`, novos hooks/components para playback e UI.
- **Shared**: `useAudioValidation`, `assetsService` (para receber blobs gravados), utilitários em `src/utils/media`.
- **Backend**: `supabase/functions/whisper_processor/index.ts`, migrations de schema/histórico, políticas de RLS.
- **Infra**: garantir `ffmpeg` disponível com codecs AAC, monitoramento das funções Supabase, possíveis ajustes de CDN/storage temporário.

## Testes e Validação
- Unitários: hooks de validação, controller de playback e utilitários de blob.
- Integração: fluxo completo (gravar -> ouvir -> salvar -> transcrever) com cobertura para upload e gravação.
- Edge: deploy em staging e execução de `supabase functions deploy whisper_processor --project-ref <staging>`.
- QA Manual: upload/record em desktop + mobile (iOS/Android) com `.m4a`, `.webm`, `.mp3`.
- Testes de carga: suíte sintética executando N uploads simultâneos com medição de tempos e falhas.

## Riscos e Mitigações
- **Incompatibilidade de codec**: fallback para conversão server-side; validar com media recorder do Safari.
- **Complexidade de UI**: manter componentes modulares (player isolado) e documentar estados.
- **Regression no pipeline**: realizar rollout por flag e monitorar taxa de sucesso.
- **Saturação de recursos**: controlar paralelismo e ajustar autoscaling conforme métricas.
- **Drift de schema**: seguir playbook de rollout/rollback para migrations com testes automáticos.

## Próximos Passos
1. Alinhar escopo com time de Produto/Conteúdo (reunião de 30min). Assumir owners de UI e Supabase.
2. Criar tarefas no board (Fases 1 a 9).
3. Preparar branch `feature/audio-experience-plan` e implementar MVP (Fases 1 + 3) em staging.
4. Documentar decisões e atualizações de migration conforme política DB-Guardian.
5. Estabelecer OKRs de performance (latência, throughput, taxa de sucesso) e configurar suíte de testes sintéticos antes do rollout final.
