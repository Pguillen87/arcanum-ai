import { CosmicCard } from "@/components/cosmic/CosmicCard";
import { CosmicButton } from "@/components/cosmic/CosmicButton";
import { LoadingSpinner } from "@/components/cosmic/LoadingSpinner";
import type { Character } from "@/schemas/character";

export interface TransformationOverlayProps {
  isVisible: boolean;
  character?: Character | null;
  traceId?: string | null;
  onCancel?: () => void;
}

export function TransformationOverlay({ isVisible, character, traceId, onCancel }: TransformationOverlayProps) {
  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-background/70 backdrop-blur-sm" data-testid="transformation-overlay">
      <CosmicCard
        title={character?.name ? `Invocando ${character.name}` : "Transmutação em andamento"}
        description="Seu personagem está catalisando a essência do texto"
        className="max-w-md w-full mx-4"
      >
        <div className="space-y-4 text-center">
          <LoadingSpinner message="Canalizando magia criativa..." size="lg" />
          {traceId && (
            <p className="text-xs text-muted-foreground">
              traceId: <span className="font-mono">{traceId}</span>
            </p>
          )}
          {onCancel && (
            <CosmicButton variant="outline" onClick={onCancel}>
              Cancelar transformação
            </CosmicButton>
          )}
        </div>
      </CosmicCard>
    </div>
  );
}
