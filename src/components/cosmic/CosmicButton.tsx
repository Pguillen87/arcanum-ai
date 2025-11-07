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
          mystical && "gradient-cosmic text-white border-0 relative overflow-hidden",
          mystical && "before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent",
          mystical && "before:translate-x-[-200%] hover:before:translate-x-[200%] before:transition-transform before:duration-700",
          className
        )}
        {...props}
      >
        {children}
      </Button>
    </Component>
  );
};
