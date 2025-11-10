import { RuneBorder } from "@/components/ui/mystical";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Character } from "@/schemas/character";

type TransformationType = "post" | "resumo" | "newsletter" | "roteiro";
type TransformationLength = "short" | "medium" | "long";

interface TransformationPanelProps {
  applyTransformation: boolean;
  disableToggle: boolean;
  onToggle: (checked: boolean) => void;
  characters: Character[];
  selectedCharacterId?: string;
  onCharacterChange: (characterId: string) => void;
  transformationType: TransformationType;
  onTypeChange: (value: TransformationType) => void;
  transformationLength: TransformationLength;
  onLengthChange: (value: TransformationLength) => void;
  isTranscribing: boolean;
}

export function TransformationPanel({
  applyTransformation,
  disableToggle,
  onToggle,
  characters,
  selectedCharacterId,
  onCharacterChange,
  transformationType,
  onTypeChange,
  transformationLength,
  onLengthChange,
  isTranscribing,
}: TransformationPanelProps) {
  return (
    <RuneBorder
      glow={false}
      borderStyle="solid"
      showCorners={false}
      paddingClass="p-4 sm:p-6"
      className="bg-background/70 border-border/60 shadow-inner shadow-mystical-gold/20 backdrop-blur-sm"
    >
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Checkbox
            id="apply-transformation"
            checked={applyTransformation}
            onCheckedChange={(checked) => onToggle(checked === true)}
            disabled={disableToggle}
          />
          <div className="flex flex-col">
            <Label htmlFor="apply-transformation" className="cursor-pointer text-foreground/90">
              Aplicar personagem após transcrição
            </Label>
            <span className="text-xs text-foreground/60">
              O texto final segue o tom do personagem escolhido.
            </span>
          </div>
        </div>

        {applyTransformation && (
          <>
            <div className="space-y-2">
              <Label htmlFor="character" className="text-foreground/90">
                Personagem
              </Label>
              <Select
                value={selectedCharacterId ?? ""}
                onValueChange={(value) => onCharacterChange(value)}
                disabled={isTranscribing}
              >
                <SelectTrigger
                  id="character"
                  className="bg-background/80 border-border/60 text-foreground focus-visible:ring-primary/60"
                >
                  <SelectValue placeholder="Selecione um personagem" />
                </SelectTrigger>
                <SelectContent>
                  {characters.map((char) => (
                    <SelectItem key={char.id} value={char.id!}>
                      {char.name}
                      {char.is_default && " (Padrão)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="transformation-type" className="text-foreground/90">
                  Tipo de Transformação
                </Label>
                <Select
                  value={transformationType}
                  onValueChange={(value: TransformationType) => onTypeChange(value)}
                  disabled={isTranscribing}
                >
                  <SelectTrigger
                    id="transformation-type"
                    className="bg-background/80 border-border/60 text-foreground focus-visible:ring-primary/60"
                  >
                    <SelectValue placeholder="Selecione o formato" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="post">Post</SelectItem>
                    <SelectItem value="resumo">Resumo</SelectItem>
                    <SelectItem value="newsletter">Newsletter</SelectItem>
                    <SelectItem value="roteiro">Roteiro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="transformation-length" className="text-foreground/90">
                  Tamanho
                </Label>
                <Select
                  value={transformationLength}
                  onValueChange={(value: TransformationLength) => onLengthChange(value)}
                  disabled={isTranscribing}
                >
                  <SelectTrigger
                    id="transformation-length"
                    className="bg-background/80 border-border/60 text-foreground focus-visible:ring-primary/60"
                  >
                    <SelectValue placeholder="Selecione o tamanho" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="short">Curto</SelectItem>
                    <SelectItem value="medium">Médio</SelectItem>
                    <SelectItem value="long">Longo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </>
        )}
      </div>
    </RuneBorder>
  );
}
