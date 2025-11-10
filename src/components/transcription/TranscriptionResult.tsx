// src/components/transcription/TranscriptionResult.tsx
// Componente para exibir resultado de transcrição e aplicar transformação com character

import { useState } from 'react';
import { useTranscription } from '@/hooks/useTranscription';
import { useCharacters } from '@/hooks/useCharacters';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Sparkles, Copy, Wand2 } from 'lucide-react';
import { toast } from 'sonner';
import { RuneBorder } from '@/components/ui/mystical';
import { Checkbox } from '@/components/ui/checkbox';
import { MarkdownPreview } from '@/components/ui/MarkdownPreview';
import { MysticRecipeTicker } from '@/components/transcription/MysticRecipeTicker';
import type { TranscriptionHistory } from '@/schemas/transcription';

interface TranscriptionResultProps {
  history: TranscriptionHistory;
  onTransformed?: (transformedText: string) => void;
}

export function TranscriptionResult({ history, onTransformed }: TranscriptionResultProps) {
  const { transformTranscription, isTransforming } = useTranscription();
  const { characters, defaultCharacter } = useCharacters();
  
  const [selectedCharacterId, setSelectedCharacterId] = useState<string | undefined>(
    history.character_id || defaultCharacter?.id
  );
  const [transformationType, setTransformationType] = useState<'post' | 'resumo' | 'newsletter' | 'roteiro'>(
    (history.transformation_type as any) || 'post'
  );
  const [transformationLength, setTransformationLength] = useState<'short' | 'medium' | 'long'>(
    (history.transformation_length as any) || 'medium'
  );
  const [transformedText, setTransformedText] = useState<string | null>(history.transformed_text || null);
  const [viewMarkdown, setViewMarkdown] = useState<boolean>(true);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Texto copiado!');
  };

  const handleTransform = async () => {
    if (!history.transcription_id || !selectedCharacterId) {
      toast.error('Selecione um personagem');
      return;
    }

    try {
      const result = await transformTranscription({
        transcriptionId: history.transcription_id,
        characterId: selectedCharacterId,
        transformationType,
        transformationLength,
      });

      if (result.error) {
        toast.error('Erro ao transformar', {
          description: result.error.message || 'Tente novamente',
        });
        return;
      }

      if (result.data) {
        setTransformedText(result.data);
        if (onTransformed) {
          onTransformed(result.data);
        }
        toast.success('Transformação concluída!');
      }
    } catch (error: any) {
      toast.error('Erro ao processar', {
        description: error.message || 'Tente novamente',
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* Ticker místico (receitas de magia do desing.md) */}
      <MysticRecipeTicker />
      {/* Texto Original */}
      <RuneBorder variant="lilac">
        <Card className="border-0 bg-transparent">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg text-mystical-lilac">Texto Original</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleCopy(history.original_text)}
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <Checkbox id="md-view" checked={viewMarkdown} onCheckedChange={(c: boolean) => setViewMarkdown(!!c)} />
              <Label htmlFor="md-view" className="text-xs text-muted-foreground">Ler em Markdown</Label>
            </div>
          </CardHeader>
          <CardContent>
            {viewMarkdown ? (
              <div className="min-h-[150px] bg-background/40 rounded-md p-3">
                <MarkdownPreview markdown={history.original_text} />
              </div>
            ) : (
              <Textarea
                value={history.original_text}
                readOnly
                className="min-h-[150px] font-mono text-sm"
              />
            )}
          </CardContent>
        </Card>
      </RuneBorder>

      {/* Transformação */}
      {!transformedText && (
        <RuneBorder variant="gold">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Wand2 className="w-5 h-5 text-mystical-gold" />
              <h3 className="text-lg font-semibold text-mystical-gold">Transformar com Personagem</h3>
            </div>

            {characters.length === 0 ? (
              <Alert>
                <Sparkles className="w-4 h-4" />
                <AlertDescription className="text-xs">
                  Crie um personagem na Esfera Essência para transformar este texto.
                </AlertDescription>
              </Alert>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="character-select">Personagem</Label>
                  <Select
                    value={selectedCharacterId}
                    onValueChange={setSelectedCharacterId}
                    disabled={isTransforming}
                  >
                    <SelectTrigger id="character-select">
                      <SelectValue placeholder="Selecione um personagem" />
                    </SelectTrigger>
                    <SelectContent>
                      {characters.map((char) => (
                        <SelectItem key={char.id} value={char.id!}>
                          {char.name}
                          {char.is_default && ' (Padrão)'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="transform-type">Tipo</Label>
                    <Select
                      value={transformationType}
                      onValueChange={(value: 'post' | 'resumo' | 'newsletter' | 'roteiro') =>
                        setTransformationType(value)
                      }
                      disabled={isTransforming}
                    >
                      <SelectTrigger id="transform-type">
                        <SelectValue />
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
                    <Label htmlFor="transform-length">Tamanho</Label>
                    <Select
                      value={transformationLength}
                      onValueChange={(value: 'short' | 'medium' | 'long') =>
                        setTransformationLength(value)
                      }
                      disabled={isTransforming}
                    >
                      <SelectTrigger id="transform-length">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="short">Curto</SelectItem>
                        <SelectItem value="medium">Médio</SelectItem>
                        <SelectItem value="long">Longo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button
                  onClick={handleTransform}
                  disabled={!selectedCharacterId || isTransforming}
                  className="w-full bg-mystical-gold text-mystical-deep hover:bg-mystical-gold-light"
                >
                  {isTransforming ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Transformando...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Transformar
                    </>
                  )}
                </Button>
              </>
            )}
          </div>
        </RuneBorder>
      )}

      {/* Texto Transformado */}
      {transformedText && (
        <RuneBorder variant="cosmic" animated>
          <Card className="border-0 bg-transparent">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg text-mystical-cosmic">Texto Transformado</CardTitle>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopy(transformedText)}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleTransform}
                    disabled={isTransforming}
                    aria-live="polite"
                  >
                    {isTransforming ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Refresh...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Refresh
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {viewMarkdown ? (
                <div className="min-h-[200px] bg-background/40 rounded-md p-3">
                  <MarkdownPreview markdown={transformedText} />
                </div>
              ) : (
                <Textarea
                  value={transformedText}
                  readOnly
                  className="min-h-[200px] font-mono text-sm"
                />
              )}
            </CardContent>
          </Card>
        </RuneBorder>
      )}
    </div>
  );
}

