# Plano de Ajustes — Transcrição de Áudio

## Contexto Geral
- A funcionalidade atual de “transmutação” de áudio cria um job na tabela `transcriptions`, mas não persiste o texto resultante nem atualiza o status além de `queued`.
- A interface `AudioTranscribeTab` depende de `result.text` (ou do polling via `useTranscriptionStatus`) para exibir o conteúdo; como o texto não é preenchido, a experiência termina sem mostrar nada ao usuário.
- O histórico (`transcription_history`) só recebe registros quando o texto é conhecido; com o stub atual, nenhum histórico é gravado.

## Diagnóstico Técnico
- Função Edge `transcribe_audio`: insere registro “queued” em `transcriptions`, porém não roda Whisper nem atualiza `text`, `status`, `error`.
- Serviço `transcriptionService.transcribeAudio`: apenas cria histórico se o texto vier na resposta/camada de polling; com resposta vazia, nada é salvo.
- Hook `useTranscriptionStatus`: faz polling, mas encontra sempre `text = null`, logo a UI mostra estado de processamento ou fica vazia mesmo após “concluído”.
- Transformações subsequentes (`transformTranscription`) dependem de `transcriptions.text`; sem texto, nunca executam corretamente.

## Impacto Atual
- Usuário percebe mensagem de sucesso, mas não visualiza a transcrição.
- Nenhuma linha entra em `transcription_history`, comprometendo métricas e reprocessamento.
- Fluxos dependentes de transformação automática não disparam por falta de texto base.

## Ações Necessárias
1. **Processamento Whisper**  
   - Implementar worker/edge que consome o job `transcriptions` (pelo `job_id`), chama Whisper, grava `text`, `duration_seconds`, `status` (`processing` → `completed`/`failed`) e eventual `error`.
   - Garantir idempotência e reprocessamento seguro.
2. **Atualizar Resposta/Callback**  
   - Opcional: devolver texto já na resposta da função para experiências síncronas curtas.  
   - Prioridade: garantir que, após o processamento assíncrono, o polling leia dados persistidos.
3. **Persistir Histórico**  
   - Reaproveitar `transcriptionService.createHistory` no momento em que o texto é gravado (worker) ou ajustar o cliente para detectar mudança de status/texto e criar histórico.
4. **Feedback na UI**  
   - Enquanto o backend não retorna texto imediato, informar claramente que o resultado será carregado ao finalizar o processamento.
   - Opcional: mostrar tempo estimado ou progresso para reduzir frustração.

## Entregáveis por Iteração
- **Iteração 1**: Worker Whisper funcional, atualização de `transcriptions` e logs de observabilidade.
- **Iteração 2**: Escrita automática no `transcription_history`, gatilho para transformações automáticas (quando configuradas).
- **Iteração 3**: Ajustes de UX/UI (estados intermediários, mensagens claras) e testes de carga.

## Métricas & Observabilidade
- Instrumentar eventos: criação de job, início de processamento, conclusão com sucesso/falha, tempo total.
- Monitorar taxa de sucesso (`metric.audio_transcription_success_rate`) e latência média entre `queued` e `completed`.
- Alertas para jobs em `queued/processing` acima de X minutos.

## Riscos e Mitigações
- **Processamento demorado**: adicionar fila/timeout e reintentos controlados.
- **Custos da API Whisper/OpenAI**: limitar tamanho dos arquivos, compressão e controle de paralelismo.
- **Inconsistência de dados**: validar que `transcription_history` só grava após `transcriptions.status = completed`.

## Próximos Passos Imediatos
- Definir arquitetura do worker (Edge Function vs. Supabase Queue/cron).  
- Mapear credenciais necessárias (OpenAI, serviço de armazenamento).  
- Elaborar planos de teste (unitário, integração, ponta a ponta) cobrindo: sucesso, falha, reprocessamento e transformações automáticas.

## Alinhamento de UX com Transmutação de Texto
- Reproduzir o comportamento do `TransformTextPortal`: após a conclusão do job, abrir automaticamente um card “Transmutação do Personagem” reutilizando `TransformResultPanel`, com suporte a refresh e notas de refinamento.
- Renderizar um segundo card “Transcrição Original”, exibindo o texto puro em `MarkdownPreview` para leitura fluida, mantendo botões de copiar/exportar.
- Exibir lista de “Palavras suspeitas” logo abaixo da transcrição original; backend deve fornecer array com termos de baixa confiança ou suposições corrigidas para que a UI destaque/sugira ajustes.
- Garantir que, quando o usuário optar por aplicar personagem durante a transcrição, o fluxo dispare `transformTranscription` assim que `transcriptions.status` passar a `completed`, populando o primeiro card de forma síncrona com o histórico.
- Atualizar mensagens de estado no `AudioTranscribeTab` para informar que os cards surgirão assim que o processamento for concluído, evitando sensação de falha silenciosa.


