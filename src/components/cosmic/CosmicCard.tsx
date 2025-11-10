import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface CosmicCardProps {
  title?: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  className?: string;
  glow?: boolean;
}

export const CosmicCard = ({ title, description, children, className, glow = true }: CosmicCardProps) => {
  // Verificar se children é válido (não null, undefined ou string vazia)
  const hasValidChildren = children !== null && children !== undefined && children !== '';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
      transition={{ duration: 0.3 }}
    >
      <Card className={cn("glass-cosmic", glow && "cosmic-glow", className)}>
        {(title || description) && (
          <CardHeader>
            {title && <CardTitle className="text-foreground">{title}</CardTitle>}
            {description && <CardDescription>{description}</CardDescription>}
          </CardHeader>
        )}
        {hasValidChildren && <CardContent>{children}</CardContent>}
      </Card>
    </motion.div>
  );
};
