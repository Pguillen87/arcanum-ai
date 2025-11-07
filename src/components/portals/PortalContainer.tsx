import { motion, useMotionValue, useTransform, PanInfo } from "framer-motion";
import { X } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface PortalContainerProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

export const PortalContainer = ({ title, onClose, children }: PortalContainerProps) => {
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
        className="glass-cosmic p-4 md:p-6 flex items-center justify-between mb-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <h1 className="text-2xl md:text-4xl font-bold bg-gradient-cosmic bg-clip-text text-transparent">
          {title}
        </h1>
        
        {/* Close Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={onClose}
              className="group relative"
            >
              <div className="relative">
                {/* Glow effect */}
                <div className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-40 blur-xl transition-all duration-300" style={{ background: "var(--gradient-cosmic)" }} />
                
                {/* Main circle */}
                <div className="relative w-10 h-10 md:w-12 md:h-12 rounded-full border border-white/20 backdrop-blur-xl bg-black/30 flex items-center justify-center group-hover:scale-110 group-hover:rotate-90 group-hover:border-white/40 transition-all duration-300 group-hover:shadow-lg">
                  <X className="w-5 h-5 md:w-6 md:h-6 text-white group-hover:text-purple-300 transition-colors" />
                </div>
              </div>
            </button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Fechar</p>
          </TooltipContent>
        </Tooltip>
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
