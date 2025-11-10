import { Button, ButtonProps } from "@/components/ui/button";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface CosmicButtonProps extends ButtonProps {
  mystical?: boolean;
}

export const CosmicButton = ({ children, className, mystical = false, ...props }: CosmicButtonProps) => {
  const Component = motion.div;

  return (
    <Component
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className="relative inline-block"
    >
      <Button
        className={cn(
          mystical && "relative overflow-hidden rounded-full gradient-cosmic text-white border border-white/10",
          mystical && "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          mystical && "shadow-sm hover:shadow-md transition-colors",
          mystical && "after:absolute after:inset-0 after:bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.12)_0%,transparent_60%)] after:opacity-0 hover:after:opacity-100 after:transition-opacity after:duration-500",
          className
        )}
        {...props}
      >
        {children}
      </Button>
    </Component>
  );
};
