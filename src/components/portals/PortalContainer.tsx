import { motion, useMotionValue, useTransform, PanInfo } from "framer-motion";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { MysticalBackButton } from "@/components/cosmic/MysticalBackButton";
import { RotatingQuote } from "./RotatingQuote";
import { PortalOrbNavigation } from "./PortalOrbNavigation";
import { PortalTitle } from "./PortalTitle";

interface PortalContainerProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  currentOrbId?: string;
  onNavigateToOrb?: (orbId: string) => void;
}

export const PortalContainer = ({ 
  title, 
  onClose, 
  children,
  currentOrbId,
  onNavigateToOrb,
}: PortalContainerProps) => {
  const y = useMotionValue(0);
  const opacity = useTransform(y, [0, 150], [1, 0.5]);

  const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    // Se deslizar mais de 150px para baixo ou velocidade > 500, fecha o portal
    if (info.offset.y > 150 || info.velocity.y > 500) {
      onClose();
    }
  };

  return (
    <motion.div 
      className="relative w-full h-full flex flex-col"
      drag="y"
      dragConstraints={{ top: 0, bottom: 300 }}
      dragElastic={{ top: 0, bottom: 0.3 }}
      onDragEnd={handleDragEnd}
      style={{ y, opacity }}
    >
      {/* Swipe indicator - only visible on mobile */}
      <div className="flex justify-center pt-2 pb-1 md:hidden">
        <div className="w-12 h-1 rounded-full bg-muted-foreground/30" />
      </div>

      {/* Header */}
      <motion.div
        className="glass-cosmic p-4 md:p-6 mb-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        {/* Primeira linha: Botão voltar + Título + Navegação de esferas */}
        <div className="flex items-center justify-between gap-4 mb-3 md:mb-4">
          {/* Esquerda: Botão voltar + Título */}
          <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0">
            <Tooltip>
              <TooltipTrigger asChild>
                <MysticalBackButton
                  onClick={onClose}
                  size="md"
                  variant="portal"
                  ariaLabel="Voltar ao Portal Principal"
                />
              </TooltipTrigger>
              <TooltipContent>
                <p>Voltar ao Portal Principal</p>
              </TooltipContent>
            </Tooltip>
            
            <PortalTitle 
              title={title} 
              orbId={currentOrbId}
              className="flex-1 min-w-0"
            />
          </div>
          
          {/* Direita: Navegação rápida de esferas */}
          {currentOrbId && onNavigateToOrb && (
            <div className="hidden md:flex items-center">
              <PortalOrbNavigation
                currentOrbId={currentOrbId}
                onSelectOrb={onNavigateToOrb}
              />
            </div>
          )}
        </div>

        {/* Segunda linha: Frase rotativa (mobile: abaixo, desktop: ao lado do título) */}
        {currentOrbId && (
          <div className="md:hidden mb-2">
            <RotatingQuote orbId={currentOrbId as 'essencia' | 'energia' | 'protecao' | 'cosmos'} />
          </div>
        )}
        {currentOrbId && (
          <div className="hidden md:block">
            <RotatingQuote orbId={currentOrbId as 'essencia' | 'energia' | 'protecao' | 'cosmos'} />
          </div>
        )}

        {/* Navegação de esferas no mobile (abaixo da frase) */}
        {currentOrbId && onNavigateToOrb && (
          <div className="md:hidden flex justify-center mt-3">
            <PortalOrbNavigation
              currentOrbId={currentOrbId}
              onSelectOrb={onNavigateToOrb}
            />
          </div>
        )}
      </motion.div>

      {/* Content */}
      <motion.div
        className="flex-1 overflow-auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
};
