import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RuneBorder } from "@/components/ui/mystical";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Character } from "@/schemas/character";
import { cn } from "@/lib/utils";

export interface CharacterSelectorProps {
  characters: Character[];
  selectedCharacterId?: string;
  useCharacter: boolean;
  isTransforming?: boolean;
  onToggleUseCharacter: (enabled: boolean) => void;
  onSelectCharacter: (characterId: string) => void;
}

export function CharacterSelector({
  characters,
  selectedCharacterId,
  useCharacter,
  isTransforming,
  onToggleUseCharacter,
  onSelectCharacter,
}: CharacterSelectorProps) {
  if (!characters.length) {
    return null;
  }

  return (
    <RuneBorder
      variant="cosmic"
      glow={false}
      animated={false}
      borderStyle="solid"
      showCorners={false}
      className={cn(
        "transition-colors bg-background/80 border-border/60",
        useCharacter && "border-primary/60 bg-primary/5"
      )}
      data-testid="character-selector"
    >
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="use-character"
            checked={useCharacter}
            onCheckedChange={(checked) => onToggleUseCharacter(checked === true)}
            disabled={isTransforming}
          />
          <Label htmlFor="use-character" className="cursor-pointer">
            Usar Personagem para Transformação
          </Label>
        </div>

        {useCharacter && (
          <div className="space-y-2">
            <Label htmlFor="character-select">Personagem</Label>
            <Select
              value={selectedCharacterId ?? ""}
              onValueChange={onSelectCharacter}
              disabled={isTransforming}
            >
              <SelectTrigger id="character-select">
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
        )}
      </div>
    </RuneBorder>
  );
}
