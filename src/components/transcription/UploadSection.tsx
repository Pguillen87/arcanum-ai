import { RuneBorder } from "@/components/ui/mystical";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { AudioValidationMetadata } from "@/hooks/useAudioValidation";

interface UploadSectionProps {
  onSelectFile: (event: React.ChangeEvent<HTMLInputElement>) => void;
  inputRef: React.RefObject<HTMLInputElement>;
  selectedFile: File | null;
  metadata: AudioValidationMetadata | null;
  validationMessage: string | null;
  acceptedExtensions: readonly string[];
  maxSizeMB: number;
  isBusy: boolean;
  language: string;
  onLanguageChange: (value: string) => void;
  isTranscribing: boolean;
}

export function UploadSection({
  onSelectFile,
  inputRef,
  selectedFile,
  metadata,
  validationMessage,
  acceptedExtensions,
  maxSizeMB,
  isBusy,
  language,
  onLanguageChange,
  isTranscribing,
}: UploadSectionProps) {
  const acceptValue = [...acceptedExtensions, "audio/*"].join(",");

  return (
    <RuneBorder
      glow={false}
      borderStyle="solid"
      showCorners={false}
      paddingClass="p-4 sm:p-6"
      className="bg-background/70 border-border/60 shadow-inner shadow-mystical-cosmic/20 backdrop-blur-sm"
    >
      <div className="space-y-4">
        <div className="space-y-3">
          <Label htmlFor="audio-file" className="text-foreground/90">
            Arquivo de áudio
          </Label>
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-4">
              <Input
                id="audio-file"
                type="file"
                accept={acceptValue}
                onChange={onSelectFile}
                ref={inputRef}
                disabled={isBusy}
                className="flex-1 bg-background/80 border-border/60 text-foreground focus-visible:ring-primary/60 focus-visible:border-primary/60 transition"
              />
              {selectedFile && metadata && (
                <div className="flex items-center gap-2 text-sm text-foreground/80 rounded-md bg-primary/10 px-3 py-1.5">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <span className="font-medium">{metadata.sanitizedName}</span>
                  <span className="text-xs text-foreground/60">{metadata.sizeMB.toFixed(2)} MB</span>
                </div>
              )}
            </div>
            <p className="text-xs text-foreground/60">
              Aceitamos {acceptedExtensions.join(", ").toUpperCase()} até {maxSizeMB} MB.
            </p>
            {validationMessage && (
              <p className="flex items-center gap-2 text-sm text-destructive">
                <span aria-hidden>⚠️</span>
                <span>{validationMessage}</span>
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="language" className="text-foreground/90">
          Idioma
        </Label>
        <Select value={language} onValueChange={onLanguageChange} disabled={isTranscribing}>
          <SelectTrigger
            id="language"
            className="bg-background/80 border-border/60 text-foreground focus-visible:ring-primary/60"
          >
            <SelectValue placeholder="Selecione o idioma" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pt">Português</SelectItem>
            <SelectItem value="en">Inglês</SelectItem>
            <SelectItem value="es">Espanhol</SelectItem>
            <SelectItem value="fr">Francês</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </RuneBorder>
  );
}
