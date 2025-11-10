// src/components/teleprompter/CameraPreview.tsx
// Componente de preview da câmera para gravação

import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { mysticalClasses } from '@/lib/mystical-theme';
import { Video, VideoOff } from 'lucide-react';

export interface CameraPreviewProps {
  stream: MediaStream | null;
  isRecording: boolean;
  className?: string;
}

export function CameraPreview({ stream, isRecording, className }: CameraPreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  if (!stream) {
    return (
      <div
        className={cn(
          'w-full aspect-video bg-mystical-deep rounded-lg',
          'flex items-center justify-center',
          'border-2 border-dashed border-mystical-gold/30',
          mysticalClasses.animation['cosmic-pulse'],
          className
        )}
      >
        <div className="text-center space-y-2">
          <VideoOff className="w-12 h-12 mx-auto text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Câmera não disponível</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('relative w-full aspect-video rounded-lg overflow-hidden', className)}>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={cn(
          'w-full h-full object-cover',
          isRecording && mysticalClasses.shadows['mystical-gold']
        )}
      />
      {isRecording && (
        <div className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1.5 bg-red-500 rounded-full">
          <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
          <span className="text-xs font-semibold text-white">GRAVANDO</span>
        </div>
      )}
    </div>
  );
}

