// src/components/brand/BrandVoiceTrainer.tsx
// Componente para treinar voz da marca a partir de samples textuais

import { useState, useEffect } from 'react';
import { useBrandVoice } from '@/hooks/useBrandVoice';
import { TrainBrandVoiceRequestSchema } from '@/schemas/brandVoice';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Sparkles, X, Plus, Wand2 } from 'lucide-react';
import { toast } from 'sonner';
import { CosmicCard } from '@/components/cosmic/CosmicCard';
import { MigrationWarning } from './MigrationWarning';

interface BrandVoiceTrainerProps {
  brandProfileId?: string; // Se fornecido, atualiza perfil existente
  onSuccess?: (profileId: string) => void;
  onCancel?: () => void;
  migrationRequired?: boolean; // Flag para indicar se migration é necessária
}

export function BrandVoiceTrainer({ brandProfileId, onSuccess, onCancel, migrationRequired }: BrandVoiceTrainerProps) {
  const { trainBrandVoice, isTraining, profiles } = useBrandVoice();
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [samples, setSamples] = useState<string[]>(['']);
  const [isDefault, setIsDefault] = useState(false);
  const [modelProvider, setModelProvider] = useState<'openai' | 'anthropic'>('openai');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Carregar perfil existente se brandProfileId fornecido
  useEffect(() => {
    // Não tentar carregar se migration é necessária
    if (migrationRequired === true) {
      return;
    }
    
    if (brandProfileId && profiles.length > 0) {
      const profile = profiles.find(p => p.id === brandProfileId);
      if (profile) {
        setName(profile.name);
        setDescription(profile.description || '');
        setIsDefault(profile.is_default);
        setModelProvider(profile.model_provider);
      }
    }
  }, [brandProfileId, profiles, migrationRequired]);

  // Remover dependência de planos - todos podem usar Anthropic agora
  const canUseAnthropic = true;

  const handleAddSample = () => {
    if (samples.length < 50) {
      setSamples([...samples, '']);
    } else {
      toast.error('Máximo de 50 exemplos permitido');
    }
  };

  const handleRemoveSample = (index: number) => {
    if (samples.length > 1) {
      setSamples(samples.filter((_, i) => i !== index));
    }
  };

  const handleSampleChange = (index: number, value: string) => {
    const newSamples = [...samples];
    newSamples[index] = value;
    setSamples(newSamples);
    
    // Limpar erro deste sample se existir
    const newErrors = { ...errors };
    delete newErrors[`sample-${index}`];
    setErrors(newErrors);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = 'Nome é obrigatório';
    }

    // Verificar se há pelo menos 1 sample não vazio
    const validSamples = samples.filter(s => s.trim().length > 0);
    if (validSamples.length === 0) {
      newErrors.samples = 'Adicione pelo menos um exemplo de texto';
    }

    // Validar tamanho máximo de cada sample
    samples.forEach((sample, index) => {
      if (sample.length > 10000) {
        newErrors[`sample-${index}`] = 'Máximo de 10000 caracteres';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleTrain = async () => {
    if (!validateForm()) {
      return;
    }

    // Filtrar samples não vazios
    const validSamples = samples.filter(s => s.trim().length > 0);

    if (validSamples.length === 0) {
      toast.error('Adicione pelo menos um exemplo de texto');
      return;
    }

    try {
      // Validar com Zod
      const validatedParams = TrainBrandVoiceRequestSchema.parse({
        brandProfileId: brandProfileId || undefined,
        name: name.trim(),
        description: description.trim() || undefined,
        samples: validSamples,
        isDefault,
        modelProvider: canUseAnthropic ? modelProvider : 'openai',
        modelName: modelProvider === 'anthropic' ? 'claude-3-5-sonnet-20241022' : 'gpt-4o',
      });

      const result = await trainBrandVoice(validatedParams as TrainBrandVoiceParams);
      
      if (result) {
        toast.success('Voz treinada com sucesso!', {
          description: `${validSamples.length} samples processados. Sua voz está pronta para uso.`,
        });
        
        if (onSuccess) {
          onSuccess(result.id);
        }
      }
    } catch (error: any) {
      console.error('Erro ao treinar voz:', error);
      
      if (error.errors) {
        // Erros de validação Zod
        const zodErrors: Record<string, string> = {};
        error.errors.forEach((err: any) => {
          zodErrors[err.path[0]] = err.message;
        });
        setErrors(zodErrors);
      }
      
      toast.error('Erro ao treinar voz', {
        description: error.message || 'Tente novamente mais tarde.',
      });
    }
  };

  const validSamplesCount = samples.filter(s => s.trim().length > 0).length;
  const canTrain = name.trim().length > 0 && validSamplesCount > 0 && !isTraining;

  // Se migration é necessária, mostrar aviso (segurança extra - Dialog não deveria abrir)
  if (migrationRequired === true) {
    return (
      <div className="space-y-4">
        <MigrationWarning />
        {onCancel && (
          <div className="flex justify-end">
            <Button variant="outline" onClick={onCancel}>
              Fechar
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <CosmicCard 
      title="Treinar Voz da Marca" 
      description="Forneça exemplos de textos para que a IA aprenda seu estilo único"
    >
      <div className="space-y-6">
        {/* Nome */}
        <div className="space-y-2">
          <Label htmlFor="name">Nome da Voz *</Label>
          <Input
            id="name"
            placeholder="Ex: Voz Profissional, Voz Criativa, Voz Mística"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={isTraining}
          />
          {errors.name && (
            <p className="text-xs text-destructive">{errors.name}</p>
          )}
        </div>

        {/* Descrição */}
        <div className="space-y-2">
          <Label htmlFor="description">Descrição (opcional)</Label>
          <Textarea
            id="description"
            placeholder="Descreva quando usar esta voz..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={isTraining}
            rows={2}
          />
        </div>

        {/* Provider - todos podem usar agora */}
        {canUseAnthropic && (
          <div className="space-y-2">
            <Label htmlFor="provider">Modelo de IA</Label>
            <Select
              value={modelProvider}
              onValueChange={(value: 'openai' | 'anthropic') => setModelProvider(value)}
              disabled={isTraining}
            >
              <SelectTrigger id="provider">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="openai">OpenAI GPT-4o</SelectItem>
                <SelectItem value="anthropic">Anthropic Claude 3.5 Sonnet</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Claude oferece melhor qualidade para textos longos e criativos
            </p>
          </div>
        )}

        {/* Samples */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Exemplos de Texto *</Label>
            <span className="text-xs text-muted-foreground">
              {validSamplesCount} exemplo{validSamplesCount !== 1 ? 's' : ''} adicionado{validSamplesCount !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">
              💫 <strong>Cole exemplos de texto</strong> que representam o estilo que deseja replicar.
            </p>
          </div>

          {errors.samples && (
            <Alert variant="destructive">
              <AlertDescription>{errors.samples}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-3">
            {samples.map((sample, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-start gap-2">
                  <Textarea
                    placeholder={`Exemplo ${index + 1} - Cole aqui um texto no estilo desejado...`}
                    value={sample}
                    onChange={(e) => handleSampleChange(index, e.target.value)}
                    disabled={isTraining}
                    rows={4}
                    className={errors[`sample-${index}`] ? 'border-destructive' : ''}
                  />
                  {samples.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveSample(index)}
                      disabled={isTraining}
                      className="mt-2"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                {errors[`sample-${index}`] && (
                  <p className="text-xs text-destructive">{errors[`sample-${index}`]}</p>
                )}
                {sample.length > 10000 && (
                  <p className="text-xs text-destructive mt-1">
                    Máximo de 10000 caracteres excedido. Reduza o texto.
                  </p>
                )}
              </div>
            ))}
          </div>

          {samples.length < 50 && (
            <Button
              type="button"
              variant="outline"
              onClick={handleAddSample}
              disabled={isTraining}
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Exemplo
            </Button>
          )}
        </div>

        {/* Opções */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="isDefault"
              checked={isDefault}
              onChange={(e) => setIsDefault(e.target.checked)}
              disabled={isTraining}
              className="rounded border-gray-300"
            />
            <Label htmlFor="isDefault" className="cursor-pointer">
              Definir como voz padrão
            </Label>
          </div>
        </div>

        {/* Botões */}
        <div className="flex gap-2 pt-4">
          {onCancel && (
            <Button
              onClick={onCancel}
              disabled={isTraining}
              variant="outline"
              className="flex-1"
            >
              Cancelar
            </Button>
          )}
          <Button
            onClick={handleTrain}
            disabled={!canTrain || isTraining}
            className="flex-1"
            title={
              !canTrain 
                ? validSamplesCount === 0
                  ? "Adicione pelo menos um exemplo de texto"
                  : name.trim().length === 0
                    ? "Digite um nome para sua voz"
                    : "Aguarde o processamento"
                : "Clique para treinar sua voz"
            }
          >
            {isTraining ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Treinando Voz...
              </>
            ) : !canTrain ? (
              <>
                <Wand2 className="w-4 h-4 mr-2 opacity-50" />
                {validSamplesCount === 0
                  ? "Adicione exemplos"
                  : name.trim().length === 0
                    ? "Digite um nome"
                    : "Treinar Voz"}
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4 mr-2" />
                ✨ Treinar Voz
              </>
            )}
          </Button>
        </div>

        {/* Informações sobre o processo */}
        <Alert>
          <Sparkles className="w-4 h-4" />
          <AlertDescription className="text-xs">
            O treinamento pode levar alguns segundos. A IA analisará seus exemplos e criará embeddings
            para entender seu estilo único. Quanto mais exemplos você fornecer, melhor será a qualidade.
          </AlertDescription>
        </Alert>
      </div>
    </CosmicCard>
  );
}

