# Análise Detalhada: Refatoração das Esferas Essência, Energia e Escudo

**Data:** 2025-01-15  
**Autor:** Análise Técnica  
**Status:** Planejamento

---

## 📋 Sumário Executivo

Esta análise detalha as mudanças necessárias para transformar três esferas principais do Arcanum.AI:

1. **Esfera Essência**: Evoluir de "Brand Voice" para sistema de "Personagens" com personalidade tipo RPG
2. **Esfera Energia**: Integrar transcrição (texto/áudio/vídeo) com transformação usando personagens
3. **Esfera Escudo**: Transformar completamente em Teleprompter com IA integrada

---

## 🎭 1. ESFERA ESSÊNCIA: De Brand Voice para Sistema de Personagens

### 1.1. Visão Geral da Mudança

**Estado Atual:**
- Sistema baseado em "Brand Voice" (voz da marca)
- Usa tabelas `brand_profiles`, `brand_samples`, `brand_embeddings`
- Treinamento através de samples textuais
- Transformação de texto usando embeddings e similaridade

**Estado Desejado:**
- Sistema de "Personagens" com personalidade configurável
- 8 dimensões de personalidade (tipo RPG com barrinhas)
- Personagens aplicados às transcrições (não apenas transformações)
- Interface visual tipo RPG para criação e personalização

### 1.2. Mudanças no Modelo de Dados

#### 1.2.1. Nova Tabela: `characters` (substitui `brand_profiles`)

```sql
CREATE TABLE public.characters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text,
  avatar_url text, -- URL da imagem do personagem
  is_default boolean DEFAULT false,
  
  -- 8 Dimensões de Personalidade (0-100 ou similar)
  personality_core jsonb NOT NULL, -- { "traits": ["alegre", "otimista", "expansivo"] }
  communication_tone jsonb NOT NULL, -- { "formality": "informal", "enthusiasm": "high", "style": "humoristic" }
  motivation_focus jsonb NOT NULL, -- { "focus": "help", "seeks": "harmony" }
  social_attitude jsonb NOT NULL, -- { "type": "proactive", "curiosity": "high" }
  cognitive_speed jsonb NOT NULL, -- { "speed": "fast", "depth": "analytical" }
  vocabulary_style jsonb NOT NULL, -- { "style": "pop", "complexity": "medium" }
  emotional_state jsonb, -- { "current": "happy", "variability": "high" }
  values_tendencies jsonb NOT NULL, -- { "ethics": "neutral", "approach": "creative" }
  
  -- Metadados técnicos
  model_provider text NOT NULL DEFAULT 'openai',
  model_name text NOT NULL DEFAULT 'gpt-4o',
  metadata jsonb,
  
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  
  CONSTRAINT characters_model_provider_check CHECK (model_provider IN ('openai', 'anthropic'))
);

-- Manter compatibilidade com brand_profiles durante transição
-- Criar migration para migrar dados existentes
```

#### 1.2.2. Nova Tabela: `character_samples` (substitui `brand_samples`)

```sql
CREATE TABLE public.character_samples (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id uuid REFERENCES characters(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  text_content text NOT NULL,
  source_type text DEFAULT 'manual', -- 'manual', 'transcription', 'transformation'
  source_asset_id uuid REFERENCES assets(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);
```

#### 1.2.3. Nova Tabela: `character_embeddings` (substitui `brand_embeddings`)

```sql
CREATE TABLE public.character_embeddings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id uuid REFERENCES characters(id) ON DELETE CASCADE NOT NULL,
  character_sample_id uuid REFERENCES character_samples(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  embedding vector(1536), -- pgvector
  embedding_jsonb jsonb, -- fallback se pgvector não disponível
  text_chunk text NOT NULL,
  chunk_index integer NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);
```

### 1.3. Interface de Criação de Personagem

#### 1.3.1. Componente: `CharacterCreator.tsx`

**Estrutura Visual:**
```
┌─────────────────────────────────────────┐
│  Criar Novo Personagem                  │
├─────────────────────────────────────────┤
│  Nome: [________________]                │
│  Descrição: [________________]          │
│  Avatar: [Upload]                        │
│                                          │
│  🧠 Núcleo de Personalidade              │
│  [Robótico] ━━━━━━━━━━━━━━━━━ [Humano]  │
│  [Palhaço] ━━━━━━━━━━━━━━━━━ [Sério]   │
│  Traits: [alegre] [otimista] [+]        │
│                                          │
│  💬 Tom de Comunicação                   │
│  Formalidade: [Informal] ━━━ [Formal]  │
│  Entusiasmo: [Baixo] ━━━━━━━ [Alto]     │
│  Estilo: [Poético] [Técnico] [Humor]   │
│                                          │
│  ❤️ Motivação e Foco                      │
│  Foco: [Ajudar] [Ensinar] [Entreter]    │
│  Busca: [Harmonia] [Precisão] [Eficiência]
│                                          │
│  ... (outras 5 dimensões)               │
│                                          │
│  [Cancelar] [Criar Personagem]          │
└─────────────────────────────────────────┘
```

**8 Dimensões Detalhadas:**

1. **🧠 Núcleo de Personalidade**
   - Sliders: Robótico ↔ Humano, Palhaço ↔ Sério, etc.
   - Campo de tags: Adicionar traços (alegre, otimista, expansivo, etc.)
   - Armazenar: Array de strings em `personality_core.traits`

2. **💬 Tom de Comunicação**
   - Slider: Formal ↔ Informal
   - Slider: Entusiasmado ↔ Neutro ↔ Minimalista
   - Checkboxes: Poético, Técnico, Didático, Humorístico
   - Checkbox: Usar emojis, gírias, metáforas
   - Armazenar: Objeto com propriedades em `communication_tone`

3. **❤️ Motivação e Foco**
   - Radio/Select: Foco principal (ajudar, ensinar, entreter, desafiar, observar)
   - Radio/Select: Busca (harmonia, precisão, eficiência)
   - Armazenar: Objeto em `motivation_focus`

4. **👁️ Atitude Social**
   - Radio: Proativo ↔ Reativo
   - Slider: Curiosidade (baixa ↔ alta)
   - Slider: Reservado ↔ Expansivo
   - Armazenar: Objeto em `social_attitude`

5. **⚙️ Velocidade e Densidade Cognitiva**
   - Radio: Resumido ↔ Explicativo ↔ Analítico ↔ Filosófico
   - Slider: Rápido ↔ Lento
   - Armazenar: Objeto em `cognitive_speed`

6. **🎨 Vocabulário e Estilo Estético**
   - Select: Científico, Pop, Literário, Gamer, Empresarial
   - Slider: Complexidade sintática (simples ↔ complexo)
   - Checkbox: Usar figuras de linguagem
   - Armazenar: Objeto em `vocabulary_style`

7. **🧩 Emoções Simuladas**
   - Select: Estado atual (feliz, cansado, inspirado, impaciente, curioso)
   - Slider: Variabilidade emocional (baixa ↔ alta)
   - Armazenar: Objeto em `emotional_state`

8. **🪞 Valores ou Tendências**
   - Checkboxes: Ético, Neutro, Rebelde, Perfeccionista, Minimalista, Criativo, Pragmático
   - Armazenar: Array em `values_tendencies`

### 1.4. Construção do Prompt para IA

**Antes (Brand Voice):**
```typescript
prompt = `Transforme o texto usando voz da marca: ${brandProfile.name}
Descrição: ${brandProfile.description}
Exemplos: ${similarChunks.join('\n')}
Texto: ${inputText}`
```

**Depois (Personagem):**
```typescript
prompt = buildCharacterPrompt(character, inputText, transformationType);

function buildCharacterPrompt(character, inputText, type) {
  return `
Você é ${character.name}, um personagem com as seguintes características:

🧠 Personalidade: ${character.personality_core.traits.join(', ')}
💬 Tom: ${character.communication_tone.formality}, ${character.communication_tone.style}
❤️ Foco: ${character.motivation_focus.focus}, busca ${character.motivation_focus.seeks}
👁️ Atitude: ${character.social_attitude.type}, curiosidade ${character.social_attitude.curiosity}
⚙️ Velocidade: ${character.cognitive_speed.speed}, profundidade ${character.cognitive_speed.depth}
🎨 Estilo: ${character.vocabulary_style.style}, complexidade ${character.vocabulary_style.complexity}
🧩 Estado: ${character.emotional_state?.current || 'neutro'}
🪞 Valores: ${character.values_tendencies.join(', ')}

${getTransformationInstructions(type)}

Texto original:
${inputText}

Agora, responda como ${character.name} responderia:
`;
}
```

### 1.5. Componentes a Criar/Modificar

**Novos Componentes:**
- `CharacterCreator.tsx` - Formulário de criação com 8 dimensões
- `CharacterLibrary.tsx` - Lista de personagens criados
- `CharacterPersonalitySliders.tsx` - Componente reutilizável para sliders de personalidade
- `CharacterPreview.tsx` - Preview de como o personagem responderia

**Componentes a Modificar:**
- `BrandVoiceTrainer.tsx` → `CharacterCreator.tsx` (refatoração completa)
- `BrandVoiceLibrary.tsx` → `CharacterLibrary.tsx`
- `BrandVoicePreview.tsx` → `CharacterPreview.tsx` (ou remover se não necessário)

**Hooks a Criar/Modificar:**
- `useBrandVoice.ts` → `useCharacters.ts` (refatoração completa)
- `brandVoiceService.ts` → `characterService.ts`

**Schemas a Criar:**
- `src/schemas/character.ts` - Validação Zod para personagens

### 1.6. Migração de Dados

**Estratégia:**
1. Criar novas tabelas (`characters`, `character_samples`, `character_embeddings`)
2. Criar migration script para converter `brand_profiles` → `characters`
3. Manter `brand_profiles` por compatibilidade durante transição
4. Deprecar `brand_profiles` após migração completa

**Script de Migração:**
```sql
-- Converter brand_profiles para characters
INSERT INTO characters (
  id, user_id, name, description, is_default,
  personality_core, communication_tone, motivation_focus,
  social_attitude, cognitive_speed, vocabulary_style,
  emotional_state, values_tendencies,
  model_provider, model_name, metadata,
  created_at, updated_at
)
SELECT 
  id, user_id, name, description, is_default,
  '{"traits": []}'::jsonb, -- Default, usuário pode ajustar depois
  '{"formality": "neutral", "style": "neutral"}'::jsonb,
  '{"focus": "help", "seeks": "harmony"}'::jsonb,
  '{"type": "reactive", "curiosity": "medium"}'::jsonb,
  '{"speed": "medium", "depth": "medium"}'::jsonb,
  '{"style": "neutral", "complexity": "medium"}'::jsonb,
  NULL::jsonb,
  '["neutral", "pragmatic"]'::jsonb,
  model_provider, model_name, metadata,
  created_at, updated_at
FROM brand_profiles;
```

---

## ⚡ 2. ESFERA ENERGIA: Transcrição + Transformação Integrada

### 2.1. Visão Geral da Mudança

**Estado Atual:**
- 3 abas: Texto, Áudio, Vídeo
- Aba Texto: Funcional (TransformTextPortal)
- Aba Áudio: Placeholder (sem funcionalidade)
- Aba Vídeo: Placeholder (sem funcionalidade)
- Histórico: Placeholder

**Estado Desejado:**
- 3 abas funcionais com fluxo integrado
- Transcrição automática de áudio/vídeo
- Seleção de personagem para transformação
- Visualização lado a lado: Original vs Personagem
- Botão de copiar resultado
- Histórico completo de todas as transcrições

### 2.2. Fluxo de Trabalho Unificado

#### 2.2.1. Aba Texto

**Fluxo:**
```
1. Usuário digita texto
2. Seleciona personagem
3. Seleciona tipo de transformação (post, resumo, newsletter, roteiro)
4. Seleciona tamanho (curto, médio, longo)
5. (Opcional) Seleciona projeto
6. Clica em "Transmutar"
7. Mostra resultado lado a lado:
   ┌─────────────────┬─────────────────┐
   │ Texto Original  │ Versão Personagem│
   │ [texto]         │ [texto transformado]
   │ [Copiar]        │ [Copiar]        │
   └─────────────────┴─────────────────┘
```

**Componente:** `TransformTextTab.tsx` (refatorar `TransformTextPortal.tsx`)

#### 2.2.2. Aba Áudio

**Fluxo:**
```
1. Usuário faz upload ou grava áudio
2. Sistema transcreve automaticamente (Whisper)
3. Mostra transcrição original
4. Usuário seleciona personagem
5. Seleciona tipo de transformação
6. Seleciona tamanho
7. (Opcional) Seleciona projeto
8. Clica em "Transmutar com Personagem"
9. Mostra resultado lado a lado:
   ┌─────────────────┬─────────────────┐
   │ Transcrição     │ Versão Personagem│
   │ Original        │                  │
   │ [texto]         │ [texto transformado]
   │ [Copiar]        │ [Copiar]        │
   └─────────────────┴─────────────────┘
```

**Componentes Necessários:**
- `AudioTranscribeTab.tsx` - Nova aba completa
- `AudioRecorder.tsx` - Componente para gravar áudio
- `AudioUploader.tsx` - Componente para upload de arquivo
- `TranscriptionResult.tsx` - Mostrar transcrição + transformação lado a lado

**Edge Function:** `transcribe_audio` (já existe, precisa integração)

#### 2.2.3. Aba Vídeo

**Fluxo:**
```
1. Usuário faz upload de vídeo
2. Sistema extrai áudio do vídeo
3. Sistema transcreve áudio (Whisper)
4. Mostra transcrição original
5. Usuário seleciona personagem
6. Seleciona tipo de transformação
7. Seleciona tamanho
8. (Opcional) Seleciona projeto
9. Clica em "Transmutar com Personagem"
10. Mostra resultado lado a lado:
   ┌─────────────────┬─────────────────┐
   │ Transcrição     │ Versão Personagem│
   │ Original        │                  │
   │ [texto]         │ [texto transformado]
   │ [Copiar]        │ [Copiar]        │
   └─────────────────┴─────────────────┘
```

**Componentes Necessários:**
- `VideoTranscribeTab.tsx` - Nova aba completa
- `VideoUploader.tsx` - Componente para upload de vídeo
- `TranscriptionResult.tsx` - Reutilizar componente

**Edge Function:** `video_short` (existe mas precisa melhorar extração de áudio)

### 2.3. Componente: `TranscriptionResult.tsx`

**Estrutura:**
```tsx
interface TranscriptionResultProps {
  originalText: string;
  characterTransformedText?: string;
  character?: Character;
  isTransforming?: boolean;
  onCopyOriginal: () => void;
  onCopyTransformed: () => void;
}

// Layout lado a lado responsivo
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  <div className="space-y-2">
    <h3>Texto Original</h3>
    <div className="p-4 bg-muted rounded-lg">
      {originalText}
    </div>
    <Button onClick={onCopyOriginal}>Copiar</Button>
  </div>
  <div className="space-y-2">
    <h3>Versão {character?.name}</h3>
    {isTransforming ? (
      <LoadingSpinner />
    ) : (
      <>
        <div className="p-4 bg-muted rounded-lg">
          {characterTransformedText}
        </div>
        <Button onClick={onCopyTransformed}>Copiar</Button>
      </>
    )}
  </div>
</div>
```

### 2.4. Histórico de Transcrições

**Nova Tabela: `transcription_history`**
```sql
CREATE TABLE public.transcription_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  source_type text NOT NULL, -- 'text', 'audio', 'video'
  source_asset_id uuid REFERENCES assets(id) ON DELETE SET NULL,
  project_id uuid REFERENCES projects(id) ON DELETE SET NULL,
  
  -- Texto original
  original_text text NOT NULL,
  
  -- Personagem usado
  character_id uuid REFERENCES characters(id) ON DELETE SET NULL,
  
  -- Transformação aplicada
  transformation_type text, -- 'post', 'resumo', 'newsletter', 'roteiro'
  transformation_length text, -- 'short', 'medium', 'long'
  
  -- Resultado
  transformed_text text,
  
  -- Metadados
  status text DEFAULT 'completed', -- 'processing', 'completed', 'failed'
  error_message text,
  cost_dracmas integer DEFAULT 0,
  
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);
```

**Componente: `TranscriptionHistory.tsx`**
- Lista todas as transcrições do usuário
- Filtros: por tipo (texto/áudio/vídeo), por personagem, por projeto
- Busca por texto
- Ações: Ver detalhes, Copiar, Deletar, Re-transmutar com outro personagem

### 2.5. Integração com Edge Functions

**Modificar `transform_text` Edge Function:**
- Aceitar `characterId` ao invés de `brandProfileId`
- Construir prompt usando dados do personagem
- Retornar texto original + texto transformado

**Modificar `transcribe_audio` Edge Function:**
- Após transcrição, opcionalmente aplicar personagem
- Retornar transcrição + versão personagem (se solicitado)

**Modificar `video_short` Edge Function:**
- Extrair áudio do vídeo
- Transcrever áudio
- Opcionalmente aplicar personagem
- Retornar transcrição + versão personagem

### 2.6. Componentes a Criar/Modificar

**Novos Componentes:**
- `AudioTranscribeTab.tsx`
- `VideoTranscribeTab.tsx`
- `AudioRecorder.tsx`
- `AudioUploader.tsx`
- `VideoUploader.tsx`
- `TranscriptionResult.tsx`
- `TranscriptionHistory.tsx`
- `CharacterSelector.tsx` - Seletor de personagem para usar na transformação

**Componentes a Modificar:**
- `EnergiaPortal.tsx` - Integrar novas abas funcionais
- `TransformTextPortal.tsx` - Adicionar seleção de personagem e layout lado a lado

**Hooks a Criar:**
- `useTranscription.ts` - Gerenciar transcrições
- `useAudioRecorder.ts` - Gerenciar gravação de áudio
- `useCharacterTransformation.ts` - Transformar texto usando personagem

**Services a Criar/Modificar:**
- `transcriptionService.ts` - Novo service para transcrições
- `characterService.ts` - Service para personagens (substitui brandVoiceService)

---

## 🛡️ 3. ESFERA ESCUDO: Transformação em Teleprompter

### 3.1. Visão Geral da Mudança

**Estado Atual:**
- Portal de Proteção/Escudo
- Configurações de moderação
- Filtros de conteúdo
- Logs de moderação

**Estado Desejado:**
- Teleprompter completo para gravação de vídeos
- IA integrada para detectar pausas na fala
- Controle inteligente de scroll
- Integração com projetos (conteúdo do teleprompter)
- Melhor desempenho de câmeras

### 3.2. Funcionalidades do Teleprompter

#### 3.2.1. Carregamento de Conteúdo

**Fontes de Conteúdo:**
1. **Projetos**: Usar conteúdo de projetos como texto do teleprompter
2. **Transcrições**: Usar transcrições anteriores como texto
3. **Texto Manual**: Digitar texto diretamente
4. **Arquivo**: Upload de arquivo de texto

**Componente:** `TeleprompterContentLoader.tsx`

#### 3.2.2. Interface do Teleprompter

**Layout:**
```
┌─────────────────────────────────────────┐
│  [Configurações] [Projetos] [Gravar]    │
├─────────────────────────────────────────┤
│                                          │
│         ┌─────────────────┐             │
│         │                 │             │
│         │   TEXTO DO      │             │
│         │   TELEPROMPTER │             │
│         │                 │             │
│         │   (Scroll       │             │
│         │    automático)  │             │
│         │                 │             │
│         └─────────────────┘             │
│                                          │
│  [Velocidade] [Tamanho Fonte] [Cores]   │
│                                          │
│  ┌─────────────────────────────────┐    │
│  │ [Preview Câmera]                │    │
│  │                                 │    │
│  │                                 │    │
│  └─────────────────────────────────┘    │
│                                          │
│  [Iniciar Gravação] [Pausar] [Parar]    │
└─────────────────────────────────────────┘
```

#### 3.2.3. Detecção de Pausa na Fala (IA)

**Tecnologia:**
- Web Speech API para capturar áudio
- Análise de volume/energia do áudio
- Detecção de silêncio (threshold configurável)
- Quando detecta pausa, pausa o scroll automaticamente

**Algoritmo:**
```typescript
interface SpeechDetectionConfig {
  silenceThreshold: number; // ms de silêncio para considerar pausa
  volumeThreshold: number; // volume mínimo para considerar fala
  resumeDelay: number; // ms após pausa para retomar scroll
}

function detectSpeechPause(audioStream: MediaStream) {
  const audioContext = new AudioContext();
  const analyser = audioContext.createAnalyser();
  const microphone = audioContext.createMediaStreamSource(audioStream);
  microphone.connect(analyser);
  
  let silenceStartTime = null;
  
  setInterval(() => {
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(dataArray);
    const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
    
    if (average < volumeThreshold) {
      if (!silenceStartTime) {
        silenceStartTime = Date.now();
      } else if (Date.now() - silenceStartTime > silenceThreshold) {
        pauseScroll(); // Pausar scroll do teleprompter
      }
    } else {
      silenceStartTime = null;
      resumeScroll(); // Retomar scroll
    }
  }, 100);
}
```

#### 3.2.4. Controles de Scroll

**Modos de Scroll:**
1. **Automático**: Baseado em velocidade configurada
2. **Inteligente**: Pausa quando detecta silêncio na fala
3. **Manual**: Controle manual com teclado/setas
4. **Por Palavra**: Avança palavra por palavra conforme fala

**Controles:**
- Slider de velocidade (lento ↔ rápido)
- Botões: Play/Pause, Reset, Voltar ao início
- Teclas de atalho: Espaço (play/pause), Setas (manual)

#### 3.3.5. Integração com Câmera

**Requisitos:**
- Melhor desempenho possível
- Resolução configurável
- FPS otimizado
- Preview em tempo real
- Gravação de vídeo

**Tecnologias:**
- MediaRecorder API para gravação
- getUserMedia com constraints otimizados
- Canvas para preview (melhor performance)

**Configurações de Câmera:**
```typescript
const cameraConstraints = {
  video: {
    width: { ideal: 1920 },
    height: { ideal: 1080 },
    frameRate: { ideal: 30 },
    facingMode: 'user', // ou 'environment' para câmera traseira
  },
  audio: {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
  }
};
```

#### 3.3.6. Integração com Projetos

**Fluxo:**
1. Usuário seleciona um projeto
2. Sistema carrega conteúdo do projeto (textos, transcrições, etc.)
3. Usuário escolhe qual conteúdo usar no teleprompter
4. Texto é formatado e exibido no teleprompter
5. Durante gravação, pode alternar entre diferentes conteúdos do projeto

**Componente:** `ProjectContentSelector.tsx`

### 3.3. Nova Estrutura de Dados

**Tabela: `teleprompter_sessions`**
```sql
CREATE TABLE public.teleprompter_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  project_id uuid REFERENCES projects(id) ON DELETE SET NULL,
  content_text text NOT NULL,
  content_source text, -- 'project', 'transcription', 'manual', 'file'
  source_id uuid, -- ID do projeto, transcrição, etc.
  
  -- Configurações da sessão
  scroll_speed integer DEFAULT 50, -- 0-100
  font_size integer DEFAULT 24,
  text_color text DEFAULT '#ffffff',
  background_color text DEFAULT '#000000',
  mirror_mode boolean DEFAULT false,
  
  -- Gravação
  video_url text, -- URL do vídeo gravado (Supabase Storage)
  duration_seconds integer,
  
  -- Metadados
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);
```

### 3.4. Componentes a Criar

**Componentes Principais:**
- `TeleprompterPortal.tsx` - Portal principal (substitui ProtecaoPortal)
- `TeleprompterDisplay.tsx` - Área de exibição do texto
- `TeleprompterControls.tsx` - Controles de scroll e velocidade
- `CameraPreview.tsx` - Preview da câmera
- `VideoRecorder.tsx` - Gravação de vídeo
- `SpeechDetector.tsx` - Detecção de pausa na fala
- `ProjectContentSelector.tsx` - Seletor de conteúdo de projetos
- `TeleprompterSettings.tsx` - Configurações (velocidade, fonte, cores)

**Hooks:**
- `useTeleprompter.ts` - Gerenciar estado do teleprompter
- `useSpeechDetection.ts` - Detecção de pausa na fala
- `useCamera.ts` - Gerenciar câmera e gravação
- `useTeleprompterScroll.ts` - Controle de scroll

**Services:**
- `teleprompterService.ts` - Salvar/carregar sessões
- `videoStorageService.ts` - Upload de vídeos gravados

### 3.5. Migração de Configurações

**Onde mover configurações atuais:**
- Criar nova seção "Configurações" no menu principal
- Mover configurações de moderação para lá
- Manter estrutura de `protection_settings` mas acessível de outro lugar

---

## 🔄 4. IMPACTO GERAL E DEPENDÊNCIAS

### 4.1. Mudanças no Banco de Dados

**Novas Tabelas:**
1. `characters` (substitui `brand_profiles`)
2. `character_samples` (substitui `brand_samples`)
3. `character_embeddings` (substitui `brand_embeddings`)
4. `transcription_history` (nova)
5. `teleprompter_sessions` (nova)

**Tabelas a Manter (compatibilidade):**
- `brand_profiles`, `brand_samples`, `brand_embeddings` (durante transição)
- `transcriptions` (já existe)
- `transformations` (já existe)
- `assets` (já existe)
- `projects` (já existe)

**Migrations Necessárias:**
1. Migration para criar tabelas de personagens
2. Migration para migrar dados de brand_profiles → characters
3. Migration para criar transcription_history
4. Migration para criar teleprompter_sessions

### 4.2. Mudanças nas Edge Functions

**Modificar:**
- `brand_voice_train` → `character_train` (ou manter compatibilidade)
- `brand_voice_transform` → `character_transform` (ou adicionar suporte a characters)
- `transform_text` - Adicionar suporte a `characterId`
- `transcribe_audio` - Adicionar opção de aplicar personagem
- `video_short` - Melhorar extração de áudio e adicionar suporte a personagem

**Novas Edge Functions:**
- Nenhuma nova necessária (reutilizar existentes com modificações)

### 4.3. Mudanças nos Services Frontend

**Refatorar:**
- `brandVoiceService.ts` → `characterService.ts`
- Criar `transcriptionService.ts`
- Criar `teleprompterService.ts`

**Manter:**
- `transformService.ts` (adicionar suporte a characterId)
- `projectsService.ts` (sem mudanças)
- `assetsService.ts` (sem mudanças)

### 4.4. Mudanças nos Hooks

**Refatorar:**
- `useBrandVoice.ts` → `useCharacters.ts`
- Criar `useTranscription.ts`
- Criar `useTeleprompter.ts`
- Criar `useSpeechDetection.ts`
- Criar `useCamera.ts`

### 4.5. Mudanças nos Componentes

**Esfera Essência:**
- `BrandVoiceTrainer.tsx` → `CharacterCreator.tsx`
- `BrandVoiceLibrary.tsx` → `CharacterLibrary.tsx`
- `BrandVoicePreview.tsx` → Remover ou adaptar
- Criar `CharacterPersonalitySliders.tsx`
- Criar `CharacterPreview.tsx`

**Esfera Energia:**
- `TransformTextPortal.tsx` → Refatorar para incluir personagem
- Criar `AudioTranscribeTab.tsx`
- Criar `VideoTranscribeTab.tsx`
- Criar `TranscriptionResult.tsx`
- Criar `TranscriptionHistory.tsx`
- Criar `CharacterSelector.tsx`

**Esfera Escudo:**
- `ProtecaoPortal.tsx` → `TeleprompterPortal.tsx` (completamente novo)
- Criar todos os componentes de teleprompter listados acima

---

## 📊 5. PLANO DE IMPLEMENTAÇÃO SUGERIDO

### Fase 1: Preparação e Migração de Dados (1-2 semanas)
1. Criar migrations para novas tabelas
2. Criar script de migração brand_profiles → characters
3. Testar migração em ambiente de desenvolvimento
4. Atualizar tipos TypeScript

### Fase 2: Sistema de Personagens (2-3 semanas)
1. Criar `CharacterCreator.tsx` com 8 dimensões
2. Criar `CharacterLibrary.tsx`
3. Refatorar `useBrandVoice.ts` → `useCharacters.ts`
4. Refatorar `brandVoiceService.ts` → `characterService.ts`
5. Atualizar Edge Functions para suportar characters
6. Testes completos

### Fase 3: Integração Energia (2-3 semanas)
1. Implementar `AudioTranscribeTab.tsx`
2. Implementar `VideoTranscribeTab.tsx`
3. Criar `TranscriptionResult.tsx` (layout lado a lado)
4. Criar `TranscriptionHistory.tsx`
5. Integrar com Edge Functions existentes
6. Testes completos

### Fase 4: Teleprompter (3-4 semanas)
1. Criar estrutura básica do teleprompter
2. Implementar detecção de pausa na fala
3. Implementar controles de scroll
4. Integrar câmera com melhor desempenho
5. Integrar com projetos
6. Implementar gravação de vídeo
7. Testes completos

### Fase 5: Migração de Configurações e Limpeza (1 semana)
1. Mover configurações de Proteção para novo local
2. Deprecar tabelas antigas (brand_profiles)
3. Atualizar documentação
4. Testes finais

**Tempo Total Estimado:** 9-13 semanas

---

## ⚠️ 6. RISCOS E CONSIDERAÇÕES

### 6.1. Riscos Técnicos

1. **Migração de Dados:**
   - Risco: Perda de dados durante migração
   - Mitigação: Backup completo antes, testes extensivos, rollback plan

2. **Performance do Teleprompter:**
   - Risco: Lag na detecção de pausa ou scroll
   - Mitigação: Otimização de algoritmos, uso de Web Workers se necessário

3. **Compatibilidade de Navegadores:**
   - Risco: APIs de câmera/áudio não suportadas
   - Mitigação: Feature detection, fallbacks, mensagens claras

4. **Complexidade do Sistema de Personagens:**
   - Risco: 8 dimensões podem ser confusas para usuários
   - Mitigação: UI intuitiva, templates pré-configurados, tutoriais

### 6.2. Considerações de UX

1. **Curva de Aprendizado:**
   - Sistema de personagens é mais complexo que brand voice
   - Necessário: Onboarding, exemplos, templates

2. **Performance Visual:**
   - Teleprompter precisa ser fluido
   - Scroll precisa ser suave
   - Câmera precisa ter boa qualidade

3. **Acessibilidade:**
   - Teleprompter precisa funcionar para diferentes necessidades
   - Controles de tamanho de fonte, cores, velocidade

### 6.3. Considerações de Negócio

1. **Custo de Dracmas:**
   - Transcrições + Transformações = mais custos
   - Revisar preços e limites

2. **Armazenamento:**
   - Vídeos gravados ocupam muito espaço
   - Definir limites e políticas de retenção

---

## 📝 7. CHECKLIST DE IMPLEMENTAÇÃO

### Esfera Essência
- [ ] Criar migration para tabela `characters`
- [ ] Criar migration para tabela `character_samples`
- [ ] Criar migration para tabela `character_embeddings`
- [ ] Criar script de migração brand_profiles → characters
- [ ] Criar `CharacterCreator.tsx` com 8 dimensões
- [ ] Criar `CharacterPersonalitySliders.tsx`
- [ ] Criar `CharacterLibrary.tsx`
- [ ] Criar `CharacterPreview.tsx`
- [ ] Refatorar `useBrandVoice.ts` → `useCharacters.ts`
- [ ] Refatorar `brandVoiceService.ts` → `characterService.ts`
- [ ] Criar schema Zod para personagens
- [ ] Atualizar Edge Function `brand_voice_train` para suportar characters
- [ ] Atualizar Edge Function `brand_voice_transform` para usar characters
- [ ] Testes completos

### Esfera Energia
- [ ] Criar migration para tabela `transcription_history`
- [ ] Criar `AudioTranscribeTab.tsx`
- [ ] Criar `VideoTranscribeTab.tsx`
- [ ] Criar `AudioRecorder.tsx`
- [ ] Criar `AudioUploader.tsx`
- [ ] Criar `VideoUploader.tsx`
- [ ] Criar `TranscriptionResult.tsx` (layout lado a lado)
- [ ] Criar `TranscriptionHistory.tsx`
- [ ] Criar `CharacterSelector.tsx`
- [ ] Refatorar `TransformTextPortal.tsx` para incluir personagem
- [ ] Criar `useTranscription.ts`
- [ ] Criar `useAudioRecorder.ts`
- [ ] Criar `transcriptionService.ts`
- [ ] Atualizar Edge Function `transform_text` para aceitar characterId
- [ ] Atualizar Edge Function `transcribe_audio` para aplicar personagem
- [ ] Atualizar Edge Function `video_short` para aplicar personagem
- [ ] Testes completos

### Esfera Escudo
- [ ] Criar migration para tabela `teleprompter_sessions`
- [ ] Criar `TeleprompterPortal.tsx`
- [ ] Criar `TeleprompterDisplay.tsx`
- [ ] Criar `TeleprompterControls.tsx`
- [ ] Criar `CameraPreview.tsx`
- [ ] Criar `VideoRecorder.tsx`
- [ ] Criar `SpeechDetector.tsx`
- [ ] Criar `ProjectContentSelector.tsx`
- [ ] Criar `TeleprompterSettings.tsx`
- [ ] Criar `TeleprompterContentLoader.tsx`
- [ ] Criar `useTeleprompter.ts`
- [ ] Criar `useSpeechDetection.ts`
- [ ] Criar `useCamera.ts`
- [ ] Criar `useTeleprompterScroll.ts`
- [ ] Criar `teleprompterService.ts`
- [ ] Criar `videoStorageService.ts`
- [ ] Mover configurações de Proteção para novo local
- [ ] Testes completos

### Geral
- [ ] Atualizar tipos TypeScript
- [ ] Atualizar documentação
- [ ] Criar guias de uso
- [ ] Testes de integração
- [ ] Testes de performance
- [ ] Testes de acessibilidade

---

## 🎯 8. PRÓXIMOS PASSOS

1. **Revisar esta análise** com stakeholders
2. **Priorizar fases** de implementação
3. **Definir timeline** detalhado
4. **Criar issues/tasks** no sistema de gestão
5. **Iniciar Fase 1** (Preparação e Migração)

---

## 🎨 ANÁLISE DE DESIGN VISUAL - UNIVERSO MÍSTICO ARCANUM.AI

### Visão Geral da Experiência Visual

Esta refatoração não é apenas técnica — é uma **transmutação visual completa** que mergulha o usuário no universo místico do Arcanum.AI. Cada esfera deve evocar sensações de magia, sabedoria arcana e energia criativa, mantendo a usabilidade e clareza.

### 🌟 Princípios de Design Místico

#### 1. **Hierarquia Visual Arcana**
- **Cores Primárias:** Dourado radiante (#FFD700, #FFA500), Lilás etéreo (#9D4EDD, #C77DFF), Azul cósmico (#4A90E2, #6BB6FF), Preto profundo (#0A0A0A, #1A1A1A)
- **Efeitos de Luz:** Brilhos sutis em elementos interativos, partículas flutuantes em fundos, gradientes translúcidos
- **Tipografia:** Fontes que equilibram legibilidade com misticismo (sans-serif moderna para UI, serif decorativa para títulos)

#### 2. **Microinterações Encantadas**
- **Hover:** Runas brilham, cristais pulsam, bordas ganham aura dourada
- **Clique:** Portais se abrem, partículas explodem, luz vaza dos elementos
- **Loading:** Sigilos energéticos girando, ampulhetas animadas, progresso com efeito de energia condensada
- **Feedback:** Faíscas douradas para sucesso, névoa lilás para espera, cristais fragmentados para erros

#### 3. **Elementos Visuais Recorrentes**
- **Runas e Selos:** Bordas decorativas, badges de status, indicadores de progresso
- **Cristais e Esferas:** Ícones de energia, indicadores de Dracmas, elementos de navegação
- **Portais e Portais:** Transições entre telas, modais, áreas de conteúdo
- **Grimórios e Pergaminhos:** Cards de conteúdo, painéis informativos, documentação

---

### 🎭 ESFERA ESSÊNCIA: Design do Sistema de Personagens

#### Visualização do Criador de Personagens

**Estrutura Visual Mística:**
```
┌─────────────────────────────────────────────────────────┐
│  🌟 Criar Novo Personagem Arcano                         │
│  ─────────────────────────────────────────────────────  │
│                                                          │
│  ┌──────────────────────────────────────────────┐     │
│  │ Avatar Místico                                 │     │
│  │  [Cristal Flutuante]  [Upload]                │     │
│  │  "A essência visual do seu personagem"        │     │
│  └──────────────────────────────────────────────┘     │
│                                                          │
│  Nome: [________________] ✨                           │
│  Descrição: [________________]                         │
│                                                          │
│  ┌──────────────────────────────────────────────┐     │
│  │ 🧠 Núcleo de Personalidade                     │     │
│  │ ┌────────────────────────────────────────┐   │     │
│  │ │ Robótico ━━━━━━━━━━━━━━━━━━━━━━━ Humano │   │     │
│  │ │    ●───────────────────────────────○   │   │     │
│  │ │    [Runas brilham ao mover]            │   │     │
│  │ └────────────────────────────────────────┘   │     │
│  │                                              │     │
│  │ Traits Mágicos:                              │     │
│  │ [alegre ✨] [otimista 🌟] [expansivo 💫] [+] │     │
│  │ (Tags com brilho suave ao hover)             │     │
│  └──────────────────────────────────────────────┘     │
│                                                          │
│  ... (outras dimensões com visual similar)             │
│                                                          │
│  ┌──────────────────────────────────────────────┐     │
│  │ Preview do Personagem                         │     │
│  │ "Como Quiron responderia:"                    │     │
│  │ ┌────────────────────────────────────────┐   │     │
│  │ │ 🔮✨ Saudações, Mago! Aqui é Quiron... │   │     │
│  │ └────────────────────────────────────────┘   │     │
│  └──────────────────────────────────────────────┘     │
│                                                          │
│  [Cancelar]        [✨ Criar Personagem ✨]             │
└─────────────────────────────────────────────────────────┘
```

#### Elementos de Design Específicos

1. **Sliders de Personalidade:**
   - Barra com gradiente dourado/lilás
   - Indicador circular com brilho pulsante
   - Runas decorativas nas extremidades
   - Efeito de "energia fluindo" ao mover

2. **Tags de Traits:**
   - Badges com bordas translúcidas
   - Brilho suave ao hover
   - Ícones místicos opcionais (estrela, cristal, runa)
   - Animação de "aparecimento" ao adicionar

3. **Preview do Personagem:**
   - Card com borda dourada brilhante
   - Fundo translúcido com partículas flutuantes
   - Texto com efeito de "escrita mágica" (aparece letra por letra)
   - Avatar do personagem flutuando ao lado

4. **Biblioteca de Personagens:**
   - Grid de cards com efeito "portal"
   - Hover: card levita, runas aparecem ao redor
   - Badge de "Personagem Padrão" com selo dourado
   - Filtros visuais: "Todos", "Meus", "Templates"

#### Microinterações da Esfera Essência

- **Ao criar personagem:** Portal se abre, partículas douradas explodem, avatar aparece com efeito de materialização
- **Ao selecionar personagem:** Runas se reorganizam ao redor do card, brilho pulsante
- **Ao editar dimensões:** Sliders respondem com "energia fluindo", preview atualiza com transição suave
- **Ao salvar:** Faísca dourada se expande, mensagem "Personagem criado com sucesso!" com efeito de escrita mágica

---

### ⚡ ESFERA ENERGIA: Design da Transcrição e Transformação

#### Visualização da Interface de Transcrição

**Layout Místico Unificado:**
```
┌─────────────────────────────────────────────────────────┐
│  ⚡ ENERGIA - Portal de Transcrição                      │
│  ─────────────────────────────────────────────────────  │
│                                                          │
│  ┌──────────────────────────────────────────────┐     │
│  │ 🌌 Área de Upload                              │     │
│  │                                                 │     │
│  │  [📤 Upload Arquivo]  [🎤 Gravar Áudio]        │     │
│  │                                                 │     │
│  │  ┌────────────────────────────────────────┐   │     │
│  │  │ [Ícone de Portal]                      │   │     │
│  │  │ "Arraste seu arquivo aqui ou clique"   │   │     │
│  │  │ "O portal está aberto..."              │   │     │
│  │  └────────────────────────────────────────┘   │     │
│  └──────────────────────────────────────────────┘     │
│                                                          │
│  ┌──────────────────────────────────────────────┐     │
│  │ ⏳ Status da Transcrição                       │     │
│  │                                                │     │
│  │  [Sigilo Energético Girando]                  │     │
│  │  "A Bruxa das Brumas está transcrevendo..."   │     │
│  │  Progresso: ████████░░ 80%                    │     │
│  └──────────────────────────────────────────────┘     │
│                                                          │
│  ┌──────────────┬──────────────┐                     │
│  │ Original      │ Versão Quiron │                     │
│  │ ──────────────┼──────────────│                     │
│  │ "Saudações..." │ 🔮✨ "Sauda...│                     │
│  │                │              │                     │
│  │ [📋 Copiar]    │ [📋 Copiar]   │                     │
│  └──────────────┴──────────────┘                     │
│                                                          │
│  ┌──────────────────────────────────────────────┐     │
│  │ ✨ Transformar com Personagem                  │     │
│  │                                                │     │
│  │ Personagem: [Quiron, o Arcano Menor ▼] 🌟    │     │
│  │ Tipo: [Post para Redes Sociais ▼]            │     │
│  │                                                │     │
│  │ [✨ Transmutar com Personagem]                │     │
│  └──────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────┘
```

#### Elementos de Design Específicos

1. **Área de Upload:**
   - Portal circular com bordas brilhantes
   - Partículas flutuantes ao redor
   - Efeito de "vórtice" ao arrastar arquivo
   - Ícone de portal que pulsa suavemente

2. **Status de Transcrição:**
   - Sigilo energético (círculo com runas) girando no centro
   - Mensagens poéticas: "A Bruxa das Brumas sussurra sabedoria..."
   - Barra de progresso com efeito de energia condensada
   - Cores: lilás para processamento, dourado para conclusão

3. **Comparação Lado a Lado:**
   - Divisor central com runas decorativas
   - Cards com bordas translúcidas
   - Texto original: estilo neutro, fundo escuro
   - Texto transformado: estilo místico, fundo com gradiente dourado/lilás
   - Botões de copiar com ícone de cristal

4. **Seletor de Personagem:**
   - Dropdown com visual de "grimório aberto"
   - Cada opção mostra avatar e nome do personagem
   - Hover: runas aparecem ao redor da opção
   - Badge visual para "personagem padrão"

#### Microinterações da Esfera Energia

- **Ao fazer upload:** Portal se expande, arquivo "entra" no portal com efeito de vórtice
- **Durante transcrição:** Sigilo gira, partículas lilases flutuam, mensagens mudam aleatoriamente
- **Ao completar:** Explosão de partículas douradas, texto aparece com efeito de "escrita mágica"
- **Ao transformar:** Portal se abre entre os dois textos, energia "flui" do original para o transformado
- **Ao copiar:** Faísca dourada no botão, mensagem flutuante "Copiado para o grimório!"

---

### 🛡️ ESFERA ESCUDO: Design do Teleprompter Místico

#### Visualização da Interface do Teleprompter

**Layout do Portal de Gravação:**
```
┌─────────────────────────────────────────────────────────┐
│  🛡️ ESCUDO - Teleprompter Arcano                        │
│  ─────────────────────────────────────────────────────  │
│                                                          │
│  ┌──────────────────────────────────────────────┐     │
│  │ 📁 Carregar Conteúdo                          │     │
│  │                                                │     │
│  │ [Abrir Grimório] [Do Projeto] [Manual]        │     │
│  │                                                │     │
│  │ Projeto: [Meu Projeto ▼]                      │     │
│  └──────────────────────────────────────────────┘     │
│                                                          │
│  ┌──────────────────────────────────────────────┐     │
│  │ 🎬 Área de Gravação                            │     │
│  │                                                │     │
│  │  ┌──────────────────────────────────────┐   │     │
│  │  │ [Preview da Câmera]                   │   │     │
│  │  │ (Bordas com runas decorativas)         │   │     │
│  │  └──────────────────────────────────────┘   │     │
│  │                                                │     │
│  │  ┌──────────────────────────────────────┐   │     │
│  │  │ Texto do Teleprompter                  │   │     │
│  │  │                                        │   │     │
│  │  │ "Saudações, Mago! Aqui é Quiron..."   │   │     │
│  │  │                                        │   │     │
│  │  │ [Linha destacada com brilho dourado]  │   │     │
│  │  │                                        │   │     │
│  │  │ (Scroll suave e fluido)               │   │     │
│  │  └──────────────────────────────────────┘   │     │
│  │                                                │     │
│  │  [⏸️ Pausar] [▶️ Continuar] [⏹️ Parar]        │     │
│  └──────────────────────────────────────────────┘     │
│                                                          │
│  ┌──────────────────────────────────────────────┐     │
│  │ ⚙️ Configurações Místicas                     │     │
│  │                                                │     │
│  │ Velocidade: [━━━━━━━━━━━━━━━━━━━━] 50        │     │
│  │ Tamanho: [━━━━━━━━━━━━━━━━━━━━━━] 24px       │     │
│  │ Cores: [Dourado] [Lilás] [Azul]              │     │
│  │ [☑] Modo Espelhado                            │     │
│  │ [☑] Detecção de Pausa Inteligente             │     │
│  └──────────────────────────────────────────────┘     │
│                                                          │
│  [🔴 Gravar Vídeo]                                     │
└─────────────────────────────────────────────────────────┘
```

#### Elementos de Design Específicos

1. **Área de Texto do Teleprompter:**
   - Fundo escuro translúcido com partículas flutuantes
   - Texto com fonte legível mas estilizada
   - Linha atual destacada com brilho dourado pulsante
   - Scroll suave com efeito de "energia fluindo"
   - Bordas com runas decorativas

2. **Preview da Câmera:**
   - Frame com bordas douradas brilhantes
   - Runas decorativas nos cantos
   - Overlay translúcido com informações (tempo, status)
   - Efeito de "portal" ao iniciar gravação

3. **Controles de Gravação:**
   - Botões com visual de "cristais energéticos"
   - Hover: cristal pulsa e brilha
   - Estado de gravação: borda vermelha pulsante, partículas vermelhas flutuando
   - Indicador de tempo com estilo de "ampulheta mágica"

4. **Configurações:**
   - Sliders com visual místico (barra com gradiente, indicador brilhante)
   - Seletor de cores com paleta arcana
   - Checkboxes com ícones de selos mágicos
   - Tooltips com mensagens poéticas

#### Microinterações da Esfera Escudo

- **Ao carregar conteúdo:** Portal se abre, texto "flui" para o teleprompter
- **Durante scroll:** Linha atual brilha, partículas seguem o texto
- **Ao pausar (detecção automática):** Efeito de "congelamento", névoa lilás aparece
- **Ao retomar:** Portal se abre novamente, scroll continua suave
- **Ao gravar:** Bordas ficam vermelhas pulsantes, contador aparece com efeito de ampulheta
- **Ao finalizar:** Explosão de partículas douradas, preview do vídeo aparece

---

### 🎨 Sistema de Cores e Temas

#### Paleta Principal (Modo Escuro - Padrão)
- **Fundo Primário:** `#0A0A0A` (Preto profundo)
- **Fundo Secundário:** `#1A1A1A` (Preto suave)
- **Dourado Radiante:** `#FFD700` (Principal), `#FFA500` (Secundário)
- **Lilás Etéreo:** `#9D4EDD` (Principal), `#C77DFF` (Secundário)
- **Azul Cósmico:** `#4A90E2` (Principal), `#6BB6FF` (Secundário)
- **Texto:** `#FFFFFF` (Principal), `#E0E0E0` (Secundário)

#### Paleta Secundária (Modo Claro - Alternativo)
- **Fundo Primário:** `#FAFAFA` (Branco suave)
- **Fundo Secundário:** `#F0F0F0` (Cinza claro)
- **Dourado:** `#B8860B` (Mais escuro para contraste)
- **Lilás:** `#7B2CBF` (Mais escuro para contraste)
- **Azul:** `#2563EB` (Mais escuro para contraste)
- **Texto:** `#1A1A1A` (Principal), `#4A4A4A` (Secundário)

#### Efeitos e Gradientes
- **Gradiente Dourado:** `linear-gradient(135deg, #FFD700 0%, #FFA500 100%)`
- **Gradiente Lilás:** `linear-gradient(135deg, #9D4EDD 0%, #C77DFF 100%)`
- **Gradiente Cósmico:** `linear-gradient(135deg, #4A90E2 0%, #6BB6FF 50%, #9D4EDD 100%)`
- **Brilho (Glow):** `box-shadow: 0 0 20px rgba(255, 215, 0, 0.5)`
- **Névoa:** `backdrop-filter: blur(10px)` com `rgba(157, 78, 221, 0.1)`

---

### 📱 Responsividade e Acessibilidade Mística

#### Mobile
- Cards empilhados verticalmente
- Sliders adaptados para touch
- Teleprompter em tela cheia
- Navegação com menu hambúrguer estilizado como "portal"

#### Acessibilidade
- Contraste adequado mesmo com efeitos visuais
- Navegação por teclado com indicadores visuais místicos
- Screen readers com textos alternativos poéticos
- Tamanhos de fonte ajustáveis mantendo estética

---

### 🎭 Personagens Visuais e Narrativa

#### Avatares dos Personagens
- **Quiron, o Arcano Menor:** Avatar com capa dourada, cristal flutuante, expressão alegre
- **A Bruxa das Brumas:** Silhueta lilás, névoa ao redor, olhos brilhantes
- **O Alquimista de Códigos:** Avatar com símbolos geométricos, brilho azul, postura pensativa

#### Mensagens Poéticas
- **Loading:** "A Bruxa das Brumas sussurra sabedoria..."
- **Sucesso:** "A transmutação foi concluída com sucesso!"
- **Erro:** "A energia se dissipou... Tente novamente."
- **Aguardando:** "O portal está se abrindo..."

---

### 🌌 ANÁLISE PROFUNDA: NARRATIVA VISUAL E IMERSÃO

#### Storytelling através da Interface

Cada interação no Arcanum.AI deve contar uma **história mágica**, onde o usuário não apenas usa ferramentas, mas participa de um **ritual de criação arcana**.

**1. Jornada do Usuário como Ritual Mágico:**

**Fase 1 - Invocação (Entrada no Sistema):**
- Portal de login com runas que se iluminam ao digitar
- Mensagem: "Bem-vindo, Mago. O portal está aberto..."
- Transição suave com partículas douradas formando o caminho

**Fase 2 - Preparação (Criação de Personagem):**
- Cada dimensão ajustada é um "selo" sendo ativado
- Preview mostra o personagem "ganhando vida" progressivamente
- Mensagem final: "O personagem foi invocado com sucesso!"

**Fase 3 - Transmutação (Transformação de Conteúdo):**
- Upload é um "ritual de oferenda" ao portal
- Transcrição é "a Bruxa das Brumas lendo os pergaminhos"
- Transformação é "o Alquimista transmutando a essência"
- Resultado é "o elixir da criação está pronto"

**Fase 4 - Manifestação (Teleprompter):**
- Carregar conteúdo é "abrir o grimório"
- Gravação é "capturar a essência em cristal"
- Cada pausa é "o tempo congelando para reflexão"

#### Estados Emocionais da Interface

A interface deve **respirar** e **responder emocionalmente** ao estado do usuário:

**Estado de Exploração (Primeira Vez):**
- Animações mais lentas e explicativas
- Tooltips poéticos aparecem automaticamente
- Guias visuais sutis (runas apontando para ações)
- Mensagens encorajadoras: "Não tenha medo, Mago. A magia está ao seu alcance."

**Estado de Fluidez (Uso Regular):**
- Animações mais rápidas e diretas
- Feedback imediato e preciso
- Menos interrupções visuais
- Mensagens breves: "Transmutação completa."

**Estado de Maestria (Usuário Avançado):**
- Atalhos visuais aparecem
- Animações podem ser aceleradas ou desabilitadas
- Modo "Alquimista Experiente" com menos poesia, mais precisão
- Mensagens técnicas opcionais

#### Feedback Sensorial Multimodal

**Visual:**
- Cores que pulsam suavemente (respiração visual)
- Partículas que respondem ao movimento do mouse
- Bordas que brilham em sequência (como energia fluindo)

**Auditivo (Opcional, Futuro):**
- Sons sutis de cristais ao interagir
- Frequências binaurais durante processamento
- Sussurros poéticos em momentos chave

**Tátil (Haptic Feedback - Mobile):**
- Vibração suave ao completar ações
- Padrões diferentes para diferentes tipos de feedback
- Vibração rítmica durante gravação

#### Hierarquia de Informação Mística

**Nível 1 - Essencial (Sempre Visível):**
- Navegação principal com ícones místicos
- Indicador de Dracmas (cristal pulsante)
- Status atual da operação

**Nível 2 - Contextual (Aparece quando Relevante):**
- Tooltips poéticos ao hover
- Mensagens de status durante operações
- Sugestões de próximos passos

**Nível 3 - Detalhado (Sob Demanda):**
- Painéis de configuração avançada
- Histórico completo de operações
- Documentação e ajuda

#### Transições Narrativas entre Esferas

**De Essência para Energia:**
- Personagem escolhido "se materializa" na esfera Energia
- Mensagem: "Quiron está pronto para transmutar suas palavras..."
- Visual: Portal se abre, personagem atravessa, energia flui

**De Energia para Escudo:**
- Texto transformado "se cristaliza" em conteúdo para teleprompter
- Mensagem: "O elixir está pronto para ser manifestado..."
- Visual: Cristal se forma, texto aparece dentro, portal se abre

**Entre Projetos:**
- Cada projeto é um "mundo paralelo"
- Transição mostra portais múltiplos se abrindo
- Mensagem: "Escolha seu destino, Mago..."

---

### 🎭 ANÁLISE DE ACESSIBILIDADE MÍSTICA

#### Design Inclusivo sem Perder a Magia

**1. Contraste e Legibilidade:**
- Modo "Alta Visibilidade": Cores mais saturadas, bordas mais espessas
- Modo "Visão Noturna": Cores mais suaves, menos brilho
- Tamanhos de fonte ajustáveis mantendo proporções visuais

**2. Navegação por Teclado:**
- Indicadores visuais místicos para foco (runas brilhantes ao redor)
- Atalhos mágicos documentados: "Pressione ⚡ para transmutar rapidamente"
- Sequência lógica de tabulação respeitando hierarquia visual

**3. Screen Readers:**
- Textos alternativos poéticos: "Portal de criação de personagem, ativo"
- Anúncios de estado: "A Bruxa das Brumas está processando..."
- Descrições contextuais: "Slider de personalidade, valor atual: 75% humano"

**4. Redução de Movimento:**
- Modo "Meditação": Animações mínimas, transições instantâneas
- Partículas reduzidas ou desabilitadas
- Efeitos de brilho mantidos mas estáticos

**5. Cognitivo:**
- Modo "Aprendiz": Passos mais explícitos, menos opções visíveis
- Modo "Mestre": Todas as opções avançadas disponíveis
- Modo "Guia": Sugestões contextuais mais frequentes

---

### 🌟 ANÁLISE DE PERFORMANCE VISUAL

#### Otimizações Mantendo a Magia

**1. Lazy Loading de Efeitos:**
- Partículas carregam progressivamente
- Animações complexas só iniciam quando visíveis
- Efeitos de brilho com CSS filters (GPU acelerado)

**2. Degradação Graciosa:**
- Dispositivos mais lentos: Menos partículas, animações simplificadas
- Conexão lenta: Efeitos locais primeiro, remotos depois
- Sem GPU: Fallback para animações CSS simples

**3. Cache Visual:**
- Pré-renderização de componentes comuns
- Cache de SVGs de runas e símbolos
- Sprites para partículas repetitivas

**4. Priorização de Percepção:**
- Feedback imediato (mesmo que processamento continue)
- Animações de "espera" durante carregamentos reais
- Transições suaves mesmo com dados ainda carregando

---

## 🔒 ANÁLISE DE SEGURANÇA - VULNERABILIDADES E MITIGAÇÕES

### Visão Geral de Segurança

Esta refatoração introduz novos vetores de ataque que devem ser mitigados desde o planejamento. A análise abaixo identifica riscos de segurança e propõe soluções antes da implementação.

### 🛡️ ESFERA ESSÊNCIA: Segurança do Sistema de Personagens

#### Riscos Identificados

**1. Injeção de Código via JSONB (personality_core, etc.)**
- **Risco:** Campos JSONB podem conter scripts maliciosos se não validados
- **Severidade:** MÉDIA
- **Mitigação:**
  - Validação rigorosa com Zod schemas antes de inserir no banco
  - Sanitização de strings dentro dos objetos JSONB
  - Limitação de tamanho dos campos JSONB
  - Validação de tipos e estruturas esperadas

**2. XSS através de Nome/Descrição do Personagem**
- **Risco:** Nome e descrição renderizados no frontend podem conter scripts
- **Severidade:** ALTA
- **Mitigação:**
  - Sanitização HTML no backend antes de salvar
  - Escape de caracteres especiais no frontend
  - Limitação de caracteres (nome: 100, descrição: 500)
  - Validação de caracteres permitidos (sem tags HTML)

**3. Upload Malicioso de Avatar**
- **Risco:** Arquivo de avatar pode conter código executável ou ser muito grande
- **Severidade:** ALTA
- **Mitigação:**
  - Validação de tipo MIME (apenas image/*)
  - Validação de extensão (jpg, png, webp, gif)
  - Limite de tamanho (máx 5MB)
  - Scan de vírus/malware antes de armazenar
  - Armazenamento em bucket privado com URLs assinadas
  - Redimensionamento automático para prevenir bombas de imagem

**4. Acesso Não Autorizado a Personagens**
- **Risco:** Usuário pode acessar personagens de outros usuários
- **Severidade:** CRÍTICA
- **Mitigação:**
  - RLS (Row Level Security) obrigatório em todas as queries
  - Validação de `user_id` em todas as operações
  - Verificação dupla: RLS + validação no código
  - Logs de auditoria para tentativas de acesso não autorizado

**5. Manipulação de Dimensões de Personalidade**
- **Risco:** Valores fora do range esperado podem causar erros ou comportamento inesperado
- **Severidade:** BAIXA
- **Mitigação:**
  - Validação de ranges (0-100 para sliders)
  - Validação de enums para campos de seleção
  - Valores padrão seguros em caso de dados inválidos

#### Checklist de Segurança - Esfera Essência

- [ ] Implementar validação Zod para todos os campos de personagem
- [ ] Sanitizar HTML em nome e descrição
- [ ] Validar e escanear uploads de avatar
- [ ] Implementar RLS em todas as tabelas relacionadas
- [ ] Adicionar rate limiting na criação de personagens (máx 10/hora)
- [ ] Implementar logs de auditoria para operações críticas
- [ ] Validar tamanho máximo de campos JSONB
- [ ] Implementar validação de tipos em Edge Functions

---

### ⚡ ESFERA ENERGIA: Segurança de Transcrição e Transformação

#### Riscos Identificados

**1. Upload de Arquivos Maliciosos**
- **Risco:** Arquivos de áudio/vídeo podem conter malware ou ser bombas de arquivo
- **Severidade:** CRÍTICA
- **Mitigação:**
  - Validação rigorosa de tipo MIME no backend
  - Limite de tamanho por tipo (áudio: 100MB, vídeo: 500MB)
  - Scan de vírus antes de processar
  - Validação de codec e metadados do arquivo
  - Processamento em sandbox isolado
  - Timeout para processamento (máx 10 minutos)

**2. Injeção de Prompt via Texto Original**
- **Risco:** Texto malicioso pode manipular prompts da IA
- **Severidade:** MÉDIA
- **Mitigação:**
  - Sanitização de prompts antes de enviar para IA
  - Limitação de tamanho do texto (máx 50.000 caracteres)
  - Validação de caracteres permitidos
  - Escape de caracteres especiais em prompts
  - Rate limiting por usuário (máx 100 transcrições/hora)

**3. Exposição de Dados Sensíveis em Transcrições**
- **Risco:** Transcrições podem conter informações sensíveis (senhas, tokens, etc.)
- **Severidade:** ALTA
- **Mitigação:**
  - Detecção automática de dados sensíveis (regex patterns)
  - Alertas ao usuário sobre conteúdo sensível detectado
  - Opção de mascarar dados sensíveis automaticamente
  - Criptografia de transcrições em repouso
  - Política de retenção de dados (deletar após 90 dias)

**4. Acesso Não Autorizado a Histórico**
- **Risco:** Usuário pode acessar transcrições de outros usuários
- **Severidade:** CRÍTICA
- **Mitigação:**
  - RLS obrigatório em `transcription_history`
  - Validação de `user_id` em todas as queries
  - Índices para performance sem comprometer segurança
  - Logs de acesso ao histórico

**5. Consumo Excessivo de Recursos (DDoS)**
- **Risco:** Múltiplas transcrições simultâneas podem sobrecarregar o sistema
- **Severidade:** MÉDIA
- **Mitigação:**
  - Rate limiting por IP e por usuário
  - Queue de processamento com limites
  - Timeout para operações longas
  - Monitoramento de uso de recursos
  - Throttling automático em caso de sobrecarga

**6. Vazamento de Dados em Respostas de Erro**
- **Risco:** Mensagens de erro podem expor informações sensíveis
- **Severidade:** MÉDIA
- **Mitigação:**
  - Mensagens de erro genéricas para usuários
  - Logs detalhados apenas no backend
  - Não expor stack traces em produção
  - Não expor caminhos de arquivos ou IDs internos

#### Checklist de Segurança - Esfera Energia

- [ ] Implementar validação rigorosa de arquivos (tipo, tamanho, conteúdo)
- [ ] Scan de vírus/malware em uploads
- [ ] Sanitizar prompts antes de enviar para IA
- [ ] Implementar detecção de dados sensíveis
- [ ] Criptografar transcrições em repouso
- [ ] Implementar RLS em `transcription_history`
- [ ] Adicionar rate limiting por usuário e IP
- [ ] Implementar queue de processamento com limites
- [ ] Configurar timeouts para operações longas
- [ ] Sanitizar mensagens de erro

---

### 🛡️ ESFERA ESCUDO: Segurança do Teleprompter

#### Riscos Identificados

**1. Acesso Não Autorizado a Sessões de Gravação**
- **Risco:** Usuário pode acessar vídeos gravados de outros usuários
- **Severidade:** CRÍTICA
- **Mitigação:**
  - RLS obrigatório em `teleprompter_sessions`
  - URLs assinadas e temporárias para vídeos (expiração 24h)
  - Validação de `user_id` em todas as operações
  - Armazenamento em bucket privado
  - Logs de acesso a vídeos

**2. Armazenamento Excessivo de Vídeos**
- **Risco:** Usuários podem consumir todo o espaço de armazenamento
- **Severidade:** MÉDIA
- **Mitigação:**
  - Limite de tamanho por vídeo (máx 1GB)
  - Limite de vídeos por usuário (máx 50 vídeos)
  - Política de retenção automática (deletar após 30 dias)
  - Compressão automática de vídeos
  - Alertas quando próximo do limite

**3. Acesso Não Autorizado a Câmera/Microfone**
- **Risco:** Aplicação pode acessar câmera sem permissão ou de forma maliciosa
- **Severidade:** ALTA
- **Mitigação:**
  - Solicitar permissão explícita antes de acessar
  - Mostrar indicador visual quando câmera está ativa
  - Não acessar câmera em background
  - Validar origem da requisição (HTTPS obrigatório)
  - Implementar timeout automático se inativo

**4. Injeção de Código via Conteúdo do Teleprompter**
- **Risco:** Texto carregado pode conter scripts maliciosos
- **Severidade:** MÉDIA
- **Mitigação:**
  - Sanitizar HTML em conteúdo carregado
  - Validar origem do conteúdo (projeto próprio do usuário)
  - Escape de caracteres especiais
  - Limitação de tamanho do conteúdo (máx 100.000 caracteres)

**5. Vazamento de Dados em Metadados de Vídeo**
- **Risco:** Metadados podem conter informações sensíveis
- **Severidade:** BAIXA
- **Mitigação:**
  - Remover metadados antes de armazenar
  - Não incluir informações de localização
  - Sanitizar EXIF data

**6. Ataque de Exaustão de Recursos**
- **Risco:** Gravações simultâneas podem sobrecarregar o sistema
- **Severidade:** MÉDIA
- **Mitigação:**
  - Limite de gravações simultâneas por usuário (máx 1)
  - Timeout automático para gravações longas (máx 2 horas)
  - Rate limiting na criação de sessões
  - Monitoramento de recursos

#### Checklist de Segurança - Esfera Escudo

- [ ] Implementar RLS em `teleprompter_sessions`
- [ ] Usar URLs assinadas e temporárias para vídeos
- [ ] Validar permissões de câmera/microfone
- [ ] Implementar indicadores visuais de gravação ativa
- [ ] Sanitizar conteúdo do teleprompter
- [ ] Remover metadados de vídeos antes de armazenar
- [ ] Implementar limites de armazenamento por usuário
- [ ] Adicionar política de retenção automática
- [ ] Implementar rate limiting em gravações
- [ ] Configurar timeouts para gravações longas

---

### 🔐 Segurança Geral do Sistema

#### Autenticação e Autorização

**Riscos:**
- Tokens JWT expirados ou comprometidos
- Escalonamento de privilégios
- Sessões não invalidadas

**Mitigações:**
- [ ] Validar tokens JWT em todas as requisições
- [ ] Implementar refresh tokens com rotação
- [ ] Invalidar sessões ao fazer logout
- [ ] Implementar 2FA opcional para contas sensíveis
- [ ] Rate limiting em tentativas de login (máx 5/hora por IP)
- [ ] Logs de auditoria para autenticação

#### Proteção de Dados Sensíveis

**Riscos:**
- Dados em texto plano no banco
- Vazamento em logs
- Exposição em respostas de API

**Mitigações:**
- [ ] Criptografar dados sensíveis em repouso
- [ ] Usar HTTPS obrigatório em todas as comunicações
- [ ] Não logar dados sensíveis (senhas, tokens, transcrições completas)
- [ ] Mascarar dados sensíveis em respostas de API quando não necessário
- [ ] Implementar rotação de chaves de criptografia

#### Validação e Sanitização

**Riscos:**
- Inputs não validados
- SQL/NoSQL Injection
- XSS através de inputs

**Mitigações:**
- [ ] Validar todos os inputs no backend (nunca confiar no frontend)
- [ ] Usar prepared statements para queries SQL
- [ ] Sanitizar HTML em todos os campos de texto
- [ ] Validar tipos, ranges e formatos
- [ ] Implementar CSP (Content Security Policy) headers

#### Rate Limiting e DDoS

**Riscos:**
- Ataques de negação de serviço
- Abuso de recursos
- Consumo excessivo de Dracmas

**Mitigações:**
- [ ] Implementar rate limiting por IP e por usuário
- [ ] Limites diferentes por tipo de operação
- [ ] Monitoramento de padrões suspeitos
- [ ] Throttling automático em caso de sobrecarga
- [ ] Alertas para administradores

#### Logs e Monitoramento

**Riscos:**
- Falta de visibilidade sobre ataques
- Dificuldade em investigar incidentes
- Dados sensíveis em logs

**Mitigações:**
- [ ] Implementar logs estruturados
- [ ] Logar tentativas de acesso não autorizado
- [ ] Logar operações críticas (criação, exclusão, acesso a dados sensíveis)
- [ ] Não logar dados sensíveis
- [ ] Implementar alertas para atividades suspeitas
- [ ] Retenção de logs por 90 dias

#### Compliance e Privacidade

**Riscos:**
- Não conformidade com LGPD/GDPR
- Retenção excessiva de dados
- Falta de consentimento

**Mitigações:**
- [ ] Implementar política de privacidade clara
- [ ] Permitir exportação de dados do usuário
- [ ] Permitir exclusão completa de dados
- [ ] Implementar retenção automática de dados
- [ ] Obter consentimento explícito para processamento
- [ ] Documentar finalidade do uso de dados

---

**Fim da Análise de Segurança**

