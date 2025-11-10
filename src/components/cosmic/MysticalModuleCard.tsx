import { LucideIcon } from "lucide-react";
import { ReactNode, memo, isValidElement } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface MysticalModuleCardProps {
  title: string;
  subtitle: string;
  icon: LucideIcon | ReactNode;
  colors: { primary: string; secondary: string };
  onClick: () => void;
  description?: string;
}

export const MysticalModuleCard = memo(({
  title,
  subtitle,
  icon,
  colors,
  onClick,
  description,
}: MysticalModuleCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const prefersReducedMotion = typeof window !== 'undefined' 
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches 
    : false;

  // Validação e fallbacks
  const validTitle = title || 'Módulo Místico';
  const validSubtitle = subtitle || '';
  const validColors = colors && colors.primary && colors.secondary 
    ? colors 
    : { primary: '#a855f7', secondary: '#ec4899' }; // Fallback roxo padrão
  
  // Renderizar ícone de forma segura
  const renderIcon = () => {
    if (!icon) {
      return (
        <div className="w-full h-full flex items-center justify-center text-4xl">✨</div>
      );
    }
    
    // Se icon é uma função (componente React), renderizar como componente
    if (typeof icon === 'function') {
      const IconComponent = icon as LucideIcon;
      return <IconComponent className="w-full h-full" />;
    }
    
    // Se icon é um ReactNode válido (elemento React já criado), renderizar diretamente
    if (typeof icon === 'object' && icon !== null) {
      // Verificar se é um elemento React válido usando isValidElement
      if (isValidElement(icon)) {
        return icon as ReactNode;
      }
    }
    
    // Fallback padrão
    return (
      <div className="w-full h-full flex items-center justify-center text-4xl">✨</div>
    );
  };

  return (
    <motion.button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        "relative w-full h-full min-h-[200px] rounded-2xl overflow-hidden",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        "focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "transition-all duration-300"
      )}
      animate={prefersReducedMotion ? {} : {
        y: isHovered ? -8 : 0,
        scale: isHovered ? 1.02 : 1,
      }}
      transition={{ duration: 0.3 }}
      aria-label={`Abrir ${validTitle}`}
      whileHover={prefersReducedMotion ? {} : {
        y: -8,
        scale: 1.02,
      }}
      whileTap={prefersReducedMotion ? {} : {
        scale: 0.98,
      }}
    >
      {/* Luz de fundo intensificada no hover - similar ao GlassOrb */}
      <motion.div
        className="absolute inset-0 rounded-2xl blur-3xl -z-10"
        style={{
          background: `radial-gradient(circle at 50% 50%, ${validColors.primary}80 0%, ${validColors.secondary}40 50%, transparent 70%)`,
        }}
        animate={prefersReducedMotion ? {} : {
          opacity: isHovered ? [0.4, 0.7, 0.4] : 0,
          scale: isHovered ? [1, 1.2, 1] : 0.8,
        }}
        transition={{
          duration: prefersReducedMotion ? 0 : 2,
          repeat: isHovered ? Infinity : 0,
          ease: "easeInOut"
        }}
      />

      {/* Background com glassmorphism */}
      <div className="absolute inset-0 glass-cosmic rounded-2xl" />
      
      {/* Gradiente de cores específicas */}
      <div 
        className="absolute inset-0 opacity-20 rounded-2xl"
        style={{
          background: `linear-gradient(135deg, ${validColors.primary} 0%, ${validColors.secondary} 100%)`,
        }}
      />

      {/* Brilho interno animado */}
      <motion.div
        className="absolute inset-[1px] rounded-2xl opacity-30"
        style={{
          background: `radial-gradient(ellipse at top, ${validColors.primary}40 0%, transparent 70%)`,
        }}
        animate={prefersReducedMotion ? {} : {
          opacity: isHovered ? [0.3, 0.5, 0.3] : 0.3,
        }}
        transition={{
          duration: prefersReducedMotion ? 0 : 2,
          repeat: isHovered ? Infinity : 0,
        }}
      />

      {/* Borda brilhante */}
      <motion.div
        className="absolute inset-0 rounded-2xl border-2"
        style={{
          borderColor: isHovered ? validColors.primary : `${validColors.primary}60`,
          boxShadow: isHovered
            ? `0 0 30px ${validColors.primary}60, 0 0 50px ${validColors.primary}30`
            : `0 0 20px ${validColors.primary}30`,
        }}
        transition={{ duration: 0.3 }}
      />

      {/* Conteúdo */}
      <div className="relative h-full flex flex-col items-center justify-center gap-4 p-6 z-10">
        {/* Ícone com animação de levitação */}
        <motion.div
          animate={prefersReducedMotion ? {} : {
            y: isHovered ? [-4, 4, -4] : 0,
            rotate: isHovered ? [-2, 2, -2] : 0,
          }}
          transition={{
            duration: prefersReducedMotion ? 0 : 3,
            repeat: isHovered ? Infinity : 0,
            ease: "easeInOut"
          }}
          className="text-6xl md:text-7xl mb-2"
          style={{
            color: validColors.primary,
            filter: isHovered ? `drop-shadow(0 0 20px ${validColors.primary}80)` : `drop-shadow(0 0 10px ${validColors.primary}40)`,
          }}
        >
          {renderIcon()}
        </motion.div>

        {/* Título e subtítulo */}
        <div className="text-center space-y-2">
          <h3 
            className="font-bold text-lg md:text-xl"
            style={{ color: validColors.primary }}
          >
            {validTitle}
          </h3>
          {validSubtitle && (
            <p className="text-sm md:text-base text-muted-foreground font-medium">
              {validSubtitle}
            </p>
          )}
          {description && (
            <p className="text-xs md:text-sm text-muted-foreground/80 mt-2 line-clamp-2">
              {description}
            </p>
          )}
        </div>

        {/* Partículas místicas no hover */}
        {!prefersReducedMotion && isHovered && (
          <>
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 rounded-full"
                style={{
                  backgroundColor: validColors.primary,
                  width: '6px',
                  height: '6px',
                }}
                initial={{
                  x: '50%',
                  y: '50%',
                  opacity: 0,
                }}
                animate={{
                  x: [
                    '50%',
                    `${50 + Math.cos((i * 72) * Math.PI / 180) * 100}%`,
                    `${50 + Math.cos((i * 72 + 360) * Math.PI / 180) * 100}%`,
                  ],
                  y: [
                    '50%',
                    `${50 + Math.sin((i * 72) * Math.PI / 180) * 100}%`,
                    `${50 + Math.sin((i * 72 + 360) * Math.PI / 180) * 100}%`,
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

MysticalModuleCard.displayName = 'MysticalModuleCard';

