import { motion, AnimatePresence } from "framer-motion";
import { usePortalAnimation } from "@/hooks/usePortalAnimation";

interface PortalTransitionProps {
  isOpen: boolean;
  onAnimationComplete?: () => void;
  children: React.ReactNode;
}

export const PortalTransition = ({
  isOpen,
  onAnimationComplete,
  children,
}: PortalTransitionProps) => {
  const { phase } = usePortalAnimation({ 
    isOpen, 
    onOpenComplete: onAnimationComplete 
  });

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-40 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Simple backdrop */}
          <motion.div
            className="absolute inset-0 bg-background/90"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />

          {/* Quick flash effect */}
          <motion.div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: "radial-gradient(circle, hsl(var(--primary) / 0.3), transparent 60%)",
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 0.3, times: [0, 0.5, 1] }}
          />

          {/* Content container with smooth fade */}
          <motion.div
            className="relative z-10 w-full h-full max-w-7xl mx-auto p-4 md:p-8 overflow-auto"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{
              opacity: 1,
              scale: 1,
            }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ 
              duration: 0.3,
              delay: 0.15,
              ease: "easeOut"
            }}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
