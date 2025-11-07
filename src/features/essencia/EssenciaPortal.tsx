import { PortalContainer } from "@/components/portals/PortalContainer";
import { CosmicCard } from "@/components/cosmic/CosmicCard";
import { CosmicButton } from "@/components/cosmic/CosmicButton";
import { Sparkles, Upload, Library, Eye } from "lucide-react";
import { RuneIcon } from "@/components/cosmic/RuneIcon";

interface EssenciaPortalProps {
  onClose: () => void;
}

export const EssenciaPortal = ({ onClose }: EssenciaPortalProps) => {
  return (
    <PortalContainer title="Essência - DNA Criativo" onClose={onClose}>
      <div className="grid gap-6 md:gap-8">
        {/* Brand Voice Trainer */}
        <CosmicCard
          title="Treinar Voz da Marca"
          description="Capture e codifique a essência única da sua marca"
        >
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <RuneIcon icon={Upload} size="sm" />
              <p className="text-sm text-muted-foreground">
                Faça upload de samples do seu conteúdo (textos, posts, artigos) para que a IA
                aprenda seu estilo único.
              </p>
            </div>
            <CosmicButton mystical className="w-full md:w-auto">
              <Upload className="w-4 h-4 mr-2" />
              Fazer Upload de Samples
            </CosmicButton>
          </div>
        </CosmicCard>

        {/* Voice Library */}
        <CosmicCard
          title="Biblioteca de Vozes"
          description="Suas essências criativas salvas"
        >
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <RuneIcon icon={Library} size="sm" />
              <p className="text-sm text-muted-foreground">
                Gerencie múltiplas vozes de marca para diferentes projetos e contextos.
              </p>
            </div>
            <div className="grid gap-3">
              <div className="p-4 glass-cosmic rounded-lg border border-border/30">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold">Voz Principal</h4>
                    <p className="text-xs text-muted-foreground">Criado em 05 Nov 2025</p>
                  </div>
                  <CosmicButton size="sm" variant="outline">
                    <Eye className="w-4 h-4 mr-2" />
                    Ver
                  </CosmicButton>
                </div>
              </div>
            </div>
          </div>
        </CosmicCard>

        {/* Preview Section */}
        <CosmicCard
          title="Preview da Essência"
          description="Teste sua voz criativa em tempo real"
        >
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <RuneIcon icon={Sparkles} size="sm" />
              <p className="text-sm text-muted-foreground">
                Digite um prompt e veja como a IA escreve no seu estilo.
              </p>
            </div>
            <textarea
              className="w-full min-h-[120px] p-4 glass-cosmic rounded-lg border border-border/30 bg-background/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Digite seu prompt aqui..."
            />
            <CosmicButton mystical>
              <Sparkles className="w-4 h-4 mr-2" />
              Gerar Preview
            </CosmicButton>
          </div>
        </CosmicCard>
      </div>
    </PortalContainer>
  );
};
