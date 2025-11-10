import React from "react";

interface MysticCauldronProgressProps {
  progress: number; // 0..100
  label?: string;
}

/**
 * MysticCauldronProgress
 * Visual progress temático inspirado em um caldeirão que enche conforme o progresso.
 * - Usa SVG para manter o formato elegante e responsivo.
 * - A "poção" é um retângulo clipado dentro do caldeirão e sua altura varia com o progresso.
 */
export function MysticCauldronProgress({ progress, label }: MysticCauldronProgressProps) {
  const pct = Math.max(0, Math.min(100, Math.round(progress)));

  // Altura da poção dentro do caldeirão (0..1)
  const fillRatio = pct / 100;

  // Para suavizar visualmente, limitamos um pouco a borda superior com arredondamento.
  const fillHeight = 64 * fillRatio; // altura interna alvo

  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <svg width="120" height="110" viewBox="0 0 120 110" xmlns="http://www.w3.org/2000/svg" role="img" aria-label={label || `Progresso ${pct}%`}>
        {/* Glow externo místico */}
        <defs>
          <radialGradient id="glow" cx="50%" cy="40%" r="70%">
            <stop offset="0%" stopColor="hsl(var(--primary) / 0.9)" />
            <stop offset="60%" stopColor="hsl(var(--primary) / 0.35)" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
          <linearGradient id="metal" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2c2448" />
            <stop offset="50%" stopColor="#1f1836" />
            <stop offset="100%" stopColor="#120f22" />
          </linearGradient>
          <linearGradient id="potion" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="rgba(168, 139, 250, 0.9)" />
            <stop offset="50%" stopColor="rgba(120, 82, 255, 0.85)" />
            <stop offset="100%" stopColor="rgba(233, 216, 166, 0.9)" />
          </linearGradient>
        </defs>

        {/* Aura */}
        <circle cx="60" cy="46" r="44" fill="url(#glow)" />

        {/* Caldeirão (borda/metal) */}
        <path
          d="M30,45 C30,30 45,22 60,22 C75,22 90,30 90,45 C90,64 82,72 60,72 C38,72 30,64 30,45 Z"
          fill="url(#metal)"
          stroke="rgba(233, 216, 166, 0.6)"
          strokeWidth="2"
        />

        {/* Poção (nível variável) */}
        <clipPath id="bowlClip">
          <path d="M30,45 C30,30 45,22 60,22 C75,22 90,30 90,45 C90,64 82,72 60,72 C38,72 30,64 30,45 Z" />
        </clipPath>
        <g clipPath="url(#bowlClip)">
          {/* Fundo translúcido da poção */}
          <rect x="30" y={72 - fillHeight} width="60" height={fillHeight} fill="url(#potion)" rx="6" />
          {/* Ondas sutis */}
          <path
            d={`M30 ${72 - fillHeight + 6} Q 45 ${68 - fillHeight} 60 ${72 - fillHeight + 6} T 90 ${72 - fillHeight + 6}`}
            stroke="rgba(255,255,255,0.5)"
            strokeWidth="1.2"
            fill="none"
            opacity="0.6"
          />
        </g>

        {/* Pés do caldeirão */}
        <rect x="36" y="74" width="14" height="6" rx="2" fill="#1b1530" />
        <rect x="70" y="74" width="14" height="6" rx="2" fill="#1b1530" />

        {/* Porcentagem */}
        <text x="60" y="98" textAnchor="middle" fontSize="12" fill="#cfc5f8" style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace' }}>
          {pct}%
        </text>
      </svg>
      {label && <p className="text-xs text-muted-foreground">{label}</p>}
    </div>
  );
}

