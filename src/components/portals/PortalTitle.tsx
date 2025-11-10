import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { orbs } from "@/data/orbs";

interface PortalTitleProps {
  title: string;
  orbId?: string;
  className?: string;
}

export const PortalTitle = ({ title, orbId, className }: PortalTitleProps) => {
  const orb = orbId ? orbs.find(o => o.id === orbId) : null;
  const prefersReducedMotion = typeof window !== 'undefined' 
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches 
    : false;

  return (
    <div className={cn("flex items-center gap-3 md:gap-4", className)}>
      {/* Símbolo místico decorativo à esquerda */}
      <motion.div
        className="relative flex-shrink-0"
        animate={prefersReducedMotion ? {} : {
          rotate: [0, 360],
        }}
        transition={{
          duration: prefersReducedMotion ? 0 : 20,
          repeat: Infinity,
          ease: "linear"
        }}
      >
        <div 
          className="w-2 h-2 md:w-3 md:h-3 rounded-full"
          style={{
            background: orb 
              ? `radial-gradient(circle, hsl(${orb.gradientColors.primary}) 0%, hsl(${orb.gradientColors.secondary}) 100%)`
              : 'radial-gradient(circle, hsl(270 70% 60%) 0%, hsl(45 90% 60%) 100%)',
            boxShadow: orb
              ? `0 0 12px hsl(${orb.gradientColors.primary} / 0.8), 0 0 24px hsl(${orb.gradientColors.secondary} / 0.4)`
              : '0 0 12px hsl(270 70% 60% / 0.8), 0 0 24px hsl(45 90% 60% / 0.4)',
          }}
        />
        {/* Partículas orbitando */}
        {!prefersReducedMotion && (
          <>
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 rounded-full"
                style={{
                  width: '3px',
                  height: '3px',
                  top: '50%',
                  left: '50%',
                  background: orb
                    ? `hsl(${orb.gradientColors.primary})`
                    : 'hsl(270 70% 60%)',
                }}
                animate={{
                  rotate: [0, 360],
                  x: [
                    0,
                    Math.cos((i * 120) * Math.PI / 180) * 8,
                    Math.cos((i * 120 + 360) * Math.PI / 180) * 8,
                  ],
                  y: [
                    0,
                    Math.sin((i * 120) * Math.PI / 180) * 8,
                    Math.sin((i * 120 + 360) * Math.PI / 180) * 8,
                  ],
                  opacity: [0.3, 0.8, 0.3],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: i * 0.2,
                }}
              />
            ))}
          </>
        )}
      </motion.div>

      {/* Título com estilo místico */}
      <motion.h1
        className={cn(
          "text-xl md:text-3xl lg:text-4xl font-bold bg-clip-text text-transparent",
          "font-['Cinzel','Playfair_Display','serif']",
          "relative"
        )}
        style={{
          fontFamily: '"Cinzel", "Playfair Display", serif',
          fontWeight: 700,
          letterSpacing: '0.02em',
          background: orb
            ? `linear-gradient(135deg, hsl(${orb.gradientColors.primary}) 0%, hsl(${orb.gradientColors.secondary}) 100%)`
            : 'linear-gradient(135deg, hsl(270 70% 60%) 0%, hsl(45 90% 60%) 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          textShadow: orb
            ? `0 2px 8px hsl(${orb.gradientColors.primary} / 0.3), 0 4px 16px hsl(${orb.gradientColors.secondary} / 0.2)`
            : '0 2px 8px hsl(270 70% 60% / 0.3), 0 4px 16px hsl(45 90% 60% / 0.2)',
        }}
        initial={prefersReducedMotion ? {} : { opacity: 0, x: -10 }}
        animate={prefersReducedMotion ? {} : { opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        {title}
        {/* Brilho sutil no texto */}
        <motion.span
          className="absolute inset-0 blur-sm opacity-30"
          style={{
            background: orb
              ? `linear-gradient(135deg, hsl(${orb.gradientColors.primary}) 0%, hsl(${orb.gradientColors.secondary}) 100%)`
              : 'linear-gradient(135deg, hsl(270 70% 60%) 0%, hsl(45 90% 60%) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
          animate={prefersReducedMotion ? {} : {
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: prefersReducedMotion ? 0 : 3,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          {title}
        </motion.span>
      </motion.h1>

      {/* Símbolo místico decorativo à direita */}
      <motion.div
        className="relative flex-shrink-0"
        animate={prefersReducedMotion ? {} : {
          rotate: [360, 0],
        }}
        transition={{
          duration: prefersReducedMotion ? 0 : 20,
          repeat: Infinity,
          ease: "linear"
        }}
      >
        <div 
          className="w-2 h-2 md:w-3 md:h-3 rounded-full"
          style={{
            background: orb 
              ? `radial-gradient(circle, hsl(${orb.gradientColors.secondary}) 0%, hsl(${orb.gradientColors.primary}) 100%)`
              : 'radial-gradient(circle, hsl(45 90% 60%) 0%, hsl(270 70% 60%) 100%)',
            boxShadow: orb
              ? `0 0 12px hsl(${orb.gradientColors.secondary} / 0.8), 0 0 24px hsl(${orb.gradientColors.primary} / 0.4)`
              : '0 0 12px hsl(45 90% 60% / 0.8), 0 0 24px hsl(270 70% 60% / 0.4)',
          }}
        />
      </motion.div>
    </div>
  );
};

