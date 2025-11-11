// src/components/transcription/AudioTranscribeTab.tsx
// Componente para upload e transcrição de áudio com integração de characters

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranscription, useTranscriptionStatus } from "@/hooks/useTranscription";
import { useCharacters } from "@/hooks/useCharacters";
import { toast } from "sonner";
import { CosmicCard } from "@/components/cosmic/CosmicCard";
import { useAudioValidation, type AudioValidationMetadata } from "@/hooks/useAudioValidation";
import { Observability } from "@/lib/observability";
import { UploadSection } from "./UploadSection";
import { TransformationPanel } from "./TransformationPanel";
import { TranscribeActionFooter } from "./TranscribeActionFooter";
import { TranscriptionOverlay } from "./TranscriptionOverlay";
import { assetsService } from "@/services/assetsService";
import type { TranscribeRequest, TranscriptionResult } from "@/schemas/transcription";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MarkdownPreview } from "@/components/ui/MarkdownPreview";
import { MysticRecipeTicker } from "./MysticRecipeTicker";
import { Copy, Loader2, Sparkles } from "lucide-react";
import { RuneBorder } from "@/components/ui/mystical";
import { getTranscribeDisabledReason } from "./getTranscribeDisabledReason";
import { AudioRecorder } from "./AudioRecorder";
import { AudioPreviewCard } from "./player/AudioPreviewCard";
import { supabase } from "@/integrations/supabase/client";
import { normalizeError } from "@/utils/error";
import { formatBytes } from "@/utils/media/formatBytes";

interface AudioTranscribeTabProps {
  projectId?: string;
}

const UPLOAD_MESSAGES = [
  "Convocando cristais sonoros...",
  "Abrindo o portal de ondas arcanas...",
  "Alinhando runas de captura sonora...",
];

const TRANSCRIBE_MESSAGES = [
  "Lendo sussurros entre as dimensões...",
  "Convertendo ecos em pergaminhos...",
  "Os arcanos estão traduzindo cada sílaba...",
];

function pickMessage(messages: string[]): string {
  return messages[Math.floor(Math.random() * messages.length)] ?? messages[0];
}

interface ExtendedTranscriptionResult extends TranscriptionResult {
  assetId?: string;
  traceId?: string;
}

interface CurrentAudioSource {
  origin: "upload" | "recording";
  file: File;
  url: string;
  metadata: AudioValidationMetadata | null;
}

function normalizeAudioFile(file: File): File {
  if (file.type === "video/webm") {
    const normalizedName = file.name.toLowerCase().endsWith(".webm") ? file.name : `${file.name}.webm`;
    return new File([file], normalizedName, { type: "audio/webm" });
  }

  if (file.type === "video/mp4") {
    const normalizedName = file.name.toLowerCase().endsWith(".mp4") ? file.name : `${file.name}.mp4`;
    return new File([file], normalizedName, { type: "audio/mp4" });
  }

  return file;
}

export function AudioTranscribeTab({ projectId }: AudioTranscribeTabProps) {
  const { transcribeAudio, transformTranscription, isTranscribing, isTransforming, history } = useTranscription();
  const { characters, defaultCharacter } = useCharacters();
  const { validateAudio, acceptedExtensions, maxSizeMB } = useAudioValidation();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileMetadata, setFileMetadata] = useState<AudioValidationMetadata | null>(null);
  const [validationMessage, setValidationMessage] = useState<string | null>(null);
  const [traceId, setTraceId] = useState<string | null>(null);
  const [language, setLanguage] = useState("pt");
  const [selectedCharacterId, setSelectedCharacterId] = useState<string | undefined>(defaultCharacter?.id);
  const [applyTransformation, setApplyTransformation] = useState(false);
  const [transformationType, setTransformationType] = useState<"post" | "resumo" | "newsletter" | "roteiro">("post");
  const [transformationLength, setTransformationLength] = useState<"short" | "medium" | "long">("medium");

  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStage, setProcessingStage] = useState<"upload" | "transcribe">("upload");
  const [processingOverlayMessage, setProcessingOverlayMessage] = useState(UPLOAD_MESSAGES[0]);
  const [result, setResult] = useState<ExtendedTranscriptionResult | null>(null);
  const [transformedText, setTransformedText] = useState<string | null>(null);
  const [isTransformationPending, setIsTransformationPending] = useState(false);
  const [viewMarkdown, setViewMarkdown] = useState(true);
  const [inputMode, setInputMode] = useState<"upload" | "record">("record");
  const [isNewExperienceEnabled] = useState(
    (import.meta.env.VITE_FEATURE_AUDIO_TRANSCRIPTION_V2 ?? "true") !== "false",
  );
  const [currentAudioSource, setCurrentAudioSource] = useState<CurrentAudioSource | null>(null);
  const lastRequestedLanguage = useRef(language);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioUrlRef = useRef<string | null>(null);
  const lastStatusReportedRef = useRef<string | null>(null);
  const { transcription: liveTranscription, isLoading: isPolling } = useTranscriptionStatus(result?.transcriptionId ?? null);
  const progressIntervalRef = useRef<number | null>(null);
  const [overlayProgress, setOverlayProgress] = useState<number>(0);
  const [processingStartTs, setProcessingStartTs] = useState<number | null>(null);
  const [isStalled, setIsStalled] = useState<boolean>(false);

  const isJobRunning = Boolean(result && (result.status === "queued" || result.status === "processing"));
  const isJobRunningDisplay = isJobRunning || isPolling;

  const disabledReason = getTranscribeDisabledReason({
    selectedFile,
    projectId,
    validationMessage,
    isUploading,
    isTranscribing,
    isJobRunning: isJobRunningDisplay,
    isTransforming,
    applyTransformation,
    selectedCharacterId,
    hasCharacters: characters.length > 0,
  });

  // Considera o texto vindo do resultado inicial e o texto atualizado via polling
  const hasTranscriptionText = Boolean(((result?.text ?? liveTranscription?.text) || "").trim().length > 0);
  const showProcessingMessage = isJobRunning && !hasTranscriptionText;
  const transcriptionFailed = result?.status === "failed";
  const processingStatusMessage =
    result?.status === "queued"
      ? "Aguardando a alquimia começar..."
      : "Os arcanos estão traduzindo cada sílaba para o pergaminho digital.";
  const failureDescription = result?.error ?? liveTranscription?.error ?? "Não conseguimos transcrever este áudio. Tente novamente.";

  const currentHistoryEntry = useMemo(() => {
    if (!result?.transcriptionId) return null;
    return history.find((entry) => entry.transcription_id === result.transcriptionId) ?? null;
  }, [history, result?.transcriptionId]);

  useEffect(() => {
    if (!currentHistoryEntry) return;
    if (currentHistoryEntry.transformed_text) {
      setTransformedText(currentHistoryEntry.transformed_text);
      setIsTransformationPending(false);
    }
  }, [currentHistoryEntry]);

  const releaseAudioSource = useCallback(() => {
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }
  }, []);

  const clearAudioSelection = useCallback(
    (options?: { preserveValidation?: boolean }) => {
      releaseAudioSource();
      setCurrentAudioSource(null);
      setSelectedFile(null);
      setFileMetadata(null);
      if (!options?.preserveValidation) {
        setValidationMessage(null);
      }
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [releaseAudioSource],
  );

  useEffect(() => {
    return () => {
      releaseAudioSource();
    };
  }, [releaseAudioSource]);

  useEffect(() => {
    if (!liveTranscription) return;

    console.debug("[AudioTranscribeTab] liveTranscription polled", {
      transcriptionId: liveTranscription.id ?? result?.transcriptionId ?? null,
      status: liveTranscription.status,
      hasText: Boolean(liveTranscription.text),
      error: liveTranscription.error,
    });

    setResult((previous) => {
      const baseLanguage = previous?.language ?? lastRequestedLanguage.current ?? language;
      const rawDuration = (liveTranscription as Record<string, unknown>)?.["duration_seconds"];
      const durationSeconds = typeof rawDuration === "number" ? Number(rawDuration) : previous?.duration;
      return {
        transcriptionId: liveTranscription.id ?? previous?.transcriptionId ?? "",
        text: liveTranscription.text ?? previous?.text ?? "",
        language: liveTranscription.language ?? baseLanguage,
        duration: durationSeconds,
        status: liveTranscription.status ?? previous?.status ?? "processing",
        error: liveTranscription.error ?? previous?.error,
      };
    });

    const currentStatus = liveTranscription.status ?? null;

    if (currentStatus === "queued" || currentStatus === "processing") {
      setProcessingStage("transcribe");
      setProcessingOverlayMessage(pickMessage(TRANSCRIBE_MESSAGES));
      setIsProcessing(true);
    }
    if (currentStatus === "completed" || currentStatus === "failed") {
      setIsProcessing(false);
      setOverlayProgress(100);
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      setIsStalled(false);

      if (currentStatus === "failed") {
        const errorMessage = liveTranscription.error ?? "Nao foi possivel gerar a transcricao.";
        toast.error("Falha na transcricao", { description: errorMessage });
      }
    }

    if (currentStatus && lastStatusReportedRef.current !== currentStatus) {
      lastStatusReportedRef.current = currentStatus;
      Observability.trackEvent("audio_transcription_status_update", {
        transcriptionId: liveTranscription.id,
        status: currentStatus,
        traceId,
        assetId: liveTranscription.asset_id,
        hasText: Boolean(liveTranscription.text),
        error: liveTranscription.error ?? null,
      });

      if ((currentStatus === "completed" || currentStatus === "failed") && traceId) {
        setTraceId(null);
      }
    }

    if (liveTranscription.status === "failed") {
      toast.error("Transcricao falhou", {
        description: liveTranscription.error ?? "Tente novamente em instantes.",
      });
    }
  }, [language, liveTranscription, traceId, result?.transcriptionId]);

  const handleAudioFileSelection = useCallback(
    (file: File | null, source: "upload" | "recording") => {
      if (!file) {
        clearAudioSelection({ preserveValidation: true });
        setValidationMessage("Nenhum arquivo selecionado");
        return false;
      }

      const normalizedFile = normalizeAudioFile(file);
      const validation = validateAudio(normalizedFile);

      if (!validation.isValid) {
        clearAudioSelection({ preserveValidation: true });
        const errorMessage = validation.error?.message ?? "Falha ao validar o arquivo selecionado";
        setValidationMessage(errorMessage);
        const failureTraceId = crypto.randomUUID();
        setTraceId(failureTraceId);
        Observability.trackEvent("audio_transcription_validation_failure", {
          traceId: failureTraceId,
          reason: validation.error?.code ?? "unknown",
          message: errorMessage,
          mimeType: normalizedFile.type ?? "",
          name: normalizedFile.name ?? null,
          sizeBytes: normalizedFile.size ?? null,
          source,
        });
        toast.error("Arquivo invalido", { description: errorMessage });
        return false;
      }

      const metadata = validation.metadata ?? null;
      releaseAudioSource();
      const objectUrl = URL.createObjectURL(normalizedFile);
      audioUrlRef.current = objectUrl;
      setCurrentAudioSource({
        origin: source,
        file: normalizedFile,
        url: objectUrl,
        metadata,
      });

      setValidationMessage(null);
      setSelectedFile(normalizedFile);
      setFileMetadata(metadata);
      const newTraceId = crypto.randomUUID();
      setTraceId(newTraceId);
      Observability.trackEvent("audio_transcription_file_ready", {
        traceId: newTraceId,
        mimeType: metadata?.mimeType || normalizedFile.type || "",
        extension: metadata?.extension,
        sizeMB: metadata?.sizeMB ?? normalizedFile.size / (1024 * 1024),
        source,
      });

      if (source === "recording") {
        toast.success("Gravacao pronta", {
          description: "Audio capturado. Revise e clique em Transcrever para continuar.",
        });
      }

      return true;
    },
    [clearAudioSelection, releaseAudioSource, validateAudio],
  );

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    handleAudioFileSelection(file, "upload");
    if (event.target) {
      event.target.value = "";
    }
  };

  const handleRecordingComplete = useCallback(
    (file: File) => {
      handleAudioFileSelection(file, "recording");
    },
    [handleAudioFileSelection],
  );

  const handleRemoveAudio = useCallback(() => {
    clearAudioSelection();
    setTraceId(null);
    toast.info("Audio removido");
  }, [clearAudioSelection]);

  const handleChangeInputMode = useCallback(
    (mode: "upload" | "record") => {
      setInputMode((current) => {
        if (current === mode) {
          return current;
        }
        clearAudioSelection();
        return mode;
      });
    },
    [clearAudioSelection],
  );

  useEffect(() => {
    const shouldTransform =
      applyTransformation &&
      isTransformationPending &&
      Boolean(result?.transcriptionId) &&
      Boolean(selectedCharacterId) &&
      liveTranscription?.status === "completed" &&
      Boolean(liveTranscription.text);

    if (!shouldTransform) {
      return;
    }

    let cancelled = false;

    const runTransformation = async () => {
      try {
        const transformed = await transformTranscription({
          transcriptionId: result!.transcriptionId,
          characterId: selectedCharacterId!,
          transformationType,
          transformationLength,
        });

        if (!cancelled) {
          setTransformedText(transformed ?? null);
        }
      } catch (rawError: unknown) {
        if (!cancelled) {
          const error = normalizeError(rawError);
          toast.error("Falha ao transformar o texto", {
            description: error.message ?? "Tente novamente em instantes.",
          });
        }
      } finally {
        if (!cancelled) {
          setIsTransformationPending(false);
        }
      }
    };

    runTransformation();

    return () => {
      cancelled = true;
    };
  }, [
    applyTransformation,
    isTransformationPending,
    liveTranscription?.status,
    liveTranscription?.text,
    result,
    selectedCharacterId,
    transformationLength,
    transformationType,
    transformTranscription,
  ]);

  const handleTranscribe = async () => {
    if (!selectedFile || !currentAudioSource) {
      toast.error("Salve a gravação ou selecione um arquivo de áudio antes de transcrever.");
      return;
    }

    if (!projectId) {
      toast.error("Projeto não configurado", {
        description: "Selecione um projeto válido antes de transcrever o áudio.",
      });
      Observability.trackEvent("audio_transcription_failure", {
        traceId: traceId ?? crypto.randomUUID(),
        stage: "validation",
        reason: "missing_project_id",
      });
      return;
    }

    try {
      lastRequestedLanguage.current = language;
      setIsUploading(true);
      setIsProcessing(true);
      setProcessingStage("upload");
      setProcessingOverlayMessage(pickMessage(UPLOAD_MESSAGES));
      setOverlayProgress(0);
      setProcessingStartTs(Date.now());
      setIsStalled(false);
      setTransformedText(null);
      setIsTransformationPending(applyTransformation && Boolean(selectedCharacterId));

      const activeTraceId = traceId ?? crypto.randomUUID();
      setTraceId(activeTraceId);
      const basePayload = {
        traceId: activeTraceId,
        mimeType: fileMetadata?.mimeType || selectedFile.type || "",
        sizeMB: fileMetadata?.sizeMB ?? selectedFile.size / (1024 * 1024),
        applyTransformation,
        characterId: applyTransformation ? selectedCharacterId ?? null : null,
        language,
      };

      Observability.trackEvent("audio_transcription_attempt", basePayload);
      toast.info("Fazendo upload do arquivo...", { id: "upload" });

      const uploadResult = await assetsService.uploadFile({
        file: selectedFile,
        projectId,
        type: "audio",
        onProgress: (p) => setOverlayProgress(Math.max(0, Math.min(100, Math.round(p))))
      });

      if (uploadResult.error || !uploadResult.data) {
        const failureMessage = uploadResult.error?.message || "Tente novamente";
        toast.error("Falha no upload do áudio", { description: failureMessage });
        Observability.trackEvent("audio_transcription_failure", {
          ...basePayload,
          stage: "upload",
          reason: failureMessage,
          status: uploadResult.error?.status ?? uploadResult.error?.statusCode,
          requestId: uploadResult.error?.requestId ?? uploadResult.error?.id,
        });
        Observability.trackEvent("metric.audio_transcription_success_rate", {
          traceId: activeTraceId,
          success: false,
          stage: "upload",
        });
        return;
      }

      setProcessingStage("transcribe");
      setProcessingOverlayMessage(pickMessage(TRANSCRIBE_MESSAGES));
      if (!isProcessing) {
        setIsProcessing(true);
      }
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      setOverlayProgress((prev) => Math.max(prev, 20));
      progressIntervalRef.current = window.setInterval(() => {
        setOverlayProgress((prev) => {
          const next = prev + Math.random() * 3 + 1;
          return Math.min(next, 90);
        });
      }, 900);

      const params: TranscribeRequest = {
        assetId: uploadResult.data.id,
        language,
        characterId: applyTransformation ? selectedCharacterId : undefined,
        applyTransformation,
        transformationType: applyTransformation ? transformationType : undefined,
        transformationLength: applyTransformation ? transformationLength : undefined,
      };

      let responseData: TranscriptionResult | null = null;
      try {
        responseData = await transcribeAudio(params);
      } catch (error: unknown) {
        const failureMessage =
          error instanceof Error ? error.message : typeof error === "string" ? error : "Tente novamente";
        const failureStatus = typeof (error as { status?: number }).status === "number"
          ? (error as { status?: number }).status
          : undefined;
        const failureRequestId = typeof (error as { requestId?: string }).requestId === "string"
          ? (error as { requestId?: string }).requestId
          : undefined;

        toast.error("Falha na transcrição", { description: failureMessage });
        Observability.trackEvent("audio_transcription_failure", {
          ...basePayload,
          stage: "transcription",
          reason: failureMessage,
          status: failureStatus,
          requestId: failureRequestId,
        });
        Observability.trackEvent("metric.audio_transcription_success_rate", {
          traceId: activeTraceId,
          success: false,
          stage: "transcription",
        });
        return;
      }

      if (responseData) {
        setResult(responseData);

        // Tentar acionar o worker imediatamente para reduzir latência do queued -> processing
        (async () => {
          try {
            const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
            const edgeToken = import.meta.env.VITE_SUPABASE_EDGE_TOKEN;
            if (SUPABASE_URL && edgeToken) {
              const session = await supabase.auth.getSession();
              const bearer = session.data.session?.access_token;
              const headers: Record<string, string> = {
                "Content-Type": "application/json",
                ...(edgeToken ? { "x-edge-token": edgeToken } : {}),
                ...(bearer ? { Authorization: `Bearer ${bearer}` } : {}),
              };
              const triggerResponse = await fetch(`${SUPABASE_URL}/functions/v1/whisper_processor`, {
                method: 'POST',
                headers,
                body: JSON.stringify({ transcriptionId: responseData.transcriptionId }),
              });
              if (!triggerResponse.ok) {
                const raw = await triggerResponse.text();
                console.warn("[AudioTranscribeTab] whisper_processor trigger failed", {
                  transcriptionId: responseData.transcriptionId,
                  status: triggerResponse.status,
                  body: raw,
                });
              } else {
                console.log("[AudioTranscribeTab] whisper_processor trigger dispatched", {
                  transcriptionId: responseData.transcriptionId,
                });
                // Tenta revalidar o status algumas vezes para reduzir janela em queued
                (async () => {
                  const firstAttempt = await checkTranscriptionStatus();
                  let currentStatus = firstAttempt?.status ?? null;
                  for (let attempt = 1; attempt <= 3; attempt += 1) {
                    if (currentStatus === "completed" || currentStatus === "failed") {
                      break;
                    }
                    await new Promise((resolve) => setTimeout(resolve, attempt * 1000));
                    const retryResult = await checkTranscriptionStatus();
                    currentStatus = retryResult?.status ?? currentStatus;
                  }
                })();
              }
            }
          } catch (e) {
            // não bloquear o fluxo principal, apenas logar
            console.warn('[AudioTranscribeTab] could not trigger whisper_processor immediately', e);
          }
        })();
      }

      const hasImmediateText = Boolean(responseData?.text);
      const toastTitle = hasImmediateText
        ? applyTransformation
          ? "Transcrição e transformação concluídas!"
          : "Transcrição concluída!"
        : "Transcrição em andamento";
      const toastDescription = hasImmediateText
        ? applyTransformation
          ? "Texto transformado com sucesso."
          : "Áudio transcrito com sucesso."
        : "Estamos traduzindo o áudio. Avisaremos quando o texto estiver disponível.";

      if (hasImmediateText) {
        setIsProcessing(false);
        setOverlayProgress(100);
      }

      toast.success(toastTitle, { description: toastDescription });
      Observability.trackEvent("audio_transcription_success", {
        ...basePayload,
        transformed: applyTransformation && hasImmediateText,
        status: responseData?.status ?? "queued",
      });
      Observability.trackEvent("metric.audio_transcription_success_rate", {
        traceId: activeTraceId,
        success: true,
      });

      clearAudioSelection();
    } catch (rawError: unknown) {
      const error = normalizeError(rawError);
      toast.error("Erro ao processar", {
        description: error.message || "Tente novamente",
      });
      const activeTraceId = traceId ?? crypto.randomUUID();
      setTraceId(activeTraceId);
      Observability.trackEvent("audio_transcription_failure", {
        traceId: activeTraceId,
        stage: "unexpected",
        reason: error.message || "unknown",
      });
      Observability.trackEvent("metric.audio_transcription_success_rate", {
        traceId: activeTraceId,
        success: false,
        stage: "unexpected",
      });
    } finally {
      setIsUploading(false);
      // Overlay permanece ativo; será desligado pelo polling quando status for completed/failed
    }
  };

  // Timeout gentil: após 120s sem concluir, oferecer ações (rechecar/forçar)
  useEffect(() => {
    if (!isProcessing || !processingStartTs) return;
    const timeoutMs = 120_000; // 2 minutos
    const id = window.setTimeout(() => {
      setIsStalled(true);
    }, timeoutMs);
    return () => window.clearTimeout(id);
  }, [isProcessing, processingStartTs]);

  const checkTranscriptionStatus = async (): Promise<{ status: string | null } | null> => {
    try {
      if (!result?.transcriptionId) return null;
      const { data, error } = await supabase
        .from("transcriptions")
        .select("id, text, status, language, error")
        .eq("id", result.transcriptionId)
        .single();
      if (error) throw error;
      console.debug("[AudioTranscribeTab] checkTranscriptionStatus", {
        transcriptionId: result.transcriptionId,
        status: data.status,
        hasText: Boolean(data.text),
        error: data.error,
      });
      setResult((prev) => ({
        transcriptionId: data.id,
        text: typeof data.text === "string" ? data.text : prev?.text ?? "",
        language: data.language ?? prev?.language ?? "pt",
        duration: prev?.duration,
        status: data.status ?? prev?.status ?? "processing",
        error: typeof data.error === "string" ? data.error : prev?.error ?? null,
      }));
      if (data.status === "completed") {
        setIsProcessing(false);
        setOverlayProgress(100);
        setIsStalled(false);
      }
      return { status: data.status ?? null };
    } catch (rawError: unknown) {
      const error = normalizeError(rawError);
      console.error("[AudioTranscribeTab] checkTranscriptionStatus error", error);
      toast.error("Falha ao checar status", { description: error.message ?? "Tente novamente." });
      return null;
    }
  };

  const forceWorkerProcessing = async () => {
    try {
      if (!result?.transcriptionId) return;
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      const edgeToken = import.meta.env.VITE_SUPABASE_EDGE_TOKEN;
      const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(edgeToken ? { 'x-edge-token': edgeToken } : {}),
      };
      const resp = await fetch(`${SUPABASE_URL}/functions/v1/whisper_processor`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ transcriptionId: result.transcriptionId }),
      });
      const raw = await resp.text();
      if (!resp.ok) {
        if (resp.status === 401) {
          toast.error("Falha ao acionar processamento", {
            description: "Token de execução inválido. Verifique a variável VITE_SUPABASE_EDGE_TOKEN.",
          });
        } else {
          toast.error("Falha ao acionar processamento", { description: raw || `HTTP ${resp.status}` });
        }
        return;
      }
      toast.success("Processamento acionado", { description: "Vamos rechecar o status." });
      await checkTranscriptionStatus();
    } catch (rawError: unknown) {
      const error = normalizeError(rawError);
      toast.error("Erro ao forcar processamento", { description: error.message ?? "Tente novamente." });
    }
  };

  const showTransformationCard = applyTransformation || Boolean(transformedText);

  return (
    <>
      <TranscriptionOverlay
        visible={isProcessing}
        stage={processingStage}
        message={processingOverlayMessage}
        traceId={traceId}
        progress={overlayProgress}
        isStalled={isStalled}
        onRetry={forceWorkerProcessing}
        onCheck={checkTranscriptionStatus}
      />

      <CosmicCard title="Transcrever Áudio" description="Converta áudio em texto e transforme com personagens">
        <div className="space-y-6">
          {inputMode === "record" ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-foreground">Gravar áudio com microfone</p>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleChangeInputMode("upload")}
                  disabled={isUploading || isTranscribing}
                >
                  Importar arquivo
                </Button>
              </div>
              <AudioRecorder
                onRecordingComplete={handleRecordingComplete}
                disabled={isUploading || isTranscribing || isJobRunningDisplay}
                hasPendingAudio={Boolean(currentAudioSource)}
              />
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-foreground">Importar arquivo de áudio</p>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleChangeInputMode("record")}
                  disabled={isUploading || isTranscribing}
                >
                  Usar microfone
                </Button>
              </div>
              <UploadSection
                onSelectFile={handleFileSelect}
                inputRef={fileInputRef}
                selectedFile={selectedFile}
                metadata={fileMetadata}
                validationMessage={validationMessage}
                acceptedExtensions={acceptedExtensions}
                maxSizeMB={maxSizeMB}
                isBusy={isUploading || isTranscribing}
                language={language}
                onLanguageChange={setLanguage}
                isTranscribing={isTranscribing}
              />
            </div>
          )}

          {currentAudioSource ? (
            <AudioPreviewCard
              title={currentAudioSource.origin === "upload" ? "Arquivo importado" : "Gravacao selecionada"}
              description="Revise o audio antes de iniciar a transcricao."
              fileName={currentAudioSource.file.name}
              fileSizeLabel={formatBytes(currentAudioSource.file.size)}
              sourceLabel={currentAudioSource.origin === "upload" ? "Upload" : "Gravacao"}
              url={currentAudioSource.url}
              onRemove={handleRemoveAudio}
              downloadFileName={currentAudioSource.file.name}
              downloadLabel="Baixar"
            />
          ) : null}

          <TransformationPanel
            applyTransformation={applyTransformation}
            disableToggle={isTranscribing || characters.length === 0}
            onToggle={setApplyTransformation}
            characters={characters}
            selectedCharacterId={selectedCharacterId}
            onCharacterChange={(value) => setSelectedCharacterId(value || undefined)}
            transformationType={transformationType}
            onTypeChange={setTransformationType}
            transformationLength={transformationLength}
            onLengthChange={setTransformationLength}
            isTranscribing={isTranscribing}
          />

          <TranscribeActionFooter
            onSubmit={handleTranscribe}
            disabled={Boolean(disabledReason)}
            disabledReason={disabledReason}
            isUploading={isUploading}
            isTranscribing={isTranscribing}
            isJobRunning={isJobRunningDisplay}
            showCharacterAlert={characters.length === 0}
          />

          {result && isNewExperienceEnabled && (
            <div className="space-y-4">
              <MysticRecipeTicker />

              <RuneBorder glow={false} borderStyle="solid" showCorners={false} paddingClass="p-4 sm:p-6" className="bg-background/70 border-border/60">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">Texto Original</h3>
                    <p className="text-sm text-muted-foreground">
                      {transcriptionFailed ? "Não foi possível gerar a transcrição" : "Transcrição direta do áudio"}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigator.clipboard.writeText(result.text)}
                    disabled={!hasTranscriptionText}
                  >
                    <Copy className="w-4 h-4 mr-2" /> Copiar
                  </Button>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <input
                    id="md-view-audio"
                    type="checkbox"
                    checked={viewMarkdown}
                    onChange={(e) => setViewMarkdown(e.target.checked)}
                    aria-controls="audio-transcription-viewer"
                  />
                  <label htmlFor="md-view-audio" className="text-xs text-muted-foreground">
                    Ler em Markdown
                  </label>
                </div>

                {transcriptionFailed ? (
                  <div
                    role="alert"
                    className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive"
                  >
                    <Sparkles className="h-4 w-4" />
                    {failureDescription}
                  </div>
                ) : showProcessingMessage ? (
                  <div
                    role="status"
                    aria-live="polite"
                    className="flex items-center gap-2 rounded-lg border border-dashed border-border/60 bg-background/60 p-4 text-sm text-muted-foreground"
                  >
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {processingStatusMessage}
                  </div>
                ) : viewMarkdown ? (
                  <div
                    id="audio-transcription-viewer"
                    className="min-h-[180px] max-h-[360px] bg-background/60 rounded-md p-3 overflow-y-auto scrollbar-mystic"
                  >
                    <MarkdownPreview markdown={result.text} />
                  </div>
                ) : (
                  <Textarea
                    id="audio-transcription-viewer"
                    value={result.text}
                    readOnly
                    className="min-h-[180px] max-h-[360px] whitespace-pre-wrap scrollbar-mystic"
                  />
                )}
              </RuneBorder>

              {showTransformationCard && (
                <RuneBorder glow={false} borderStyle="solid" showCorners={false} paddingClass="p-4 sm:p-6" className="bg-background/70 border-border/60">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">Texto Transformado</h3>
                      <p className="text-sm text-muted-foreground">
                        {isTransformationPending
                          ? "O personagem está alinhando a voz..."
                          : transformedText
                            ? "Resultado com a essência do personagem"
                            : "Clique em Refresh quando quiser gerar uma nova versão"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigator.clipboard.writeText(transformedText ?? "")}
                        disabled={!transformedText}
                      >
                        <Copy className="w-4 h-4 mr-2" /> Copiar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={
                          isTransforming ||
                          isJobRunningDisplay ||
                          !currentHistoryEntry?.transcription_id ||
                          !selectedCharacterId
                        }
                        onClick={async () => {
                          if (!currentHistoryEntry?.transcription_id || !selectedCharacterId) return;
                          setIsTransformationPending(true);
                          try {
                            const refreshed = await transformTranscription({
                              transcriptionId: currentHistoryEntry.transcription_id,
                              characterId: selectedCharacterId,
                              transformationType,
                              transformationLength,
                            });
                            setTransformedText(refreshed ?? null);
                          } catch (rawError: unknown) {
                            const error = normalizeError(rawError);
                            toast.error("Falha ao transformar o texto", {
                              description: error.message ?? "Tente novamente em instantes.",
                            });
                          } finally {
                            setIsTransformationPending(false);
                          }
                        }}
                      >
                        {isTransforming ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Renovando...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4 mr-2" />
                            Refresh
                          </>
                        )}
                      </Button>
                    </div>
                  </div>

                  {isTransformationPending && !transformedText ? (
                    <div
                      role="status"
                      aria-live="polite"
                      className="flex items-center gap-2 rounded-lg border border-dashed border-border/60 bg-background/60 p-4 text-sm text-muted-foreground"
                    >
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Aguarde alguns instantes enquanto o personagem manifesta a fala.
                    </div>
                  ) : !transformedText && applyTransformation && !hasTranscriptionText ? (
                    <div className="rounded-lg border border-dashed border-border/60 bg-background/60 p-4 text-sm text-muted-foreground">
                      Precisamos concluir a transcrição original antes de aplicar a voz do personagem.
                    </div>
                  ) : viewMarkdown ? (
                    <div className="min-h-[180px] max-h-[360px] bg-background/60 rounded-md p-3 overflow-y-auto scrollbar-mystic">
                      <MarkdownPreview markdown={transformedText ?? ""} />
                    </div>
                  ) : (
                    <Textarea
                      value={transformedText ?? ""}
                      readOnly
                      className="min-h-[180px] max-h-[360px] whitespace-pre-wrap scrollbar-mystic"
                    />
                  )}
                </RuneBorder>
              )}
            </div>
          )}

          {result && !isNewExperienceEnabled && (
            <div className="space-y-4">
              <RuneBorder glow={false} borderStyle="solid" showCorners={false} paddingClass="p-4 sm:p-6" className="bg-background/70 border-border/60">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">Transcrição (modo legado)</h3>
                    <p className="text-sm text-muted-foreground">Visualização simplificada controlada por feature flag.</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigator.clipboard.writeText(result.text)}
                    disabled={!hasTranscriptionText}
                  >
                    <Copy className="w-4 h-4 mr-2" /> Copiar
                  </Button>
                </div>
                <Textarea
                  value={
                    transcriptionFailed
                      ? failureDescription
                      : hasTranscriptionText
                        ? result.text
                        : processingStatusMessage
                  }
                  readOnly
                  className="min-h-[180px] whitespace-pre-wrap scrollbar-mystic"
                />
                {showProcessingMessage && (
                  <p className="mt-2 text-xs text-muted-foreground">{processingStatusMessage}</p>
                )}
              </RuneBorder>

              {showTransformationCard && (
                <RuneBorder glow={false} borderStyle="solid" showCorners={false} paddingClass="p-4 sm:p-6" className="bg-background/70 border-border/60">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">Transformação</h3>
                      <p className="text-sm text-muted-foreground">Versão controlada em rollout — sem markdown.</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={
                        isTransforming ||
                        isJobRunningDisplay ||
                        !currentHistoryEntry?.transcription_id ||
                        !selectedCharacterId
                      }
                      onClick={async () => {
                        if (!currentHistoryEntry?.transcription_id || !selectedCharacterId) return;
                        setIsTransformationPending(true);
                        try {
                          const refreshed = await transformTranscription({
                            transcriptionId: currentHistoryEntry.transcription_id,
                            characterId: selectedCharacterId,
                            transformationType,
                            transformationLength,
                          });
                          setTransformedText(refreshed ?? null);
                        } catch (rawError: unknown) {
                          const error = normalizeError(rawError);
                          toast.error("Falha ao transformar o texto", {
                            description: error.message ?? "Tente novamente em instantes.",
                          });
                        } finally {
                          setIsTransformationPending(false);
                        }
                      }}
                    >
                      {isTransforming ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Renovando...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 mr-2" />
                          Refresh
                        </>
                      )}
                    </Button>
                  </div>

                  <Textarea
                    value={
                      isTransformationPending && !transformedText
                        ? "O personagem está manifestando a nova versão..."
                        : transformedText ?? ""
                    }
                    readOnly
                    className="min-h-[180px] whitespace-pre-wrap scrollbar-mystic"
                  />
                </RuneBorder>
              )}
            </div>
          )}
        </div>
      </CosmicCard>
    </>
  );
}

interface ResultCardProps {
  title: string;
  subtitle: string;
  value: string;
  isLoading?: boolean;
  emptyMessage?: string;
}

function ResultCard({ title, subtitle, value, isLoading = false, emptyMessage }: ResultCardProps) {
  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    toast.success("Texto copiado!");
  };

  return (
    <RuneBorder glow={false} borderStyle="solid" showCorners={false} paddingClass="p-4 sm:p-6" className="bg-background/70 border-border/60">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div>
          <h3 className="text-lg font-semibold text-foreground">{title}</h3>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
        <Button variant="ghost" size="sm" onClick={handleCopy} disabled={!value}>
          <Copy className="w-4 h-4 mr-2" /> Copiar
        </Button>
      </div>

      {isLoading && !value ? (
        <div className="flex items-center gap-2 rounded-lg border border-dashed border-border/60 bg-background/60 p-4 text-sm text-muted-foreground">
          <Sparkles className="h-4 w-4 animate-spin" />
          {emptyMessage ?? "Gerando fala do personagem..."}
        </div>
      ) : (
        <Textarea value={value} readOnly className="min-h-[180px] whitespace-pre-wrap" />
      )}
    </RuneBorder>
  );
}

