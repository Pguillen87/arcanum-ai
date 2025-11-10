import { useState, useRef } from "react";
import { ShatterEffect } from "@/components/animations/ShatterEffect";
import { motion } from "framer-motion";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { GlassOrb } from "@/components/cosmic/GlassOrb";
import { orbs } from "@/data/orbs";

interface OrbNavigationProps {
  selectedOrb: string | null;
  onSelectOrb: (orb: string) => void;
}

export const OrbNavigation = ({ selectedOrb, onSelectOrb }: OrbNavigationProps) => {
  const [shatteringOrb, setShatteringOrb] = useState<string | null>(null);
  const [shatterPosition, setShatterPosition] = useState({ x: 0, y: 0 });
  const orbRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});

  const handleOrbClick = (orbId: string, event: React.MouseEvent<HTMLButtonElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setShatterPosition({
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    });
    setShatteringOrb(orbId);
  };

  const handleShatterComplete = () => {
    if (shatteringOrb) {
      onSelectOrb(shatteringOrb);
      setShatteringOrb(null);
    }
  };

  return (
    <>
      <TooltipProvider>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 max-w-5xl mx-auto px-4">
        {orbs.map((orb) => {
          const isSelected = selectedOrb === orb.id;
          const isExiting = shatteringOrb === orb.id;

          return (
            <Tooltip key={orb.id}>
              <TooltipTrigger asChild>
                  <div
                    ref={(el) => {
                      if (el) {
                        orbRefs.current[orb.id] = el.querySelector('button') || null;
                      }
                    }}
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
                      onClick={() => {
                        const button = orbRefs.current[orb.id];
                        if (button) {
                          const rect = button.getBoundingClientRect();
                          setShatterPosition({
                            x: rect.left + rect.width / 2,
                            y: rect.top + rect.height / 2,
                          });
                        }
                        setShatteringOrb(orb.id);
                      }}
                      isSelected={isSelected && !isExiting}
                    />
                  </div>
              </TooltipTrigger>
              <TooltipContent>
                Abrir Portal de {orb.label}
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
      </TooltipProvider>

      <ShatterEffect
        isActive={!!shatteringOrb}
        onComplete={handleShatterComplete}
        orbPosition={shatterPosition}
      />
    </>
  );
};
