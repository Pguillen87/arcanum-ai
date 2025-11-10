// Definições dos 7 Raios da Fraternidade Branca
// Baseado nos ensinamentos místicos e aplicado ao design do Arcanum.AI

export interface RayData {
  id: string;
  number: number;
  name: string;
  nameEn: string;
  hsl: string;
  meaning: string[];
  master: string;
  archangel: string;
  description: string;
}

export const sevenRays: RayData[] = [
  {
    id: 'blue',
    number: 1,
    name: 'Azul',
    nameEn: 'Blue',
    hsl: '210 80% 55%',
    meaning: ['Vontade divina', 'Força', 'Proteção', 'Fé', 'Poder'],
    master: 'El Morya',
    archangel: 'Miguel',
    description: 'O raio da vontade divina, força e proteção. Representa o poder de manifestar através da fé e determinação.',
  },
  {
    id: 'gold',
    number: 2,
    name: 'Dourado',
    nameEn: 'Gold',
    hsl: '45 90% 60%',
    meaning: ['Sabedoria', 'Iluminação', 'Paz', 'Clareza mental', 'Inteligência'],
    master: 'Lanto',
    archangel: 'Jofiel',
    description: 'O raio da sabedoria e iluminação. Traz clareza mental, paz e inteligência divina.',
  },
  {
    id: 'pink',
    number: 3,
    name: 'Rosa',
    nameEn: 'Pink',
    hsl: '340 75% 65%',
    meaning: ['Amor divino', 'Compaixão', 'Perdão', 'Unidade', 'Beleza'],
    master: 'Paulo Veneziano',
    archangel: 'Chamuel',
    description: 'O raio do amor divino e compaixão. Representa unidade, perdão e a beleza da criação.',
  },
  {
    id: 'white',
    number: 4,
    name: 'Branco',
    nameEn: 'White',
    hsl: '0 0% 98%',
    meaning: ['Pureza', 'Ascensão', 'Ressurreição', 'Esperança', 'Paz'],
    master: 'Seraphis Bey',
    archangel: 'Gabriel',
    description: 'O raio da pureza e ascensão. Traz esperança, paz e a energia da ressurreição.',
  },
  {
    id: 'green',
    number: 5,
    name: 'Verde',
    nameEn: 'Green',
    hsl: '150 60% 50%',
    meaning: ['Cura', 'Verdade', 'Concentração', 'Ciência', 'Prosperidade'],
    master: 'Hilarion',
    archangel: 'Rafael',
    description: 'O raio da cura e verdade. Representa concentração, ciência divina e prosperidade.',
  },
  {
    id: 'ruby',
    number: 6,
    name: 'Rubi',
    nameEn: 'Ruby',
    hsl: '0 70% 55%',
    meaning: ['Graça', 'Misericórdia', 'Devoção', 'Paz'],
    master: 'Miguel',
    archangel: 'Maria',
    description: 'O raio da graça e misericórdia. Traz devoção e paz através da compaixão divina.',
  },
  {
    id: 'violet',
    number: 7,
    name: 'Violeta',
    nameEn: 'Violet',
    hsl: '270 70% 60%',
    meaning: ['Transmutação', 'Liberdade', 'Perdão', 'Compaixão', 'Cerimônia'],
    master: 'Saint Germain',
    archangel: 'Uriel',
    description: 'O raio da transmutação e liberdade. Representa o poder de transformar através do perdão e compaixão.',
  },
];

// Funções helper
export function getRayById(id: string): RayData | undefined {
  return sevenRays.find(ray => ray.id === id);
}

export function getRayByNumber(number: number): RayData | undefined {
  return sevenRays.find(ray => ray.number === number);
}

export function getRayByName(name: string): RayData | undefined {
  return sevenRays.find(ray => ray.name.toLowerCase() === name.toLowerCase() || ray.nameEn.toLowerCase() === name.toLowerCase());
}

// Mapeamento de raios para áreas do app
export const rayMappings = {
  // Esferas (Orbs)
  essencia: ['gold', 'violet'], // Sabedoria + Transmutação
  energia: ['violet', 'blue'], // Transmutação + Vontade Divina
  protecao: ['blue', 'green'], // Proteção + Cura
  cosmos: ['violet', 'white', 'blue'], // Visão Universal + Pureza + Vontade
  
  // Módulos Místicos
  oracle: ['pink', 'violet'], // Amor Divino + Transmutação
  numerologist: ['blue', 'gold'], // Vontade + Sabedoria
  elemental: ['green', 'ruby'], // Cura + Devoção
  alchemist: ['violet', 'blue'], // Transmutação + Vontade
  astrologer: ['white', 'violet'], // Pureza + Transmutação
  soundmaster: ['violet', 'pink'], // Transmutação + Amor
} as const;

// Função para obter cores HSL de uma área específica
export function getRaysForArea(area: keyof typeof rayMappings): RayData[] {
  const rayIds = rayMappings[area];
  return rayIds.map(id => getRayById(id)!).filter(Boolean);
}

// Função para criar gradiente baseado nos raios de uma área
export function createGradientForArea(area: keyof typeof rayMappings, direction: 'linear' | 'radial' = 'linear'): string {
  const rays = getRaysForArea(area);
  if (rays.length === 0) {
    // Fallback para gradiente violeta padrão
    return `linear-gradient(135deg, hsl(270 70% 60%) 0%, hsl(45 90% 60%) 100%)`;
  }
  
  const colors = rays.map(ray => `hsl(${ray.hsl})`);
  
  if (direction === 'radial') {
    return `radial-gradient(circle at 50% 50%, ${colors.join(', ')})`;
  }
  
  // Gradiente linear com distribuição igual
  const stops = colors.map((color, index) => {
    const percentage = (index / (colors.length - 1)) * 100;
    return `${color} ${percentage}%`;
  }).join(', ');
  
  return `linear-gradient(135deg, ${stops})`;
}

