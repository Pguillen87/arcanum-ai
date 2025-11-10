import { useI18n } from "@/contexts/I18nContext";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Sparkles, Stars, Wand2 } from "lucide-react";
import { useState } from "react";

interface CosmicLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'text-4xl md:text-5xl',
  md: 'text-6xl md:text-7xl',
  lg: 'text-7xl md:text-8xl lg:text-9xl',
};

export const CosmicLogo = ({ className, size = 'md' }: CosmicLogoProps) => {
  const { locale } = useI18n();
  const [isHovered, setIsHovered] = useState(false);
  const prefersReducedMotion = typeof window !== 'undefined' 
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches 
    : false;
  
  return (
    <motion.div
      className={cn("relative inline-block", className)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Glow de fundo intensificado no hover */}
      <motion.div
        className="absolute inset-0 blur-3xl -z-10"
        style={{
          background: 'radial-gradient(circle, hsl(var(--ray-violet) / 0.5) 0%, hsl(var(--ray-gold) / 0.3) 50%, transparent 80%)',
        }}
        animate={prefersReducedMotion ? {} : {
          opacity: isHovered ? [0.6, 0.9, 0.6] : [0.2, 0.4, 0.2],
          scale: isHovered ? [1, 1.3, 1] : [0.9, 1.1, 0.9],
        }}
        transition={{
          duration: prefersReducedMotion ? 0 : 2.5,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />

      {/* Container do logo */}
      <div className="relative flex items-center justify-center gap-3 md:gap-4 lg:gap-5">
        {/* Símbolo místico à esquerda - Portal com runas */}
        <motion.div
          className="relative"
          animate={prefersReducedMotion ? {} : {
            rotate: isHovered ? [0, 360] : 0,
            scale: isHovered ? [1, 1.15, 1] : 1,
          }}
          transition={{
            duration: prefersReducedMotion ? 0 : 4,
            repeat: isHovered ? Infinity : 0,
            ease: "linear"
          }}
        >
          {/* Círculo místico com runas */}
          <div className="relative w-14 h-14 md:w-16 md:h-16 lg:w-20 lg:h-20">
            {/* Círculo externo pulsante com múltiplas camadas */}
            <motion.div
              className="absolute inset-0 rounded-full border-2"
              style={{
                borderColor: 'hsl(var(--ray-violet) / 0.6)',
                boxShadow: '0 0 30px hsl(var(--ray-violet) / 0.4), 0 0 50px hsl(var(--ray-gold) / 0.2)',
              }}
              animate={prefersReducedMotion ? {} : {
                scale: [1, 1.15, 1],
                opacity: [0.6, 0.9, 0.6],
                rotate: [0, 180, 360],
              }}
              transition={{
                duration: prefersReducedMotion ? 0 : 3,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
            {/* Círculo interno com gradiente animado */}
            <motion.div
              className="absolute inset-3 rounded-full"
              style={{
                background: 'radial-gradient(circle, hsl(var(--ray-violet) / 0.4) 0%, hsl(var(--ray-gold) / 0.2) 50%, transparent 80%)',
                boxShadow: 'inset 0 0 30px hsl(var(--ray-violet) / 0.3), inset 0 0 50px hsl(var(--ray-gold) / 0.15)',
              }}
              animate={prefersReducedMotion ? {} : {
                opacity: [0.4, 0.7, 0.4],
                scale: [1, 1.1, 1],
              }}
              transition={{
                duration: prefersReducedMotion ? 0 : 2.5,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
            {/* Símbolo central - Sparkles com brilho */}
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.div
                animate={prefersReducedMotion ? {} : {
                  rotate: [0, 360],
                  scale: [1, 1.2, 1],
                }}
                transition={{
                  duration: prefersReducedMotion ? 0 : 4,
                  repeat: Infinity,
                  ease: "linear"
                }}
              >
                <Sparkles className="w-7 h-7 md:w-9 md:h-9 lg:w-12 lg:h-12 text-primary" style={{ filter: 'drop-shadow(0 0 10px hsl(var(--ray-violet)))' }} />
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Texto do logo com múltiplas camadas para contraste */}
        <h1 
          className={cn(
            'font-bold mb-0 animate-fade-in relative',
            sizeClasses[size],
            'font-["Cinzel","Playfair_Display","serif"]',
            className
          )}
          style={{
            fontFamily: '"Cinzel", "Playfair Display", serif',
            fontWeight: 700,
            letterSpacing: '0.05em',
            textShadow: `
              0 0 10px hsl(var(--ray-violet) / 0.4),
              0 0 20px hsl(var(--ray-violet) / 0.3),
              0 2px 4px hsl(0 0% 0% / 0.6)
            `,
          }}
        >
          {/* Camada de sombra para contraste - reduzida */}
          <span 
            className="absolute inset-0 bg-gradient-cosmic bg-clip-text text-transparent blur-sm opacity-30"
            aria-hidden="true"
          >
            {t('app.title', locale)}
          </span>
          
          {/* Texto principal com gradiente vibrante - brilho mais sutil */}
          <motion.span 
            className="relative bg-clip-text text-transparent animate-shine inline-block"
            style={{
              background: 'linear-gradient(to right, hsl(var(--ray-violet) / 0.9) 0%, hsl(var(--ray-gold) / 0.9) 50%, hsl(var(--ray-violet) / 0.9) 100%)',
              backgroundSize: '200% 100%',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              filter: 'drop-shadow(0 0 4px hsl(var(--ray-violet) / 0.5)) drop-shadow(0 0 8px hsl(var(--ray-gold) / 0.3))',
            }}
            aria-label={t('app.title', locale)}
            animate={prefersReducedMotion ? {} : {
              backgroundPosition: isHovered ? ['0%', '100%', '0%'] : ['0%', '50%', '0%'],
              filter: isHovered 
                ? 'drop-shadow(0 0 6px hsl(var(--ray-violet) / 0.6)) drop-shadow(0 0 12px hsl(var(--ray-gold) / 0.4)) brightness(1.15)'
                : 'drop-shadow(0 0 4px hsl(var(--ray-violet) / 0.5)) drop-shadow(0 0 8px hsl(var(--ray-gold) / 0.3)) brightness(1)',
            }}
            transition={{ 
              duration: prefersReducedMotion ? 0 : 3,
              repeat: Infinity,
              ease: "linear"
            }}
          >
            {t('app.title', locale)}
          </motion.span>
          
          {/* Partículas orbitando no hover */}
          {!prefersReducedMotion && isHovered && (
            <>
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-1.5 h-1.5 rounded-full"
                  style={{
                    width: '6px',
                    height: '6px',
                    top: '50%',
                    left: '50%',
                    background: i % 2 === 0 
                      ? 'hsl(var(--ray-violet))' 
                      : 'hsl(var(--ray-gold))',
                    boxShadow: `0 0 10px ${i % 2 === 0 ? 'hsl(var(--ray-violet))' : 'hsl(var(--ray-gold))'}`,
                  }}
                  animate={{
                    rotate: [0, 360],
                    x: [
                      0,
                      Math.cos((i * 60) * Math.PI / 180) * 80,
                      Math.cos((i * 60 + 360) * Math.PI / 180) * 80,
                    ],
                    y: [
                      0,
                      Math.sin((i * 60) * Math.PI / 180) * 80,
                      Math.sin((i * 60 + 360) * Math.PI / 180) * 80,
                    ],
                    opacity: [0, 1, 0.8, 0],
                    scale: [0, 1, 1.2, 0],
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: i * 0.2,
                  }}
                />
              ))}
            </>
          )}
        </h1>

        {/* Símbolo místico à direita - Estrelas com varinha */}
        <motion.div
          className="relative flex items-center gap-1"
          animate={prefersReducedMotion ? {} : {
            rotate: isHovered ? [0, -360] : 0,
            scale: isHovered ? [1, 1.15, 1] : 1,
          }}
          transition={{
            duration: prefersReducedMotion ? 0 : 4,
            repeat: isHovered ? Infinity : 0,
            ease: "linear"
          }}
        >
          <Stars className="w-8 h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 text-primary/70" style={{ filter: 'drop-shadow(0 0 8px hsl(var(--ray-violet)))' }} />
          <motion.div
            animate={prefersReducedMotion ? {} : {
              rotate: [0, 15, -15, 0],
            }}
            transition={{
              duration: prefersReducedMotion ? 0 : 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <Wand2 className="w-6 h-6 md:w-7 md:h-7 lg:w-8 lg:h-8 text-primary/60" />
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  );
};

