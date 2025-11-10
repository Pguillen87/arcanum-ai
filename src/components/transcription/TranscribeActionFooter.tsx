import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Sparkles, Loader2 } from "lucide-react";

interface TranscribeActionFooterProps {
  onSubmit: () => void;
  disabled: boolean;
  disabledReason?: string | null;
  isUploading: boolean;
  isTranscribing: boolean;
  isJobRunning: boolean;
  showCharacterAlert: boolean;
}

export function TranscribeActionFooter({
  onSubmit,
  disabled,
  disabledReason,
  isUploading,
  isTranscribing,
  isJobRunning,
  showCharacterAlert,
}: TranscribeActionFooterProps) {
  const isBusy = isUploading || isTranscribing || isJobRunning;

  const button = (
    <Button
      onClick={onSubmit}
      disabled={disabled}
      className="w-full bg-gradient-to-r from-mystical-lilac/70 via-mystical-cosmic/70 to-mystical-gold/70 text-foreground shadow-[0_0_24px_rgba(120,82,255,0.25)] hover:from-mystical-lilac/80 hover:via-mystical-cosmic/80 hover:to-mystical-gold/80 focus-visible:ring-primary/60 transition"
    >
      {isBusy ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {isUploading ? "Fazendo upload..." : isTranscribing ? "Transcrevendo..." : "Processando áudio..."}
        </>
      ) : (
        <>
          <Sparkles className="mr-2 h-4 w-4" />
          Transcrever Áudio
        </>
      )}
    </Button>
  );

  return (
    <div className="space-y-4">
      {disabledReason ? (
        <TooltipProvider delayDuration={150}>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="block w-full cursor-not-allowed">
                {button}
              </span>
            </TooltipTrigger>
            <TooltipContent side="top" align="center" className="max-w-[260px] text-center leading-relaxed">
              {disabledReason}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ) : (
        button
      )}

      {showCharacterAlert && (
        <Alert>
          <Sparkles className="w-4 h-4" />
          <AlertDescription className="text-xs">
            Crie um personagem na Esfera Essência para aplicar transformações automáticas após a transcrição.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

