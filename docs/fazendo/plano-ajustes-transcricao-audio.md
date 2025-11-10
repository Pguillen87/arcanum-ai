# Plano – Ajustes Portal de Transcrição de Áudio

## 0. Organização inicial
- Verifiquei `docs/Task/fazendo` e não havia pendências para mover; nada foi alterado nas pastas `fazendo`/`feito`.

## 1. Aceitação de arquivos e limites
- Atualizar `AudioTranscribeTab.tsx` para aceitar extensões de áudio comuns (`.mp3`, `.wav`, `.m4a`, `.aac`, `.ogg`, `.flac`, `.mp4`, `.webm`).
- Ajustar `accept` do `<input type="file">` para a lista de extensões e ampliar `validTypes` incluindo `audio/mp4` e `video/mp4`.
- Definir constante `MAX_FILE_SIZE_MB` (ex.: 200MB) e reaproveitar na validação com mensagem clara.

## 2. UI sem “brilho” amarelo
- Substituir `RuneBorder variant="lilac"/"gold"` por versão neutra (`glow={false}`, `borderStyle="solid"`, `showCorners={false}`) tanto no bloco de upload quanto no de transformação com personagem.
- Ajustar classes utilitárias conforme necessário para manter contraste sem o fundo amarelo.

## 3. Disponibilidade do botão “Transcrever Áudio”
- Garantir que `selectedFile` continue sendo setado quando MIME estiver na lista (incluindo mp4) para habilitar o botão.
- Reforçar desabilitação apenas quando `!selectedFile || isUploading || isTranscribing`.
- Exibir mensagens de erro coerentes quando o arquivo for rejeitado (tipo ou tamanho).

## 4. Validação e testes
- Testar manualmente via dev server com arquivos `.mp3`, `.wav`, `.mp4` dentro e acima do limite.
- Revisar testes automatizados relevantes (não existem específicos; executar `npm run test:file -- src/hooks/__tests__/useTranscription.test.ts` se necessário) e validar visualmente no navegador.

## 5. Análise detalhada da experiência atual e melhorias propostas
- **Arquitetura atual**: `AudioTranscribeTab` concentra upload, seleção de idioma e opções de personagem dentro de um único componente. Depende de `useTranscription` (mutations Supabase), `useAssets` (upload), `useCharacters` (lista padrão). Layout usa `CosmicCard` e dois blocos `RuneBorder` com variantes brilhantes.
- **Fluxo funcional**: `handleFileSelect` filtra tipos/tamanho, `handleTranscribe` realiza upload, aciona edge `transcribe_audio` e, opcionalmente, transforma com personagem antes de registrar histórico. Toasts (sonner) comunicam etapas, mas não exibem detalhes de limite tipo/tamanho quando falha.
- **Problemas observados**:
  - Lista de MIME aceita faltando formatos chave (ex.: `audio/mp4`, `video/mp4`, `audio/ogg`, `audio/flac`). Usuários recebem erro silencioso quando selecionam MP4.
  - Limite de 100 MB pode frustrar uploads legítimos; mensagem de erro não destaca valor máximo em MB/GB.
  - Destaques amarelos (`RuneBorder` variante `lilac/gold` com glow) criam distração visual e prejudicam legibilidade; não dialoga com diretrizes de `desing.md` para elegância translúcida.
  - Botão “Transcrever Áudio” desabilita mesmo após seleção de MP4 (por validação rígida), gerando sensação de travamento.
  - Falta rastreamento/telemetria dedicado ao fluxo de áudio (sem `traceId` específico), dificultando diagnósticos.
  - Mensagens de sucesso não apresentam links rápidos para histórico/projeto, reduzindo feedback de conclusão.
- **Melhorias recomendadas**:
  - Criar hook `useAudioValidation` centralizando lista de MIME/extensões (`mp3`, `wav`, `aac`, `ogg`, `flac`, `m4a`, `webm`, `mp4`) e limite `MAX_FILE_SIZE_MB = 200`. Reutilizar em futuras telas (vídeo) e alinhar com `AudioVideoUploadSchema`.
  - Ajustar `RuneBorder` para `glow={false}`, `borderStyle="solid"`, classes neutras (`border-border/60 bg-background/75`) evitando amarelo pulsante; manter aura mística via gradientes sutis e ícones sugeridos em `desing.md` (cristais, portais etéreos).
  - Revisar toasts: ao rejeitar arquivo, exibir lista resumida de formatos aceitos e instruir sobre limite. Ao sucesso, incluir botão “Ver histórico” ou “Abrir texto transformado”.
  - Inserir `Observability.trackEvent` com `audio_transcription_attempt`, `..._success`, `..._failure` e `metric.audio_transcription_success_rate`, sempre enviando `traceId` (`crypto.randomUUID()`), MIME normalizado, tamanho em MB e flag `applyTransformation`.
  - Reduzir responsabilidades de `AudioTranscribeTab` dividindo em subcomponentes (`UploadSection`, `TransformationPanel`, `ActionFooter`); facilita manutenção e evita funções extensas.
  - Garantir que `selectedFile` seja resetado apenas após sucesso; em falhas, manter referência para evitar re-seleção.
  - Preparar código para feedback futuro de progresso (exibir skeleton/loader linear durante upload) e arrastar-e-soltar (estrutura já planejada no hook).
- **Critérios de validação**:
  - MP4 de até 200 MB habilita botão e inicia upload.
  - Bordas livres de animações amarelas mantendo contraste AA.
  - Eventos de observabilidade aparecem em console/logs com traceId correspondente ao request edge.
  - Toasts de erro informam claramente formato/limite; sucesso inclui ação contextual.

## 6. Diagnóstico aprofundado da interface atual (foco segurança, UX e manutenção)
- **Hierarquia visual**: cabeçalho “Transcrever Áudio” e cards subsequentes competem com gradientes fortes (duplo glow lilás/amarelo). Recomendo aplicar contraste suave (bordas sólidas e sombras discretas) para que botões primários e labels sejam foco principal, conforme diretrizes `desing.md`.
- **Legibilidade**: labels e selects têm baixo contraste em relação ao fundo; sugerir aumentar opacidade do texto (`text-foreground/90`) e usar `bg-surface/80` nos inputs para leitura confortável em ambientes claros/escuros.
- **Feedback de estado**: ausência de indicação inline após selecionar arquivo válido. Inserir badge “Arquivo pronto” com ícone de cristal e tamanho em MB; em caso de erro, destacar mensagem abaixo do input (evitar depender apenas de toast).
- **Acessibilidade**: remover animações contínuas (glow amarelo) reduz fadiga visual e ajuda usuários sensíveis a movimento. Garantir foco visível nos campos (outline lilás sólido) para navegação por teclado.
- **Cópia e microtexto**: instruções curtas nos cards (“Aceitamos MP3, WAV, M4A, OGG, FLAC e MP4 até 200 MB”) evitam tentativas inválidas. No painel de personagem, explicar rapidamente que aplicar transformação consome Dracmas (quando política estiver ativa) para alinhar expectativa.
- **Layout responsivo**: em breakpoints menores, `RuneBorder` atual ocupa quase toda largura com espaços negativos; sugiro padding dinâmico (`p-4 sm:p-6`) e grid vertical para tipos/tamanho garantindo alinhamento.
- **Componentização**: destacar oportunidade de extrair `UploadSection`, `TransformationPanel` e `ActionFooter` para reuso em futuras abas (vídeo). Isso reduz riscos de regressão e mantém consistência.
- **Observabilidade**: incluir `traceId` no início da interação (seleção do arquivo) e enviar metadados (tamanho, MIME, personagem escolhido) para monitorar gargalos. Sugerir painel de métricas comparando taxas de sucesso por formato.
- **Tratamento de erros**: encadear try/catch diferencia upload e transcrição; mensagens específicas (“Falha ao subir arquivo para Supabase” vs “Edge transcribe_audio retornou erro”). Registrar `response.status` e `requestId` em logs para correlação backend.
- **Segurança**: sanitizar nome do arquivo exibido (escape HTML) e rejeitar extensões duplas suspeitas (ex.: `.mp3.exe`). Validar tamanho também no backend (edge function) para evitar bypass via alteração de MIME.
- **Performance percebida**: exibir skeleton/loader linear durante upload >3 s e permitir cancelar ação (botão “Cancelar upload” com ícone de runa quebrada) para evitar sensação de travamento.
- **Integração futura**: preparar hooks para suportar áudio em lote (fila) e mostrar saldo de Dracmas antes da transcrição; mantém escalabilidade sem reescrever UI.

## 7. Execução e verificações (09-11-2025)
- Hook `useAudioValidation` criado com regras unificadas, sanitização HTML e bloqueio de extensões duplas, coberto por testes (`npm run test:file -- src/hooks/__tests__/useAudioValidation.test.ts`).
- `AudioTranscribeTab` refatorado em subcomponentes (`UploadSection`, `TransformationPanel`, `TranscribeActionFooter`), reduzindo o arquivo para 241 linhas e removendo bordas luminosas. UI recebe microtextos, badge “Arquivo pronto” e gradientes sutis alinhados ao `desing.md`.
- Consolidado `mediaFormats.ts` com as extensões/MIME de áudio e vídeo; `useAudioValidation` e `UploadSection` agora leem dessa fonte única (MP4 removido da lista de áudio para evitar uploads que contenham vídeo).
- Feedbacks atualizados: mensagens inline + `toast.error` contextuais para validação, upload e transcrição, mantendo o formulário preenchido em falhas.
- Observabilidade integrada com `traceId` (uuid) para eventos `audio_transcription_*` e métrica `metric.audio_transcription_success_rate`, diferenciando estágios (“validation”, “upload”, “transcription”, “unexpected”).
- Testes manuais planejados: validar uploads `.mp3`, `.wav`, `.m4a` < 200 MB e rejeição de arquivos maiores/de extensão suspeita; observar logs no console para confirmar eventos e status.

---

## 8. Análise complementar do funcionamento atual (engenharia)

### Como o código opera hoje (resumo técnico)
- Frontend
  - `AudioTranscribeTab.tsx` orquestra o fluxo: validação → upload para Storage (via `assetsService`) → chamada à Edge `transcribe_audio` (via `transcriptionService`) → eventualmente transformação com personagem → criação de histórico `transcription_history`.
  - `useTranscription.ts` mantém mutations: `transcribeAudio` e `transformTranscription`, invalidando `['transcription_history', user.id]` após sucesso.
  - `transcriptionService.ts`
    - Busca sessão via `supabase.auth.getSession()`; invoca `fetch(${VITE_SUPABASE_URL}/functions/v1/transcribe_audio)` com Authorization Bearer.
    - Espera um retorno contendo `transcriptionId` e `text`; caso `applyTransformation` esteja ativo, chama `transformTranscription` e registra histórico.
    - Se vier apenas `jobId/status`, o fluxo não popula UI imediatamente (não há polling).
  - UI de resultados atuais usa `ResultCard`/`TranscriptionResult.tsx`: exibe texto original e, quando presente, texto transformado; não há Markdown por padrão.
- Backend (Edge)
  - `transcribe_audio` inseriu um job em `transcriptions` com `status='queued'` e retornou `{ jobId, status }`. Há versão atual que captura Authorization e associa `user_id` quando disponível.

### Pontos de atrito identificados
1) Contrato assíncrono x síncrono: frontend espera texto pronto, backend retorna apenas `jobId` (processamento assíncrono). Sem polling em `useTranscriptionStatus`, o card não aparece com conteúdo.
2) Histórico e user_id: se a função Edge não cria o texto e o histórico (ou cria sem `user_id`), a listagem `transcription_history` do usuário fica vazia e nada é renderizado.
3) Transformação acoplada: forçar transformação no mesmo request pode falhar silenciosamente (ex.: personagem ausente), impedindo a criação do histórico básico.
4) UX de scroll: containers com overflow padrão geram barras de rolagem sem estilo do tema.
5) Botão desabilitado sem causa explícita: falta uma função consolidada `getDisabledReason()` que informe via tooltip o motivo de impedimento.

### Recomendações (sem código agora, apenas direção)
- Alinhar contrato: Edge pode retornar `{ jobId }` e o frontend ativar `useTranscriptionStatus(jobId)` para polling de `status/text`; quando `completed`, gerar histórico e então renderizar os dois cards.
- Garantir vinculação ao usuário: toda inserção de transcrição/histórico deve associar `user_id = auth.uid()` via Bearer; sem isso a UI não encontra itens.
- Desacoplar transformação: primeiro registrar transcrição e histórico; a transformação com personagem pode ser uma ação separada (Refresh), reduzindo risco de falhas encadeadas.
- UX de scroll: padronizar containers com classes utilitárias de scroll “discreto” e evitar overflow no wrapper principal.
- Tooltip no botão: implementar matriz de motivos (arquivo ausente, projetoId vazio, tipo inválido, tamanho excedido, processo em andamento) e exibir hint acessível.

### Critérios de aceitação adicionais (engenharia)
- Quando a Edge retornar apenas `{ jobId }`, a página inicia polling (até 2–5 min máx. com backoff) e atualiza automaticamente para `completed` com texto, exibindo card de Original+Markdown e o card de Versão com Refresh.
- `transcription_history` sempre guarda registros com `user_id` e timestamps, permitindo listagem consistente por usuário.
- Tooltip do botão é acionável com teclado (focus) e descreve a causa e a ação sugerida.

---

## 9. Análise adicional — Fluxo de dados, estados e possíveis pontos de falha

### Fluxo esperado (alto nível)
1) Usuário seleciona arquivo válido → validação (tipo/tamanho) aprova → `selectedFile` setado → botão “Transcrever Áudio” habilita.
2) Upload para Storage (assetsService) retorna `assetId`.
3) Edge `transcribe_audio` recebe `{ assetId, language }` e inicia job em `transcriptions` → retorna `{ jobId, status: 'queued' }` (assíncrono) ou `{ transcriptionId, text }` (síncrono, quando houver processamento imediato).
4) Frontend registra histórico (quando `text` está presente) ou inicia polling por `jobId` até `status='completed'` e `text` disponível.
5) UI exibe dois cards: “Texto Original” e “Versão do Personagem” (com Refresh).

### Pontos que podem levar ao “ok mas não aparece nada”
- P1: Função Edge retornando apenas `{ jobId, status }` e frontend esperando `{ transcriptionId, text }` — sem um mecanismo de polling, a UI não tem conteúdo para renderizar.
- P2: Histórico não vinculado ao `user_id` (Bearer ausente/invalidado), então `listHistory()` retorna vazio para o usuário logado.
- P3: `applyTransformation` ativo, mas `characterId` não informado; transformação falha silenciosamente e impede registro do histórico básico.
- P4: Condições de desabilitação do botão/estado de `selectedFile` flutuantes (por validação rígida), impedindo o acionamento do fluxo completo.
- P5: Erros silenciosos na invocação de Edge (CORS/preflight/Authorization), onde o toast exibe sucesso de upload, mas transcrição não foi de fato iniciada.

### Estados e concorrência
- S1: `isUploading` e `isTranscribing` simultâneos podem ocultar toasts/overlays corretos e confundir o usuário.
- S2: `isTransformationPending` com `transformedText=null` precisa de fallback claro (“Gerando fala do personagem…”) para evitar percepção de travamento.
- S3: Invalidação de queries de history deve ocorrer após o backend realmente persistir dados, senão a UI revalida e continua vazia.

### Observabilidade — o que deve ser visto após um fluxo saudável
- `audio_transcription_attempt` (com `traceId`, MIME, tamanho, `applyTransformation`).
- `audio_transcription_success` (com `transformed: boolean`).
- `metric.audio_transcription_success_rate` (success true/false + stage).
- Em caso de falha, presence de `response.status` e `requestId` para correlação com Edge.

### Scrollbar “feia” — prováveis fontes
- Containers com `overflow: auto` herdado em wrappers (ex.: card/section) sem estilização do tema.
- Área de resultados ocupando altura maior que o viewport sem `min-h`/`max-h` consistentes.
- Falta de classes utilitárias de scroll fino (thumb discreto, cores do tema).

---

## 10. Evidências a coletar antes de qualquer alteração
- Network (DevTools):
  - Request para `/functions/v1/transcribe_audio`: método, headers (Authorization Bearer), payload, status e body (confirma se retornou `{ jobId }` ou `{ transcriptionId, text }`).
  - Requests subsequentes para listar `transcriptions` e `transcription_history` (verificar filtros por `user_id`).
- Console:
  - Eventos de Observability com `traceId` em todas as etapas (validation/upload/transcription/unexpected).
- Supabase Dashboard:
  - Logs de execução da Edge `transcribe_audio` (erros, tempo de resposta, body recebido e retorno).
  - Tabela `transcriptions`: confirmação do registro “queued/processing/completed” com `user_id`.
  - Tabela `transcription_history`: inserções com `user_id`, `original_text` e, quando aplicável, `transformed_text`.

---

## 11. Priorização técnica (sem código nesta fase)
- Prioridade 1: Contrato assíncrono → estabelecer/validar polling por `jobId` e garantir `user_id` em todas as inserções.
- Prioridade 2: Hint de desabilitação do botão → mapear causas e definir a mensagem de cada uma.
- Prioridade 3: Scrollbar → catalogar containers com overflow e aplicar padrão do tema.
- Prioridade 4: Observabilidade → revisar obrigatoriedade de `traceId` em todos os eventos e padronizar campos (`mimeType`, `sizeMB`, `requestId`).
