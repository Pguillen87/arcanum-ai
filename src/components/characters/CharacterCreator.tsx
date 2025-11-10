// src/components/characters/CharacterCreator.tsx
// Componente para criar personagens com 8 dimensões de personalidade

import { useState, useEffect } from 'react';
import { useCharacters } from '@/hooks/useCharacters';
import { 
  CharacterSchema, 
  CreateCharacterSchema,
  type CreateCharacter,
  type Character,
  type PersonalityCore,
  type CommunicationTone,
  type MotivationFocus,
  type SocialAttitude,
  type CognitiveSpeed,
  type VocabularyStyle,
  type EmotionalState,
  type ValuesTendencies,
} from '@/schemas/character';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Sparkles, Wand2 } from 'lucide-react';
import { toast } from 'sonner';
import { CosmicCard } from '@/components/cosmic/CosmicCard';
import { RuneBorder } from '@/components/ui/mystical';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { CharacterPersonalitySliders } from './CharacterPersonalitySliders';
import { CharacterPreview } from './CharacterPreview';
import { GrimoireHint } from '@/components/ui/mystical/GrimoireHint';
import { getCharacterHint } from '@/lib/character-hints';

interface CharacterCreatorProps {
  characterId?: string; // Se fornecido, atualiza personagem existente
  onSuccess?: (characterId: string) => void;
  onCancel?: () => void;
}

export function CharacterCreator({ characterId, onSuccess, onCancel }: CharacterCreatorProps) {
  const { characters, createCharacter, updateCharacter, isCreating, isUpdating } = useCharacters();
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [modelProvider, setModelProvider] = useState<'openai' | 'anthropic'>('openai');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [refinementNotes, setRefinementNotes] = useState('');

  // 8 Dimensões de Personalidade
  const [personalityCore, setPersonalityCore] = useState<PersonalityCore>({
    traits: [],
    robotic_human: 50,
    clown_serious: 50,
  });
  
  const [communicationTone, setCommunicationTone] = useState<CommunicationTone>({
    formality: 'neutral',
    enthusiasm: 'medium',
    style: [],
    use_emojis: false,
    use_slang: false,
    use_metaphors: false,
  });
  
  const [motivationFocus, setMotivationFocus] = useState<MotivationFocus>({
    focus: 'help',
    seeks: 'harmony',
  });
  
  const [socialAttitude, setSocialAttitude] = useState<SocialAttitude>({
    type: 'reactive',
    curiosity: 'medium',
    reserved_expansive: 50,
  });
  
  const [cognitiveSpeed, setCognitiveSpeed] = useState<CognitiveSpeed>({
    speed: 'medium',
    depth: 'medium',
  });
  
  const [vocabularyStyle, setVocabularyStyle] = useState<VocabularyStyle>({
    style: 'neutral',
    complexity: 'medium',
    use_figures: false,
  });
  
  const [emotionalState, setEmotionalState] = useState<EmotionalState>({
    current: 'neutral',
    variability: 'medium',
  });
  
  const [valuesTendencies, setValuesTendencies] = useState<ValuesTendencies>(['neutral', 'pragmatic']);

  // Carregar personagem existente se characterId fornecido
  useEffect(() => {
    if (characterId && characters.length > 0) {
      const character = characters.find(c => c.id === characterId);
      if (character) {
        setName(character.name);
        setDescription(character.description || '');
        setAvatarUrl(character.avatar_url || '');
        setIsDefault(character.is_default);
        setModelProvider(character.model_provider);
        if (Array.isArray(character.refinement_rules)) {
          setRefinementNotes(
            character.refinement_rules
              .filter((rule) => typeof rule === 'string')
              .join('\n')
          );
        }
        if (character.personality_core) setPersonalityCore(character.personality_core as PersonalityCore);
        if (character.communication_tone) setCommunicationTone(character.communication_tone as CommunicationTone);
        if (character.motivation_focus) setMotivationFocus(character.motivation_focus as MotivationFocus);
        if (character.social_attitude) setSocialAttitude(character.social_attitude as SocialAttitude);
        if (character.cognitive_speed) setCognitiveSpeed(character.cognitive_speed as CognitiveSpeed);
        if (character.vocabulary_style) setVocabularyStyle(character.vocabulary_style as VocabularyStyle);
        if (character.emotional_state) setEmotionalState(character.emotional_state as EmotionalState);
        if (character.values_tendencies) setValuesTendencies(character.values_tendencies as ValuesTendencies);
      }
    }
  }, [characterId, characters]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = 'Nome é obrigatório';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    const parsedRefinementRules = refinementNotes
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .slice(0, 5)
      .map((line) => line.slice(0, 240));

    try {
      const characterData: CreateCharacter = {
        name: name.trim(),
        description: description.trim() || undefined,
        avatar_url: avatarUrl.trim() || undefined,
        is_default: isDefault,
        model_provider: modelProvider,
        model_name: modelProvider === 'anthropic' ? 'claude-3-5-sonnet-20241022' : 'gpt-4o',
        personality_core: personalityCore,
        communication_tone: communicationTone,
        motivation_focus: motivationFocus,
        social_attitude: socialAttitude,
        cognitive_speed: cognitiveSpeed,
        vocabulary_style: vocabularyStyle,
        emotional_state: emotionalState,
        values_tendencies: valuesTendencies,
        refinement_rules: parsedRefinementRules,
      };

      // Validar com Zod
      const validated = CreateCharacterSchema.parse(characterData);

      let result: Character | null = null;

      if (characterId) {
        // Atualizar existente
        const updateResult = await updateCharacter({ id: characterId, ...validated });
        result = updateResult;
      } else {
        // Criar novo
        result = await createCharacter(validated);
      }
      
      if (result) {
        toast.success('Personagem salvo com sucesso!', {
          description: characterId ? 'Personagem atualizado.' : 'Seu personagem está pronto para uso.',
        });
        
        if (onSuccess) {
          onSuccess(result.id);
        }
      }
    } catch (error: any) {
      console.error('Erro ao salvar personagem:', error);
      
      if (error.errors) {
        // Erros de validação Zod
        const zodErrors: Record<string, string> = {};
        error.errors.forEach((err: any) => {
          zodErrors[err.path[0]] = err.message;
        });
        setErrors(zodErrors);
      }
      
      toast.error('Erro ao salvar personagem', {
        description: error.message || 'Tente novamente mais tarde.',
      });
    }
  };

  const isLoading = isCreating || isUpdating;
  const canSave = name.trim().length > 0 && !isLoading;
  const modalTitle = characterId ? "Editar Personagem" : "Criar Novo Personagem";

  // Helper para renderizar hint
  const renderHint = (dimension: string, field: string) => {
    const hint = getCharacterHint(dimension, field);
    if (!hint) return null;
    return (
      <GrimoireHint
        title={hint.title}
        description={hint.description}
        why={hint.why}
        examples={hint.examples}
        tips={hint.tips}
      />
    );
  };

  return (
    <CosmicCard 
      title={
        <div className="flex items-center gap-2">
          {modalTitle}
          <GrimoireHint
            title="Guia do Grimório"
            description="Este portal reúne todas as dimensões que definem como seu personagem pensa, escreve e guia os rituais criativos."
            why="Personagens consistentes aceleram transformações, evitam retrabalho e mantêm a narrativa mística alinhada."
            examples={[
              'Use-o para direcionar transformações de texto com personalidade própria.',
              'Defina personagens padrão para fluxos recorrentes dentro da Essência.',
              'Construa variações para teleprompter, transcrições e missões especiais.'
            ]}
            tips="Revisite as dimensões sempre que evoluir sua estratégia. Pequenos ajustes geram resultados totalmente novos."
            delayDuration={120}
            preferredSides={['right', 'left', 'top', 'bottom']}
          />
        </div>
      }
      description={
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>
            Construa ou refine um arquétipo arcano completo com oito dimensões, camada técnica de IA e metadados.
          </p>
          <p>
            Os ajustes aqui alimentam todos os portais: transformações, transcrições, teleprompter e futuras esferas.
          </p>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Informações Básicas */}
        <div className="space-y-4">
        <div className="space-y-2">
            <div className="flex items-center gap-2">
          <Label htmlFor="name">Nome do Personagem *</Label>
              {getCharacterHint('basic', 'name') && (
                <GrimoireHint
                  title={getCharacterHint('basic', 'name')!.title}
                  description={getCharacterHint('basic', 'name')!.description}
                  why={getCharacterHint('basic', 'name')!.why}
                  examples={getCharacterHint('basic', 'name')!.examples}
                  tips={getCharacterHint('basic', 'name')!.tips}
                />
              )}
            </div>
          <Input
            id="name"
              placeholder="Ex: Mago Sábio, Bruxa Criativa, Alquimista Prático"
            value={name}
            onChange={(e) => setName(e.target.value)}
              disabled={isLoading}
          />
          {errors.name && (
            <p className="text-xs text-destructive">{errors.name}</p>
          )}
        </div>

        <div className="space-y-2">
            <div className="flex items-center gap-2">
          <Label htmlFor="description">Descrição (opcional)</Label>
              {getCharacterHint('basic', 'description') && (
                <GrimoireHint
                  title={getCharacterHint('basic', 'description')!.title}
                  description={getCharacterHint('basic', 'description')!.description}
                  why={getCharacterHint('basic', 'description')!.why}
                  examples={getCharacterHint('basic', 'description')!.examples}
                  tips={getCharacterHint('basic', 'description')!.tips}
                />
              )}
            </div>
          <Textarea
            id="description"
            placeholder="Descreva quando usar este personagem..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
              disabled={isLoading}
            rows={2}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="refinement-rules">Regras de Refinamento (até 5 linhas)</Label>
            {getCharacterHint('basic', 'refinement_rules') && (
              <GrimoireHint
                title={getCharacterHint('basic', 'refinement_rules')!.title}
                description={getCharacterHint('basic', 'refinement_rules')!.description}
                why={getCharacterHint('basic', 'refinement_rules')!.why}
                examples={getCharacterHint('basic', 'refinement_rules')!.examples}
                tips={getCharacterHint('basic', 'refinement_rules')!.tips}
              />
            )}
          </div>
          <Textarea
            id="refinement-rules"
            placeholder="Ex: Não se apresente ao leitor.\nEvite citar redes sociais diretamente.\nUse chamadas para ação curtas."
            value={refinementNotes}
            onChange={(e) => setRefinementNotes(e.target.value)}
            disabled={isLoading}
            rows={4}
          />
          <p className="text-xs text-muted-foreground">
            Estas notas aparecem após a transmutação para orientar ajustes rápidos via Refresh.
          </p>
        </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="avatar">URL do Avatar (opcional)</Label>
              {getCharacterHint('basic', 'avatar_url') && (
                <GrimoireHint
                  title={getCharacterHint('basic', 'avatar_url')!.title}
                  description={getCharacterHint('basic', 'avatar_url')!.description}
                  why={getCharacterHint('basic', 'avatar_url')!.why}
                  examples={getCharacterHint('basic', 'avatar_url')!.examples}
                  tips={getCharacterHint('basic', 'avatar_url')!.tips}
                />
              )}
            </div>
            <Input
              id="avatar"
              type="url"
              placeholder="https://..."
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="provider">Modelo de IA</Label>
              {getCharacterHint('basic', 'model_provider') && (
                <GrimoireHint
                  title={getCharacterHint('basic', 'model_provider')!.title}
                  description={getCharacterHint('basic', 'model_provider')!.description}
                  why={getCharacterHint('basic', 'model_provider')!.why}
                  examples={getCharacterHint('basic', 'model_provider')!.examples}
                  tips={getCharacterHint('basic', 'model_provider')!.tips}
                />
              )}
            </div>
            <Select
              value={modelProvider}
              onValueChange={(value: 'openai' | 'anthropic') => setModelProvider(value)}
              disabled={isLoading}
            >
              <SelectTrigger id="provider">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="openai">OpenAI GPT-4o</SelectItem>
                <SelectItem value="anthropic">Anthropic Claude 3.5 Sonnet</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* 8 Dimensões de Personalidade */}
          <CharacterPersonalitySliders
          personalityCore={personalityCore}
          communicationTone={communicationTone}
          socialAttitude={socialAttitude}
          onPersonalityCoreChange={setPersonalityCore}
          onCommunicationToneChange={setCommunicationTone}
          onSocialAttitudeChange={setSocialAttitude}
          disabled={isLoading}
        />

        {/* Dimensão 2: Tom de Comunicação - Campos adicionais */}
        <RuneBorder variant="lilac">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-mystical-lilac">💬 Tom de Comunicação</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label>Formalidade</Label>
                  {renderHint('communication_tone', 'formality')}
                </div>
                <Select
                  value={communicationTone.formality}
                  onValueChange={(value: 'formal' | 'neutral' | 'casual') => 
                    setCommunicationTone({ ...communicationTone, formality: value })
                  }
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="formal">Formal</SelectItem>
                    <SelectItem value="neutral">Neutro</SelectItem>
                    <SelectItem value="casual">Casual</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label>Entusiasmo</Label>
                  {renderHint('communication_tone', 'enthusiasm')}
                </div>
                <Select
                  value={communicationTone.enthusiasm}
                  onValueChange={(value: 'low' | 'medium' | 'high') => 
                    setCommunicationTone({ ...communicationTone, enthusiasm: value })
                  }
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Baixo</SelectItem>
                    <SelectItem value="medium">Médio</SelectItem>
                    <SelectItem value="high">Alto</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Características</Label>
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="use_emojis"
                    checked={communicationTone.use_emojis}
                    onCheckedChange={(checked) => 
                      setCommunicationTone({ ...communicationTone, use_emojis: checked === true })
                    }
                    disabled={isLoading}
                  />
                  <div className="flex items-center gap-1">
                    <Label htmlFor="use_emojis" className="cursor-pointer">Usar Emojis</Label>
                    {renderHint('communication_tone', 'use_emojis')}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="use_slang"
                    checked={communicationTone.use_slang}
                    onCheckedChange={(checked) => 
                      setCommunicationTone({ ...communicationTone, use_slang: checked === true })
                    }
                    disabled={isLoading}
                  />
                  <div className="flex items-center gap-1">
                    <Label htmlFor="use_slang" className="cursor-pointer">Usar Gírias</Label>
                    {renderHint('communication_tone', 'use_slang')}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="use_metaphors"
                    checked={communicationTone.use_metaphors}
                    onCheckedChange={(checked) => 
                      setCommunicationTone({ ...communicationTone, use_metaphors: checked === true })
                    }
                    disabled={isLoading}
                  />
                  <div className="flex items-center gap-1">
                    <Label htmlFor="use_metaphors" className="cursor-pointer">Usar Metáforas</Label>
                    {renderHint('communication_tone', 'use_metaphors')}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </RuneBorder>

        {/* Dimensão 3: Motivação e Foco */}
        <RuneBorder variant="cosmic">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-mystical-cosmic">❤️ Motivação e Foco</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label>Foco Principal</Label>
                  {renderHint('motivation_focus', 'focus')}
                </div>
                <Select
                  value={motivationFocus.focus}
                  onValueChange={(value: 'help' | 'teach' | 'entertain' | 'inspire' | 'sell' | 'inform') => 
                    setMotivationFocus({ ...motivationFocus, focus: value })
                  }
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="help">Ajudar</SelectItem>
                    <SelectItem value="teach">Ensinar</SelectItem>
                    <SelectItem value="entertain">Entreter</SelectItem>
                    <SelectItem value="inspire">Inspirar</SelectItem>
                    <SelectItem value="sell">Vender</SelectItem>
                    <SelectItem value="inform">Informar</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label>Busca</Label>
                  {renderHint('motivation_focus', 'seeks')}
                </div>
                <Select
                  value={motivationFocus.seeks}
                  onValueChange={(value: 'harmony' | 'innovation' | 'efficiency' | 'creativity' | 'clarity') => 
                    setMotivationFocus({ ...motivationFocus, seeks: value })
                  }
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="harmony">Harmonia</SelectItem>
                    <SelectItem value="innovation">Inovação</SelectItem>
                    <SelectItem value="efficiency">Eficiência</SelectItem>
                    <SelectItem value="creativity">Criatividade</SelectItem>
                    <SelectItem value="clarity">Clareza</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </RuneBorder>

        {/* Dimensão 4: Atitude Social - Campos adicionais */}
        <RuneBorder variant="gold">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-mystical-gold">👁️ Atitude Social</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label>Tipo</Label>
                  {renderHint('social_attitude', 'type')}
                </div>
                <Select
                  value={socialAttitude.type}
                  onValueChange={(value: 'proactive' | 'reactive') => 
                    setSocialAttitude({ ...socialAttitude, type: value })
                  }
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="proactive">Proativo</SelectItem>
                    <SelectItem value="reactive">Reativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label>Curiosidade</Label>
                  {renderHint('social_attitude', 'curiosity')}
                </div>
                <Select
                  value={socialAttitude.curiosity}
                  onValueChange={(value: 'low' | 'medium' | 'high') => 
                    setSocialAttitude({ ...socialAttitude, curiosity: value })
                  }
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Baixa</SelectItem>
                    <SelectItem value="medium">Média</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </RuneBorder>

        {/* Dimensão 5: Velocidade Cognitiva */}
        <RuneBorder variant="lilac">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-mystical-lilac">⚙️ Velocidade Cognitiva</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label>Velocidade</Label>
                  {renderHint('cognitive_speed', 'speed')}
                </div>
                <Select
                  value={cognitiveSpeed.speed}
                  onValueChange={(value: 'slow' | 'medium' | 'fast') => 
                    setCognitiveSpeed({ ...cognitiveSpeed, speed: value })
                  }
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="slow">Lenta</SelectItem>
                    <SelectItem value="medium">Média</SelectItem>
                    <SelectItem value="fast">Rápida</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label>Profundidade</Label>
                  {renderHint('cognitive_speed', 'depth')}
                </div>
                <Select
                  value={cognitiveSpeed.depth}
                  onValueChange={(value: 'shallow' | 'medium' | 'deep') => 
                    setCognitiveSpeed({ ...cognitiveSpeed, depth: value })
                  }
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="shallow">Superficial</SelectItem>
                    <SelectItem value="medium">Média</SelectItem>
                    <SelectItem value="deep">Profunda</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </RuneBorder>

        {/* Dimensão 6: Vocabulário e Estilo */}
        <RuneBorder variant="cosmic">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-mystical-cosmic">🎨 Vocabulário e Estilo</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label>Estilo</Label>
                  {renderHint('vocabulary_style', 'style')}
                </div>
                <Select
                  value={vocabularyStyle.style}
                  onValueChange={(value: 'scientific' | 'pop' | 'literary' | 'technical' | 'neutral') => 
                    setVocabularyStyle({ ...vocabularyStyle, style: value })
                  }
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scientific">Científico</SelectItem>
                    <SelectItem value="pop">Popular</SelectItem>
                    <SelectItem value="literary">Literário</SelectItem>
                    <SelectItem value="technical">Técnico</SelectItem>
                    <SelectItem value="neutral">Neutro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label>Complexidade</Label>
                  {renderHint('vocabulary_style', 'complexity')}
                </div>
                <Select
                  value={vocabularyStyle.complexity}
                  onValueChange={(value: 'simple' | 'medium' | 'complex') => 
                    setVocabularyStyle({ ...vocabularyStyle, complexity: value })
                  }
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="simple">Simples</SelectItem>
                    <SelectItem value="medium">Média</SelectItem>
                    <SelectItem value="complex">Complexa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="use_figures"
                checked={vocabularyStyle.use_figures}
                onCheckedChange={(checked) => 
                  setVocabularyStyle({ ...vocabularyStyle, use_figures: checked === true })
                }
                disabled={isLoading}
              />
              <div className="flex items-center gap-1">
                <Label htmlFor="use_figures" className="cursor-pointer">Usar Figuras de Linguagem</Label>
                {renderHint('vocabulary_style', 'use_figures')}
              </div>
            </div>
          </div>
        </RuneBorder>

        {/* Dimensão 7: Emoções Simuladas */}
        <RuneBorder variant="gold">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-mystical-gold">🧩 Emoções Simuladas</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label>Estado Atual</Label>
                  {renderHint('emotional_state', 'current')}
                </div>
                <Select
                  value={emotionalState.current}
                  onValueChange={(value: 'neutral' | 'happy' | 'serious' | 'playful' | 'contemplative') => 
                    setEmotionalState({ ...emotionalState, current: value })
                  }
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="neutral">Neutro</SelectItem>
                    <SelectItem value="happy">Feliz</SelectItem>
                    <SelectItem value="serious">Sério</SelectItem>
                    <SelectItem value="playful">Brincalhão</SelectItem>
                    <SelectItem value="contemplative">Contemplativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label>Variabilidade</Label>
                  {renderHint('emotional_state', 'variability')}
                </div>
                <Select
                  value={emotionalState.variability}
                  onValueChange={(value: 'low' | 'medium' | 'high') => 
                    setEmotionalState({ ...emotionalState, variability: value })
                  }
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Baixa</SelectItem>
                    <SelectItem value="medium">Média</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </RuneBorder>

        {/* Dimensão 8: Valores e Tendências */}
        <RuneBorder variant="lilac">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-mystical-lilac">🪞 Valores e Tendências</h3>
              {renderHint('values_tendencies', 'values')}
            </div>
            <p className="text-sm text-muted-foreground">Selecione os valores que melhor descrevem este personagem</p>
            
            <div className="flex flex-wrap gap-4">
              {(['ethical', 'creative', 'pragmatic', 'innovative', 'traditional', 'neutral'] as const).map((value) => (
                <div key={value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`value-${value}`}
                    checked={valuesTendencies.includes(value)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setValuesTendencies([...valuesTendencies, value]);
                      } else {
                        setValuesTendencies(valuesTendencies.filter(v => v !== value));
                      }
                    }}
                    disabled={isLoading}
                  />
                  <Label htmlFor={`value-${value}`} className="cursor-pointer capitalize">
                    {value === 'ethical' ? 'Ético' : 
                     value === 'creative' ? 'Criativo' :
                     value === 'pragmatic' ? 'Pragmático' :
                     value === 'innovative' ? 'Inovador' :
                     value === 'traditional' ? 'Tradicional' :
                     'Neutro'}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        </RuneBorder>

        {/* Opções */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="isDefault"
              checked={isDefault}
              onCheckedChange={(checked) => setIsDefault(checked === true)}
              disabled={isLoading}
            />
            <div className="flex items-center gap-1">
            <Label htmlFor="isDefault" className="cursor-pointer">
              Definir como personagem padrão
            </Label>
              {renderHint('basic', 'is_default')}
            </div>
          </div>
        </div>

        {/* Preview */}
        <CharacterPreview
          character={{
            name,
            description,
            personality_core: personalityCore,
            communication_tone: communicationTone,
            motivation_focus: motivationFocus,
            social_attitude: socialAttitude,
            cognitive_speed: cognitiveSpeed,
            vocabulary_style: vocabularyStyle,
            emotional_state: emotionalState,
            values_tendencies: valuesTendencies,
          } as Partial<Character>}
        />

        {/* Botões */}
        <div className="flex gap-2 pt-4">
          {onCancel && (
            <Button
              onClick={onCancel}
              disabled={isLoading}
              variant="outline"
              className="flex-1"
            >
              Cancelar
            </Button>
          )}
          <Button
            onClick={handleSave}
            disabled={!canSave || isLoading}
            className="flex-1"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4 mr-2" />
                ✨ {characterId ? 'Atualizar' : 'Criar'} Personagem
              </>
            )}
          </Button>
        </div>

        {/* Informações */}
        <Alert>
          <Sparkles className="w-4 h-4" />
          <AlertDescription className="text-xs">
            Configure as 8 dimensões para criar um personagem único. Quanto mais detalhado, melhor será a qualidade das transformações.
          </AlertDescription>
        </Alert>
      </div>
    </CosmicCard>
  );
}
