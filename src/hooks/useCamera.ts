// src/hooks/useCamera.ts
// Hook para gerenciar acesso à câmera

import { useState, useEffect, useRef, useCallback } from 'react';

export interface UseCameraReturn {
  stream: MediaStream | null;
  isActive: boolean;
  error: Error | null;
  startCamera: () => Promise<void>;
  stopCamera: () => void;
  switchCamera: () => Promise<void>;
}

export function useCamera(constraints?: MediaStreamConstraints): UseCameraReturn {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
      setStream(null);
      setIsActive(false);
    }
  }, []);

  const startCamera = useCallback(async () => {
    try {
      // Parar stream anterior se existir
      stopCamera();

      const videoConstraints: MediaTrackConstraints = {
        facingMode: facingMode,
        width: { ideal: 1920 },
        height: { ideal: 1080 },
        ...(constraints?.video as MediaTrackConstraints),
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: videoConstraints,
        audio: constraints?.audio !== false,
      });

      streamRef.current = mediaStream;
      setStream(mediaStream);
      setIsActive(true);
      setError(null);
    } catch (err: any) {
      setError(err);
      setIsActive(false);
      setStream(null);
    }
  }, [facingMode, constraints, stopCamera]);

  const switchCamera = useCallback(async () => {
    const newFacingMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(newFacingMode);
    
    if (isActive) {
      await startCamera();
    }
  }, [facingMode, isActive, startCamera]);

  // Limpar stream ao desmontar
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  return {
    stream,
    isActive,
    error,
    startCamera,
    stopCamera,
    switchCamera,
  };
}

