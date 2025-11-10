// src/components/ui/mystical/RuneBorder.tsx
// Componente de borda com runas místicas

import { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { mysticalClasses } from "@/lib/mystical-theme";

interface RuneBorderProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  variant?: "gold" | "lilac" | "cosmic" | "combined";
  className?: string;
  animated?: boolean;
  glow?: boolean;
  borderStyle?: "dashed" | "solid";
  paddingClass?: string;
  showCorners?: boolean;
}

export const RuneBorder = forwardRef<HTMLDivElement, RuneBorderProps>(function RuneBorder(
  {
    children,
    variant = "gold",
    className,
    animated = false,
    glow = true,
    borderStyle = "dashed",
    paddingClass = "p-4",
    showCorners = true,
    ...rest
  },
  ref
) {
  const variantClasses = {
    gold: "border-mystical-gold",
    lilac: "border-mystical-lilac",
    cosmic: "border-mystical-cosmic",
    combined: "border-mystical-gold border-mystical-lilac",
  };

  const glowVariant = variant === "combined" ? "combined" : variant;

  return (
    <div
      ref={ref}
      className={cn(
        "relative border-2 rounded-lg",
        borderStyle === "dashed" ? "border-dashed" : "border-solid",
        paddingClass,
        variantClasses[variant],
        animated && glow && mysticalClasses.animation.rune,
        glow && mysticalClasses.glow[glowVariant as keyof typeof mysticalClasses.glow],
        className
      )}
      {...rest}
    >
      {showCorners && (
        <>
          <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-mystical-gold opacity-60" />
          <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-mystical-gold opacity-60" />
          <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-mystical-gold opacity-60" />
          <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-mystical-gold opacity-60" />
        </>
      )}

      {children}
    </div>
  );
});

