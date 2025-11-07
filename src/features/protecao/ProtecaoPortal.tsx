import { PortalContainer } from "@/components/portals/PortalContainer";
import { CosmicCard } from "@/components/cosmic/CosmicCard";
import { CosmicButton } from "@/components/cosmic/CosmicButton";
import { Shield, AlertTriangle, Settings, CheckCircle } from "lucide-react";
import { RuneIcon } from "@/components/cosmic/RuneIcon";
import { Badge } from "@/components/ui/badge";

interface ProtecaoPortalProps {
  onClose: () => void;
}

export const ProtecaoPortal = ({ onClose }: ProtecaoPortalProps) => {
  return (
    <PortalContainer title="Proteção - Escudo Dimensional" onClose={onClose}>
      <div className="grid gap-6 md:gap-8">
        {/* Moderation Dashboard */}
        <CosmicCard
          title="Dashboard de Moderação"
          description="Mantenha a integridade da sua marca"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 glass-cosmic rounded-lg text-center">
                <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-500" />
                <p className="text-2xl font-bold">142</p>
                <p className="text-xs text-muted-foreground">Conteúdos Aprovados</p>
              </div>
              <div className="p-4 glass-cosmic rounded-lg text-center">
                <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
                <p className="text-2xl font-bold">3</p>
                <p className="text-xs text-muted-foreground">Aguardando Revisão</p>
              </div>
              <div className="p-4 glass-cosmic rounded-lg text-center">
                <Shield className="w-8 h-8 mx-auto mb-2 text-primary" />
                <p className="text-2xl font-bold">98%</p>
                <p className="text-xs text-muted-foreground">Taxa de Proteção</p>
              </div>
            </div>
          </div>
        </CosmicCard>

        {/* Content Filters */}
        <CosmicCard
          title="Filtros de Conteúdo"
          description="Configure suas proteções dimensionais"
        >
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <RuneIcon icon={Settings} size="sm" />
              <p className="text-sm text-muted-foreground">
                Defina palavras proibidas e temas sensíveis para moderação automática
              </p>
            </div>

            <div className="space-y-3">
              <div className="p-4 glass-cosmic rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-sm">Moderação Automática</h4>
                  <Badge className="bg-green-500/20 text-green-500">Ativo</Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  IA analisa conteúdo antes da publicação
                </p>
              </div>

              <div className="p-4 glass-cosmic rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-sm">Filtro de Linguagem Ofensiva</h4>
                  <Badge className="bg-green-500/20 text-green-500">Ativo</Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Bloqueia palavras e frases inapropriadas
                </p>
              </div>

              <div className="p-4 glass-cosmic rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-sm">Verificação de Marca</h4>
                  <Badge className="bg-green-500/20 text-green-500">Ativo</Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Garante alinhamento com diretrizes da marca
                </p>
              </div>
            </div>

            <CosmicButton variant="outline" className="w-full">
              <Settings className="w-4 h-4 mr-2" />
              Configurar Filtros
            </CosmicButton>
          </div>
        </CosmicCard>

        {/* Recent Moderation Logs */}
        <CosmicCard
          title="Logs Recentes"
          description="Últimas atividades de moderação"
        >
          <div className="space-y-3">
            <div className="p-3 glass-cosmic rounded-lg flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">Conteúdo aprovado</p>
                <p className="text-xs text-muted-foreground truncate">
                  Post sobre tecnologia revisado e aprovado
                </p>
                <p className="text-xs text-muted-foreground mt-1">Há 2 horas</p>
              </div>
            </div>

            <div className="p-3 glass-cosmic rounded-lg flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">Aguardando revisão</p>
                <p className="text-xs text-muted-foreground truncate">
                  Conteúdo flagged para revisão manual
                </p>
                <p className="text-xs text-muted-foreground mt-1">Há 5 horas</p>
              </div>
            </div>
          </div>
        </CosmicCard>
      </div>
    </PortalContainer>
  );
};
