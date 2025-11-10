# Especificações Técnicas Detalhadas - Refatoração das Esferas

**Documento técnico complementar para implementação**

---

## 📊 1. ESTRUTURAS DE DADOS DETALHADAS

### 1.1. Tabela `characters`

```sql
CREATE TABLE public.characters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text,
  avatar_url text,
  is_default boolean DEFAULT false,
  
  -- 8 Dimensões de Personalidade
  personality_core jsonb NOT NULL DEFAULT '{
    "traits": [],
    "robotic_human": 50,
    "clown_serious": 50
  }'::jsonb,
  
  communication_tone jsonb NOT NULL DEFAULT '{
    "formality": "neutral",
    "enthusiasm": "medium",
    "style": [],
    "use_emojis": false,
    "use_slang": false,
    "use_metaphors": false
  }'::jsonb,
  
  motivation_focus jsonb NOT NULL DEFAULT '{
    "focus": "help",
    "seeks": "harmony"
  }'::jsonb,
  
  social_attitude jsonb NOT NULL DEFAULT '{
    "type": "reactive",
    "curiosity": "medium",
    "reserved_expansive": 50
  }'::jsonb,
  
  cognitive_speed jsonb NOT NULL DEFAULT '{
    "speed": "medium",
    "depth": "medium"
  }'::jsonb,
  
  vocabulary_style jsonb NOT NULL DEFAULT '{
    "style": "neutral",
    "complexity": "medium",
    "use_figures": false
  }'::jsonb,
  
  emotional_state jsonb DEFAULT '{
    "current": "neutral",
    "variability": "medium"
  }'::jsonb,
  
  values_tendencies jsonb NOT NULL DEFAULT '["neutral", "pragmatic"]'::jsonb,
  
  -- Metadados técnicos
  model_provider text NOT NULL DEFAULT 'openai',
  model_name text NOT NULL DEFAULT 'gpt-4o',
  metadata jsonb,
  
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  
  CONSTRAINT characters_model_provider_check CHECK (model_provider IN ('openai', 'anthropic'))
);

-- Índices
CREATE INDEX characters_user_id_idx ON characters(user_id);
CREATE INDEX characters_user_default_idx ON characters(user_id, is_default) WHERE is_default = true;
CREATE UNIQUE INDEX characters_user_default_unique ON characters(user_id, is_default) WHERE is_default = true;

-- RLS Policies
ALTER TABLE characters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own characters"
  ON characters FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own characters"
  ON characters FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own characters"
  ON characters FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own characters"
  ON characters FOR DELETE
  USING (auth.uid() = user_id);
```

### 1.2. Tabela `transcription_history`

```sql
CREATE TABLE public.transcription_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Fonte
  source_type text NOT NULL CHECK (source_type IN ('text', 'audio', 'video')),
  source_asset_id uuid REFERENCES assets(id) ON DELETE SET NULL,
  transcription_id uuid REFERENCES transcriptions(id) ON DELETE SET NULL,
  project_id uuid REFERENCES projects(id) ON DELETE SET NULL,
  
  -- Texto original
  original_text text NOT NULL,
  
  -- Personagem usado
  character_id uuid REFERENCES characters(id) ON DELETE SET NULL,
  
  -- Transformação aplicada
  transformation_type text CHECK (transformation_type IN ('post', 'resumo', 'newsletter', 'roteiro')),
  transformation_length text CHECK (transformation_length IN ('short', 'medium', 'long')),
  
  -- Resultado
  transformed_text text,
  
  -- Metadados
  status text DEFAULT 'completed' CHECK (status IN ('processing', 'completed', 'failed')),
  error_message text,
  cost_dracmas integer DEFAULT 0,
  
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Índices
CREATE INDEX transcription_history_user_id_idx ON transcription_history(user_id);
CREATE INDEX transcription_history_character_id_idx ON transcription_history(character_id);
CREATE INDEX transcription_history_project_id_idx ON transcription_history(project_id);
CREATE INDEX transcription_history_source_type_idx ON transcription_history(source_type);
CREATE INDEX transcription_history_created_at_idx ON transcription_history(created_at DESC);

-- RLS Policies
ALTER TABLE transcription_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transcription history"
  ON transcription_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transcription history"
  ON transcription_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own transcription history"
  ON transcription_history FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own transcription history"
  ON transcription_history FOR DELETE
  USING (auth.uid() = user_id);
```

### 1.3. Tabela `teleprompter_sessions`

```sql
CREATE TABLE public.teleprompter_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  project_id uuid REFERENCES projects(id) ON DELETE SET NULL,
  
  -- Conteúdo
  content_text text NOT NULL,
  content_source text CHECK (content_source IN ('project', 'transcription', 'manual', 'file')),
  source_id uuid, -- ID do projeto, transcrição, etc.
  
  -- Configurações da sessão
  scroll_speed integer DEFAULT 50 CHECK (scroll_speed >= 0 AND scroll_speed <= 100),
  font_size integer DEFAULT 24 CHECK (font_size >= 12 AND font_size <= 72),
  text_color text DEFAULT '#ffffff',
  background_color text DEFAULT '#000000',
  mirror_mode boolean DEFAULT false,
  
  -- Detecção de pausa
  speech_detection_enabled boolean DEFAULT true,
  silence_threshold_ms integer DEFAULT 500,
  volume_threshold integer DEFAULT 30,
  resume_delay_ms integer DEFAULT 1000,
  
  -- Gravação
  video_url text, -- URL do vídeo gravado (Supabase Storage)
  video_storage_path text, -- Caminho no storage
  duration_seconds integer,
  file_size_bytes bigint,
  
  -- Metadados
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Índices
CREATE INDEX teleprompter_sessions_user_id_idx ON teleprompter_sessions(user_id);
CREATE INDEX teleprompter_sessions_project_id_idx ON teleprompter_sessions(project_id);
CREATE INDEX teleprompter_sessions_created_at_idx ON teleprompter_sessions(created_at DESC);

-- RLS Policies
ALTER TABLE teleprompter_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own teleprompter sessions"
  ON teleprompter_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own teleprompter sessions"
  ON teleprompter_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own teleprompter sessions"
  ON teleprompter_sessions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own teleprompter sessions"
  ON teleprompter_sessions FOR DELETE
  USING (auth.uid() = user_id);
```

---

## 💻 2. INTERFACES TYPESCRIPT

### 2.1. Interface `Character`

```typescript
export interface Character {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  avatar_url?: string;
  is_default: boolean;
  
  personality_core: {
    traits: string[];
    robotic_human: number; // 0-100
    clown_serious: number; // 0-100
  };
  
  communication_tone: {
    formality: 'formal' | 'neutral' | 'informal';
    enthusiasm: 'low' | 'medium' | 'high';
    style: ('poetic' | 'technical' | 'didactic' | 'humoristic')[];
    use_emojis: boolean;
    use_slang: boolean;
    use_metaphors: boolean;
  };
  
  motivation_focus: {
    focus: 'help' | 'teach' | 'entertain' | 'challenge' | 'observe';
    seeks: 'harmony' | 'precision' | 'efficiency';
  };
  
  social_attitude: {
    type: 'proactive' | 'reactive';
    curiosity: 'low' | 'medium' | 'high';
    reserved_expansive: number; // 0-100
  };
  
  cognitive_speed: {
    speed: 'fast' | 'medium' | 'slow';
    depth: 'summary' | 'explanatory' | 'analytical' | 'philosophical';
  };
  
  vocabulary_style: {
    style: 'scientific' | 'pop' | 'literary' | 'gamer' | 'business' | 'mystical' | 'neutral';
    complexity: 'low' | 'medium' | 'high';
    use_figures: boolean;
  };
  
  emotional_state?: {
    current: 'happy' | 'tired' | 'inspired' | 'impatient' | 'curious' | 'neutral';
    variability: 'low' | 'medium' | 'high';
  };
  
  values_tendencies: ('ethical' | 'neutral' | 'rebel' | 'perfectionist' | 'minimalist' | 'creative' | 'pragmatic')[];
  
  model_provider: 'openai' | 'anthropic';
  model_name: string;
  metadata?: Record<string, any>;
  
  created_at: string;
  updated_at: string;
}
```

### 2.2. Interface `TranscriptionHistory`

```typescript
export interface TranscriptionHistory {
  id: string;
  user_id: string;
  source_type: 'text' | 'audio' | 'video';
  source_asset_id?: string;
  transcription_id?: string;
  project_id?: string;
  original_text: string;
  character_id?: string;
  transformation_type?: 'post' | 'resumo' | 'newsletter' | 'roteiro';
  transformation_length?: 'short' | 'medium' | 'long';
  transformed_text?: string;
  status: 'processing' | 'completed' | 'failed';
  error_message?: string;
  cost_dracmas: number;
  created_at: string;
  updated_at: string;
}
```

### 2.3. Interface `TeleprompterSession`

```typescript
export interface TeleprompterSession {
  id: string;
  user_id: string;
  project_id?: string;
  content_text: string;
  content_source?: 'project' | 'transcription' | 'manual' | 'file';
  source_id?: string;
  scroll_speed: number; // 0-100
  font_size: number; // 12-72
  text_color: string;
  background_color: string;
  mirror_mode: boolean;
  speech_detection_enabled: boolean;
  silence_threshold_ms: number;
  volume_threshold: number;
  resume_delay_ms: number;
  video_url?: string;
  video_storage_path?: string;
  duration_seconds?: number;
  file_size_bytes?: number;
  created_at: string;
  updated_at: string;
}
```

---

## 🔧 3. FUNÇÕES AUXILIARES

### 3.1. Construção de Prompt do Personagem

```typescript
export function buildCharacterPrompt(
  character: Character,
  inputText: string,
  transformationType: 'post' | 'resumo' | 'newsletter' | 'roteiro',
  length?: 'short' | 'medium' | 'long'
): string {
  const typeInstructions = {
    post: "Transforme o seguinte texto em um post para redes sociais, mantendo a essência e tornando-o envolvente e conciso.",
    resumo: "Crie um resumo objetivo e claro do seguinte texto, destacando os pontos principais.",
    newsletter: "Transforme o seguinte conteúdo em uma newsletter profissional e informativa, com estrutura clara e tom adequado.",
    roteiro: "Crie um roteiro estruturado baseado no seguinte conteúdo, com cenas, diálogos e direções quando apropriado.",
  };

  const lengthInstructions = {
    short: "Mantenha o conteúdo conciso.",
    medium: "Mantenha um tamanho equilibrado.",
    long: "Pode ser mais detalhado.",
  };

  let prompt = `Você é ${character.name}`;
  
  if (character.description) {
    prompt += `, ${character.description}`;
  }
  
  prompt += `. Um personagem com as seguintes características:\n\n`;

  // 🧠 Núcleo de Personalidade
  prompt += `🧠 Personalidade: ${character.personality_core.traits.join(', ')}\n`;
  prompt += `   Robótico ↔ Humano: ${character.personality_core.robotic_human}/100 (mais ${character.personality_core.robotic_human < 50 ? 'humano' : 'robótico'})\n`;
  prompt += `   Palhaço ↔ Sério: ${character.personality_core.clown_serious}/100 (mais ${character.personality_core.clown_serious < 50 ? 'sério' : 'palhaço'})\n\n`;

  // 💬 Tom de Comunicação
  prompt += `💬 Tom de Comunicação:\n`;
  prompt += `   Formalidade: ${character.communication_tone.formality}\n`;
  prompt += `   Entusiasmo: ${character.communication_tone.enthusiasm}\n`;
  prompt += `   Estilo: ${character.communication_tone.style.join(', ')}\n`;
  if (character.communication_tone.use_emojis) prompt += `   ✓ Usa emojis\n`;
  if (character.communication_tone.use_slang) prompt += `   ✓ Usa gírias\n`;
  if (character.communication_tone.use_metaphors) prompt += `   ✓ Usa metáforas\n`;
  prompt += `\n`;

  // ❤️ Motivação e Foco
  prompt += `❤️ Motivação e Foco:\n`;
  prompt += `   Foco principal: ${character.motivation_focus.focus}\n`;
  prompt += `   Busca: ${character.motivation_focus.seeks}\n\n`;

  // 👁️ Atitude Social
  prompt += `👁️ Atitude Social:\n`;
  prompt += `   Tipo: ${character.social_attitude.type}\n`;
  prompt += `   Curiosidade: ${character.social_attitude.curiosity}\n`;
  prompt += `   Reservado ↔ Expansivo: ${character.social_attitude.reserved_expansive}/100\n\n`;

  // ⚙️ Velocidade e Densidade Cognitiva
  prompt += `⚙️ Velocidade e Densidade Cognitiva:\n`;
  prompt += `   Velocidade: ${character.cognitive_speed.speed}\n`;
  prompt += `   Profundidade: ${character.cognitive_speed.depth}\n\n`;

  // 🎨 Vocabulário e Estilo Estético
  prompt += `🎨 Vocabulário e Estilo:\n`;
  prompt += `   Estilo: ${character.vocabulary_style.style}\n`;
  prompt += `   Complexidade: ${character.vocabulary_style.complexity}\n`;
  if (character.vocabulary_style.use_figures) prompt += `   ✓ Usa figuras de linguagem\n`;
  prompt += `\n`;

  // 🧩 Emoções Simuladas
  if (character.emotional_state) {
    prompt += `🧩 Estado Emocional:\n`;
    prompt += `   Estado atual: ${character.emotional_state.current}\n`;
    prompt += `   Variabilidade: ${character.emotional_state.variability}\n\n`;
  }

  // 🪞 Valores ou Tendências
  prompt += `🪞 Valores e Tendências: ${character.values_tendencies.join(', ')}\n\n`;

  // Instruções de transformação
  prompt += `${typeInstructions[transformationType]}\n`;
  if (length) {
    prompt += `${lengthInstructions[length]}\n`;
  }
  prompt += `\nTexto original:\n${inputText}\n\n`;
  prompt += `Agora, responda como ${character.name} responderia, mantendo todas as características de personalidade definidas acima:`;

  return prompt;
}
```

### 3.2. Detecção de Pausa na Fala

```typescript
export interface SpeechDetectionConfig {
  silenceThresholdMs: number; // Tempo de silêncio para considerar pausa
  volumeThreshold: number; // Volume mínimo (0-100)
  resumeDelayMs: number; // Tempo após pausa para retomar scroll
  onPause: () => void;
  onResume: () => void;
}

export class SpeechDetector {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private microphone: MediaStreamAudioSourceNode | null = null;
  private stream: MediaStream | null = null;
  private animationFrameId: number | null = null;
  private silenceStartTime: number | null = null;
  private config: SpeechDetectionConfig;
  private isPaused: boolean = false;

  constructor(config: SpeechDetectionConfig) {
    this.config = config;
  }

  async start(stream: MediaStream): Promise<void> {
    this.stream = stream;
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 256;
    this.microphone = this.audioContext.createMediaStreamSource(stream);
    this.microphone.connect(this.analyser);
    
    this.detect();
  }

  private detect(): void {
    if (!this.analyser) return;

    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(dataArray);
    
    // Calcular média de volume
    const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
    const volume = Math.round((average / 255) * 100);

    const now = Date.now();

    if (volume < this.config.volumeThreshold) {
      // Silêncio detectado
      if (!this.silenceStartTime) {
        this.silenceStartTime = now;
      } else if (now - this.silenceStartTime > this.config.silenceThresholdMs) {
        // Pausa confirmada
        if (!this.isPaused) {
          this.isPaused = true;
          this.config.onPause();
        }
      }
    } else {
      // Fala detectada
      this.silenceStartTime = null;
      
      if (this.isPaused) {
        // Aguardar delay antes de retomar
        setTimeout(() => {
          if (!this.silenceStartTime) { // Ainda falando
            this.isPaused = false;
            this.config.onResume();
          }
        }, this.config.resumeDelayMs);
      }
    }

    this.animationFrameId = requestAnimationFrame(() => this.detect());
  }

  stop(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    
    if (this.microphone) {
      this.microphone.disconnect();
      this.microphone = null;
    }
    
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    
    this.analyser = null;
    this.isPaused = false;
    this.silenceStartTime = null;
  }
}
```

### 3.3. Controle de Scroll do Teleprompter

```typescript
export interface ScrollConfig {
  speed: number; // 0-100
  mode: 'auto' | 'intelligent' | 'manual' | 'word-by-word';
  onScroll: (position: number) => void;
}

export class TeleprompterScroll {
  private config: ScrollConfig;
  private intervalId: number | null = null;
  private currentPosition: number = 0;
  private isPaused: boolean = false;
  private textLength: number = 0;

  constructor(config: ScrollConfig) {
    this.config = config;
  }

  start(textLength: number): void {
    this.textLength = textLength;
    this.currentPosition = 0;
    this.isPaused = false;
    
    if (this.config.mode === 'auto' || this.config.mode === 'intelligent') {
      this.startAutoScroll();
    }
  }

  private startAutoScroll(): void {
    // Velocidade: 0-100 → pixels por segundo
    const pixelsPerSecond = (this.config.speed / 100) * 200; // Max 200px/s
    const intervalMs = 16; // ~60fps
    const pixelsPerFrame = (pixelsPerSecond * intervalMs) / 1000;

    this.intervalId = window.setInterval(() => {
      if (!this.isPaused && this.currentPosition < this.textLength) {
        this.currentPosition += pixelsPerFrame;
        this.config.onScroll(this.currentPosition);
      }
    }, intervalMs);
  }

  pause(): void {
    this.isPaused = true;
  }

  resume(): void {
    this.isPaused = false;
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.currentPosition = 0;
    this.isPaused = false;
  }

  setSpeed(speed: number): void {
    this.config.speed = Math.max(0, Math.min(100, speed));
    if (this.intervalId) {
      this.stop();
      this.start(this.textLength);
    }
  }

  reset(): void {
    this.currentPosition = 0;
    this.config.onScroll(0);
  }
}
```

---

## 🎨 4. COMPONENTES REACT - ESTRUTURA BASE

### 4.1. CharacterCreator - Estrutura Base

```typescript
// src/components/character/CharacterCreator.tsx
import { useState } from 'react';
import { Character } from '@/types/character';

export function CharacterCreator() {
  const [character, setCharacter] = useState<Partial<Character>>({
    personality_core: {
      traits: [],
      robotic_human: 50,
      clown_serious: 50,
    },
    communication_tone: {
      formality: 'neutral',
      enthusiasm: 'medium',
      style: [],
      use_emojis: false,
      use_slang: false,
      use_metaphors: false,
    },
    // ... outras dimensões com valores padrão
  });

  return (
    <div className="space-y-6">
      {/* Nome e Descrição */}
      <div>
        <Label>Nome do Personagem</Label>
        <Input
          value={character.name || ''}
          onChange={(e) => setCharacter({ ...character, name: e.target.value })}
        />
      </div>

      {/* 8 Dimensões */}
      <PersonalityCoreEditor
        value={character.personality_core}
        onChange={(value) => setCharacter({ ...character, personality_core: value })}
      />
      
      <CommunicationToneEditor
        value={character.communication_tone}
        onChange={(value) => setCharacter({ ...character, communication_tone: value })}
      />
      
      {/* ... outras 6 dimensões */}
    </div>
  );
}
```

### 4.2. TranscriptionResult - Layout Lado a Lado

```typescript
// src/components/transcription/TranscriptionResult.tsx
interface TranscriptionResultProps {
  originalText: string;
  characterTransformedText?: string;
  character?: Character;
  isTransforming?: boolean;
  onCopyOriginal: () => void;
  onCopyTransformed: () => void;
}

export function TranscriptionResult({
  originalText,
  characterTransformedText,
  character,
  isTransforming,
  onCopyOriginal,
  onCopyTransformed,
}: TranscriptionResultProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Texto Original */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Texto Original</h3>
          <Button size="sm" variant="outline" onClick={onCopyOriginal}>
            <Copy className="w-4 h-4 mr-2" />
            Copiar
          </Button>
        </div>
        <div className="p-4 bg-muted rounded-lg min-h-[200px] max-h-[400px] overflow-y-auto">
          <p className="whitespace-pre-wrap">{originalText}</p>
        </div>
      </div>

      {/* Versão Personagem */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">
            Versão {character?.name || 'Personagem'}
          </h3>
          {characterTransformedText && (
            <Button size="sm" variant="outline" onClick={onCopyTransformed}>
              <Copy className="w-4 h-4 mr-2" />
              Copiar
            </Button>
          )}
        </div>
        <div className="p-4 bg-muted rounded-lg min-h-[200px] max-h-[400px] overflow-y-auto">
          {isTransforming ? (
            <LoadingSpinner message="Transformando com personagem..." />
          ) : characterTransformedText ? (
            <p className="whitespace-pre-wrap">{characterTransformedText}</p>
          ) : (
            <p className="text-muted-foreground text-sm">
              Selecione um personagem e clique em "Transmutar" para ver a versão transformada.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
```

### 4.3. TeleprompterDisplay - Componente Base

```typescript
// src/components/teleprompter/TeleprompterDisplay.tsx
interface TeleprompterDisplayProps {
  text: string;
  scrollPosition: number;
  fontSize: number;
  textColor: string;
  backgroundColor: string;
  mirrorMode: boolean;
}

export function TeleprompterDisplay({
  text,
  scrollPosition,
  fontSize,
  textColor,
  backgroundColor,
  mirrorMode,
}: TeleprompterDisplayProps) {
  return (
    <div
      className="relative w-full h-full overflow-hidden"
      style={{ backgroundColor }}
    >
      <div
        className="absolute w-full transition-transform duration-100 ease-linear"
        style={{
          transform: `translateY(-${scrollPosition}px)`,
          transform: mirrorMode ? `translateY(-${scrollPosition}px) scaleX(-1)` : `translateY(-${scrollPosition}px)`,
        }}
      >
        <p
          className="text-center px-8"
          style={{
            fontSize: `${fontSize}px`,
            color: textColor,
            lineHeight: 1.6,
          }}
        >
          {text}
        </p>
      </div>
    </div>
  );
}
```

---

## 🔌 5. INTEGRAÇÃO COM EDGE FUNCTIONS

### 5.1. Modificar `transform_text` para aceitar `characterId`

```typescript
// supabase/functions/transform_text/index.ts
interface TransformTextRequest {
  projectId: string;
  type: 'post' | 'resumo' | 'newsletter' | 'roteiro';
  inputText?: string;
  sourceAssetId?: string;
  tone?: string;
  length?: 'short' | 'long';
  characterId?: string; // NOVO
  idempotencyKey?: string;
}

serve(async (req: Request) => {
  const body: TransformTextRequest = await req.json();
  
  // Se characterId fornecido, buscar personagem
  let characterPrompt = '';
  if (body.characterId) {
    const { data: character } = await admin
      .from('characters')
      .select('*')
      .eq('id', body.characterId)
      .single();
    
    if (character) {
      characterPrompt = buildCharacterPrompt(
        character,
        body.inputText || '',
        body.type,
        body.length
      );
    }
  }
  
  // Usar prompt do personagem ou prompt padrão
  const finalPrompt = characterPrompt || buildDefaultPrompt(body);
  
  // ... resto da lógica
});
```

### 5.2. Modificar `transcribe_audio` para aplicar personagem opcionalmente

```typescript
// supabase/functions/transcribe_audio/index.ts
interface TranscribeParams {
  assetId: string;
  language?: string;
  characterId?: string; // NOVO - aplicar personagem após transcrição
  transformationType?: 'post' | 'resumo' | 'newsletter' | 'roteiro'; // NOVO
  transformationLength?: 'short' | 'medium' | 'long'; // NOVO
  idempotencyKey?: string;
}

serve(async (req: Request) => {
  const params: TranscribeParams = await req.json();
  
  // ... transcrição normal ...
  const { text } = await callWhisper(audioBlob, params.language);
  
  // Se characterId fornecido, aplicar transformação
  let transformedText: string | null = null;
  if (params.characterId && params.transformationType) {
    const { data: character } = await admin
      .from('characters')
      .select('*')
      .eq('id', params.characterId)
      .single();
    
    if (character) {
      const prompt = buildCharacterPrompt(
        character,
        text,
        params.transformationType,
        params.transformationLength
      );
      
      // Chamar GPT/Claude
      transformedText = await generateWithAI(prompt, character.model_provider);
    }
  }
  
  // Salvar em transcription_history
  await admin.from('transcription_history').insert({
    user_id: asset.user_id,
    source_type: 'audio',
    source_asset_id: params.assetId,
    transcription_id: transcriptionId,
    original_text: text,
    character_id: params.characterId,
    transformation_type: params.transformationType,
    transformation_length: params.transformationLength,
    transformed_text: transformedText,
    status: 'completed',
  });
  
  return new Response(JSON.stringify({
    jobId: transcriptionId,
    originalText: text,
    transformedText: transformedText,
  }), { status: 200 });
});
```

---

## 📱 6. CONSIDERAÇÕES DE PERFORMANCE

### 6.1. Otimizações do Teleprompter

1. **Virtual Scrolling**: Renderizar apenas texto visível
2. **RequestAnimationFrame**: Usar para scroll suave
3. **Web Workers**: Processar detecção de voz em worker separado
4. **Debounce**: Debounce em mudanças de velocidade
5. **Canvas**: Usar Canvas para preview de vídeo (melhor performance)

### 6.2. Otimizações de Transcrição

1. **Streaming**: Se possível, mostrar transcrição em tempo real
2. **Cache**: Cachear transcrições idênticas
3. **Compressão**: Comprimir áudio antes de enviar para Whisper

### 6.3. Otimizações de Personagens

1. **Cache de Embeddings**: Reutilizar embeddings de samples similares
2. **Lazy Loading**: Carregar personagens sob demanda
3. **Indexação**: Índices adequados no banco de dados

---

## 🎨 ESPECIFICAÇÕES DE DESIGN E COMPONENTES VISUAIS

### Visão Geral da Implementação Visual

As especificações técnicas devem ser complementadas com **componentes visuais místicos** que transformam a experiência do usuário em uma jornada arcana imersiva.

### 🌟 Componentes React com Estilo Místico

#### 1. CharacterCreator - Especificações Visuais

```typescript
// Componente com visual místico
interface CharacterCreatorProps {
  // Props técnicas existentes...
  mysticalTheme?: 'gold' | 'purple' | 'blue';
  showParticles?: boolean;
  enableAnimations?: boolean;
}

// Estilos CSS/Tailwind sugeridos:
const mysticalStyles = {
  container: 'bg-arcanum-black-soft border border-arcanum-gold/30 rounded-lg p-6 relative overflow-hidden',
  slider: 'bg-gradient-to-r from-arcanum-purple via-arcanum-gold to-arcanum-purple',
  sliderThumb: 'bg-arcanum-gold rounded-full shadow-lg shadow-arcanum-gold/50',
  tag: 'bg-arcanum-purple/20 border border-arcanum-purple/50 rounded-full px-3 py-1 text-arcanum-purple-secondary',
  previewCard: 'bg-gradient-to-br from-arcanum-black via-arcanum-purple/10 to-arcanum-black border border-arcanum-gold/50 rounded-lg p-4',
  button: 'bg-gradient-to-r from-arcanum-gold to-arcanum-gold-secondary text-arcanum-black font-bold rounded-lg px-6 py-3 hover:shadow-lg hover:shadow-arcanum-gold/50 transition-all duration-300',
};
```

#### 2. TranscriptionResult - Especificações Visuais

```typescript
// Layout lado a lado com visual místico
const transcriptionStyles = {
  container: 'grid grid-cols-1 md:grid-cols-2 gap-4',
  originalCard: 'bg-arcanum-black border border-arcanum-blue/30 rounded-lg p-4',
  transformedCard: 'bg-gradient-to-br from-arcanum-purple/20 via-arcanum-gold/10 to-arcanum-purple/20 border border-arcanum-gold/50 rounded-lg p-4',
  divider: 'hidden md:block absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-arcanum-gold to-transparent',
  copyButton: 'bg-arcanum-purple/20 border border-arcanum-purple/50 rounded-lg px-4 py-2 hover:bg-arcanum-purple/30 transition-all duration-300',
};
```

#### 3. TeleprompterDisplay - Especificações Visuais

```typescript
// Teleprompter com visual místico
const teleprompterStyles = {
  container: 'bg-arcanum-black/90 backdrop-blur-md border border-arcanum-gold/30 rounded-lg p-8 relative overflow-hidden',
  textArea: 'text-arcanum-text font-mono text-2xl leading-relaxed',
  currentLine: 'bg-gradient-to-r from-transparent via-arcanum-gold/20 to-transparent border-l-2 border-r-2 border-arcanum-gold px-4 py-2 rounded',
  particles: 'absolute inset-0 pointer-events-none', // Partículas flutuantes em background
  runes: 'absolute top-2 left-2 top-2 right-2 bottom-2 left-2 bottom-2 right-2', // Runas decorativas nos cantos
};
```

### 🎨 Sistema de Design Tokens

#### Cores (Tailwind Config)
```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        'arcanum': {
          'black': '#0A0A0A',
          'black-soft': '#1A1A1A',
          'gold': '#FFD700',
          'gold-secondary': '#FFA500',
          'purple': '#9D4EDD',
          'purple-secondary': '#C77DFF',
          'blue': '#4A90E2',
          'blue-secondary': '#6BB6FF',
          'text': '#FFFFFF',
          'text-secondary': '#E0E0E0',
        },
      },
      boxShadow: {
        'arcanum-glow': '0 0 20px rgba(255, 215, 0, 0.5)',
        'arcanum-glow-purple': '0 0 20px rgba(157, 78, 221, 0.5)',
      },
      backgroundImage: {
        'gradient-gold': 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
        'gradient-purple': 'linear-gradient(135deg, #9D4EDD 0%, #C77DFF 100%)',
        'gradient-cosmic': 'linear-gradient(135deg, #4A90E2 0%, #6BB6FF 50%, #9D4EDD 100%)',
      },
    },
  },
};
```

### ✨ Animações e Efeitos

#### Framer Motion Variants
```typescript
// Animações reutilizáveis
export const mysticalAnimations = {
  portalOpen: {
    initial: { scale: 0, opacity: 0, rotate: -180 },
    animate: { scale: 1, opacity: 1, rotate: 0 },
    exit: { scale: 0, opacity: 0, rotate: 180 },
    transition: { duration: 0.6, ease: [0.4, 0, 0.2, 1] },
  },
  particleExplosion: {
    initial: { scale: 0, opacity: 1 },
    animate: { 
      scale: [0, 1.5, 0],
      opacity: [1, 1, 0],
      x: [0, (Math.random() - 0.5) * 100],
      y: [0, (Math.random() - 0.5) * 100],
    },
    transition: { duration: 0.8, ease: 'easeOut' },
  },
  runeGlow: {
    initial: { opacity: 0.3 },
    animate: { opacity: [0.3, 1, 0.3] },
    transition: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
  },
  textMagic: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5, staggerChildren: 0.03 },
  },
};
```

### 🎭 Componentes de UI Místicos

#### RuneBorder Component
```typescript
// Componente de borda com runas decorativas
export const RuneBorder = ({ children, variant = 'gold' }: RuneBorderProps) => {
  return (
    <div className="relative">
      {/* Runas nos cantos */}
      <RuneCorner position="top-left" variant={variant} />
      <RuneCorner position="top-right" variant={variant} />
      <RuneCorner position="bottom-left" variant={variant} />
      <RuneCorner position="bottom-right" variant={variant} />
      {children}
    </div>
  );
};
```

#### ParticleBackground Component
```typescript
// Componente de partículas flutuantes
export const ParticleBackground = ({ 
  color = 'purple', 
  density = 50 
}: ParticleBackgroundProps) => {
  // Implementação com canvas ou SVG para partículas animadas
  // Cores: dourado, lilás, azul cósmico
  // Movimento suave e orgânico
};
```

#### MysticalButton Component
```typescript
// Botão com visual místico
export const MysticalButton = ({ 
  children, 
  variant = 'gold',
  onClick 
}: MysticalButtonProps) => {
  return (
    <button
      className={`
        bg-gradient-${variant}
        border border-arcanum-${variant}/50
        rounded-lg px-6 py-3
        hover:shadow-arcanum-glow-${variant}
        transition-all duration-300
        relative overflow-hidden
      `}
      onClick={onClick}
    >
      {/* Efeito de brilho ao hover */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] hover:translate-x-[100%] transition-transform duration-700" />
      {children}
    </button>
  );
};
```

### 📱 Responsividade Mística

#### Breakpoints e Adaptações
```typescript
// Adaptações visuais por tamanho de tela
const responsiveMysticalStyles = {
  mobile: {
    particles: 'reduced', // Menos partículas em mobile
    animations: 'simplified', // Animações mais simples
    runes: 'hidden', // Runas ocultas em telas muito pequenas
  },
  tablet: {
    particles: 'medium',
    animations: 'standard',
    runes: 'visible',
  },
  desktop: {
    particles: 'full',
    animations: 'enhanced',
    runes: 'animated', // Runas com animação
  },
};
```

### 🎨 Acessibilidade Visual

#### Contraste e Legibilidade
- **Contraste mínimo:** 4.5:1 para texto normal, 3:1 para texto grande
- **Modo alto contraste:** Versão com cores mais saturadas disponível
- **Redução de movimento:** Respeitar `prefers-reduced-motion`
- **Tamanhos de fonte:** Mínimo 16px, ajustável até 24px

#### Indicadores Visuais
- **Focus:** Borda dourada brilhante (2px) em elementos focáveis
- **Estados:** Cores distintas para hover, active, disabled
- **Feedback:** Animações sutis mesmo com movimento reduzido

---

### 🌌 ESPECIFICAÇÕES AVANÇADAS: COMPONENTES DE IMERSÃO

#### Sistema de Partículas Místicas

```typescript
// Sistema de partículas configurável
interface ParticleSystemConfig {
  type: 'gold' | 'purple' | 'blue' | 'cosmic';
  density: number; // 0-100
  speed: 'slow' | 'medium' | 'fast';
  behavior: 'float' | 'orbit' | 'flow' | 'explode';
  responsive: boolean; // Reduz em mobile
}

// Implementação com Canvas ou WebGL
export const MysticalParticleSystem = ({
  config,
  containerRef
}: ParticleSystemProps) => {
  // Canvas-based particle system
  // Suporta milhares de partículas com performance otimizada
  // Degradação graciosa para dispositivos mais lentos
};
```

#### Sistema de Runas Animadas

```typescript
// Runas decorativas com animação
interface RuneConfig {
  variant: 'gold' | 'purple' | 'blue';
  size: 'small' | 'medium' | 'large';
  animation: 'glow' | 'rotate' | 'pulse' | 'flow';
  position: 'corner' | 'border' | 'center';
}

export const AnimatedRune = ({ config }: RuneProps) => {
  // SVG-based runes com animações CSS/JS
  // Suporta diferentes símbolos místicos
  // Performance otimizada com GPU acceleration
};
```

#### Sistema de Portais e Transições

```typescript
// Portal component para transições místicas
interface PortalProps {
  isOpen: boolean;
  variant: 'gold' | 'purple' | 'blue' | 'cosmic';
  size: 'small' | 'medium' | 'large' | 'fullscreen';
  onComplete?: () => void;
}

export const MysticalPortal = ({ 
  isOpen, 
  variant, 
  size,
  children,
  onComplete 
}: PortalProps) => {
  // Portal com efeito de vórtice
  // Suporta diferentes tamanhos e variantes
  // Callback quando animação completa
};
```

#### Sistema de Mensagens Poéticas

```typescript
// Sistema de mensagens contextuais poéticas
interface PoeticMessageConfig {
  context: 'loading' | 'success' | 'error' | 'waiting' | 'info';
  character?: string; // Personagem que "fala"
  duration?: number;
  animation?: 'fade' | 'typewriter' | 'materialize';
}

export const PoeticMessage = ({ config }: PoeticMessageProps) => {
  // Mensagens rotativas baseadas em contexto
  // Suporte a múltiplos personagens
  // Animações de escrita mágica
  // Internacionalização preparada
};
```

#### Sistema de Feedback Sensorial

```typescript
// Feedback multimodal (visual + haptic + audio opcional)
interface SensoryFeedbackConfig {
  type: 'success' | 'error' | 'warning' | 'info' | 'interaction';
  intensity: 'subtle' | 'normal' | 'strong';
  haptic?: boolean; // Mobile only
  audio?: boolean; // Opcional, futuro
}

export const SensoryFeedback = ({ config }: SensoryFeedbackProps) => {
  // Coordena feedback visual, haptic e audio
  // Respeita preferências de acessibilidade
  // Performance otimizada
};
```

### 🎨 Sistema de Temas Dinâmicos

```typescript
// Sistema de temas místicos dinâmicos
interface MysticalTheme {
  name: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
  particles: ParticleSystemConfig;
  runes: RuneConfig[];
  animations: {
    speed: number;
    intensity: number;
  };
}

export const ThemeProvider = ({ 
  theme, 
  children 
}: ThemeProviderProps) => {
  // Provider de tema com suporte a múltiplos temas místicos
  // Transições suaves entre temas
  // Persistência de preferências
};
```

### 📊 Métricas de Experiência Visual

```typescript
// Tracking de métricas de experiência visual
interface VisualExperienceMetrics {
  animationPerformance: number; // FPS médio
  interactionLatency: number; // ms
  particleDensity: number; // Partículas ativas
  userPreference: {
    reducedMotion: boolean;
    highContrast: boolean;
    theme: string;
  };
}

export const trackVisualExperience = (metrics: VisualExperienceMetrics) => {
  // Coleta métricas de performance visual
  // Ajusta automaticamente baseado em performance
  // Respeita preferências do usuário
};
```

### 🔧 Utilitários de Design Místico

```typescript
// Funções utilitárias para design místico
export const mysticalUtils = {
  // Gera gradiente místico baseado em variante
  generateGradient: (variant: 'gold' | 'purple' | 'blue' | 'cosmic') => string,
  
  // Calcula brilho baseado em contexto
  calculateGlow: (intensity: number, variant: string) => string,
  
  // Gera cor mística baseada em estado emocional
  getEmotionalColor: (emotion: 'happy' | 'calm' | 'energetic' | 'mysterious') => string,
  
  // Calcula densidade de partículas baseada em performance
  calculateParticleDensity: (devicePerformance: 'low' | 'medium' | 'high') => number,
  
  // Gera mensagem poética baseada em contexto
  generatePoeticMessage: (context: string, character?: string) => string,
};
```

---

## 🔒 ESPECIFICAÇÕES DE SEGURANÇA TÉCNICA

### Validação e Sanitização de Dados

#### Schemas Zod para Validação

```typescript
// Validação rigorosa de personagens
import { z } from 'zod';

const PersonalityCoreSchema = z.object({
  traits: z.array(z.string().max(50)).max(20),
  robotic_human: z.number().min(0).max(100),
  clown_serious: z.number().min(0).max(100),
});

const CommunicationToneSchema = z.object({
  formality: z.enum(['formal', 'neutral', 'informal']),
  enthusiasm: z.enum(['low', 'medium', 'high']),
  style: z.array(z.enum(['poetic', 'technical', 'didactic', 'humoristic'])).max(4),
  use_emojis: z.boolean(),
  use_slang: z.boolean(),
  use_metaphors: z.boolean(),
});

const CharacterSchema = z.object({
  name: z.string()
    .min(1)
    .max(100)
    .regex(/^[a-zA-Z0-9\s\-_.,!?áàâãéêíóôõúçÁÀÂÃÉÊÍÓÔÕÚÇ]+$/, 'Nome contém caracteres inválidos'),
  description: z.string()
    .max(500)
    .optional()
    .transform(val => sanitizeHTML(val || '')),
  avatar_url: z.string()
    .url()
    .regex(/\.(jpg|jpeg|png|webp|gif)$/i, 'Formato de imagem inválido')
    .optional(),
  personality_core: PersonalityCoreSchema,
  communication_tone: CommunicationToneSchema,
  // ... outras dimensões com validação similar
});

// Função de sanitização HTML
function sanitizeHTML(input: string): string {
  // Remover tags HTML, manter apenas texto
  // Usar biblioteca como DOMPurify ou similar
  return input.replace(/<[^>]*>/g, '');
}
```

#### Validação de Uploads

```typescript
// Validação de arquivos de áudio/vídeo
const ALLOWED_AUDIO_TYPES = ['audio/mpeg', 'audio/wav', 'audio/mp4', 'audio/webm'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];
const MAX_AUDIO_SIZE = 100 * 1024 * 1024; // 100MB
const MAX_VIDEO_SIZE = 500 * 1024 * 1024; // 500MB

async function validateFileUpload(file: File, type: 'audio' | 'video'): Promise<void> {
  // Validar tipo MIME
  const allowedTypes = type === 'audio' ? ALLOWED_AUDIO_TYPES : ALLOWED_VIDEO_TYPES;
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Tipo de arquivo não permitido');
  }
  
  // Validar tamanho
  const maxSize = type === 'audio' ? MAX_AUDIO_SIZE : MAX_VIDEO_SIZE;
  if (file.size > maxSize) {
    throw new Error('Arquivo muito grande');
  }
  
  // Validar extensão
  const extension = file.name.split('.').pop()?.toLowerCase();
  const allowedExtensions = type === 'audio' 
    ? ['mp3', 'wav', 'm4a', 'webm']
    : ['mp4', 'webm', 'mov'];
  if (!extension || !allowedExtensions.includes(extension)) {
    throw new Error('Extensão de arquivo não permitida');
  }
  
  // TODO: Scan de vírus antes de processar
}
```

### Row Level Security (RLS) - Políticas Avançadas

#### Políticas RLS para Characters

```sql
-- Política adicional: Usuários só podem ter um personagem padrão
CREATE POLICY "Users can only have one default character"
  ON characters FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND (
      is_default = false OR
      NOT EXISTS (
        SELECT 1 FROM characters 
        WHERE user_id = auth.uid() AND is_default = true
      )
    )
  );

-- Política adicional: Validação de integridade
CREATE POLICY "Users cannot modify other users' characters"
  ON characters FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id AND
    user_id = (SELECT user_id FROM characters WHERE id = characters.id)
  );
```

#### Políticas RLS para Transcription History

```sql
-- Política adicional: Usuários só podem ver suas próprias transcrições
CREATE POLICY "Users can only view own transcriptions"
  ON transcription_history FOR SELECT
  USING (auth.uid() = user_id);

-- Política adicional: Validação de character_id pertence ao usuário
CREATE POLICY "Users can only use own characters"
  ON transcription_history FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND (
      character_id IS NULL OR
      EXISTS (
        SELECT 1 FROM characters 
        WHERE id = character_id AND user_id = auth.uid()
      )
    )
  );
```

### Proteção de Edge Functions

#### Validação em Edge Functions

```typescript
// Exemplo: Edge Function com validação de segurança
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req: Request) => {
  // 1. Validar método HTTP
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  
  // 2. Validar autenticação
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  
  // 3. Validar token JWT
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    {
      global: { headers: { Authorization: authHeader } },
    }
  );
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return new Response(JSON.stringify({ error: 'Invalid token' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  
  // 4. Validar e sanitizar input
  const body = await req.json();
  const validatedData = CharacterSchema.parse(body);
  
  // 5. Rate limiting (implementar com Redis ou similar)
  // TODO: Verificar rate limit por user_id
  
  // 6. Processar com validação adicional
  // ...
  
  // 7. Log de auditoria (sem dados sensíveis)
  console.log(JSON.stringify({
    action: 'character_created',
    user_id: user.id,
    timestamp: new Date().toISOString(),
    // Não logar dados do personagem completo
  }));
  
  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
});
```

### Criptografia de Dados Sensíveis

#### Criptografia de Transcrições

```typescript
// Criptografar transcrições antes de armazenar
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY = Buffer.from(Deno.env.get('ENCRYPTION_KEY') || '', 'hex');

function encryptTranscription(text: string): { encrypted: string; iv: string; tag: string } {
  const iv = randomBytes(16);
  const cipher = createCipheriv(ALGORITHM, KEY, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const tag = cipher.getAuthTag();
  
  return {
    encrypted,
    iv: iv.toString('hex'),
    tag: tag.toString('hex'),
  };
}

function decryptTranscription(encrypted: string, iv: string, tag: string): string {
  const decipher = createDecipheriv(ALGORITHM, KEY, Buffer.from(iv, 'hex'));
  decipher.setAuthTag(Buffer.from(tag, 'hex'));
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}
```

### Rate Limiting

#### Implementação de Rate Limiting

```typescript
// Rate limiting por usuário e por IP
interface RateLimitConfig {
  windowMs: number; // Janela de tempo em ms
  maxRequests: number; // Máximo de requisições
  keyGenerator: (req: Request) => string; // Função para gerar chave
}

class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  
  async checkLimit(req: Request, config: RateLimitConfig): Promise<boolean> {
    const key = config.keyGenerator(req);
    const now = Date.now();
    
    if (!this.requests.has(key)) {
      this.requests.set(key, []);
    }
    
    const userRequests = this.requests.get(key)!;
    
    // Remover requisições antigas
    const validRequests = userRequests.filter(
      timestamp => now - timestamp < config.windowMs
    );
    
    if (validRequests.length >= config.maxRequests) {
      return false; // Limite excedido
    }
    
    validRequests.push(now);
    this.requests.set(key, validRequests);
    
    return true; // Dentro do limite
  }
}

// Configurações de rate limiting
const RATE_LIMITS = {
  characterCreation: { windowMs: 3600000, maxRequests: 10 }, // 10/hora
  transcription: { windowMs: 3600000, maxRequests: 100 }, // 100/hora
  teleprompterSession: { windowMs: 3600000, maxRequests: 20 }, // 20/hora
};
```

### Detecção de Dados Sensíveis

#### Padrões de Detecção

```typescript
// Detectar dados sensíveis em transcrições
const SENSITIVE_PATTERNS = {
  email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
  phone: /\b\d{2,3}[-.\s]?\d{4,5}[-.\s]?\d{4}\b/g,
  cpf: /\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/g,
  creditCard: /\b\d{4}[-.\s]?\d{4}[-.\s]?\d{4}[-.\s]?\d{4}\b/g,
  token: /\b[A-Za-z0-9]{20,}\b/g, // Tokens longos
};

function detectSensitiveData(text: string): {
  detected: boolean;
  types: string[];
  masked: string;
} {
  const detectedTypes: string[] = [];
  let masked = text;
  
  for (const [type, pattern] of Object.entries(SENSITIVE_PATTERNS)) {
    if (pattern.test(text)) {
      detectedTypes.push(type);
      masked = masked.replace(pattern, (match) => '*'.repeat(match.length));
    }
  }
  
  return {
    detected: detectedTypes.length > 0,
    types: detectedTypes,
    masked,
  };
}
```

### Logs de Auditoria

#### Estrutura de Logs Seguros

```typescript
// Logs de auditoria sem dados sensíveis
interface AuditLog {
  action: string;
  user_id: string;
  resource_type: string;
  resource_id?: string;
  timestamp: string;
  ip_address?: string;
  user_agent?: string;
  success: boolean;
  error_message?: string;
  // NUNCA incluir: senhas, tokens, transcrições completas, dados pessoais
}

async function logAuditEvent(log: AuditLog): Promise<void> {
  // Enviar para serviço de logs (ex: Supabase Logs, CloudWatch, etc.)
  // Retenção: 90 dias
  // Acesso: Apenas administradores
  console.log(JSON.stringify(log));
}
```

### Headers de Segurança

#### Configuração de Headers HTTP

```typescript
// Headers de segurança para respostas
const SECURITY_HEADERS = {
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';",
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
};

function addSecurityHeaders(response: Response): Response {
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  return response;
}
```

---

**Fim das Especificações Técnicas**

