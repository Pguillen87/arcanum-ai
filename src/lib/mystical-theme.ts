// src/lib/mystical-theme.ts
// Utilitários para tema místico do Arcanum.AI

/**
 * Paleta de cores místicas do Arcanum.AI
 */
export const mysticalColors = {
  gold: {
    DEFAULT: '#FFD700',
    light: '#FFA500',
    dark: '#FF8C00',
  },
  lilac: {
    DEFAULT: '#9D4EDD',
    light: '#C77DFF',
    dark: '#7B2CBF',
  },
  cosmic: {
    DEFAULT: '#4A90E2',
    light: '#6BB6FF',
    dark: '#2E5C8A',
  },
  deep: {
    DEFAULT: '#0A0A0A',
    light: '#1A1A1A',
    dark: '#000000',
  },
} as const;

/**
 * Mensagens poéticas para diferentes estados
 */
export const mysticalMessages = {
  loading: [
    'A Bruxa das Brumas sussurra sabedoria...',
    'O Alquimista prepara o elixir da criação...',
    'Os cristais energéticos se alinham...',
    'A energia arcana flui através dos portais...',
    'Os dragões guardiões observam...',
  ],
  success: [
    'A transmutação foi concluída com sucesso!',
    'A energia se cristalizou perfeitamente!',
    'O portal se abriu e a magia fluiu!',
    'Os Dracmas foram consumidos com sabedoria!',
  ],
  error: [
    'A energia se dissipou... Tente novamente.',
    'O portal se fechou inesperadamente...',
    'Os cristais perderam sua conexão...',
    'A magia não respondeu... Verifique seus Dracmas.',
  ],
  waiting: [
    'Aguardando a energia se estabilizar...',
    'Os portais estão se alinhando...',
    'A sabedoria está sendo invocada...',
  ],
} as const;

/**
 * Retorna uma mensagem poética aleatória para um estado
 */
export function getMysticalMessage(type: keyof typeof mysticalMessages): string {
  const messages = mysticalMessages[type];
  return messages[Math.floor(Math.random() * messages.length)];
}

/**
 * Classes CSS para efeitos místicos
 */
export const mysticalClasses = {
  shadows: {
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg',
    xl: 'shadow-xl',
  },
  glow: {
    gold: 'shadow-mystical-gold',
    lilac: 'shadow-mystical-lilac',
    cosmic: 'shadow-mystical-cosmic',
    combined: 'shadow-mystical-glow',
  },
  animation: {
    pulse: 'animate-cosmic-pulse',
    glow: 'animate-glow-pulse',
    float: 'animate-float',
    rune: 'animate-rune-glow',
    particle: 'animate-particle-float',
    portal: 'animate-portal-open',
    crystal: 'animate-crystal-pulse',
  },
  border: {
    rune: 'border-2 border-mystical-gold/50 rounded-lg relative before:absolute before:inset-0 before:rounded-lg before:border before:border-mystical-lilac/30 before:animate-rune-glow',
    portal: 'border-2 border-mystical-cosmic/50 rounded-xl shadow-mystical-cosmic',
    crystal: 'border border-mystical-gold/30 rounded-lg shadow-mystical-gold',
  },
  background: {
    glass: 'glass-cosmic backdrop-blur-md bg-gradient-to-br from-mystical-deep-light/80 to-mystical-deep/90',
    portal: 'bg-gradient-to-br from-mystical-lilac/20 via-mystical-cosmic/10 to-mystical-gold/20',
    particle: 'relative overflow-hidden before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_50%_50%,rgba(255,215,0,0.1)_0%,transparent_70%)]',
  },
} as const;

/**
 * Utilitário para gerar gradientes místicos
 */
export function getMysticalGradient(type: 'essence' | 'energy' | 'shield' | 'cosmic'): string {
  const gradients = {
    essence: 'bg-gradient-to-br from-mystical-gold via-mystical-lilac to-mystical-gold',
    energy: 'bg-gradient-to-br from-mystical-lilac via-mystical-cosmic to-mystical-lilac',
    shield: 'bg-gradient-to-br from-mystical-cosmic via-mystical-gold to-mystical-cosmic',
    cosmic: 'bg-gradient-to-br from-mystical-deep via-mystical-lilac/20 to-mystical-deep',
  };
  return gradients[type];
}

/**
 * Utilitário para obter cor de feedback baseado em estado
 */
export function getFeedbackColor(state: 'success' | 'error' | 'warning' | 'info'): string {
  const colors = {
    success: 'text-mystical-gold',
    error: 'text-red-400',
    warning: 'text-mystical-gold-light',
    info: 'text-mystical-cosmic',
  };
  return colors[state];
}

/**
 * Utilitário para obter classe de hover místico
 */
export function getMysticalHover(type: 'card' | 'button' | 'link'): string {
  const hovers = {
    card: 'hover:shadow-mystical-glow hover:scale-[1.02] transition-all duration-300',
    button: 'hover:shadow-mystical-gold hover:brightness-110 transition-all duration-200',
    link: 'hover:text-mystical-gold transition-colors duration-200',
  };
  return hovers[type];
}

/**
 * Utilitário para obter animações de interação
 */
export function getInteractionAnimation(type: 'hover' | 'click' | 'focus'): string {
  const animations = {
    hover: 'hover:scale-105 hover:shadow-mystical-glow transition-all duration-200',
    click: 'active:scale-95 transition-transform duration-100',
    focus: 'focus:ring-2 focus:ring-mystical-gold focus:ring-offset-2 focus:ring-offset-mystical-deep',
  };
  return animations[type];
}
