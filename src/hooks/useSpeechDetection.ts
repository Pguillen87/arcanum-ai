// src/hooks/useSpeechDetection.ts
// Hook para detectar pausas na fala e controlar scroll do teleprompter

import { useState, useEffect, useRef, useCallback } from 'react';

export interface SpeechDetectionConfig {
  silenceThresholdMs?: number; // Tempo de silêncio para considerar pausa
  volumeThreshold?: number; // Volume mínimo (0-100)
  resumeDelayMs?: number; // Delay antes de retomar após pausa
  checkInterval?: number; // Intervalo de verificação (ms)
}

export interface UseSpeechDetectionReturn {
  isSpeaking: boolean;
  isPaused: boolean;
  volume: number;
  startDetection: (stream: MediaStream) => void;
  stopDetection: () => void;
}

export function useSpeechDetection(config: SpeechDetectionConfig = {}): UseSpeechDetectionReturn {
  const {
    silenceThresholdMs = 500,
    volumeThreshold = 30,
    resumeDelayMs = 1000,
    checkInterval = 100,
  } = config;

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [volume, setVolume] = useState(0);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const silenceStartTimeRef = useRef<number | null>(null);
  const intervalRef = useRef<number | null>(null);
  const resumeTimeoutRef = useRef<number | null>(null);

  const startDetection = useCallback((stream: MediaStream) => {
    // Limpar detecção anterior
    stopDetection();

    try {
      // Criar AudioContext
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioContext;

      // Criar analyser
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;

      // Conectar microfone
      const microphone = audioContext.createMediaStreamSource(stream);
      microphone.connect(analyser);

      // Criar array de dados
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      dataArrayRef.current = dataArray;

      // Iniciar detecção
      const checkVolume = () => {
        if (!analyserRef.current || !dataArrayRef.current) return;

        analyserRef.current.getByteFrequencyData(dataArrayRef.current as Uint8Array<ArrayBuffer>);
        
        // Calcular volume médio
        const average = dataArrayRef.current.reduce((a, b) => a + b) / dataArrayRef.current.length;
        setVolume(average);

        // Detectar fala vs silêncio
        if (average >= volumeThreshold) {
          // Fala detectada
          setIsSpeaking(true);
          setIsPaused(false);
          silenceStartTimeRef.current = null;
          
          // Cancelar timeout de retomada se existir
          if (resumeTimeoutRef.current) {
            clearTimeout(resumeTimeoutRef.current);
            resumeTimeoutRef.current = null;
          }
        } else {
          // Silêncio detectado
          setIsSpeaking(false);
          
          const now = Date.now();
          
          if (silenceStartTimeRef.current === null) {
            silenceStartTimeRef.current = now;
          } else {
            const silenceDuration = now - silenceStartTimeRef.current;
            
            if (silenceDuration >= silenceThresholdMs && !isPaused) {
              // Pausar scroll
              setIsPaused(true);
              
              // Agendar retomada
              resumeTimeoutRef.current = window.setTimeout(() => {
                setIsPaused(false);
                resumeTimeoutRef.current = null;
              }, resumeDelayMs);
            }
          }
        }
      };

      intervalRef.current = window.setInterval(checkVolume, checkInterval);
    } catch (err) {
      console.error('Erro ao iniciar detecção de fala:', err);
    }
  }, [silenceThresholdMs, volumeThreshold, resumeDelayMs, checkInterval, isPaused]);

  const stopDetection = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (resumeTimeoutRef.current) {
      clearTimeout(resumeTimeoutRef.current);
      resumeTimeoutRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }

    analyserRef.current = null;
    dataArrayRef.current = null;
    silenceStartTimeRef.current = null;
    setIsSpeaking(false);
    setIsPaused(false);
    setVolume(0);
  }, []);

  // Limpar ao desmontar
  useEffect(() => {
    return () => {
      stopDetection();
    };
  }, [stopDetection]);

  return {
    isSpeaking,
    isPaused,
    volume,
    startDetection,
    stopDetection,
  };
}

