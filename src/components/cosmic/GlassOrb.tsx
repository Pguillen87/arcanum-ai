import { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { RuneIcon } from "@/components/cosmic/RuneIcon";
import { useState, memo } from "react";

interface GlassOrbProps {
  icon: LucideIcon;
  label: string;
  description: string;
  color: 'primary' | 'secondary';
  onClick: () => void;
  isSelected?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const GlassOrb = memo(({
  icon,
  label,
  description,
  color,
  onClick,
  isSelected = false,
  size = 'md',
}: GlassOrbProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const prefersReducedMotion = typeof window !== 'undefined' 
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches 
    : false;

  return (
    <motion.button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        "relative transition-all duration-300",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        "focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        size === 'sm' ? "w-12 h-12" : "w-full aspect-square",
        isSelected && size !== 'sm' && "scale-110 -translate-y-2"
      )}
      animate={{
        scale: isSelected ? 1.1 : isHovered ? 1.05 : 1,
      }}
      transition={{ 
        duration: prefersReducedMotion ? 0 : 0.3,
        ease: "easeOut"
      }}
      aria-label={`Abrir Portal de ${label}`}
      whileHover={prefersReducedMotion ? {} : {
        scale: 1.05,
      }}
      whileTap={prefersReducedMotion ? {} : {
        scale: 0.95,
      }}
    >
      <div className="relative h-full flex items-center justify-center">
        {/* Luz de fundo intensificada no hover/focus */}
        <motion.div
          className="absolute inset-0 rounded-full blur-3xl -z-10"
          style={{
            background: color === 'primary'
              ? `radial-gradient(circle at 50% 50%, hsl(var(--orb-primary, var(--primary)) / 0.7) 0%, transparent 70%)`
              : `radial-gradient(circle at 50% 50%, hsl(var(--orb-secondary, var(--secondary)) / 0.7) 0%, transparent 70%)`,
          }}
          animate={prefersReducedMotion ? {} : {
            opacity: isHovered || isSelected ? [0.5, 0.8, 0.5] : 0,
            scale: isHovered || isSelected ? [1, 1.3, 1] : 0.8,
          }}
          transition={{
            duration: prefersReducedMotion ? 0 : 2,
            repeat: isHovered || isSelected ? Infinity : 0,
            ease: "easeInOut"
          }}
        />

        {/* Glowing background com pulsação contínua */}
        <motion.div
          className={cn(
            "absolute inset-0 rounded-full blur-2xl opacity-40"
          )}
          style={{
            background: `radial-gradient(circle at 50% 50%, color-mix(in srgb, var(--orb-primary, hsl(var(--primary))) 40%, transparent) 0%, transparent 70%)`,
          }}
          animate={prefersReducedMotion ? {} : {
            opacity: isSelected || isHovered ? [0.4, 0.6, 0.4] : [0.3, 0.5, 0.3],
            scale: isSelected || isHovered ? [1, 1.1, 1] : [1, 1.05, 1],
          }}
          transition={{
            duration: prefersReducedMotion ? 0 : 3,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />

        {/* Partículas orbitando (apenas se hover e não reduced motion) */}
        {!prefersReducedMotion && isHovered && (
          <>
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 rounded-full bg-primary/60"
                style={{
                  width: '4px',
                  height: '4px',
                }}
                animate={{
                  rotate: [0, 360],
                  x: [
                    Math.cos((i * 120) * Math.PI / 180) * 30,
                    Math.cos((i * 120 + 360) * Math.PI / 180) * 30,
                  ],
                  y: [
                    Math.sin((i * 120) * Math.PI / 180) * 30,
                    Math.sin((i * 120 + 360) * Math.PI / 180) * 30,
                  ],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "linear"
                }}
              />
            ))}
          </>
        )}

        {/* Glass orb container com múltiplas camadas */}
        <div className={cn(
          "relative rounded-full w-full h-full flex items-center justify-center overflow-hidden",
          size === 'sm' ? "p-2" : size === 'lg' ? "p-6 md:p-10" : "p-4 md:p-8"
        )}>
          {/* Camada de vidro base */}
          <div className="absolute inset-0 glass-cosmic rounded-full" />
          
          {/* Camada de brilho interno */}
          <motion.div 
            className={cn(
              "absolute inset-[2px] rounded-full opacity-30",
              "bg-gradient-to-br from-white/20 via-transparent to-transparent"
            )}
            animate={prefersReducedMotion ? {} : {
              opacity: isHovered ? [0.3, 0.5, 0.3] : 0.3,
            }}
            transition={{
              duration: prefersReducedMotion ? 0 : 2,
              repeat: isHovered ? Infinity : 0,
            }}
          />
          
          {/* Glow sem borda visível - apenas box-shadow */}
          <motion.div 
            className="absolute inset-0 rounded-full"
            style={{
              boxShadow: isHovered || isSelected
                ? color === 'primary'
                  ? `0 0 40px hsl(var(--orb-primary, var(--primary)) / 0.6), 0 0 60px hsl(var(--orb-primary, var(--primary)) / 0.4), 0 0 80px hsl(var(--orb-primary, var(--primary)) / 0.2)`
                  : `0 0 40px hsl(var(--orb-secondary, var(--secondary)) / 0.6), 0 0 60px hsl(var(--orb-secondary, var(--secondary)) / 0.4), 0 0 80px hsl(var(--orb-secondary, var(--secondary)) / 0.2)`
                : color === 'primary'
                  ? `0 0 20px hsl(var(--orb-primary, var(--primary)) / 0.2)`
                  : `0 0 20px hsl(var(--orb-secondary, var(--secondary)) / 0.2)`,
            }}
            animate={prefersReducedMotion ? {} : {
              boxShadow: isHovered || isSelected
                ? color === 'primary'
                  ? `0 0 40px hsl(var(--orb-primary, var(--primary)) / 0.6), 0 0 60px hsl(var(--orb-primary, var(--primary)) / 0.4), 0 0 80px hsl(var(--orb-primary, var(--primary)) / 0.2)`
                  : `0 0 40px hsl(var(--orb-secondary, var(--secondary)) / 0.6), 0 0 60px hsl(var(--orb-secondary, var(--secondary)) / 0.4), 0 0 80px hsl(var(--orb-secondary, var(--secondary)) / 0.2)`
                : color === 'primary'
                  ? `0 0 20px hsl(var(--orb-primary, var(--primary)) / 0.2)`
                  : `0 0 20px hsl(var(--orb-secondary, var(--secondary)) / 0.2)`,
            }}
            transition={{ duration: 0.3 }}
          />

          {/* Conteúdo */}
          <div className={cn(
            "relative flex flex-col items-center z-10",
            size === 'sm' ? "gap-1" : size === 'lg' ? "gap-3 md:gap-4" : "gap-2 md:gap-3"
          )}>
            <RuneIcon 
              icon={icon} 
              size={size === 'sm' ? 'sm' : size === 'lg' ? 'lg' : 'md'} 
              animated={!prefersReducedMotion && isHovered} 
              className={size === 'sm' ? "mb-0" : "mb-2"}
            />
            {size !== 'sm' && (
              <div className="text-center">
                <h3 className={cn(
                  "font-bold transition-colors",
                  size === 'lg' ? "text-lg md:text-xl" : "text-sm md:text-lg",
                  color === 'primary' ? "text-primary" : "text-secondary"
                )}>
                  {label}
                </h3>
                <p className={cn(
                  "text-muted-foreground",
                  size === 'lg' ? "text-sm md:text-base" : "text-xs md:text-sm"
                )}>
                  {description}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.button>
  );
});

GlassOrb.displayName = 'GlassOrb';

