import { Sparkles, Zap, Shield, Stars, LucideIcon } from "lucide-react";

export interface OrbData {
  id: string;
  icon: LucideIcon;
  label: string;
  description: string;
  color: 'primary' | 'secondary';
  // Cores específicas para gradientes e glows baseadas nos 7 Raios
  gradientColors: {
    primary: string; // Cor principal HSL (baseada no raio principal)
    secondary: string; // Cor secundária HSL (raio complementar)
  };
  // Raios associados a esta esfera
  rays: string[]; // IDs dos raios (ex: ['gold', 'violet'])
}

export const orbs: OrbData[] = [
  {
    id: "essencia",
    icon: Sparkles,
    label: "Essência",
    description: "DNA Criativo",
    color: "primary",
    rays: ['gold', 'violet'], // 2º Raio (Sabedoria) + 7º Raio (Transmutação)
    gradientColors: {
      primary: "45 90% 60%", // 2º Raio - Dourado (Sabedoria, Iluminação)
      secondary: "270 70% 60%", // 7º Raio - Violeta (Transmutação)
    },
  },
  {
    id: "energia",
    icon: Zap,
    label: "Energia",
    description: "Transmutação",
    color: "secondary",
    rays: ['violet', 'blue'], // 7º Raio (Transmutação) + 1º Raio (Vontade Divina)
    gradientColors: {
      primary: "270 70% 60%", // 7º Raio - Violeta (Transmutação)
      secondary: "210 80% 55%", // 1º Raio - Azul (Vontade Divina, Força)
    },
  },
  {
    id: "protecao",
    icon: Shield,
    label: "Proteção",
    description: "Escudo",
    color: "primary",
    rays: ['blue', 'green'], // 1º Raio (Proteção) + 5º Raio (Cura)
    gradientColors: {
      primary: "210 80% 55%", // 1º Raio - Azul (Vontade Divina, Proteção)
      secondary: "150 60% 50%", // 5º Raio - Verde (Cura, Verdade)
    },
  },
  {
    id: "cosmos",
    icon: Stars,
    label: "Cosmos",
    description: "Visão Universal",
    color: "secondary",
    rays: ['violet', 'white', 'blue'], // 7º Raio + 4º Raio + 1º Raio
    gradientColors: {
      primary: "270 70% 60%", // 7º Raio - Violeta (Transmutação)
      secondary: "0 0% 98%", // 4º Raio - Branco (Pureza, Ascensão) - usando azul como secundário visual
    },
  },
];

