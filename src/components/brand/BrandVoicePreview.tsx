// src/components/brand/BrandVoicePreview.tsx
// Componente para preview de transformação com Brand Voice

import { useState } from 'react';
import { useBrandVoice } from '@/hooks/useBrandVoice';
import { CosmicCard } from '@/components/cosmic/CosmicCard';
import { CosmicButton } from '@/components/cosmic/CosmicButton';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Sparkles, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';
import { RuneIcon } from '@/components/cosmic/RuneIcon';
import { SafeHtml } from '@/components/ui/SafeHtml';
import { MigrationWarning } from './MigrationWarning';

export function BrandVoicePreview() {
  const { profiles, defaultProfile, transformWithBrandVoice, isTransforming, migrationRequired } = useBrandVoice();
  
  const [inputText, setInputText] = useState('');
  const [selectedProfileId, setSelectedProfileId] = useState<string>('');
  const [transformationType, setTransformationType] = useState<'post' | 'resumo' | 'newsletter' | 'roteiro'>('post');
  const [tone, setTone] = useState<string>('');
  const [length, setLength] = useState<'short' | 'medium' | 'long'>('medium');
  const [result, setResult] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Usar perfil padrão se disponível
  const activeProfileId = selectedProfileId || defaultProfile?.id || (profiles.length > 0 ? profiles[0].id : '');

  const handlePreview = async () => {
    if (!inputText.trim() || inputText.length < 10) {
      toast.error('Digite pelo menos 10 caracteres para gerar preview');
      return;
    }

    if (!activeProfileId) {
      toast.error('Nenhuma voz treinada disponível. Treine uma voz primeiro.');
      return;
    }

    try {
      const transformed = await transformWithBrandVoice({
        brandProfileId: activeProfileId,
        inputText: inputText.trim(),
        transformationType,
        tone: tone || undefined,
        length,
        useSimilaritySearch: true,
        similarityThreshold: 0.7,
        maxSimilarChunks: 5,
      });

      if (transformed) {
        setResult(transformed);
        toast.success('Preview gerado com sucesso!');
      }
    } catch (error: any) {
      console.error('Erro ao gerar preview:', error);
      toast.error('Erro ao gerar preview', {
        description: error.message || 'Tente novamente mais tarde.',
      });
    }
  };

  const handleCopy = async () => {
    if (!result) return;
    
    try {
      await navigator.clipboard.writeText(result);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success('Texto copiado!');
    } catch (err) {
      console.error('Erro ao copiar:', err);
      toast.error('Erro ao copiar texto');
    }
  };

  const canGenerate = inputText.trim().length >= 10 && activeProfileId && !isTransforming;

  // Priorizar aviso de migration sobre conteúdo normal
  // Se migration é necessária, mostrar aviso imediatamente
  if (migrationRequired === true) {
    return (
      <CosmicCard 
        title="Preview da Essência" 
        description="Teste sua voz criativa em tempo real"
      >
        <MigrationWarning />
      </CosmicCard>
    );
  }

  return (
    <CosmicCard 
      title="Preview da Essência" 
      description="Teste sua voz criativa em tempo real"
    >
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <RuneIcon icon={Sparkles} size="sm" />
          <p className="text-sm text-muted-foreground">
            Digite um prompt e veja como a IA escreve no seu estilo.
          </p>
        </div>

        {/* Seleção de perfil */}
        {profiles.length > 0 && (
          <div className="space-y-2">
            <Label htmlFor="profile-select">Voz da Marca</Label>
            <Select
              value={activeProfileId}
              onValueChange={setSelectedProfileId}
              disabled={isTransforming}
            >
              <SelectTrigger id="profile-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {profiles.map((profile) => (
                  <SelectItem key={profile.id} value={profile.id}>
                    {profile.name} {profile.is_default && '(Padrão)'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {profiles.length === 0 && (
          <div className="py-8">
            <Alert>
              <AlertDescription className="text-center">
                <div className="space-y-2">
                  <p className="font-medium">🌟 Nenhuma voz treinada</p>
                  <p className="text-sm">Treine uma voz primeiro para usar o preview da essência.</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    💡 Dica: Role para cima e use a seção "Treinar Voz da Marca" para começar.
                  </p>
                </div>
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* Tipo de transformação */}
        <div className="space-y-2">
          <Label htmlFor="transformation-type">Tipo de Transformação</Label>
          <Select
            value={transformationType}
            onValueChange={(value: 'post' | 'resumo' | 'newsletter' | 'roteiro') => setTransformationType(value)}
            disabled={isTransforming}
          >
            <SelectTrigger id="transformation-type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="post">Post para Redes Sociais</SelectItem>
              <SelectItem value="resumo">Resumo</SelectItem>
              <SelectItem value="newsletter">Newsletter</SelectItem>
              <SelectItem value="roteiro">Roteiro</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Opções */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="tone">Tom (opcional)</Label>
            <input
              id="tone"
              type="text"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              placeholder="Ex: profissional, descontraído"
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              disabled={isTransforming}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="length">Tamanho</Label>
            <Select
              value={length}
              onValueChange={(value: 'short' | 'medium' | 'long') => setLength(value)}
              disabled={isTransforming}
            >
              <SelectTrigger id="length">
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

        {/* Input de texto */}
        <div className="space-y-2">
          <Label htmlFor="preview-input">Texto de Entrada</Label>
          <Textarea
            id="preview-input"
            placeholder="Digite ou cole seu texto aqui para ver como será transformado..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={isTransforming}
            rows={6}
            className="min-h-[150px]"
          />
          <p className="text-xs text-muted-foreground">
            {inputText.length < 10
              ? `Mínimo 10 caracteres (${inputText.length}/10)`
              : `${inputText.length} caracteres`}
          </p>
        </div>

        {/* Botão de gerar */}
        <CosmicButton
          onClick={handlePreview}
          disabled={!canGenerate}
          className="w-full"
        >
          {isTransforming ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Gerando Preview...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Gerar Preview
            </>
          )}
        </CosmicButton>

        {/* Resultado */}
        {result && (
          <div className="space-y-3 pt-4 border-t border-border/30">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold">Resultado</h4>
              <CosmicButton
                size="sm"
                variant="outline"
                onClick={handleCopy}
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Copiado!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    Copiar
                  </>
                )}
              </CosmicButton>
            </div>
            <div className="p-4 glass-cosmic rounded-lg border border-border/30 bg-background/50">
              <SafeHtml html={result.replace(/\n/g, '<br />')} />
            </div>
          </div>
        )}
      </div>
    </CosmicCard>
  );
}

