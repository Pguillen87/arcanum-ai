// src/components/ui/mystical/GrimoireHint.tsx
// Componente de hint informativo com ícone de grimório

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type MouseEvent } from 'react';
import { BookOpen } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { mysticalClasses } from '@/lib/mystical-theme';

type TooltipSide = 'top' | 'bottom' | 'left' | 'right';
type TooltipAlign = 'start' | 'center' | 'end';

export interface GrimoireHintProps {
  title: string;
  description: string;
  why?: string;
  examples?: string[];
  tips?: string;
  className?: string;
  side?: TooltipSide;
  align?: TooltipAlign;
  sideOffset?: number;
  collisionPadding?: number | Partial<Record<TooltipSide, number>>;
  delayDuration?: number;
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  preferredSides?: TooltipSide[];
  mobileBreakpoint?: number;
}

export function GrimoireHint({
  title,
  description,
  why,
  examples,
  tips,
  className,
  side = 'top',
  align = 'center',
  sideOffset = 8,
  collisionPadding = 16,
  delayDuration = 200,
  defaultOpen,
  open,
  onOpenChange,
  preferredSides,
  mobileBreakpoint = 768,
}: GrimoireHintProps) {
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const isControlled = open !== undefined;
  const [internalOpen, setInternalOpen] = useState(defaultOpen ?? false);
  const currentOpen = isControlled ? !!open : internalOpen;
  const [isMobile, setIsMobile] = useState(false);
  const [adaptiveSide, setAdaptiveSide] = useState<TooltipSide>(side);
  const [adaptiveAlign, setAdaptiveAlign] = useState<TooltipAlign>(align);

  const effectivePreferredSides = useMemo(() => {
    const base = preferredSides && preferredSides.length > 0
      ? preferredSides
      : [side, 'top', 'bottom', 'right', 'left'];
    return Array.from(new Set(base));
  }, [preferredSides, side]);

  useEffect(() => {
    if (!isControlled) {
      setInternalOpen(defaultOpen ?? false);
    }
  }, [defaultOpen, isControlled]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    const query = window.matchMedia(`(max-width: ${mobileBreakpoint}px)`);
    const update = () => setIsMobile(query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, [mobileBreakpoint]);

  const updatePosition = useCallback(() => {
    if (typeof window === 'undefined' || !triggerRef.current) {
      return;
    }

    const rect = triggerRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    const verticalRequirement = Math.min(320, viewportHeight * 0.6);
    const horizontalRequirement = Math.min(400, viewportWidth * 0.7);

    const hasRoom = (candidate: TooltipSide) => {
      switch (candidate) {
        case 'top':
          return rect.top >= verticalRequirement;
        case 'bottom':
          return viewportHeight - rect.bottom >= verticalRequirement;
        case 'left':
          return rect.left >= horizontalRequirement;
        case 'right':
          return viewportWidth - rect.right >= horizontalRequirement;
        default:
          return false;
      }
    };

    const computedSide =
      effectivePreferredSides.find(hasRoom) ??
      effectivePreferredSides[effectivePreferredSides.length - 1] ??
      side;

    let computedAlign: TooltipAlign = 'center';
    if (computedSide === 'top' || computedSide === 'bottom') {
      const leftSpace = rect.left;
      const rightSpace = viewportWidth - rect.right;
      if (leftSpace < 120) {
        computedAlign = 'start';
      } else if (rightSpace < 120) {
        computedAlign = 'end';
      }
    } else {
      const topSpace = rect.top;
      const bottomSpace = viewportHeight - rect.bottom;
      if (topSpace < 120) {
        computedAlign = 'start';
      } else if (bottomSpace < 120) {
        computedAlign = 'end';
      }
    }

    setAdaptiveSide(computedSide);
    setAdaptiveAlign(computedAlign);
  }, [effectivePreferredSides, side]);

  useLayoutEffect(() => {
    setAdaptiveSide(side);
  }, [side]);

  useLayoutEffect(() => {
    setAdaptiveAlign(align);
  }, [align]);

  useLayoutEffect(() => {
    if (currentOpen) {
      updatePosition();
    }
  }, [currentOpen, updatePosition]);

  useEffect(() => {
    if (!currentOpen || typeof window === 'undefined') {
      return;
    }

    const handleReposition = () => updatePosition();
    window.addEventListener('resize', handleReposition);
    window.addEventListener('scroll', handleReposition, true);

    return () => {
      window.removeEventListener('resize', handleReposition);
      window.removeEventListener('scroll', handleReposition, true);
    };
  }, [currentOpen, updatePosition]);

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!isControlled) {
        setInternalOpen(nextOpen);
      }
      if (nextOpen) {
        updatePosition();
      }
      onOpenChange?.(nextOpen);
    },
    [isControlled, onOpenChange, updatePosition],
  );

  const handleTriggerClick = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      if (!isMobile) return;
      event.preventDefault();
      event.stopPropagation();
      handleOpenChange(!currentOpen);
    },
    [currentOpen, handleOpenChange, isMobile],
  );

  const resolvedCollisionPadding =
    typeof collisionPadding === 'number'
      ? Math.max(collisionPadding, isMobile ? 20 : 16)
      : collisionPadding;

  const resolvedSideOffset = isMobile ? Math.max(sideOffset, 6) : sideOffset;
  const resolvedMaxWidth = isMobile ? 'min(90vw, 24rem)' : '32rem';

  return (
    <TooltipProvider delayDuration={delayDuration}>
      <Tooltip
        disableHoverableContent={isMobile}
        open={currentOpen}
        onOpenChange={handleOpenChange}
      >
        <TooltipTrigger asChild>
          <button
            type="button"
            className={cn(
              'inline-flex items-center justify-center',
              'text-mystical-cosmic hover:text-mystical-gold',
              'transition-colors duration-200',
              'focus:outline-none focus:ring-2 focus:ring-mystical-gold focus:ring-offset-2 rounded',
              mysticalClasses.glow.cosmic,
              'cursor-help',
              className
            )}
            aria-label={`Informações sobre ${title}`}
            aria-expanded={currentOpen}
            ref={triggerRef}
            onClick={handleTriggerClick}
          >
            <BookOpen className="w-4 h-4" />
          </button>
        </TooltipTrigger>
        <TooltipContent
          side={adaptiveSide}
          align={adaptiveAlign}
          sideOffset={resolvedSideOffset}
          avoidCollisions
          collisionPadding={resolvedCollisionPadding}
          className={cn(
            'max-w-lg p-4',
            'bg-gradient-to-br from-mystical-deep via-mystical-deep to-mystical-deep/95',
            'border-2 border-mystical-gold/50',
            'shadow-mystical-glow',
            'z-50',
            'break-words'
          )}
          style={{ wordBreak: 'break-word', overflowWrap: 'anywhere', maxWidth: resolvedMaxWidth }}
        >
          <div className="space-y-3 text-sm">
            {/* Título */}
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-mystical-gold flex-shrink-0" />
              <h4 className="font-semibold text-mystical-gold break-words">{title}</h4>
            </div>

            {/* Descrição */}
            <p className="text-foreground leading-relaxed break-words">{description}</p>

            {/* Por que */}
            {why && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-mystical-lilac">💡 Por que isso importa:</p>
                <p className="text-muted-foreground text-xs leading-relaxed break-words">{why}</p>
              </div>
            )}

            {/* Exemplos */}
            {examples && examples.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-mystical-cosmic">✨ Exemplos:</p>
                <ul className="space-y-1.5 list-disc list-inside text-muted-foreground text-xs">
                  {examples.map((example, index) => (
                    <li key={index} className="leading-relaxed break-words">{example}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Dicas */}
            {tips && (
              <div className="pt-2 border-t border-mystical-gold/20">
                <p className="text-xs font-medium text-mystical-gold">📚 Dica:</p>
                <p className="text-muted-foreground text-xs leading-relaxed mt-1 break-words">{tips}</p>
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}


