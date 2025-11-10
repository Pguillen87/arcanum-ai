import { Wand2, Hash, Flame, Droplets, Leaf, Stars, Sparkles, Music } from "lucide-react";
import { LucideIcon, ReactNode } from "react";

export interface MysticalModule {
  id: string;
  title: string;
  subtitle: string;
  icon: LucideIcon | ReactNode;
  colors: { primary: string; secondary: string }; // Cores em hex para compatibilidade
  rays: string[]; // IDs dos raios associados (ex: ['pink', 'violet'])
  agentType: 'oracle' | 'numerologist' | 'elemental' | 'alchemist' | 'astrologer' | 'soundmaster';
  chatGreeting: string;
  description?: string;
}

export const mysticalModules: MysticalModule[] = [
  {
    id: 'oracle',
    title: 'O Oráculo das Palavras',
    subtitle: 'Tarot AI',
    icon: Wand2,
    rays: ['pink', 'violet'], // 3º Raio (Amor Divino) + 7º Raio (Transmutação)
    colors: {
      primary: '#ec4899', // 3º Raio - Rosa (Amor Divino, Compaixão) - hsl(340 75% 65%)
      secondary: '#a855f7', // 7º Raio - Violeta (Transmutação) - hsl(270 70% 60%)
    },
    agentType: 'oracle',
    chatGreeting: 'Bem-vindo ao Oráculo das Palavras! 🌙✨ Deixe-me consultar os arcanos para revelar os mistérios que cercam sua jornada criativa...',
    description: 'Leitura simbólica e intuitiva através de IA',
  },
  {
    id: 'numerologist',
    title: 'O Códice dos Números',
    subtitle: 'Numerologia Criativa',
    icon: Hash,
    rays: ['blue', 'gold'], // 1º Raio (Vontade) + 2º Raio (Sabedoria)
    colors: {
      primary: '#3b82f6', // 1º Raio - Azul (Vontade Divina, Força) - hsl(210 80% 55%)
      secondary: '#fbbf24', // 2º Raio - Dourado (Sabedoria, Iluminação) - hsl(45 90% 60%)
    },
    agentType: 'numerologist',
    chatGreeting: 'Bem-vindo ao Códice dos Números! 🔢✨ Os números guardam segredos sobre sua essência criativa. Compartilhe seu nome ou data de nascimento para desvendar os ciclos energéticos...',
    description: 'Interpretação energética dos ciclos e nomes',
  },
  {
    id: 'elemental',
    title: 'Os Quatro Soprores',
    subtitle: 'Magia Elemental',
    icon: Flame,
    rays: ['green', 'ruby'], // 5º Raio (Cura) + 6º Raio (Devoção)
    colors: {
      primary: '#10b981', // 5º Raio - Verde (Cura, Verdade) - hsl(150 60% 50%)
      secondary: '#dc2626', // 6º Raio - Rubi (Graça, Devoção) - hsl(0 70% 55%)
    },
    agentType: 'elemental',
    chatGreeting: 'Bem-vindo aos Quatro Soprores! 🔥💧🌍💨 Os elementos aguardam para guiar sua transmutação criativa. Qual elemento ressoa com sua essência hoje?',
    description: 'Experiência interativa com os elementos',
  },
  {
    id: 'alchemist',
    title: 'O Laboratório Etéreo',
    subtitle: 'Manipulação Energética',
    icon: Sparkles,
    rays: ['violet', 'blue'], // 7º Raio (Transmutação) + 1º Raio (Vontade)
    colors: {
      primary: '#a855f7', // 7º Raio - Violeta (Transmutação) - hsl(270 70% 60%)
      secondary: '#3b82f6', // 1º Raio - Azul (Vontade Divina) - hsl(210 80% 55%)
    },
    agentType: 'alchemist',
    chatGreeting: 'Bem-vindo ao Laboratório Etéreo! ⚗️✨ Aqui, transformamos a vibração do seu conteúdo. Descreva o que deseja transmutar e eu ajustarei a energia...',
    description: 'Ajuste a vibração do conteúdo',
  },
  {
    id: 'astrologer',
    title: 'O Mapa dos Céus Internos',
    subtitle: 'Astrologia Interdimensional',
    icon: Stars,
    rays: ['white', 'violet'], // 4º Raio (Pureza) + 7º Raio (Transmutação)
    colors: {
      primary: '#fafafa', // 4º Raio - Branco (Pureza, Ascensão) - hsl(0 0% 98%)
      secondary: '#a855f7', // 7º Raio - Violeta (Transmutação) - hsl(270 70% 60%)
    },
    agentType: 'astrologer',
    chatGreeting: 'Bem-vindo ao Mapa dos Céus Internos! ⭐🌌 Os arquétipos astrais revelam padrões profundos em sua criatividade. Compartilhe sua data de nascimento para mapear seu céu interno...',
    description: 'Insights baseados em arquétipos astrais',
  },
  {
    id: 'soundmaster',
    title: 'A Harpa dos Mundos',
    subtitle: 'Som & Frequência',
    icon: Music,
    rays: ['violet', 'pink'], // 7º Raio (Transmutação) + 3º Raio (Amor)
    colors: {
      primary: '#a855f7', // 7º Raio - Violeta (Transmutação) - hsl(270 70% 60%)
      secondary: '#ec4899', // 3º Raio - Rosa (Amor Divino) - hsl(340 75% 65%)
    },
    agentType: 'soundmaster',
    chatGreeting: 'Bem-vindo à Harpa dos Mundos! 🎵✨ As frequências sonoras purificam e elevam sua energia criativa. Descreva o que busca: foco, meditação ou inspiração?',
    description: 'Purificação sonora para meditação e foco',
  },
];

