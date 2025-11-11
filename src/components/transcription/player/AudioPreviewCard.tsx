import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Pause, Play, Download, Trash2, Save } from "lucide-react";
import { useAudioPlayer } from "./useAudioPlayer";

interface AudioPreviewCardProps {
  title: string;
  description?: string;
  fileName: string;
  fileSizeLabel: string;
  sourceLabel: string;
  url: string;
  onRemove: () => void;
  onPrimaryAction?: () => void;
  primaryLabel?: string;
  primaryDisabled?: boolean;
  downloadFileName?: string;
  downloadLabel?: string;
}

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return "00:00";
  }
  const minutes = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const remaining = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");
  return `${minutes}:${remaining}`;
}

export function AudioPreviewCard({
  title,
  description,
  fileName,
  fileSizeLabel,
  sourceLabel,
  url,
  onRemove,
  onPrimaryAction,
  primaryLabel = "Salvar",
  primaryDisabled = false,
  downloadFileName,
  downloadLabel = "Salvar local",
}: AudioPreviewCardProps) {
  const { status, toggle, download, currentTime, duration, error, clearError } = useAudioPlayer({ src: url });

  const playLabel = useMemo(() => (status === "playing" ? "Pausar" : "Ouvir"), [status]);

  const handleToggle = async () => {
    await toggle();
  };

  const handleRemove = () => {
    clearError();
    onRemove();
  };

  const handlePrimaryAction = () => {
    if (onPrimaryAction) {
      clearError();
      onPrimaryAction();
    }
  };

  const handleDownload = () => {
    download(downloadFileName ?? fileName);
    clearError();
  };

  return (
    <div className="rounded-lg border border-border/60 bg-background/70 p-4 space-y-3">
      <div className="flex flex-col gap-1">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h4 className="text-sm font-medium text-foreground">{title}</h4>
            {description ? <p className="text-xs text-muted-foreground">{description}</p> : null}
          </div>
          <span className="text-[11px] uppercase tracking-wide text-muted-foreground">{sourceLabel}</span>
        </div>
        <div className="rounded-md bg-background/60 px-3 py-2 text-xs text-muted-foreground">
          <div className="flex items-center justify-between">
            <span className="truncate font-medium text-foreground">{fileName}</span>
            <span>{fileSizeLabel}</span>
          </div>
          <div className="mt-1 flex items-center justify-between">
            <span className="font-mono text-[11px] text-foreground/80">{formatTime(currentTime)} / {formatTime(duration)}</span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={handleToggle}
            >
              {status === "playing" ? <Pause className="mr-2 h-3.5 w-3.5" /> : <Play className="mr-2 h-3.5 w-3.5" />}
              {playLabel}
            </Button>
          </div>
        </div>
      </div>

      {error ? (
        <div className="rounded-md border border-amber-500/60 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
          {error} Utilize o botão Baixar para ouvir no seu dispositivo.
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        {onPrimaryAction ? (
          <Button type="button" size="sm" onClick={handlePrimaryAction} disabled={primaryDisabled}>
            <Save className="mr-2 h-4 w-4" />
            {primaryLabel}
          </Button>
        ) : null}
        <Button type="button" variant="outline" size="sm" onClick={handleDownload}>
          <Download className="mr-2 h-4 w-4" />
          {downloadLabel}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={handleRemove}>
          <Trash2 className="mr-2 h-4 w-4" />
          Remover
        </Button>
      </div>
    </div>
  );
}
