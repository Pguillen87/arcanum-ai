import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface ShatterEffectProps {
  isActive: boolean;
  onComplete: () => void;
  orbPosition: { x: number; y: number };
}

const RUNE_SYMBOLS = [
  "ᚠ", "ᚢ", "ᚦ", "ᚨ", "ᚱ", "ᚲ", "ᚷ", "ᚹ", "ᚺ", "ᚾ", // Runas nórdicas
  "✦", "✧", "✨", "◈", "◇", "⬡", "⬢", // Símbolos geométricos
  "𖤐", "𖤓", "𖤔", "𖤕", // Símbolos alquímicos
];

export const ShatterEffect = ({ isActive, onComplete, orbPosition }: ShatterEffectProps) => {
  const [fragments] = useState(() => {
    const fragmentCount = 6;
    return Array.from({ length: fragmentCount }, (_, i) => ({
      symbol: RUNE_SYMBOLS[Math.floor(Math.random() * RUNE_SYMBOLS.length)],
      id: i,
      angle: (360 / fragmentCount) * i,
      distance: 100 + Math.random() * 80,
      scale: 0.9 + Math.random() * 0.2,
    }));
  });

  useEffect(() => {
    if (isActive) {
      const timer = setTimeout(onComplete, 400);
      return () => clearTimeout(timer);
    }
  }, [isActive, onComplete]);

  if (!isActive) return null;

  return (
    <div
      className="fixed inset-0 pointer-events-none z-50"
      style={{
        left: orbPosition.x,
        top: orbPosition.y,
      }}
    >
      {fragments.map((fragment) => (
        <motion.div
          key={fragment.id}
          className="absolute text-2xl md:text-4xl font-bold"
          style={{
            textShadow: "0 0 10px hsl(var(--primary) / 0.8), 0 0 20px hsl(var(--primary) / 0.5)",
            color: "hsl(var(--primary))",
          }}
          initial={{ x: 0, y: 0, opacity: 1, scale: fragment.scale }}
          animate={{
            x: Math.cos((fragment.angle * Math.PI) / 180) * fragment.distance,
            y: Math.sin((fragment.angle * Math.PI) / 180) * fragment.distance,
            opacity: 0,
            scale: 0.3,
          }}
          transition={{ 
            duration: 0.4, 
            ease: "easeOut"
          }}
        >
          {fragment.symbol}
        </motion.div>
      ))}
    </div>
  );
};
