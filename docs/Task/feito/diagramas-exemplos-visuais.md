# Diagramas e Exemplos Visuais - Refatoração das Esferas

**Complemento à análise principal**

---

## 🎭 ESFERA ESSÊNCIA: Fluxo de Criação de Personagem

### Fluxo Visual

```
┌─────────────────────────────────────────────────────────┐
│  ESFERA ESSÊNCIA - Criar Personagem                      │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Nome: [Quiron, o Arcano Menor________]                 │
│  Descrição: [Guardião místico...]                       │
│  Avatar: [📷 Upload]                                    │
│                                                          │
│  ┌──────────────────────────────────────────────┐     │
│  │ 🧠 Núcleo de Personalidade                      │     │
│  │                                                │     │
│  │ Robótico ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ Humano │     │
│  │    ●───────────────────────────────────────○   │     │
│  │                                                │     │
│  │ Palhaço ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ Sério │     │
│  │    ●───────────────────────────────○           │     │
│  │                                                │     │
│  │ Traits: [alegre] [otimista] [expansivo] [+]   │     │
│  └──────────────────────────────────────────────┘     │
│                                                          │
│  ┌──────────────────────────────────────────────┐     │
│  │ 💬 Tom de Comunicação                         │     │
│  │                                                │     │
│  │ Formalidade:                                    │     │
│  │ Informal ━━━━━━━━━━━━━━━━━━━━━━━━━━━ Formal  │     │
│  │    ●───────────────────────────────○           │     │
│  │                                                │     │
│  │ Entusiasmo:                                     │     │
│  │ Baixo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ Alto    │     │
│  │    ●───────────────────────────────○           │     │
│  │                                                │     │
│  │ Estilo: ☑ Poético ☑ Humorístico ☐ Técnico    │     │
│  │         ☑ Usar emojis ☐ Gírias               │     │
│  └──────────────────────────────────────────────┘     │
│                                                          │
│  ... (outras 6 dimensões)                              │
│                                                          │
│  [Cancelar]                    [Criar Personagem ✨]    │
└─────────────────────────────────────────────────────────┘
```

### Exemplo de Dados JSON

```json
{
  "id": "uuid",
  "name": "Quiron, o Arcano Menor",
  "description": "Guardião místico com toque de humor",
  "personality_core": {
    "traits": ["alegre", "otimista", "expansivo", "místico"],
    "robotic_human": 25,  // 0-100, mais humano
    "clown_serious": 30   // 0-100, mais palhaço
  },
  "communication_tone": {
    "formality": "informal",
    "enthusiasm": "high",
    "style": ["poetic", "humoristic"],
    "use_emojis": true,
    "use_slang": false
  },
  "motivation_focus": {
    "focus": "help",
    "seeks": "harmony"
  },
  "social_attitude": {
    "type": "proactive",
    "curiosity": "high",
    "reserved_expansive": 20  // mais expansivo
  },
  "cognitive_speed": {
    "speed": "fast",
    "depth": "analytical"
  },
  "vocabulary_style": {
    "style": "mystical",
    "complexity": "medium",
    "use_figures": true
  },
  "emotional_state": {
    "current": "happy",
    "variability": "high"
  },
  "values_tendencies": ["creative", "mystical", "helpful"]
}
```

---

## ⚡ ESFERA ENERGIA: Fluxo de Transcrição + Transformação

### Fluxo Completo - Aba Áudio

```
┌─────────────────────────────────────────────────────────┐
│  ENERGIA - Transcrição de Áudio                         │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  [📤 Upload] ou [🎤 Gravar]                             │
│                                                          │
│  Arquivo: audio_exemplo.mp3                             │
│  Status: ⏳ Transcrevendo...                             │
│                                                          │
│  ┌──────────────────────────────────────────────┐     │
│  │ Transcrição Original                           │     │
│  │                                                │     │
│  │ "Saudações, Mago! Sou Quiron o arcano menor!  │     │
│  │  Tivemos uma ótima notícia..."                │     │
│  │                                                │     │
│  │ [📋 Copiar]                                    │     │
│  └──────────────────────────────────────────────┘     │
│                                                          │
│  ┌──────────────────────────────────────────────┐     │
│  │ Transformar com Personagem                    │     │
│  │                                                │     │
│  │ Personagem: [Quiron, o Arcano Menor ▼]       │     │
│  │ Tipo: [Post para Redes Sociais ▼]            │     │
│  │ Tamanho: [Médio ▼]                            │     │
│  │ Projeto: [Meu Projeto ▼] (opcional)          │     │
│  │                                                │     │
│  │ [✨ Transmutar com Personagem]                │     │
│  └──────────────────────────────────────────────┘     │
│                                                          │
│  ┌──────────────────────┬──────────────────────┐       │
│  │ Transcrição Original │ Versão Quiron        │       │
│  ├──────────────────────┼──────────────────────┤       │
│  │ "Saudações, Mago!    │ 🔮✨ Saudações, Mago!│       │
│  │  Sou Quiron..."      │ Aqui é Quiron..."    │       │
│  │                      │                      │       │
│  │ [📋 Copiar]          │ [📋 Copiar]          │       │
│  └──────────────────────┴──────────────────────┘       │
└─────────────────────────────────────────────────────────┘
```

### Fluxo Completo - Aba Vídeo

```
┌─────────────────────────────────────────────────────────┐
│  ENERGIA - Transcrição de Vídeo                         │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  [📤 Upload Vídeo]                                      │
│                                                          │
│  Arquivo: video_exemplo.mp4                             │
│  Status: ⏳ Extraindo áudio...                          │
│  Status: ⏳ Transcrevendo...                             │
│                                                          │
│  ┌──────────────────────────────────────────────┐     │
│  │ Transcrição Original                           │     │
│  │                                                │     │
│  │ "Olá pessoal, hoje vou falar sobre..."        │     │
│  │                                                │     │
│  │ [📋 Copiar]                                    │     │
│  └──────────────────────────────────────────────┘     │
│                                                          │
│  [Mesmo fluxo de transformação com personagem]          │
└─────────────────────────────────────────────────────────┘
```

### Histórico de Transcrições

```
┌─────────────────────────────────────────────────────────┐
│  Histórico de Transcrições                              │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Filtros: [Todos] [Texto] [Áudio] [Vídeo]              │
│  Busca: [________________]                              │
│                                                          │
│  ┌──────────────────────────────────────────────┐     │
│  │ 🎤 Áudio - 15/01/2025 14:30                   │     │
│  │ Personagem: Quiron                            │     │
│  │ Tipo: Post para Redes Sociais                 │     │
│  │ [Ver] [Copiar] [Deletar]                      │     │
│  └──────────────────────────────────────────────┘     │
│                                                          │
│  ┌──────────────────────────────────────────────┐     │
│  │ 📹 Vídeo - 15/01/2025 12:15                   │     │
│  │ Personagem: Quiron                            │     │
│  │ Tipo: Resumo                                  │     │
│  │ [Ver] [Copiar] [Deletar]                      │     │
│  └──────────────────────────────────────────────┘     │
│                                                          │
│  ┌──────────────────────────────────────────────┐     │
│  │ 📝 Texto - 15/01/2025 10:00                   │     │
│  │ Personagem: Quiron                            │     │
│  │ Tipo: Newsletter                              │     │
│  │ [Ver] [Copiar] [Deletar]                      │     │
│  └──────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────┘
```

---

## 🛡️ ESFERA ESCUDO: Interface do Teleprompter

### Layout Principal

```
┌─────────────────────────────────────────────────────────┐
│  ESCUDO - Teleprompter                                  │
├─────────────────────────────────────────────────────────┤
│  [⚙️ Config] [📁 Projetos] [🔴 Gravar]                 │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────────────────────────────────────┐     │
│  │                                                │     │
│  │                                                │     │
│  │         Saudações, Mago!                       │     │
│  │                                                │     │
│  │         Sou Quiron, o arcano menor!             │     │
│  │                                                │     │
│  │         Tivemos uma ótima notícia:             │     │
│  │                                                │     │
│  │         conseguimos remover toda energia        │     │
│  │                                                │     │
│  │         de escassez e agora você vai voar      │     │
│  │                                                │     │
│  │         com abundância!                        │     │
│  │                                                │     │
│  │         Aproveite, mago!                        │     │
│  │                                                │     │
│  │                                                │     │
│  │  ←────────────────────────────────────────→   │     │
│  │  (Scroll automático/inteligente)               │     │
│  └──────────────────────────────────────────────┘     │
│                                                          │
│  ┌──────────────────────────────────────────────┐     │
│  │ Controles                                      │     │
│  │                                                │     │
│  │ Velocidade: [━━━━━━━━━━━━━━━━━━━━━━━━━━━━]   │     │
│  │            Lento                    Rápido     │     │
│  │                                                │     │
│  │ [⏮ Início] [⏯ Play/Pause] [⏹ Parar]         │     │
│  │                                                │     │
│  │ Modo: ○ Automático ● Inteligente ○ Manual     │     │
│  └──────────────────────────────────────────────┘     │
│                                                          │
│  ┌──────────────────────────────────────────────┐     │
│  │ Preview Câmera                               │     │
│  │ ┌────────────────────────────────────────┐   │     │
│  │ │                                        │   │     │
│  │ │         [Preview da Câmera]            │   │     │
│  │ │                                        │   │     │
│  │ └────────────────────────────────────────┘   │     │
│  │                                                │     │
│  │ [🎥 Selecionar Câmera] [📐 Configurações]      │     │
│  └──────────────────────────────────────────────┘     │
│                                                          │
│  [🔴 Iniciar Gravação]                                  │
└─────────────────────────────────────────────────────────┘
```

### Seleção de Conteúdo do Projeto

```
┌─────────────────────────────────────────────────────────┐
│  Selecionar Conteúdo do Projeto                         │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Projeto: [Meu Projeto de Vídeos ▼]                    │
│                                                          │
│  ┌──────────────────────────────────────────────┐     │
│  │ Conteúdo Disponível                           │     │
│  │                                                │     │
│  │ ☑ Transcrição - Áudio 15/01                    │     │
│  │    "Saudações, Mago! Sou Quiron..."           │     │
│  │                                                │     │
│  │ ☐ Transcrição - Vídeo 14/01                    │     │
│  │    "Olá pessoal, hoje vou falar..."           │     │
│  │                                                │     │
│  │ ☐ Texto Manual - Roteiro Episódio 1            │     │
│  │    "Cena 1: Introdução..."                    │     │
│  │                                                │     │
│  │ [➕ Adicionar Texto Manual]                    │     │
│  └──────────────────────────────────────────────┘     │
│                                                          │
│  [Cancelar] [Usar Conteúdo Selecionado]                 │
└─────────────────────────────────────────────────────────┘
```

### Configurações do Teleprompter

```
┌─────────────────────────────────────────────────────────┐
│  Configurações do Teleprompter                          │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────────────────────────────────────┐     │
│  │ Aparência                                      │     │
│  │                                                │     │
│  │ Tamanho da Fonte: [24px ▼]                    │     │
│  │ Cor do Texto: [⬜ Branco]                     │     │
│  │ Cor de Fundo: [⬛ Preto]                      │     │
│  │ Espelhado: ☐ Sim                              │     │
│  └──────────────────────────────────────────────┘     │
│                                                          │
│  ┌──────────────────────────────────────────────┐     │
│  │ Detecção de Pausa                              │     │
│  │                                                │     │
│  │ Sensibilidade: [━━━━━━━━━━━━━━━━━━━━━━━━━━━━]│     │
│  │            Baixa                    Alta       │     │
│  │                                                │     │
│  │ Tempo de Pausa: [500ms ▼]                     │     │
│  │ Tempo para Retomar: [1000ms ▼]                │     │
│  └──────────────────────────────────────────────┘     │
│                                                          │
│  ┌──────────────────────────────────────────────┐     │
│  │ Câmera                                         │     │
│  │                                                │     │
│  │ Resolução: [1920x1080 ▼]                     │     │
│  │ FPS: [30 ▼]                                    │     │
│  │ Câmera: [Câmera Frontal ▼]                    │     │
│  │                                                │     │
│  │ ☑ Cancelamento de Eco                         │     │
│  │ ☑ Redução de Ruído                            │     │
│  └──────────────────────────────────────────────┘     │
│                                                          │
│  [Salvar Configurações]                                 │
└─────────────────────────────────────────────────────────┘
```

---

## 🔄 Diagrama de Fluxo de Dados

### Fluxo: Áudio → Transcrição → Personagem → Resultado

```
┌──────────┐
│  Áudio   │
│ Upload   │
└────┬─────┘
     │
     ▼
┌─────────────────┐
│ Supabase Storage│
│ (bucket: audio) │
└────┬────────────┘
     │
     ▼
┌─────────────────────────┐
│ Edge Function            │
│ transcribe_audio         │
│                          │
│ 1. Download áudio        │
│ 2. Whisper API          │
│ 3. Salva transcrição     │
└────┬────────────────────┘
     │
     ▼
┌─────────────────────────┐
│ Tabela: transcriptions   │
│ - text (original)        │
│ - status: completed      │
└────┬────────────────────┘
     │
     ▼
┌─────────────────────────┐
│ Frontend: Mostra        │
│ Transcrição Original    │
└────┬────────────────────┘
     │
     │ Usuário seleciona:
     │ - Personagem
     │ - Tipo transformação
     │ - Tamanho
     │
     ▼
┌─────────────────────────┐
│ Edge Function            │
│ character_transform      │
│ (ou transform_text       │
│  com characterId)       │
│                          │
│ 1. Busca personagem     │
│ 2. Constrói prompt      │
│ 3. Chama GPT/Claude      │
│ 4. Retorna transformado  │
└────┬────────────────────┘
     │
     ▼
┌─────────────────────────┐
│ Tabela:                  │
│ transcription_history    │
│ - original_text          │
│ - transformed_text       │
│ - character_id           │
└────┬────────────────────┘
     │
     ▼
┌─────────────────────────┐
│ Frontend: Mostra         │
│ Lado a Lado              │
│ [Original] [Personagem] │
└─────────────────────────┘
```

---

## 🎯 Exemplos de Prompts Gerados

### Exemplo 1: Quiron transformando transcrição

**Input (Transcrição Original):**
```
"Saudações, Mago! Sou Quiron o arcano menor! Tivemos uma ótima notícia conseguimos remover toda energia de escassez e agora você vai voar com abundância. aproveite mago!!"
```

**Prompt Construído:**
```
Você é Quiron, o Arcano Menor, um personagem com as seguintes características:

🧠 Personalidade: alegre, otimista, expansivo, místico
💬 Tom: informal, alto entusiasmo, poético e humorístico, usa emojis
❤️ Foco: ajudar, busca harmonia
👁️ Atitude: proativo, alta curiosidade, expansivo
⚙️ Velocidade: rápida, analítica
🎨 Estilo: místico, complexidade média, usa figuras de linguagem
🧩 Estado: feliz, alta variabilidade
🪞 Valores: criativo, místico, útil

Transforme o seguinte texto em um post para redes sociais, mantendo a essência e tornando-o envolvente e conciso.

Texto original:
"Saudações, Mago! Sou Quiron o arcano menor! Tivemos uma ótima notícia conseguimos remover toda energia de escassez e agora você vai voar com abundância. aproveite mago!!"

Agora, responda como Quiron, o Arcano Menor responderia:
```

**Output Esperado:**
```
🔮✨ Saudações, Mago! Aqui é Quiron, o arcano menor! 🌟 Temos uma notícia incrível: toda aquela energia de escassez foi removida! Agora é hora de voar alto com abundância! 🚀💰 Aproveite! #Magia #Abundância
```

---

## 📱 Responsividade e Mobile

### Layout Mobile - Teleprompter

```
┌─────────────────────┐
│ [☰] Teleprompter    │
├─────────────────────┤
│                     │
│ ┌─────────────────┐ │
│ │                 │ │
│ │   Texto do      │ │
│ │   Teleprompter │ │
│ │                 │ │
│ │   (Scroll)      │ │
│ │                 │ │
│ └─────────────────┘ │
│                     │
│ [⏮] [⏯] [⏹]      │
│                     │
│ Velocidade: [━━━]  │
│                     │
│ ┌─────────────────┐ │
│ │ [Preview]       │ │
│ └─────────────────┘ │
│                     │
│ [🔴 Gravar]         │
└─────────────────────┘
```

---

## 🔧 Tecnologias e APIs Necessárias

### Frontend
- **MediaRecorder API**: Gravação de áudio/vídeo
- **getUserMedia API**: Acesso à câmera/microfone
- **Web Speech API**: Detecção de voz (opcional, para melhor detecção)
- **Canvas API**: Preview de vídeo (melhor performance)
- **File API**: Upload de arquivos
- **Clipboard API**: Copiar texto

### Backend
- **OpenAI Whisper API**: Transcrição de áudio
- **OpenAI GPT-4/Claude**: Transformação com personagem
- **Supabase Storage**: Armazenamento de arquivos
- **Supabase Edge Functions**: Processamento serverless

### Bibliotecas Sugeridas
- **react-webcam**: Acesso à câmera (React)
- **wavesurfer.js**: Visualização de áudio (opcional)
- **framer-motion**: Animações suaves no teleprompter
- **react-speech-recognition**: Detecção de fala (opcional)

---

## 🎨 ANÁLISE DE DESIGN VISUAL - ELEMENTOS MÍSTICOS E COMPONENTES

### Visão Criativa dos Componentes Visuais

Este documento complementa os diagramas técnicos com **elementos visuais místicos** que transformam cada interface em uma experiência imersiva no universo Arcanum.AI.

### 🌟 Componentes Visuais por Esfera

#### ESFERA ESSÊNCIA - Elementos Visuais

**1. Sliders de Personalidade:**
- Barra com gradiente dourado/lilás animado
- Indicador circular com brilho pulsante e runas ao redor
- Runas decorativas nas extremidades que brilham ao interagir
- Efeito de "energia fluindo" ao mover o slider
- Tooltip com descrição poética do valor atual

**2. Tags de Traits:**
- Badges com bordas translúcidas e brilho suave
- Ícones místicos opcionais (estrela ⭐, cristal 🔮, runa ✨)
- Animação de "materialização" ao adicionar
- Hover: leve levitação e brilho aumentado
- Remoção com efeito de "dissipação"

**3. Preview do Personagem:**
- Card com borda dourada brilhante pulsante
- Fundo translúcido com partículas flutuantes (lilás/dourado)
- Avatar do personagem flutuando suavemente ao lado
- Texto com efeito de "escrita mágica" (aparece letra por letra)
- Ícone de cristal pulsante indicando "energia ativa"

**4. Biblioteca de Personagens:**
- Grid de cards com efeito "portal" (bordas translúcidas)
- Hover: card levita, runas aparecem ao redor, brilho aumenta
- Badge de "Personagem Padrão" com selo dourado animado
- Filtros com ícones místicos: "Todos" (portal), "Meus" (cristal), "Templates" (grimório)

#### ESFERA ENERGIA - Elementos Visuais

**1. Área de Upload:**
- Portal circular com bordas brilhantes pulsantes
- Partículas flutuantes (lilás/dourado) ao redor
- Efeito de "vórtice" ao arrastar arquivo sobre a área
- Ícone de portal central que pulsa suavemente
- Mensagem poética: "O portal está aberto... Arraste seu arquivo aqui"

**2. Status de Transcrição:**
- Sigilo energético (círculo com runas) girando no centro
- Mensagens poéticas rotativas:
  - "A Bruxa das Brumas sussurra sabedoria..."
  - "O Alquimista prepara o elixir da transcrição..."
  - "As runas se reorganizam..."
- Barra de progresso com efeito de energia condensada (gradiente dourado/lilás)
- Partículas lilases flutuando durante processamento

**3. Comparação Lado a Lado:**
- Divisor central com runas decorativas animadas
- Cards com bordas translúcidas e brilho suave
- Texto original: estilo neutro, fundo escuro (#1A1A1A)
- Texto transformado: estilo místico, fundo com gradiente dourado/lilás translúcido
- Botões de copiar com ícone de cristal que brilha ao hover

**4. Seletor de Personagem:**
- Dropdown com visual de "grimório aberto" (bordas decorativas)
- Cada opção mostra avatar pequeno, nome e badge de "padrão" se aplicável
- Hover: runas aparecem ao redor da opção, brilho aumenta
- Ícone de seta estilizado como "varinha mágica"

#### ESFERA ESCUDO - Elementos Visuais

**1. Área de Texto do Teleprompter:**
- Fundo escuro translúcido (#0A0A0A com opacity 0.9)
- Partículas flutuantes sutis (lilás/dourado) em segundo plano
- Texto com fonte legível mas estilizada (sans-serif moderna)
- Linha atual destacada com brilho dourado pulsante e sombra
- Scroll suave com efeito de "energia fluindo" (gradiente seguindo o scroll)
- Bordas com runas decorativas nos cantos

**2. Preview da Câmera:**
- Frame com bordas douradas brilhantes (2px, glow effect)
- Runas decorativas nos 4 cantos (pequenas, sutis)
- Overlay translúcido com informações (tempo, status) no canto superior
- Efeito de "portal" ao iniciar gravação (bordas se expandem, partículas explodem)
- Indicador de gravação: círculo vermelho pulsante com runas ao redor

**3. Controles de Gravação:**
- Botões com visual de "cristais energéticos" (bordas translúcidas, brilho)
- Hover: cristal pulsa e brilha, leve levitação
- Estado de gravação: borda vermelha pulsante, partículas vermelhas flutuando
- Indicador de tempo com estilo de "ampulheta mágica" (ícone animado)
- Botão de gravar: grande, central, com efeito de "portal fechado" quando inativo

**4. Configurações:**
- Sliders com visual místico (barra com gradiente dourado/lilás, indicador brilhante)
- Seletor de cores com paleta arcana (dourado, lilás, azul cósmico)
- Checkboxes com ícones de selos mágicos ao invés de checkmarks padrão
- Tooltips com mensagens poéticas ao hover

### 🎨 Paleta de Cores Detalhada

#### Cores Principais (Modo Escuro)
```css
--arcanum-black: #0A0A0A;
--arcanum-black-soft: #1A1A1A;
--arcanum-gold: #FFD700;
--arcanum-gold-secondary: #FFA500;
--arcanum-purple: #9D4EDD;
--arcanum-purple-secondary: #C77DFF;
--arcanum-blue: #4A90E2;
--arcanum-blue-secondary: #6BB6FF;
--arcanum-text: #FFFFFF;
--arcanum-text-secondary: #E0E0E0;
```

#### Efeitos e Gradientes
```css
--gradient-gold: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
--gradient-purple: linear-gradient(135deg, #9D4EDD 0%, #C77DFF 100%);
--gradient-cosmic: linear-gradient(135deg, #4A90E2 0%, #6BB6FF 50%, #9D4EDD 100%);
--glow-gold: 0 0 20px rgba(255, 215, 0, 0.5);
--glow-purple: 0 0 20px rgba(157, 78, 221, 0.5);
--mist-effect: backdrop-filter: blur(10px) + rgba(157, 78, 221, 0.1);
```

### ✨ Microinterações Detalhadas

#### Transições Gerais
- **Duração padrão:** 300ms para interações simples, 600ms para transições complexas
- **Easing:** `cubic-bezier(0.4, 0, 0.2, 1)` para suavidade
- **Hover:** Escala 1.02-1.05, brilho aumenta 20-30%
- **Click:** Escala 0.98, partículas explodem do ponto de clique

#### Feedback Visual
- **Sucesso:** Faíscas douradas explodindo, mensagem com efeito de escrita mágica
- **Erro:** Cristais fragmentados, névoa vermelha, mensagem com tom de "energia dissipada"
- **Loading:** Sigilo girando, partículas flutuantes, mensagens poéticas rotativas
- **Aguardando:** Portal pulsante, partículas orbitando, mensagem "O portal está se abrindo..."

### 🎭 Ícones e Símbolos Místicos

#### Ícones Principais
- **Portal:** Círculo com runas ao redor, brilho pulsante
- **Cristal:** Forma geométrica com brilho interno, partículas ao redor
- **Runa:** Símbolo antigo estilizado, brilho suave
- **Grimório:** Livro aberto com runas nas páginas
- **Ampulheta:** Ampulheta mágica com partículas caindo
- **Selos:** Círculos com símbolos internos, bordas brilhantes

#### Uso Contextual
- **Navegação:** Portais para transições entre telas
- **Status:** Cristais para indicadores de energia/Dracmas
- **Ações:** Runas para botões de ação mística
- **Informação:** Grimórios para cards informativos
- **Tempo:** Ampulhetas para indicadores de progresso/tempo

---

## 🎨 ANÁLISE CRIATIVA: FLUXOS NARRATIVOS E EXPERIÊNCIA IMERSIVA

### Visão Narrativa dos Fluxos Visuais

Além dos diagramas técnicos, cada fluxo deve contar uma **história mágica** onde o usuário é o protagonista de sua própria jornada arcana.

### 🌟 Fluxos Narrativos Detalhados

#### ESFERA ESSÊNCIA - A Jornada do Invocador

**Cenário 1: Primeira Criação**
```
[Estado Inicial]
┌─────────────────────────────────────┐
│  🌟 "Bem-vindo ao Círculo de Criação" │
│  "Nenhum personagem invocado ainda..." │
│  [Portal Vazio Pulsante]              │
│  [✨ Criar Primeiro Personagem]        │
└─────────────────────────────────────┘
         ↓ (Clique)
[Portal se Abre com Efeito de Vórtice]
         ↓
[Formulário Aparece com Materialização]
         ↓
[Usuário Ajusta Dimensões - Runas se Ativam]
         ↓
[Preview Mostra Personagem "Ganhando Vida"]
         ↓
[Botão "Criar" Brilha - Portal se Fecha]
         ↓
[Explosão de Partículas Douradas]
         ↓
[Personagem Aparece na Biblioteca com Efeito de Materialização]
```

**Cenário 2: Edição de Personagem Existente**
```
[Biblioteca de Personagens]
┌─────────────────────────────────────┐
│  [Card do Personagem]               │
│  Hover: Runas Aparecem, Card Levita │
│  [Editar] [Usar] [Deletar]          │
└─────────────────────────────────────┘
         ↓ (Clique em Editar)
[Portal se Abre - Personagem "Sai" do Card]
         ↓
[Formulário com Valores Pré-preenchidos]
[Sliders Animam para Posições Corretas]
         ↓
[Usuário Faz Alterações]
[Preview Atualiza em Tempo Real]
         ↓
[Salvar - Portal se Fecha]
[Personagem Retorna ao Card Atualizado]
```

#### ESFERA ENERGIA - O Ritual de Transmutação

**Cenário 1: Transcrição de Áudio**
```
[Estado Inicial]
┌─────────────────────────────────────┐
│  ⚡ "Portal de Transcrição Aberto"   │
│  [Área de Upload - Portal Pulsante] │
│  "Arraste seu arquivo ou clique..."  │
└─────────────────────────────────────┘
         ↓ (Upload)
[Arquivo "Entra" no Portal com Vórtice]
         ↓
[Portal se Fecha - Sigilo Aparece]
[Partículas Lilases Flutuam]
[Mensagem: "A Bruxa das Brumas está lendo..."]
         ↓
[Barra de Progresso com Energia Condensada]
[Mensagens Rotativas Poéticas]
         ↓
[100% - Sigilo Explode em Partículas Douradas]
         ↓
[Portal se Abre - Texto Original Aparece]
[Card com Borda Azul Translúcida]
         ↓
[Seletor de Personagem Aparece]
[Grimório se Abre com Opções]
         ↓
[Usuário Seleciona Personagem]
[Personagem "Se Materializa" ao Lado]
         ↓
[Botão "Transmutar" Brilha]
[Clique - Portal se Abre Entre os Cards]
         ↓
[Energia "Flui" do Original para Transformado]
[Card Transformado Aparece com Gradiente Dourado/Lilás]
[Mensagem: "A transmutação está completa!"]
```

**Cenário 2: Comparação Lado a Lado**
```
[Dois Cards Visíveis]
┌──────────────┬──────────────┐
│ Original     │ Transformado │
│ [Azul]       │ [Dourado]    │
│              │              │
│ Texto...     │ Texto...     │
│              │              │
│ [Copiar]     │ [Copiar]     │
└──────────────┴──────────────┘
         ↓ (Hover em Copiar)
[Cristal Brilha no Botão]
         ↓ (Clique)
[Faísca Dourada Explode]
[Mensagem Flutuante: "Copiado para o grimório!"]
[Texto Aparece com Efeito de "Escrita Mágica"]
```

#### ESFERA ESCUDO - A Manifestação em Vídeo

**Cenário 1: Preparação para Gravação**
```
[Estado Inicial]
┌─────────────────────────────────────┐
│  🛡️ "Portal de Manifestação"        │
│  [Seletor de Conteúdo]               │
│  "Escolha sua fonte de poder..."     │
└─────────────────────────────────────┘
         ↓ (Seleciona Projeto)
[Grimório se Abre]
[Lista de Projetos com Efeito Portal]
         ↓ (Seleciona Projeto)
[Projeto "Sai" do Grimório]
[Texto "Flui" para Área do Teleprompter]
         ↓
[Teleprompter Aparece com Texto]
[Runas nos Cantos se Ativam]
[Linha Atual Brilha com Dourado]
         ↓
[Usuário Ajusta Configurações]
[Sliders Respondem com "Energia Fluindo"]
         ↓
[Preview da Câmera Aparece]
[Frame com Bordas Douradas]
[Runas nos Cantos]
```

**Cenário 2: Gravação com Detecção de Pausa**
```
[Gravação Iniciada]
┌─────────────────────────────────────┐
│  [🔴 Gravação Ativa]                │
│  [Preview com Borda Vermelha]       │
│  [Partículas Vermelhas Flutuando]   │
│  [Teleprompter Scrollando]          │
│  [Linha Atual Brilha]               │
└─────────────────────────────────────┘
         ↓ (Usuário Para de Falar)
[Detecção de Silêncio]
[Névoa Lilás Aparece]
[Scroll Pausa Suavemente]
[Mensagem: "O tempo congelou para reflexão..."]
         ↓ (Usuário Continua Falando)
[Névoa se Dissipa]
[Portal se Reabre]
[Scroll Retoma]
[Mensagem: "O tempo flui novamente..."]
         ↓ (Finaliza Gravação)
[Botão Para - Portal se Fecha]
[Partículas Douradas Explodem]
[Preview do Vídeo Aparece]
[Mensagem: "A manifestação está completa!"]
```

### 🎭 Elementos de Imersão Adicionais

#### Feedback Contextual Inteligente

**Baseado no Tempo de Uso:**
- Primeiros 5 minutos: Mensagens mais explicativas
- 5-30 minutos: Mensagens balanceadas
- 30+ minutos: Mensagens mais concisas

**Baseado no Tipo de Ação:**
- Criação: "Você está criando magia..."
- Transformação: "A transmutação está em andamento..."
- Gravação: "Capturando a essência..."

**Baseado no Resultado:**
- Sucesso rápido: "Magia poderosa foi conjurada!"
- Sucesso após espera: "A paciência foi recompensada!"
- Erro: "A energia se dissipou... Mas não desista!"

#### Transições Entre Estados

**De Vazio para Preenchido:**
- Portal vazio → Portal com conteúdo (materialização)
- Área vazia → Área com elementos (aparecimento suave)
- Lista vazia → Lista com itens (cascata de materialização)

**De Processamento para Resultado:**
- Loading → Resultado (explosão de partículas)
- Espera → Sucesso (portal se abre)
- Erro → Retry (energia se reorganiza)

**De Visualização para Edição:**
- Card estático → Formulário editável (portal se abre)
- Texto estático → Texto editável (runas aparecem)
- Configuração padrão → Configuração customizada (sliders animam)

---

## 🔒 ANÁLISE DE SEGURANÇA VISUAL E UX

### Indicadores Visuais de Segurança

#### Feedback de Segurança para o Usuário

**1. Indicadores de Autenticação:**
- Badge visual quando usuário está autenticado
- Indicador de sessão ativa com timeout visível
- Aviso visual antes de sessão expirar (5 minutos antes)
- Mensagem clara ao fazer logout: "Sessão encerrada com segurança"

**2. Indicadores de Privacidade:**
- Ícone de "cadeado" em dados sensíveis
- Badge "Privado" em conteúdo não compartilhado
- Indicador visual quando dados estão criptografados
- Aviso ao compartilhar conteúdo: "Este conteúdo será visível para outros"

**3. Indicadores de Upload Seguro:**
- Progresso visual durante scan de vírus
- Badge "Verificado" após validação de arquivo
- Aviso visual para arquivos grandes: "Este arquivo pode demorar para processar"
- Mensagem de erro clara para arquivos rejeitados: "Arquivo não permitido. Use formatos: MP3, WAV, MP4"

**4. Indicadores de Rate Limiting:**
- Contador visual de requisições restantes
- Aviso quando próximo do limite: "Você tem 5 transcrições restantes nesta hora"
- Mensagem clara ao exceder limite: "Limite atingido. Tente novamente em X minutos"
- Sugestão de upgrade para limites maiores

**5. Indicadores de Câmera/Microfone:**
- Badge vermelho pulsante quando câmera está ativa
- Indicador de gravação sempre visível
- Aviso antes de acessar: "Esta aplicação precisa acessar sua câmera"
- Botão para desativar câmera sempre acessível

### Fluxos de Segurança Visuais

#### Fluxo de Validação de Upload

```
[Usuário Faz Upload]
         ↓
[Validação Visual - Ícone de Verificação]
         ↓
[Scan de Vírus - Barra de Progresso]
         ↓
[Validação de Tipo/Tamanho - Badge "Verificando..."]
         ↓
[Sucesso - Badge "Verificado" Verde]
         ↓
[Processamento Normal]
```

#### Fluxo de Detecção de Dados Sensíveis

```
[Transcrição Completa]
         ↓
[Análise Automática - Ícone de Escaneamento]
         ↓
[Dados Sensíveis Detectados?]
    ↓ Sim                    ↓ Não
[Badge "Dados Sensíveis Detectados"]
[Mensagem: "Encontramos informações sensíveis"]
[Opção: Mascarar Automaticamente]
         ↓
[Usuário Escolhe Ação]
```

#### Fluxo de Rate Limiting

```
[Usuário Tenta Ação]
         ↓
[Verificação de Limite]
         ↓
[Dentro do Limite?]
    ↓ Sim                    ↓ Não
[Ação Prossegue]    [Aviso Visual]
                    [Contador: "X ações restantes"]
                    [Tempo de Espera: "Tente em Y minutos"]
                    [Sugestão de Upgrade]
```

### Mensagens de Erro Seguras

#### Princípios de Mensagens de Erro

**1. Não Expor Informações Sensíveis:**
- ❌ Ruim: "Erro ao acessar arquivo /users/123/secret/video.mp4"
- ✅ Bom: "Erro ao processar arquivo. Tente novamente."

**2. Ser Específico sem Ser Técnico:**
- ❌ Ruim: "SQL Error: Invalid user_id in WHERE clause"
- ✅ Bom: "Não foi possível acessar este recurso."

**3. Fornecer Ação Clara:**
- ❌ Ruim: "Erro 500"
- ✅ Bom: "Algo deu errado. Por favor, tente novamente em alguns instantes."

**4. Usar Linguagem Mística Consistente:**
- ❌ Ruim: "Authentication failed"
- ✅ Bom: "O portal não reconheceu suas credenciais. Verifique e tente novamente."

### Visualização de Permissões

#### Interface de Permissões

```
┌─────────────────────────────────────┐
│  🔒 Permissões Ativas                │
│  ──────────────────────────────────  │
│                                      │
│  ✅ Câmera - Ativa                   │
│     "Usada para gravação de vídeo"   │
│     [Desativar]                      │
│                                      │
│  ✅ Microfone - Ativo                │
│     "Usado para detecção de voz"     │
│     [Desativar]                      │
│                                      │
│  ⚠️ Localização - Não Solicitada     │
│     "Não necessário para esta app"   │
│                                      │
│  [Gerenciar Todas as Permissões]    │
└─────────────────────────────────────┘
```

### Indicadores de Privacidade

#### Badges e Ícones de Privacidade

- **🔒 Privado:** Conteúdo visível apenas para você
- **👁️ Público:** Conteúdo pode ser compartilhado
- **🔐 Criptografado:** Dados protegidos com criptografia
- **✅ Verificado:** Arquivo validado e seguro
- **⚠️ Sensível:** Dados sensíveis detectados
- **🛡️ Protegido:** Recurso com proteção adicional

---

**Fim do Documento Complementar**

