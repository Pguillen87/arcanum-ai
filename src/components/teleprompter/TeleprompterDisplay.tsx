// src/components/teleprompter/TeleprompterDisplay.tsx
// Componente principal de exibição do teleprompter

import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { mysticalClasses } from '@/lib/mystical-theme';

export interface TeleprompterDisplayProps {
  text: string;
  scrollSpeed: number; // 0-100
  fontSize: number; // 12-72
  textColor: string;
  backgroundColor: string;
  mirrorMode: boolean;
  isPaused: boolean;
  onScroll?: (position: number) => void;
  className?: string;
}

export function TeleprompterDisplay({
  text,
  scrollSpeed,
  fontSize,
  textColor,
  backgroundColor,
  mirrorMode,
  isPaused,
  onScroll,
  className,
}: TeleprompterDisplayProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollPosition, setScrollPosition] = useState(0);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    if (isPaused || scrollSpeed === 0) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      return;
    }

    const scroll = () => {
      if (!containerRef.current) return;

      const container = containerRef.current;
      const maxScroll = container.scrollHeight - container.clientHeight;
      
      if (maxScroll <= 0) return;

      // Velocidade baseada em scrollSpeed (0-100)
      // scrollSpeed 50 = velocidade média
      const speedMultiplier = scrollSpeed / 50;
      const pixelsPerFrame = 0.5 * speedMultiplier;

      setScrollPosition((prev) => {
        const newPosition = Math.min(prev + pixelsPerFrame, maxScroll);
        
        container.scrollTop = newPosition;
        onScroll?.(newPosition);
        
        if (newPosition >= maxScroll) {
          // Chegou ao fim, pausar
          return maxScroll;
        }
        
        return newPosition;
      });

      animationRef.current = requestAnimationFrame(scroll);
    };

    animationRef.current = requestAnimationFrame(scroll);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    };
  }, [scrollSpeed, isPaused, onScroll]);

  // Reset scroll quando texto mudar
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
      setScrollPosition(0);
    }
  }, [text]);

  return (
    <div
      ref={containerRef}
      className={cn(
        'w-full h-full overflow-y-auto',
        'transition-all duration-300',
        mirrorMode && 'transform scale-x-[-1]',
        mysticalClasses.shadows['mystical-glow'],
        className
      )}
      style={{
        backgroundColor,
        scrollBehavior: 'smooth',
      }}
    >
      <div
        className={cn(
          'px-8 py-16',
          'select-none',
          'leading-relaxed',
          mysticalClasses.animation.float
        )}
        style={{
          fontSize: `${fontSize}px`,
          color: textColor,
          transform: mirrorMode ? 'scaleX(-1)' : 'none',
        }}
      >
        {text.split('\n').map((line, index) => (
          <p key={index} className="mb-4">
            {line || '\u00A0'}
          </p>
        ))}
      </div>
    </div>
  );
}

