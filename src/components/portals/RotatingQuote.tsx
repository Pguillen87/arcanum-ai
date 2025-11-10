import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getQuotesForOrb, type PortalQuote } from "@/data/portalQuotes";
import { cn } from "@/lib/utils";

interface RotatingQuoteProps {
  orbId: 'essencia' | 'energia' | 'protecao' | 'cosmos';
  className?: string;
}

// Hook para gerenciar rotação de frases
function useRotatingQuote(orbId: 'essencia' | 'energia' | 'protecao' | 'cosmos') {
  const quotes = useMemo(() => getQuotesForOrb(orbId), [orbId]);
  const [currentIndex, setCurrentIndex] = useState(() => {
    // Inicia com índice aleatório
    return Math.floor(Math.random() * quotes.length);
  });
  const [usedIndices, setUsedIndices] = useState<Set<number>>(new Set([currentIndex]));

  const prefersReducedMotion = typeof window !== 'undefined' 
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches 
    : false;

  useEffect(() => {
    if (quotes.length === 0) return;

    // Se todas as frases foram usadas, resetar
    if (usedIndices.size >= quotes.length) {
      setUsedIndices(new Set());
    }

    // Escolher próximo índice aleatório que não foi usado recentemente
    const getNextIndex = (): number => {
      const availableIndices = quotes
        .map((_, idx) => idx)
        .filter(idx => !usedIndices.has(idx));
      
      if (availableIndices.length === 0) {
        // Se todas foram usadas, resetar e escolher aleatório
        setUsedIndices(new Set());
        return Math.floor(Math.random() * quotes.length);
      }
      
      return availableIndices[Math.floor(Math.random() * availableIndices.length)];
    };

    // Intervalo entre 5-7 segundos
    const interval = prefersReducedMotion 
      ? 7000 
      : 5000 + Math.random() * 2000;

    const timer = setTimeout(() => {
      const nextIndex = getNextIndex();
      setCurrentIndex(nextIndex);
      setUsedIndices(prev => new Set([...prev, nextIndex]));
    }, interval);

    return () => clearTimeout(timer);
  }, [currentIndex, quotes, usedIndices, prefersReducedMotion]);

  return quotes[currentIndex] || quotes[0];
}

export const RotatingQuote = ({ orbId, className }: RotatingQuoteProps) => {
  const currentQuote = useRotatingQuote(orbId);
  const prefersReducedMotion = typeof window !== 'undefined' 
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches 
    : false;

  if (!currentQuote) return null;

  return (
    <AnimatePresence mode="wait">
      <motion.p
        key={currentQuote.id}
        initial={prefersReducedMotion ? {} : { opacity: 0, y: 10 }}
        animate={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
        exit={prefersReducedMotion ? {} : { opacity: 0, y: -10 }}
        transition={{
          duration: prefersReducedMotion ? 0 : 0.5,
          ease: "easeInOut"
        }}
        className={cn(
          "text-sm md:text-base text-muted-foreground/90 italic",
          "font-['Cinzel','Playfair_Display','serif']",
          "text-center md:text-left",
          "max-w-2xl",
          className
        )}
        style={{
          fontFamily: '"Cinzel", "Playfair Display", serif',
          fontWeight: 400,
          letterSpacing: '0.01em',
          lineHeight: '1.6',
        }}
      >
        "{currentQuote.text}"
      </motion.p>
    </AnimatePresence>
  );
};

