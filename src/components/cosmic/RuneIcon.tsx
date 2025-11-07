import { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface RuneIconProps {
  icon: LucideIcon;
  size?: "sm" | "md" | "lg";
  className?: string;
  animated?: boolean;
}

const sizeClasses = {
  sm: "w-8 h-8",
  md: "w-12 h-12",
  lg: "w-16 h-16",
};

export const RuneIcon = ({ icon: Icon, size = "md", className, animated = true }: RuneIconProps) => {
  const Component = animated ? motion.div : "div";

  return (
    <Component
      className={cn(
        "relative rounded-full flex items-center justify-center",
        "bg-card/50 backdrop-blur-sm",
        "border-2 border-primary/60",
        sizeClasses[size],
        animated && "animate-rune-pulse",
        className
      )}
      style={{
        boxShadow: "0 0 20px hsl(var(--primary) / 0.6), 0 0 30px hsl(var(--primary) / 0.3)",
      }}
      {...(animated && {
        whileHover: { 
          scale: 1.15,
          boxShadow: "0 0 40px hsl(var(--primary) / 0.9), 0 0 60px hsl(var(--primary) / 0.5)",
        },
        transition: {
          duration: 0.3,
          ease: "easeOut",
        },
      })}
    >
      <Icon className={cn("text-primary", size === "sm" && "w-4 h-4", size === "md" && "w-6 h-6", size === "lg" && "w-8 h-8")} />
    </Component>
  );
};
