import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Sparkles } from "lucide-react";

interface LoadingSpinnerProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'w-8 h-8',
  md: 'w-12 h-12',
  lg: 'w-16 h-16',
};

const textSizeClasses = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
};

export const LoadingSpinner = ({ 
  message = "Consultando os cristais...", 
  size = 'md',
  className 
}: LoadingSpinnerProps) => {
  const prefersReducedMotion = typeof window !== 'undefined' 
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches 
    : false;

  return (
    <div 
      className={cn("flex flex-col items-center justify-center gap-4 p-6", className)}
      role="status"
      aria-live="polite"
      aria-label={message || "Carregando"}
    >
      {/* Runa/Sigilo girando */}
      <div className="relative">
        <motion.div
          className={cn(
            "rounded-full glass-cosmic flex items-center justify-center",
            "border-2 border-primary/40",
            sizeClasses[size]
          )}
          animate={prefersReducedMotion ? {} : {
            rotate: [0, 360],
          }}
          transition={{
            duration: prefersReducedMotion ? 0 : 2,
            repeat: Infinity,
            ease: "linear"
          }}
          style={{
            boxShadow: "0 0 20px hsl(var(--primary) / 0.5), 0 0 40px hsl(var(--primary) / 0.3)",
          }}
        >
          <Sparkles className={cn(
            "text-primary",
            size === 'sm' && "w-4 h-4",
            size === 'md' && "w-6 h-6",
            size === 'lg' && "w-8 h-8"
          )} />
        </motion.div>

        {/* Partículas orbitando */}
        {!prefersReducedMotion && (
          <>
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute top-1/2 left-1/2 w-1 h-1 rounded-full bg-primary/60"
                style={{
                  width: '4px',
                  height: '4px',
                }}
                animate={{
                  rotate: [0, 360],
                  x: [
                    Math.cos((i * 120) * Math.PI / 180) * (size === 'sm' ? 16 : size === 'md' ? 24 : 32),
                    Math.cos((i * 120 + 360) * Math.PI / 180) * (size === 'sm' ? 16 : size === 'md' ? 24 : 32),
                  ],
                  y: [
                    Math.sin((i * 120) * Math.PI / 180) * (size === 'sm' ? 16 : size === 'md' ? 24 : 32),
                    Math.sin((i * 120 + 360) * Math.PI / 180) * (size === 'sm' ? 16 : size === 'md' ? 24 : 32),
                  ],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "linear",
                  delay: i * 0.2,
                }}
              />
            ))}
          </>
        )}
      </div>

      {/* Mensagem */}
      {message && (
        <motion.p
          className={cn(
            "text-muted-foreground text-center",
            textSizeClasses[size]
          )}
          animate={prefersReducedMotion ? {} : {
            opacity: [0.6, 1, 0.6],
          }}
          transition={{
            duration: prefersReducedMotion ? 0 : 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          aria-hidden="false"
        >
          {message}
        </motion.p>
      )}
    </div>
  );
};

