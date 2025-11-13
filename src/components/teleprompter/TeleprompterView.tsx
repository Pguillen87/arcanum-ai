// src/components/teleprompter/TeleprompterView.tsx
// Componente principal que integra todos os componentes do teleprompter

import { useState, useEffect, useRef } from 'react';
import { TeleprompterDisplay } from './TeleprompterDisplay';
import { TeleprompterControls } from './TeleprompterControls';
import { CameraPreview } from './CameraPreview';
import { useCamera } from '@/hooks/useCamera';
import { useSpeechDetection } from '@/hooks/useSpeechDetection';
import { useTeleprompter } from '@/hooks/useTeleprompter';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Video, Square, Download, Edit2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { mysticalClasses } from '@/lib/mystical-theme';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

export interface TeleprompterViewProps {
  sessionId?: string;
  initialText?: string;
  projectId?: string;
  onClose?: () => void;
  className?: string;
}

export function TeleprompterView({
  sessionId,
  initialText,
  projectId,
  onClose,
  className,
}: TeleprompterViewProps) {
  const [text, setText] = useState(initialText || '');
  const [isEditingText, setIsEditingText] = useState(false);
  const [scrollSpeed, setScrollSpeed] = useState(50);
  const [fontSize, setFontSize] = useState(24);
  const [textColor, setTextColor] = useState('#ffffff');
  const [backgroundColor, setBackgroundColor] = useState('#000000');
  const [mirrorMode, setMirrorMode] = useState(false);
  const [isPaused, setIsPaused] = useState(true);
  const [speechDetectionEnabled, setSpeechDetectionEnabled] = useState(true);
  const [isRecording, setIsRecording] = useState(false);

  const { stream, isActive, error: cameraError, startCamera, stopCamera, switchCamera } = useCamera({
    video: true,
    audio: true,
  });

  const {
    isSpeaking,
    isPaused: speechPaused,
    volume,
    startDetection,
    stopDetection,
  } = useSpeechDetection({
    silenceThresholdMs: 500,
    volumeThreshold: 30,
    resumeDelayMs: 1000,
  });

  const {
    createSession,
    updateSession,
    loadProjectContent,
    saveVideoRecording,
    isCreating,
    isUpdating,
    isLoadingContent,
    isSavingVideo,
  } = useTeleprompter();

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  // Carregar conteúdo do projeto se projectId fornecido
  useEffect(() => {
    if (projectId && !initialText) {
      loadProjectContent({ projectId })
        .then((content) => {
          if (content) setText(content);
        })
        .catch((err) => {
          toast.error('Erro ao carregar conteúdo do projeto', {
            description: err.message,
          });
        });
    }
  }, [projectId, initialText, loadProjectContent]);

  // Iniciar detecção de fala quando câmera estiver ativa
  useEffect(() => {
    if (stream && speechDetectionEnabled) {
      startDetection(stream);
    } else {
      stopDetection();
    }

    return () => {
      stopDetection();
    };
  }, [stream, speechDetectionEnabled, startDetection, stopDetection]);

  // Pausar scroll quando detecção de fala detectar pausa
  useEffect(() => {
    if (speechDetectionEnabled && speechPaused && !isPaused) {
      setIsPaused(true);
    }
  }, [speechPaused, speechDetectionEnabled, isPaused]);

  // Iniciar câmera ao montar
  useEffect(() => {
    startCamera().catch((err) => {
      toast.error('Erro ao acessar câmera', {
        description: err.message,
      });
    });

    return () => {
      stopCamera();
    };
  }, [startCamera, stopCamera]);

  const handleStartRecording = async () => {
    if (!stream) {
      toast.error('Câmera não disponível');
      return;
    }

    try {
      // Criar sessão se não existir
      let currentSessionId = sessionId;
      if (!currentSessionId) {
        const session = await createSession({
          content_text: text,
          content_source: projectId ? 'project' : 'manual',
          source_id: projectId || undefined,
          scroll_speed: scrollSpeed,
          font_size: fontSize,
          text_color: textColor,
          background_color: backgroundColor,
          mirror_mode: mirrorMode,
          speech_detection_enabled: speechDetectionEnabled,
        });
        currentSessionId = session.id;
      }

      // Iniciar gravação
      recordedChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9',
      });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        
        if (currentSessionId) {
          try {
            await saveVideoRecording({ sessionId: currentSessionId, videoBlob: blob });
            toast.success('Vídeo salvo com sucesso!');
          } catch (err: any) {
            toast.error('Erro ao salvar vídeo', {
              description: err.message,
            });
          }
        }
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
      setIsPaused(false);
      toast.success('Gravação iniciada');
    } catch (err: any) {
      toast.error('Erro ao iniciar gravação', {
        description: err.message,
      });
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(true);
      toast.info('Gravação finalizada');
    }
  };

  const handleReset = () => {
    setIsPaused(true);
    setScrollSpeed(50);
    setFontSize(24);
    setTextColor('#ffffff');
    setBackgroundColor('#000000');
    setMirrorMode(false);
  };

  const handleSaveSettings = async () => {
    if (!sessionId) {
      // Criar nova sessão se não existir
      try {
        const session = await createSession({
          content_text: text,
          content_source: projectId ? 'project' : 'manual',
          source_id: projectId || undefined,
          scroll_speed: scrollSpeed,
          font_size: fontSize,
          text_color: textColor,
          background_color: backgroundColor,
          mirror_mode: mirrorMode,
          speech_detection_enabled: speechDetectionEnabled,
        });
        toast.success('Sessão criada e configurações salvas');
      } catch (err: any) {
        toast.error('Erro ao criar sessão', {
          description: err.message,
        });
      }
      return;
    }

    try {
      await updateSession({
        id: sessionId,
        scroll_speed: scrollSpeed,
        font_size: fontSize,
        text_color: textColor,
        background_color: backgroundColor,
        mirror_mode: mirrorMode,
        speech_detection_enabled: speechDetectionEnabled,
        content_text: text,
      });
      toast.success('Configurações salvas');
    } catch (err: any) {
      toast.error('Erro ao salvar configurações', {
        description: err.message,
      });
    }
  };

  return (
    <div className={cn('grid gap-4 h-full', className)}>
      {/* Header com controles principais */}
      <div className="flex items-center justify-between p-4 glass-cosmic rounded-lg">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold">Teleprompter</h2>
          {cameraError && (
            <p className="text-sm text-destructive">{cameraError.message}</p>
          )}
          {!text && (
            <p className="text-sm text-muted-foreground">Adicione texto para começar</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={isEditingText} onOpenChange={setIsEditingText}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Edit2 className="w-4 h-4 mr-2" />
                Editar Texto
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Editar Texto do Teleprompter</DialogTitle>
              </DialogHeader>
              <Textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={15}
                placeholder="Digite ou cole o texto do teleprompter aqui..."
                className="font-mono"
              />
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsEditingText(false)}>
                  Cancelar
                </Button>
                <Button onClick={() => setIsEditingText(false)}>
                  Salvar
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          {!isActive && (
            <Button
              variant="outline"
              size="sm"
              onClick={startCamera}
            >
              <Video className="w-4 h-4 mr-2" />
              Iniciar Câmera
            </Button>
          )}
          {isActive && (
            <Button
              variant="outline"
              size="sm"
              onClick={switchCamera}
            >
              Trocar Câmera
            </Button>
          )}
          {!isRecording ? (
            <Button
              onClick={handleStartRecording}
              disabled={!isActive || isCreating}
              className={cn(mysticalClasses.glow.gold)}
            >
              <Video className="w-4 h-4 mr-2" />
              {isCreating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Preparando...
                </>
              ) : (
                'Iniciar Gravação'
              )}
            </Button>
          ) : (
            <Button
              onClick={handleStopRecording}
              variant="destructive"
            >
              <Square className="w-4 h-4 mr-2" />
              Parar Gravação
            </Button>
          )}
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              Fechar
            </Button>
          )}
        </div>
      </div>

      {/* Layout principal: Câmera + Teleprompter */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 min-h-0">
        {/* Coluna esquerda: Câmera */}
        <div className="space-y-4">
          <CameraPreview stream={stream} isRecording={isRecording} />
          
          {/* Indicadores de detecção de fala */}
          {speechDetectionEnabled && isActive && (
            <div className="p-4 glass-cosmic rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Detecção de Fala</span>
                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      'w-3 h-3 rounded-full',
                      isSpeaking ? 'bg-green-500 animate-pulse' : 'bg-gray-500'
                    )}
                  />
                  <span className="text-xs text-muted-foreground">
                    {isSpeaking ? 'Falando' : 'Silêncio'}
                  </span>
                </div>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all"
                  style={{ width: `${Math.min(volume, 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Coluna direita: Teleprompter */}
        <div className="space-y-4 flex flex-col min-h-0">
          <div className="flex-1 min-h-0">
            <TeleprompterDisplay
              text={text}
              scrollSpeed={scrollSpeed}
              fontSize={fontSize}
              textColor={textColor}
              backgroundColor={backgroundColor}
              mirrorMode={mirrorMode}
              isPaused={isPaused}
            />
          </div>
        </div>
      </div>

      {/* Controles */}
      <TeleprompterControls
        scrollSpeed={scrollSpeed}
        onScrollSpeedChange={setScrollSpeed}
        fontSize={fontSize}
        onFontSizeChange={setFontSize}
        textColor={textColor}
        onTextColorChange={setTextColor}
        backgroundColor={backgroundColor}
        onBackgroundColorChange={setBackgroundColor}
        mirrorMode={mirrorMode}
        onMirrorModeChange={setMirrorMode}
        isPaused={isPaused}
        onPauseToggle={() => setIsPaused(!isPaused)}
        onReset={handleReset}
        speechDetectionEnabled={speechDetectionEnabled}
        onSpeechDetectionToggle={setSpeechDetectionEnabled}
      />

      {/* Botão de salvar configurações */}
      {sessionId && (
        <div className="flex justify-end">
          <Button
            onClick={handleSaveSettings}
            disabled={isUpdating}
            variant="outline"
          >
            {isUpdating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              'Salvar Configurações'
            )}
          </Button>
        </div>
      )}
    </div>
  );
}

