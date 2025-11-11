import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Mic, Square, RotateCcw } from "lucide-react";
import { normalizeError } from "@/utils/error";
import { formatBytes } from "@/utils/media/formatBytes";
import { AudioPreviewCard } from "./player/AudioPreviewCard";

interface AudioRecorderProps {
  onRecordingComplete: (file: File) => void;
  disabled?: boolean;
  maxDurationSeconds?: number;
  hasPendingAudio?: boolean;
}

interface RecordingTimer {
  minutes: string;
  seconds: string;
}

function formatTimer(totalSeconds: number): RecordingTimer {
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");
  return { minutes, seconds };
}

export function AudioRecorder({
  onRecordingComplete,
  disabled = false,
  maxDurationSeconds = 300,
  hasPendingAudio = false,
}: AudioRecorderProps) {
  const [isSupported, setIsSupported] = useState<boolean>(true);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [hasRecording, setHasRecording] = useState<boolean>(false);
  const [recordedFile, setRecordedFile] = useState<File | null>(null);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const selectedMimeRef = useRef<{ mime: string; extension: string } | null>(null);

  const revokeRecordedUrl = useCallback(() => {
    if (recordedUrl) {
      URL.revokeObjectURL(recordedUrl);
      setRecordedUrl(null);
    }
  }, [recordedUrl]);

  const cleanup = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (mediaRecorderRef.current) {
      if (mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      }
      mediaRecorderRef.current = null;
    }
    chunksRef.current = [];
    selectedMimeRef.current = null;
  }, []);

  useEffect(() => {
    if (!navigator.mediaDevices || typeof MediaRecorder === "undefined") {
      setIsSupported(false);
      return;
    }
    setIsSupported(true);
    return () => {
      cleanup();
      revokeRecordedUrl();
    };
  }, [cleanup, revokeRecordedUrl]);

  const stopRecordingInternal = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
  }, []);

  const handleDataAvailable = useCallback((event: BlobEvent) => {
    if (event.data && event.data.size > 0) {
      chunksRef.current.push(event.data);
    }
  }, []);

  const handleStop = useCallback(() => {
    setIsRecording(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (!chunksRef.current.length) {
      setHasRecording(false);
      toast.error("Nenhum audio capturado", {
        description: "Inicie a gravacao novamente.",
      });
      return;
    }

    const chunkCount = chunksRef.current.length;
    const blob = new Blob(chunksRef.current, {
      type: selectedMimeRef.current?.mime ?? "audio/webm",
    });
    console.debug("[AudioRecorder] blob capturado", {
      chunkCount,
      sizeBytes: blob.size,
      type: blob.type,
    });
    chunksRef.current = [];

    if (blob.size === 0) {
      console.warn("[AudioRecorder] blob vazio", {
        chunkCount,
      });
      setHasRecording(false);
      toast.error("Falha ao capturar audio", {
        description: "O arquivo gerado esta vazio.",
      });
      return;
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const extension = selectedMimeRef.current?.extension ?? "webm";
    const fileName = `gravacao-arcanum-${timestamp}.${extension}`;
    const fileType = selectedMimeRef.current?.mime ?? "audio/webm";
    const file = new File([blob], fileName, { type: fileType });
    console.debug("[AudioRecorder] arquivo gerado", {
      name: file.name,
      sizeBytes: file.size,
      type: file.type,
    });
    revokeRecordedUrl();
    const objectUrl = URL.createObjectURL(file);
    setRecordedUrl(objectUrl);
    setRecordedFile(file);
    setHasRecording(true);
  }, [revokeRecordedUrl]);

  const startRecording = useCallback(async () => {
    if (disabled) return;
    if (hasPendingAudio) {
      toast.info("Remova o audio atual antes de gravar outro.");
      return;
    }
    if (!isSupported) {
      toast.error("Gravacao nao suportada", {
        description: "Seu navegador nao suporta gravacao de audio (MediaRecorder).",
      });
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeCandidates: Array<{ mime: string; extension: string }> = [
        { mime: "audio/webm;codecs=opus", extension: "webm" },
        { mime: "audio/webm", extension: "webm" },
        { mime: "audio/ogg;codecs=opus", extension: "ogg" },
        { mime: "audio/mp4", extension: "m4a" },
      ];

      const selected = mimeCandidates.find((candidate) =>
        MediaRecorder.isTypeSupported(candidate.mime),
      ) ?? { mime: "audio/webm", extension: "webm" };

      console.info("[AudioRecorder] usando codec", selected);

      const mediaRecorder = new MediaRecorder(stream, { mimeType: selected.mime });
      streamRef.current = stream;
      mediaRecorderRef.current = mediaRecorder;
      selectedMimeRef.current = selected;
      chunksRef.current = [];
      setElapsedSeconds(0);
      setIsRecording(true);
      setHasRecording(false);
      setRecordedFile(null);
      revokeRecordedUrl();

      mediaRecorder.addEventListener("dataavailable", handleDataAvailable);
      mediaRecorder.addEventListener("stop", () => {
        mediaRecorder.removeEventListener("dataavailable", handleDataAvailable);
        handleStop();
        cleanup();
      });

      mediaRecorder.start();
      timerRef.current = setInterval(() => {
        setElapsedSeconds((seconds) => {
          const next = seconds + 1;
          if (next >= maxDurationSeconds) {
            stopRecordingInternal();
          }
          return next;
        });
      }, 1000);
    } catch (rawError: unknown) {
      cleanup();
      setIsRecording(false);
      setHasRecording(false);
      setRecordedFile(null);
      revokeRecordedUrl();

      const error = normalizeError(rawError);

      if (error.name === "NotAllowedError") {
        toast.error("Permissao negada", {
          description: "Autorize o uso do microfone nas configuracoes do navegador.",
        });
      } else if (error.name === "NotFoundError") {
        toast.error("Microfone nao encontrado", {
          description: "Conecte um microfone e tente novamente.",
        });
      } else {
        toast.error("Falha ao iniciar a gravacao", {
          description: error.message ?? "Verifique o microfone e tente novamente.",
        });
      }
    }
  }, [cleanup, disabled, handleDataAvailable, handleStop, hasPendingAudio, isSupported, maxDurationSeconds, revokeRecordedUrl, stopRecordingInternal]);

  const stopRecording = useCallback(() => {
    stopRecordingInternal();
  }, [stopRecordingInternal]);

  const discardRecording = useCallback(() => {
    cleanup();
    setIsRecording(false);
    setHasRecording(false);
    setElapsedSeconds(0);
    setRecordedFile(null);
    revokeRecordedUrl();
    toast.info("Gravacao descartada");
  }, [cleanup, revokeRecordedUrl]);

  const handleSaveRecording = useCallback(() => {
    if (!recordedFile) {
      return;
    }
    onRecordingComplete(recordedFile);
    toast.success("Gravacao adicionada ao envio");
    setRecordedFile(null);
    revokeRecordedUrl();
    setHasRecording(false);
    setElapsedSeconds(0);
  }, [onRecordingComplete, recordedFile, revokeRecordedUrl]);

  useEffect(() => {
    return () => {
      cleanup();
      revokeRecordedUrl();
    };
  }, [cleanup, revokeRecordedUrl]);

  if (!isSupported) {
    return (
      <div className="rounded-lg border border-dashed border-border/50 bg-background/60 p-4 text-sm text-muted-foreground">
        Gravacao direta indisponivel neste navegador.
      </div>
    );
  }

  const { minutes, seconds } = formatTimer(elapsedSeconds);

  return (
    <div className="rounded-lg border border-border/60 bg-background/70 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-foreground">Gravar com microfone</h3>
          <p className="text-xs text-muted-foreground">
            Capture audio diretamente do seu microfone (limite de {Math.floor(maxDurationSeconds / 60)} minutos).
          </p>
        </div>
        <div className="text-xs font-mono text-muted-foreground">
          {minutes}:{seconds}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant={isRecording ? "destructive" : "default"}
          size="sm"
          onClick={isRecording ? stopRecording : startRecording}
          disabled={disabled || (hasPendingAudio && !isRecording)}
        >
          {isRecording ? (
            <>
              <Square className="mr-2 h-4 w-4" />
              Parar gravacao
            </>
          ) : (
            <>
              <Mic className="mr-2 h-4 w-4" />
              Iniciar gravacao
            </>
          )}
        </Button>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={discardRecording}
          disabled={isRecording || (!hasRecording && !recordedFile)}
        >
          <RotateCcw className="mr-2 h-4 w-4" />
          Descartar
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        O arquivo gravado sera convertido para `webm` (opus) e anexado automaticamente ao fluxo de transcricao.
      </p>

      {recordedFile && recordedUrl ? (
        <AudioPreviewCard
          title="Gravacao pronta"
          description="Revise antes de enviar para a transcricao."
          fileName={recordedFile.name}
          fileSizeLabel={formatBytes(recordedFile.size)}
          sourceLabel="Gravacao"
          url={recordedUrl}
          onRemove={discardRecording}
          onPrimaryAction={handleSaveRecording}
          primaryLabel="Salvar gravacao"
          downloadFileName={recordedFile.name}
          downloadLabel="Baixar"
        />
      ) : null}
    </div>
  );
}
