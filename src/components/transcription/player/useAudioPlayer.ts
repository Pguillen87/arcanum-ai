import { useCallback, useEffect, useRef, useState } from "react";

export type AudioPlayerStatus = "idle" | "playing" | "paused";

const GLOBAL_PLAY_EVENT = "audio-player:play";

interface GlobalPlayEventDetail {
  id: string;
}

export interface UseAudioPlayerOptions {
  src: string | null;
}

export interface AudioPlayerControls {
  status: AudioPlayerStatus;
  duration: number;
  currentTime: number;
  error: string | null;
  play: () => Promise<void>;
  pause: () => void;
  stop: () => void;
  toggle: () => Promise<void>;
  clearError: () => void;
  download: (fileName?: string) => void;
}

export function useAudioPlayer({ src }: UseAudioPlayerOptions): AudioPlayerControls {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [status, setStatus] = useState<AudioPlayerStatus>("idle");
  const [duration, setDuration] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const playerIdRef = useRef<string>(typeof crypto.randomUUID === "function" ? crypto.randomUUID() : Math.random().toString(36).slice(2));

  useEffect(() => {
    setError(null);
  }, [src]);

  useEffect(() => {
    const handleGlobalPlay = (event: Event) => {
      const detail = (event as CustomEvent<GlobalPlayEventDetail>).detail;
      if (!detail || detail.id === playerIdRef.current) {
        return;
      }
      if (audioRef.current && status === "playing") {
        audioRef.current.pause();
      }
    };

    window.addEventListener(GLOBAL_PLAY_EVENT, handleGlobalPlay as EventListener);
    return () => window.removeEventListener(GLOBAL_PLAY_EVENT, handleGlobalPlay as EventListener);
  }, [status]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current.load();
      audioRef.current = null;
    }

    if (!src) {
      setStatus("idle");
      setDuration(0);
      setCurrentTime(0);
      setError(null);
      return;
    }

    const audio = new Audio(src);
    audioRef.current = audio;

    const handlePlay = () => {
      setError(null);
      setStatus("playing");
    };
    const handlePause = () => {
      if (audio.ended) {
        setStatus("idle");
        setCurrentTime(audio.duration);
      } else {
        setStatus("paused");
      }
    };
    const handleEnded = () => {
      setStatus("idle");
      setCurrentTime(audio.duration || 0);
    };
    const handleLoadedMetadata = () => {
      setDuration(audio.duration || 0);
      setCurrentTime(audio.currentTime || 0);
    };
    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime || 0);
    };

    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("timeupdate", handleTimeUpdate);

    return () => {
      audio.pause();
      audio.currentTime = 0;
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audioRef.current = null;
    };
  }, [src]);

  const play = useCallback(async () => {
    if (!audioRef.current) {
      return;
    }
    window.dispatchEvent(new CustomEvent<GlobalPlayEventDetail>(GLOBAL_PLAY_EVENT, {
      detail: { id: playerIdRef.current },
    }));
    try {
      await audioRef.current.play();
      setError(null);
    } catch (unknownError) {
      const message =
        unknownError instanceof DOMException && unknownError.name === "NotSupportedError"
          ? "Seu navegador bloqueou a reprodução deste áudio. Utilize o botão Baixar."
          : unknownError instanceof Error
            ? unknownError.message
            : "Não foi possível reproduzir o áudio.";
      setError(message);
      console.warn("[useAudioPlayer] play error", unknownError);
    }
  }, []);

  const pause = useCallback(() => {
    if (!audioRef.current) {
      return;
    }
    audioRef.current.pause();
  }, []);

  const stop = useCallback(() => {
    if (!audioRef.current) {
      return;
    }
    audioRef.current.pause();
    audioRef.current.currentTime = 0;
    setStatus("idle");
    setCurrentTime(0);
  }, []);

  const toggle = useCallback(async () => {
    if (!audioRef.current) {
      return;
    }
    if (status === "playing") {
      audioRef.current.pause();
      return;
    }
    setError(null);
    await play();
  }, [play, status]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const download = useCallback((fileName?: string) => {
    if (!src) {
      return;
    }
    const anchor = document.createElement("a");
    anchor.href = src;
    anchor.download = fileName ?? "audio-preview";
    anchor.rel = "noopener";
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
  }, [src]);

  return {
    status,
    duration,
    currentTime,
    error,
    play,
    pause,
    stop,
    toggle,
    clearError,
    download,
  };
}
