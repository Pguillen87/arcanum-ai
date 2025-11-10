import { PortalContainer } from "@/components/portals/PortalContainer";
import { CharacterLibrary } from "@/components/characters/CharacterLibrary";
import { ErrorBoundary } from "@/components/ErrorBoundary";

interface EssenciaPortalProps {
  onClose: () => void;
  onNavigateToOrb?: (orbId: string) => void;
}

export const EssenciaPortal = ({ onClose, onNavigateToOrb }: EssenciaPortalProps) => {
  return (
    <ErrorBoundary
      fallback={
        <PortalContainer 
          title="Essência - DNA Criativo" 
          onClose={onClose}
          currentOrbId="essencia"
          onNavigateToOrb={onNavigateToOrb}
        >
          <div className="p-6 text-center">
            <p className="text-muted-foreground">
              Erro ao carregar portal de essência. Por favor, tente novamente.
            </p>
          </div>
        </PortalContainer>
      }
    >
      <PortalContainer 
        title="Essência - DNA Criativo" 
        onClose={onClose}
        currentOrbId="essencia"
        onNavigateToOrb={onNavigateToOrb}
      >
        <CharacterLibrary />
      </PortalContainer>
    </ErrorBoundary>
  );
};
