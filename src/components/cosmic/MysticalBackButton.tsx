import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, forwardRef } from "react";
import React from "react";

interface MysticalBackButtonProps {
  onClick: () => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'portal' | 'modal' | 'default';
  ariaLabel?: string;
}

const sizeClasses = {
  sm: 'w-8 h-8',
  md: 'w-10 h-10 md:w-12 md:h-12',
  lg: 'w-14 h-14 md:w-16 md:h-16',
};

const iconSizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-5 h-5 md:w-6 md:h-6',
  lg: 'w-7 h-7 md:w-8 md:h-8',
};

export const MysticalBackButton = forwardRef<HTMLButtonElement, MysticalBackButtonProps>(({
  onClick,
  className,
  size = 'md',
  variant = 'default',
  ariaLabel = 'Voltar ao Portal Principal',
}, ref) => {
  const [isHovered, setIsHovered] = useState(false);
  const prefersReducedMotion = typeof window !== 'undefined' 
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches 
    : false;

  return (
    <motion.button
      ref={ref}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        "group relative rounded-full",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        "focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        sizeClasses[size],
        className
      )}
      aria-label={ariaLabel}
      whileHover={prefersReducedMotion ? {} : {
        scale: 1.1,
      }}
      whileTap={prefersReducedMotion ? {} : {
        scale: 0.9,
      }}
    >
      {/* Glow de fundo pulsante */}
      <motion.div
        className="absolute inset-0 rounded-full blur-xl -z-10"
        style={{
          background: 'radial-gradient(circle, hsl(270 70% 60% / 0.5) 0%, hsl(45 90% 60% / 0.3) 50%, transparent 70%)',
        }}
        animate={prefersReducedMotion ? {} : {
          opacity: isHovered ? [0.5, 0.8, 0.5] : [0.2, 0.4, 0.2],
          scale: isHovered ? [1, 1.3, 1] : [0.9, 1.1, 0.9],
        }}
        transition={{
          duration: prefersReducedMotion ? 0 : 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />

      {/* Círculo principal com glassmorphism */}
      <div className={cn(
        "relative w-full h-full rounded-full",
        "backdrop-blur-xl border",
        variant === 'portal' 
          ? "border-white/20 bg-black/30 group-hover:border-white/40"
          : variant === 'modal'
          ? "border-primary/30 bg-background/50 group-hover:border-primary/50"
          : "border-white/20 bg-black/30 group-hover:border-white/40",
        "transition-all duration-300",
        "group-hover:shadow-lg"
      )}>
        {/* Brilho interno */}
        <motion.div
          className="absolute inset-[2px] rounded-full opacity-30"
          style={{
            background: 'radial-gradient(ellipse at top, hsl(270 70% 60% / 0.4) 0%, transparent 70%)',
          }}
          animate={prefersReducedMotion ? {} : {
            opacity: isHovered ? [0.3, 0.5, 0.3] : 0.3,
          }}
          transition={{
            duration: prefersReducedMotion ? 0 : 2,
            repeat: isHovered ? Infinity : 0,
          }}
        />

        {/* Ícone ArrowLeft com animação de deslizamento */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          animate={prefersReducedMotion ? {} : {
            x: isHovered ? [-2, 0, -2] : 0,
          }}
          transition={{
            duration: prefersReducedMotion ? 0 : 0.3,
            ease: "easeInOut"
          }}
        >
          <ArrowLeft 
            className={cn(
              iconSizeClasses[size],
              variant === 'portal' 
                ? "text-white group-hover:text-purple-300"
                : variant === 'modal'
                ? "text-foreground group-hover:text-primary"
                : "text-white group-hover:text-purple-300",
              "transition-colors duration-300"
            )} 
          />
        </motion.div>

        {/* Partículas orbitando no hover */}
        {!prefersReducedMotion && isHovered && (
          <>
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 rounded-full bg-primary/60"
                style={{
                  width: '4px',
                  height: '4px',
                  top: '50%',
                  left: '50%',
                }}
                animate={{
                  rotate: [0, 360],
                  x: [
                    0,
                    Math.cos((i * 120) * Math.PI / 180) * 20,
                    Math.cos((i * 120 + 360) * Math.PI / 180) * 20,
                  ],
                  y: [
                    0,
                    Math.sin((i * 120) * Math.PI / 180) * 20,
                    Math.sin((i * 120 + 360) * Math.PI / 180) * 20,
                  ],
                  opacity: [0, 1, 0],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: i * 0.2,
                }}
              />
            ))}
          </>
        )}
      </div>
    </motion.button>
  );
});

MysticalBackButton.displayName = 'MysticalBackButton';

