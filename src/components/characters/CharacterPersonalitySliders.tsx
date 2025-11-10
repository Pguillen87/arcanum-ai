// src/components/characters/CharacterPersonalitySliders.tsx
// Componente reutilizável para sliders de personalidade com visual místico

import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { RuneBorder } from '@/components/ui/mystical';
import { GrimoireHint } from '@/components/ui/mystical/GrimoireHint';
import { getCharacterHint } from '@/lib/character-hints';
import type { PersonalityCore, CommunicationTone, SocialAttitude } from '@/schemas/character';

interface SliderProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  hintDimension?: string;
  hintField?: string;
  disabled?: boolean;
}

function MysticalSlider({ label, value, onChange, min = 0, max = 100, hintDimension, hintField, disabled }: SliderProps) {
  const hint = hintDimension && hintField ? getCharacterHint(hintDimension, hintField) : null;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium text-foreground">{label}</Label>
        {hint && (
          <GrimoireHint
            title={hint.title}
            description={hint.description}
            why={hint.why}
            examples={hint.examples}
            tips={hint.tips}
            side="top"
          />
        )}
      </div>
      <div className="relative">
        <Slider
          value={[value]}
          onValueChange={([val]) => onChange(val)}
          min={min}
          max={max}
          step={1}
          disabled={disabled}
          className={cn(
            'w-full',
            !disabled && 'hover:shadow-mystical-gold/20'
          )}
        />
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span>{min}</span>
          <span className="font-semibold text-mystical-gold">{value}</span>
          <span>{max}</span>
        </div>
      </div>
    </div>
  );
}

interface CharacterPersonalitySlidersProps {
  personalityCore: PersonalityCore;
  communicationTone: CommunicationTone;
  socialAttitude: SocialAttitude;
  onPersonalityCoreChange: (core: PersonalityCore) => void;
  onCommunicationToneChange: (tone: CommunicationTone) => void;
  onSocialAttitudeChange: (attitude: SocialAttitude) => void;
  disabled?: boolean;
}

export function CharacterPersonalitySliders({
  personalityCore,
  communicationTone,
  socialAttitude,
  onPersonalityCoreChange,
  onCommunicationToneChange,
  onSocialAttitudeChange,
  disabled = false,
}: CharacterPersonalitySlidersProps) {
  return (
    <div className="space-y-6">
      {/* Dimensão 1: Núcleo de Personalidade */}
      <RuneBorder variant="gold" animated={!disabled}>
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-mystical-gold">🧠 Núcleo de Personalidade</h3>
          </div>
          
          <MysticalSlider
            label="Robótico ↔ Humano"
            value={personalityCore.robotic_human}
            onChange={(value) => onPersonalityCoreChange({ ...personalityCore, robotic_human: value })}
            hintDimension="personality_core"
            hintField="robotic_human"
            disabled={disabled}
          />
          
          <MysticalSlider
            label="Palhaço ↔ Sério"
            value={personalityCore.clown_serious}
            onChange={(value) => onPersonalityCoreChange({ ...personalityCore, clown_serious: value })}
            hintDimension="personality_core"
            hintField="clown_serious"
            disabled={disabled}
          />
        </div>
      </RuneBorder>

      {/* Dimensão 2: Tom de Comunicação */}
      <RuneBorder variant="lilac" animated={!disabled}>
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-mystical-lilac">💬 Tom de Comunicação</h3>
          </div>
          
          <MysticalSlider
            label="Reservado ↔ Expansivo"
            value={socialAttitude.reserved_expansive}
            onChange={(value) => onSocialAttitudeChange({ ...socialAttitude, reserved_expansive: value })}
            hintDimension="social_attitude"
            hintField="reserved_expansive"
            disabled={disabled}
          />
        </div>
      </RuneBorder>
    </div>
  );
}
