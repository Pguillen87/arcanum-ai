import { CosmicCard } from "@/components/cosmic/CosmicCard";
import { Button } from "@/components/ui/button";
import { MysticCauldronProgress } from "./MysticCauldronProgress";

interface TranscriptionOverlayProps {
  visible: boolean;
  stage: "upload" | "transcribe";
  message: string;
  traceId?: string | null;
  progress?: number; // 0..100 (upload real; transcribe estimado)
  isStalled?: boolean;
  stallDescription?: string | null;
  onRetry?: () => void; // Forçar processamento no worker
  isRetrying?: boolean;
  onCheck?: () => void; // Rechecar status no PostgREST
  onClose?: () => void; // Fechar overlay
}

const stageTitles: Record<"upload" | "transcribe", string> = {
  upload: "Enfileirando ecos do portal",
  transcribe: "Sussurros sendo decifrados",
};

export function TranscriptionOverlay({
  visible,
  stage,
  message,
  traceId,
  progress = 0,
  isStalled = false,
  stallDescription,
  onRetry,
  isRetrying = false,
  onCheck,
  onClose,
}: TranscriptionOverlayProps) {
  if (!visible) return null;

  const showActions = isStalled && (onRetry || onCheck);
  const statusDescription = isStalled && stallDescription ? stallDescription : message;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-background/70 backdrop-blur-sm">
      <CosmicCard
        title={stageTitles[stage]}
        description="A voz arcana percorre as esferas para ganhar forma textual"
        className="max-w-md w-full mx-4"
      >
        <div className="space-y-4 text-center">
          <div className="flex items-center justify-center">
            <MysticCauldronProgress progress={progress} label={statusDescription} stalled={isStalled} />
          </div>
          {traceId && (
            <p className="text-xs text-muted-foreground">
              traceId: <span className="font-mono">{traceId}</span>
            </p>
          )}
          {showActions && (
            <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
              {onCheck && (
                <Button size="sm" variant="outline" onClick={onCheck}>
                  Rechecar status
                </Button>
              )}
              {onRetry && (
                <Button size="sm" onClick={onRetry} disabled={!!isRetrying}>
                  {isRetrying ? 'Processando...' : 'Forçar processamento'}
                </Button>
              )}
              {onClose && (
                <Button size="sm" variant="ghost" onClick={onClose}>
                  Fechar
                </Button>
              )}
            </div>
          )}
        </div>
      </CosmicCard>
    </div>
  );
}
