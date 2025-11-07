import { motion } from "framer-motion";
import { useMemo } from "react";

const MYSTICAL_SYMBOLS = ["ᚠ", "ᚢ", "ᚦ", "ᚨ", "ᚱ", "ᚲ", "ᚷ", "ᚹ", "ᚺ", "ᚾ", "✦", "✧", "✨", "◈", "◇", "⬡", "⬢"];

interface FloatingRunesProps {
  count?: number;
}

export const FloatingRunes = ({ count = 20 }: FloatingRunesProps) => {
  const runes = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        symbol: MYSTICAL_SYMBOLS[Math.floor(Math.random() * MYSTICAL_SYMBOLS.length)],
        x: Math.random() * 100,
        y: Math.random() * 100,
        duration: 20 + Math.random() * 30,
        delay: Math.random() * 5,
        size: 1 + Math.random() * 2,
      })),
    [count]
  );

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-10 dark:opacity-20 z-0">
      {runes.map((rune) => (
        <motion.div
          key={rune.id}
          className="absolute text-primary font-bold"
          style={{
            left: `${rune.x}%`,
            top: `${rune.y}%`,
            fontSize: `${rune.size}rem`,
          }}
          animate={{
            y: [0, -100, 0],
            x: [0, Math.sin(rune.id) * 50, 0],
            rotate: [0, 360],
            opacity: [0.1, 0.3, 0.1],
          }}
          transition={{
            duration: rune.duration,
            delay: rune.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          {rune.symbol}
        </motion.div>
      ))}
    </div>
  );
};
