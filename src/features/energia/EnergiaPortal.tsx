import { PortalContainer } from "@/components/portals/PortalContainer";
import { CosmicCard } from "@/components/cosmic/CosmicCard";
import { CosmicButton } from "@/components/cosmic/CosmicButton";
import { Zap, Type, Mic, Video, History } from "lucide-react";
import { RuneIcon } from "@/components/cosmic/RuneIcon";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface EnergiaPortalProps {
  onClose: () => void;
}

export const EnergiaPortal = ({ onClose }: EnergiaPortalProps) => {
  return (
    <PortalContainer title="Energia - Transmutação Criativa" onClose={onClose}>
      <Tabs defaultValue="text" className="w-full">
        <TabsList className="grid w-full grid-cols-3 glass-cosmic mb-6">
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
        </TabsList>

        <TabsContent value="text" className="space-y-6">
          <CosmicCard title="Transmutação de Texto" description="GPT + Sua Essência">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <RuneIcon icon={Zap} size="sm" />
                <p className="text-sm text-muted-foreground">
                  Transforme ideias em conteúdo alinhado com sua voz criativa
                </p>
              </div>
              <textarea
                className="w-full min-h-[150px] p-4 glass-cosmic rounded-lg border border-border/30 bg-background/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Digite sua ideia ou prompt..."
              />
              <CosmicButton mystical className="w-full">
                <Zap className="w-4 h-4 mr-2" />
                Transmutar Texto
              </CosmicButton>
            </div>
          </CosmicCard>
        </TabsContent>

        <TabsContent value="audio" className="space-y-6">
          <CosmicCard title="Transmutação de Áudio" description="Whisper + GPT + Sua Essência">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <RuneIcon icon={Mic} size="sm" />
                <p className="text-sm text-muted-foreground">
                  Transcreva áudio e refine com sua voz criativa
                </p>
              </div>
              <div className="p-8 glass-cosmic rounded-lg border-2 border-dashed border-primary/30 text-center">
                <Mic className="w-12 h-12 mx-auto mb-4 text-primary" />
                <p className="text-muted-foreground mb-4">
                  Grave ou faça upload de um arquivo de áudio
                </p>
                <CosmicButton mystical>
                  <Mic className="w-4 h-4 mr-2" />
                  Gravar Áudio
                </CosmicButton>
              </div>
            </div>
          </CosmicCard>
        </TabsContent>

        <TabsContent value="video" className="space-y-6">
          <CosmicCard title="Transmutação de Vídeo" description="Extração + Whisper + GPT">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <RuneIcon icon={Video} size="sm" />
                <p className="text-sm text-muted-foreground">
                  Extraia áudio de vídeo e transmute em conteúdo escrito
                </p>
              </div>
              <div className="p-8 glass-cosmic rounded-lg border-2 border-dashed border-primary/30 text-center">
                <Video className="w-12 h-12 mx-auto mb-4 text-primary" />
                <p className="text-muted-foreground mb-4">
                  Faça upload de um arquivo de vídeo
                </p>
                <CosmicButton mystical>
                  <Video className="w-4 h-4 mr-2" />
                  Upload de Vídeo
                </CosmicButton>
              </div>
            </div>
          </CosmicCard>
        </TabsContent>
      </Tabs>

      {/* History */}
      <CosmicCard title="Histórico de Transmutações" className="mt-6">
        <div className="flex items-center gap-3">
          <RuneIcon icon={History} size="sm" />
          <p className="text-sm text-muted-foreground">
            Suas últimas transmutações aparecerão aqui
          </p>
        </div>
      </CosmicCard>
    </PortalContainer>
  );
};
