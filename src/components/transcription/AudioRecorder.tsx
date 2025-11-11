import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Mic, Square, RotateCcw } from "lucide-react";
import { normalizeError } from "@/utils/error";

interface AudioRecorderProps {
  onRecordingComplete: (file: File) => void;
  disabled?: boolean;
  maxDurationSeconds?: number;
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
}: AudioRecorderProps) {
  const [isSupported, setIsSupported] = useState<boolean>(true);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [hasRecording, setHasRecording] = useState<boolean>(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const selectedMimeRef = useRef<{ mime: string; extension: string } | null>(null);

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
    };
  }, [cleanup]);

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
      toast.error("Nenhum áudio capturado", {
        description: "Inicie a gravação novamente.",
      });
      return;
    }

    const blob = new Blob(chunksRef.current, {
      type: selectedMimeRef.current?.mime ?? "audio/webm",
    });
    chunksRef.current = [];

    if (blob.size === 0) {
      setHasRecording(false);
      toast.error("Falha ao capturar áudio", {
        description: "O arquivo gerado está vazio.",
      });
      return;
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const extension = selectedMimeRef.current?.extension ?? "webm";
    const fileName = `gravacao-arcanum-${timestamp}.${extension}`;
    const fileType = selectedMimeRef.current?.mime ?? "audio/webm";
    const file = new File([blob], fileName, { type: fileType });
    setHasRecording(true);
    onRecordingComplete(file);
  }, [onRecordingComplete]);

  const startRecording = useCallback(async () => {
    if (disabled) return;
    if (!isSupported) {
      toast.error("Gravação não suportada", {
        description: "Seu navegador não suporta gravação de áudio (MediaRecorder).",
      });
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeCandidates: Array<{ mime: string; extension: string }> = [
        { mime: "audio/mp4", extension: "m4a" },
        { mime: "audio/webm;codecs=opus", extension: "webm" },
        { mime: "audio/ogg;codecs=opus", extension: "ogg" },
        { mime: "audio/webm", extension: "webm" },
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
  }, [cleanup, disabled, handleDataAvailable, handleStop, isSupported, maxDurationSeconds, stopRecordingInternal]);

  const stopRecording = useCallback(() => {
    stopRecordingInternal();
  }, [stopRecordingInternal]);

  const discardRecording = useCallback(() => {
    cleanup();
    setIsRecording(false);
    setHasRecording(false);
    setElapsedSeconds(0);
    toast.info("Gravação descartada");
  }, [cleanup]);

  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  if (!isSupported) {
    return (
      <div className="rounded-lg border border-dashed border-border/50 bg-background/60 p-4 text-sm text-muted-foreground">
        Gravação direta indisponível neste navegador.
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
            Capture áudio diretamente do seu microfone (limite de {Math.floor(maxDurationSeconds / 60)} minutos).
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
          disabled={disabled}
        >
          {isRecording ? (
            <>
              <Square className="mr-2 h-4 w-4" />
              Parar gravação
            </>
          ) : (
            <>
              <Mic className="mr-2 h-4 w-4" />
              Iniciar gravação
            </>
          )}
        </Button>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={discardRecording}
          disabled={isRecording || !hasRecording}
        >
          <RotateCcw className="mr-2 h-4 w-4" />
          Descartar
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        O arquivo gravado será convertido para `webm` (opus) e anexado automaticamente ao fluxo de transcrição.
      </p>
    </div>
  );
}
