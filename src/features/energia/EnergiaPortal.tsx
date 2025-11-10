import { useState, Suspense } from "react";
import { PortalContainer } from "@/components/portals/PortalContainer";
import { CosmicCard } from "@/components/cosmic/CosmicCard";
import { CosmicButton } from "@/components/cosmic/CosmicButton";
import { Zap, Type, Mic, Video, History } from "lucide-react";
import { RuneIcon } from "@/components/cosmic/RuneIcon";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TransformTextPortal } from "@/components/transform/TransformTextPortal";
import { AudioTranscribeTab } from "@/components/transcription/AudioTranscribeTab";
import { VideoTranscribeTab } from "@/components/transcription/VideoTranscribeTab";
import { TranscriptionResult } from "@/components/transcription/TranscriptionResult";
import { TranscriptionHistory } from "@/components/transcription/TranscriptionHistory";
import { useTranscription } from "@/hooks/useTranscription";
import { useProjects } from "@/hooks/useProjects";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { LoadingSpinner } from "@/components/cosmic/LoadingSpinner";

interface EnergiaPortalProps {
  onClose: () => void;
  onNavigateToOrb?: (orbId: string) => void;
}

export const EnergiaPortal = ({ onClose, onNavigateToOrb }: EnergiaPortalProps) => {
  const { history } = useTranscription();
  const { projects } = useProjects();
  const [selectedProjectId, setSelectedProjectId] = useState<string | undefined>(undefined);
  
  // Usar primeiro projeto se disponível
  const defaultProjectId = projects.length > 0 ? projects[0].id : undefined;

  return (
    <ErrorBoundary
      fallback={
        <PortalContainer 
          title="Energia - Transmutação Criativa" 
          onClose={onClose}
          currentOrbId="energia"
          onNavigateToOrb={onNavigateToOrb}
        >
          <div className="p-6 text-center">
            <p className="text-muted-foreground">
              Erro ao carregar portal de energia. Por favor, tente novamente.
            </p>
          </div>
        </PortalContainer>
      }
    >
      <PortalContainer 
        title="Energia - Transmutação Criativa" 
        onClose={onClose}
        currentOrbId="energia"
        onNavigateToOrb={onNavigateToOrb}
      >
      <Tabs defaultValue="text" className="w-full">
        <TabsList className="grid w-full grid-cols-4 glass-cosmic mb-6">
          <TabsTrigger value="text">
            <Type className="w-4 h-4 mr-2" />
            Texto
          </TabsTrigger>
          <TabsTrigger value="audio">
            <Mic className="w-4 h-4 mr-2" />
            Áudio
          </TabsTrigger>
          <TabsTrigger value="video">
            <Video className="w-4 h-4 mr-2" />
            Vídeo
          </TabsTrigger>
          <TabsTrigger value="history">
            <History className="w-4 h-4 mr-2" />
            Histórico
          </TabsTrigger>
        </TabsList>

        <TabsContent value="text" className="space-y-6">
          <ErrorBoundary
            fallback={
              <CosmicCard title="Erro ao carregar transformação de texto">
                <div className="p-6 text-center">
                  <p className="text-muted-foreground mb-4">
                    Não foi possível carregar o portal de transformação de texto.
                  </p>
                  <CosmicButton onClick={() => window.location.reload()}>
                    Recarregar Página
                  </CosmicButton>
                </div>
              </CosmicCard>
            }
          >
            <Suspense fallback={<LoadingSpinner message="Carregando portal de transformação..." size="md" />}>
              <TransformTextPortal />
            </Suspense>
          </ErrorBoundary>
        </TabsContent>

        <TabsContent value="audio" className="space-y-6">
          <AudioTranscribeTab projectId={selectedProjectId || defaultProjectId} />
        </TabsContent>

        <TabsContent value="video" className="space-y-6">
          <VideoTranscribeTab projectId={selectedProjectId || defaultProjectId} />
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <ErrorBoundary
            fallback={
              <CosmicCard title="Erro ao carregar histórico">
                <div className="p-6 text-center">
                  <p className="text-muted-foreground mb-4">
                    Não foi possível carregar o histórico de transcrições.
                  </p>
                  <CosmicButton onClick={() => window.location.reload()}>
                    Recarregar Página
                  </CosmicButton>
                </div>
              </CosmicCard>
            }
          >
            <Suspense fallback={<LoadingSpinner message="Carregando histórico..." size="md" />}>
              <TranscriptionHistory />
            </Suspense>
          </ErrorBoundary>
        </TabsContent>
      </Tabs>
    </PortalContainer>
    </ErrorBoundary>
  );
};
