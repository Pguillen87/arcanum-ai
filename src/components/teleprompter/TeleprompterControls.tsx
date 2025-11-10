// src/components/teleprompter/TeleprompterControls.tsx
// Componente de controles do teleprompter

import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Play, Pause, RotateCcw, FlipHorizontal, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { mysticalClasses } from '@/lib/mystical-theme';

export interface TeleprompterControlsProps {
  scrollSpeed: number;
  onScrollSpeedChange: (speed: number) => void;
  fontSize: number;
  onFontSizeChange: (size: number) => void;
  textColor: string;
  onTextColorChange: (color: string) => void;
  backgroundColor: string;
  onBackgroundColorChange: (color: string) => void;
  mirrorMode: boolean;
  onMirrorModeChange: (enabled: boolean) => void;
  isPaused: boolean;
  onPauseToggle: () => void;
  onReset: () => void;
  speechDetectionEnabled: boolean;
  onSpeechDetectionToggle: (enabled: boolean) => void;
  className?: string;
}

export function TeleprompterControls({
  scrollSpeed,
  onScrollSpeedChange,
  fontSize,
  onFontSizeChange,
  textColor,
  onTextColorChange,
  backgroundColor,
  onBackgroundColorChange,
  mirrorMode,
  onMirrorModeChange,
  isPaused,
  onPauseToggle,
  onReset,
  speechDetectionEnabled,
  onSpeechDetectionToggle,
  className,
}: TeleprompterControlsProps) {
  return (
    <div className={cn('space-y-4 p-4 glass-cosmic rounded-lg', className)}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-lg flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Controles
        </h3>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onPauseToggle}
            className={cn(mysticalClasses.glow.gold)}
          >
            {isPaused ? (
              <>
                <Play className="w-4 h-4 mr-2" />
                Retomar
              </>
            ) : (
              <>
                <Pause className="w-4 h-4 mr-2" />
                Pausar
              </>
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onReset}
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset
          </Button>
        </div>
      </div>

      {/* Velocidade de Scroll */}
      <div className="space-y-2">
        <Label>Velocidade de Scroll ({scrollSpeed}%)</Label>
        <Slider
          min={0}
          max={100}
          step={1}
          value={[scrollSpeed]}
          onValueChange={(val) => onScrollSpeedChange(val[0])}
        />
      </div>

      {/* Tamanho da Fonte */}
      <div className="space-y-2">
        <Label>Tamanho da Fonte ({fontSize}px)</Label>
        <Slider
          min={12}
          max={72}
          step={1}
          value={[fontSize]}
          onValueChange={(val) => onFontSizeChange(val[0])}
        />
      </div>

      {/* Cores */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Cor do Texto</Label>
          <div className="flex items-center gap-2">
            <Input
              type="color"
              value={textColor}
              onChange={(e) => onTextColorChange(e.target.value)}
              className="w-16 h-10"
            />
            <Input
              type="text"
              value={textColor}
              onChange={(e) => onTextColorChange(e.target.value)}
              className="flex-1"
              placeholder="#ffffff"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Cor de Fundo</Label>
          <div className="flex items-center gap-2">
            <Input
              type="color"
              value={backgroundColor}
              onChange={(e) => onBackgroundColorChange(e.target.value)}
              className="w-16 h-10"
            />
            <Input
              type="text"
              value={backgroundColor}
              onChange={(e) => onBackgroundColorChange(e.target.value)}
              className="flex-1"
              placeholder="#000000"
            />
          </div>
        </div>
      </div>

      {/* Modo Espelho */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FlipHorizontal className="w-4 h-4" />
          <Label htmlFor="mirror-mode" className="cursor-pointer">
            Modo Espelho
          </Label>
        </div>
        <Switch
          id="mirror-mode"
          checked={mirrorMode}
          onCheckedChange={onMirrorModeChange}
        />
      </div>

      {/* Detecção de Fala */}
      <div className="flex items-center justify-between">
        <div>
          <Label htmlFor="speech-detection" className="cursor-pointer">
            Detecção de Fala
          </Label>
          <p className="text-xs text-muted-foreground">
            Pausa automaticamente quando você para de falar
          </p>
        </div>
        <Switch
          id="speech-detection"
          checked={speechDetectionEnabled}
          onCheckedChange={onSpeechDetectionToggle}
        />
      </div>
    </div>
  );
}

