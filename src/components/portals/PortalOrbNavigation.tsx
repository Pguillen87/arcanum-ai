import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { GlassOrb } from "@/components/cosmic/GlassOrb";
import { orbs } from "@/data/orbs";
import { cn } from "@/lib/utils";

interface PortalOrbNavigationProps {
  currentOrbId: string;
  onSelectOrb: (orbId: string) => void;
  className?: string;
}

export const PortalOrbNavigation = ({ 
  currentOrbId, 
  onSelectOrb,
  className 
}: PortalOrbNavigationProps) => {
  // Filtrar esferas excluindo a atual
  const availableOrbs = orbs.filter(orb => orb.id !== currentOrbId);

  if (availableOrbs.length === 0) return null;

  return (
    <TooltipProvider>
      <div className={cn("flex items-center gap-2 md:gap-3", className)}>
        {availableOrbs.map((orb) => (
          <Tooltip key={orb.id}>
            <TooltipTrigger asChild>
              <div
                style={{
                  // Aplica cores específicas via CSS variables
                  ['--orb-primary' as string]: `hsl(${orb.gradientColors.primary})`,
                  ['--orb-secondary' as string]: `hsl(${orb.gradientColors.secondary})`,
                }}
                className="orb-gradient-wrapper"
              >
                <GlassOrb
                  icon={orb.icon}
                  label={orb.label}
                  description={orb.description}
                  color={orb.color}
                  onClick={() => onSelectOrb(orb.id)}
                  size="sm"
                />
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Abrir Portal de {orb.label}</p>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  );
};

