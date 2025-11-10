// src/components/characters/CharacterPreview.tsx
// Preview de como o personagem responderia

import { RuneBorder } from '@/components/ui/mystical';
import { Card, CardContent } from '@/components/ui/card';
import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Character } from '@/schemas/character';

interface CharacterPreviewProps {
  character: Partial<Character>;
  previewText?: string;
  className?: string;
}

export function CharacterPreview({ character, previewText, className }: CharacterPreviewProps) {
  // Texto de exemplo para preview
  const exampleText = previewText || "Explique como funciona a inteligência artificial de forma simples.";

  // Construir descrição do personagem baseado nas dimensões
  const buildCharacterDescription = (char: Partial<Character>): string => {
    const parts: string[] = [];
    
    if (char.personality_core) {
      const core = char.personality_core as any;
      if (core.robotic_human > 70) parts.push('muito humano');
      else if (core.robotic_human < 30) parts.push('mais técnico');
      
      if (core.clown_serious > 70) parts.push('sério');
      else if (core.clown_serious < 30) parts.push('brincalhão');
    }
    
    if (char.communication_tone) {
      const tone = char.communication_tone as any;
      if (tone.formality === 'formal') parts.push('formal');
      else if (tone.formality === 'casual') parts.push('casual');
      
      if (tone.enthusiasm === 'high') parts.push('entusiasmado');
      else if (tone.enthusiasm === 'low') parts.push('contido');
    }
    
    if (char.vocabulary_style) {
      const vocab = char.vocabulary_style as any;
      if (vocab.style === 'scientific') parts.push('científico');
      else if (vocab.style === 'literary') parts.push('literário');
      else if (vocab.style === 'pop') parts.push('popular');
    }
    
    return parts.length > 0 ? parts.join(', ') : 'personalidade única';
  };

  const characterDescription = buildCharacterDescription(character);

  return (
    <Card className={cn('border-mystical-gold/30', className)}>
      <CardContent className="p-6">
        <RuneBorder variant="gold" animated>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-mystical-gold" />
              <h3 className="text-lg font-semibold text-mystical-gold">Preview do Personagem</h3>
            </div>
            
            {character.name && (
              <div>
                <p className="text-sm font-medium text-foreground mb-1">Nome:</p>
                <p className="text-lg text-mystical-gold">{character.name}</p>
              </div>
            )}
            
            {characterDescription && (
              <div>
                <p className="text-sm font-medium text-foreground mb-1">Características:</p>
                <p className="text-sm text-muted-foreground italic">{characterDescription}</p>
              </div>
            )}
            
            {Array.isArray((character as any).refinement_rules) && (character as any).refinement_rules.length > 0 && (
              <div>
                <p className="text-sm font-medium text-foreground mb-1">Regras de Refinamento:</p>
                <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                  {(character as any).refinement_rules
                    .filter((rule: unknown): rule is string => typeof rule === 'string' && rule.trim().length > 0)
                    .slice(0, 5)
                    .map((rule: string, index: number) => (
                      <li key={`${rule}-${index}`}>{rule}</li>
                    ))}
                </ul>
              </div>
            )}
            
            <div className="pt-4 border-t border-mystical-gold/20">
              <p className="text-sm font-medium text-foreground mb-2">Exemplo de resposta:</p>
              <div className="p-4 bg-mystical-deep-light/50 rounded-lg border border-mystical-lilac/20">
                <p className="text-sm text-muted-foreground italic animate-pulse">
                  "A Bruxa das Brumas está preparando a resposta..."
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  O preview completo aparecerá quando você salvar o personagem.
                </p>
              </div>
            </div>
          </div>
        </RuneBorder>
      </CardContent>
    </Card>
  );
}

