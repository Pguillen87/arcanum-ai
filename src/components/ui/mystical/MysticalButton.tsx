// src/components/ui/mystical/MysticalButton.tsx
// Botão com visual místico e efeitos especiais

import { Button, ButtonProps } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { mysticalClasses, getInteractionAnimation } from '@/lib/mystical-theme';
import { forwardRef } from 'react';

type MysticalVariant = 'gold' | 'lilac' | 'cosmic' | 'portal';

interface MysticalButtonProps extends Omit<ButtonProps, 'variant'> {
  variant?: MysticalVariant;
  mystical?: boolean;
  showParticles?: boolean;
}

export const MysticalButton = forwardRef<HTMLButtonElement, MysticalButtonProps>(
  ({ 
    variant = 'gold', 
    mystical = true, 
    showParticles = false,
    className,
    children,
    ...props 
  }, ref) => {
    const variantClasses = {
      gold: 'bg-mystical-gold text-mystical-deep hover:bg-mystical-gold-light',
      lilac: 'bg-mystical-lilac text-white hover:bg-mystical-lilac-light',
      cosmic: 'bg-mystical-cosmic text-white hover:bg-mystical-cosmic-light',
      portal: 'bg-gradient-to-r from-mystical-lilac to-mystical-gold text-white',
    };

    const glowClasses = {
      gold: mysticalClasses.glow.gold,
      lilac: mysticalClasses.glow.lilac,
      cosmic: mysticalClasses.glow.cosmic,
      portal: mysticalClasses.glow.combined,
    };

    return (
      <Button
        ref={ref}
        className={cn(
          mystical && variantClasses[variant],
          mystical && glowClasses[variant],
          mystical && getInteractionAnimation('hover'),
          mystical && getInteractionAnimation('click'),
          'relative overflow-hidden',
          className
        )}
        {...props}
      >
        {showParticles && mystical && (
          <div className="absolute inset-0 opacity-30">
            <div className="absolute top-1/2 left-1/2 w-2 h-2 bg-white rounded-full animate-ping" />
            <div className="absolute top-1/3 left-1/3 w-1 h-1 bg-white rounded-full animate-pulse" />
            <div className="absolute bottom-1/3 right-1/3 w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
          </div>
        )}
        <span className="relative z-10">{children}</span>
      </Button>
    );
  }
);

MysticalButton.displayName = 'MysticalButton';

