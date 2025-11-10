import { PortalContainer } from "@/components/portals/PortalContainer";
import { CosmicCard } from "@/components/cosmic/CosmicCard";
import { CosmicButton } from "@/components/cosmic/CosmicButton";
import { Stars, Lightbulb, CreditCard, FolderOpen, BarChart3 } from "lucide-react";
import { RuneIcon } from "@/components/cosmic/RuneIcon";
import { Badge } from "@/components/ui/badge";
import { ErrorBoundary } from "@/components/ErrorBoundary";

interface CosmosPortalProps {
  onClose: () => void;
  onNavigateToOrb?: (orbId: string) => void;
}

export const CosmosPortal = ({ onClose, onNavigateToOrb }: CosmosPortalProps) => {
  return (
    <ErrorBoundary
      fallback={
        <PortalContainer 
          title="Cosmos - Visão Universal" 
          onClose={onClose}
          currentOrbId="cosmos"
          onNavigateToOrb={onNavigateToOrb}
        >
          <div className="p-6 text-center">
            <p className="text-muted-foreground">
              Erro ao carregar portal de cosmos. Por favor, tente novamente.
            </p>
          </div>
        </PortalContainer>
      }
    >
      <PortalContainer 
        title="Cosmos - Visão Universal" 
        onClose={onClose}
        currentOrbId="cosmos"
        onNavigateToOrb={onNavigateToOrb}
      >
      <div className="grid gap-6 md:gap-8">
        {/* Inspiration of the Day */}
        <CosmicCard glow>
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <RuneIcon icon={Lightbulb} size="md" />
              <h3 className="text-xl font-bold">Inspiração do Dia</h3>
            </div>
            <div className="p-6 glass-cosmic rounded-lg border-2 border-primary/30">
              <p className="text-lg italic text-foreground mb-4">
                "A criatividade é a inteligência se divertindo."
              </p>
              <p className="text-sm text-muted-foreground text-right">— Albert Einstein</p>
            </div>
          </div>
        </CosmicCard>

        {/* Credits Manager */}
        <CosmicCard
          title="Gerenciador de Créditos"
          description="Controle seu poder de transmutação"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 glass-cosmic rounded-lg">
              <div className="flex items-center gap-3">
                <RuneIcon icon={CreditCard} size="sm" />
                <div>
                  <p className="font-semibold">Saldo Atual</p>
                  <p className="text-xs text-muted-foreground">Créditos disponíveis</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-primary">250</p>
                <Badge className="mt-1 bg-secondary/20 text-secondary">Créditos</Badge>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
              <div className="p-3 glass-cosmic rounded-lg text-center">
                <p className="text-muted-foreground mb-1">Texto</p>
                <p className="font-bold">1 crédito</p>
              </div>
              <div className="p-3 glass-cosmic rounded-lg text-center">
                <p className="text-muted-foreground mb-1">Áudio</p>
                <p className="font-bold">2 créditos</p>
              </div>
              <div className="p-3 glass-cosmic rounded-lg text-center">
                <p className="text-muted-foreground mb-1">Vídeo</p>
                <p className="font-bold">5 créditos</p>
              </div>
            </div>

            <CosmicButton mystical className="w-full">
              <CreditCard className="w-4 h-4 mr-2" />
              Comprar Créditos
            </CosmicButton>
          </div>
        </CosmicCard>

        {/* Projects Dashboard */}
        <CosmicCard
          title="Painel de Projetos"
          description="Seus universos criativos"
        >
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <RuneIcon icon={FolderOpen} size="sm" />
              <p className="text-sm text-muted-foreground">
                Gerencie todos os seus projetos em um só lugar
              </p>
            </div>

            <div className="grid gap-3">
              <div className="p-4 glass-cosmic rounded-lg hover:scale-[1.02] transition-transform cursor-pointer">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold">Projeto Principal</h4>
                  <Badge className="bg-primary/20 text-primary">Ativo</Badge>
                </div>
                <p className="text-xs text-muted-foreground mb-3">
                  142 transmutações • Última atividade há 2 horas
                </p>
                <div className="flex gap-2">
                  <Badge variant="outline" className="text-xs">
                    Essência configurada
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    3 vozes
                  </Badge>
                </div>
              </div>

              <CosmicButton variant="outline" className="w-full">
                <FolderOpen className="w-4 h-4 mr-2" />
                Ver Todos os Projetos
              </CosmicButton>
            </div>
          </div>
        </CosmicCard>

        {/* Analytics Dashboard */}
        <CosmicCard
          title="Análise Dimensional"
          description="Insights do seu universo criativo"
        >
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <RuneIcon icon={BarChart3} size="sm" />
              <p className="text-sm text-muted-foreground">
                Acompanhe métricas e performance
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 glass-cosmic rounded-lg text-center">
                <BarChart3 className="w-6 h-6 mx-auto mb-2 text-primary" />
                <p className="text-2xl font-bold">142</p>
                <p className="text-xs text-muted-foreground">Transmutações</p>
              </div>
              <div className="p-4 glass-cosmic rounded-lg text-center">
                <Stars className="w-6 h-6 mx-auto mb-2 text-secondary" />
                <p className="text-2xl font-bold">3</p>
                <p className="text-xs text-muted-foreground">Vozes Ativas</p>
              </div>
            </div>

            <CosmicButton variant="outline" className="w-full">
              <BarChart3 className="w-4 h-4 mr-2" />
              Ver Análise Completa
            </CosmicButton>
          </div>
        </CosmicCard>
      </div>
    </PortalContainer>
    </ErrorBoundary>
  );
};
