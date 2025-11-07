import { Sparkles, Zap, Shield, Stars } from "lucide-react";
import { useState, useRef } from "react";
import { ShatterEffect } from "@/components/animations/ShatterEffect";
import { RuneIcon } from "@/components/cosmic/RuneIcon";
import { motion } from "framer-motion";

interface OrbNavigationProps {
  selectedOrb: string | null;
  onSelectOrb: (orb: string) => void;
}

const orbs = [
  {
    id: "essencia",
    icon: Sparkles,
    label: "Essência",
    description: "DNA Criativo",
    color: "text-primary",
  },
  {
    id: "energia",
    icon: Zap,
    label: "Energia",
    description: "Transmutação",
    color: "text-secondary",
  },
  {
    id: "protecao",
    icon: Shield,
    label: "Proteção",
    description: "Escudo",
    color: "text-primary",
  },
  {
    id: "cosmos",
    icon: Stars,
    label: "Cosmos",
    description: "Visão Universal",
    color: "text-secondary",
  },
];

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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 max-w-5xl mx-auto px-4">
        {orbs.map((orb) => {
          const Icon = orb.icon;
          const isSelected = selectedOrb === orb.id;
          const isExiting = shatteringOrb === orb.id;

          return (
            <motion.button
              key={orb.id}
              ref={(el) => (orbRefs.current[orb.id] = el)}
              onClick={(e) => handleOrbClick(orb.id, e)}
              className={`relative w-full aspect-square transition-all duration-300 ${
                isSelected ? "scale-110 -translate-y-2" : ""
              }`}
              animate={{
                scale: isExiting ? 0.8 : isSelected ? 1.1 : 1,
                opacity: isExiting ? 0 : 1,
              }}
              transition={{ duration: 0.3 }}
            >
              <div className="relative h-full flex items-center justify-center">
                {/* Glowing background */}
                <div
                  className={`absolute inset-0 rounded-full blur-2xl opacity-40 ${
                    isSelected ? "animate-glow-pulse" : ""
                  }`}
                  style={{ background: "var(--gradient-orb)" }}
                />

                {/* Orb container with mystical rune */}
                <div className="glass-cosmic rounded-full w-full h-full p-4 md:p-8 flex items-center justify-center">
                  <div className="relative flex flex-col items-center gap-2 md:gap-3">
                    <RuneIcon icon={Icon} size="md" animated={false} className="mb-2" />
                    <div className="text-center">
                      <h3 className="font-bold text-sm md:text-lg">{orb.label}</h3>
                      <p className="text-xs md:text-sm text-muted-foreground">
                        {orb.description}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>

      <ShatterEffect
        isActive={!!shatteringOrb}
        onComplete={handleShatterComplete}
        orbPosition={shatterPosition}
      />
    </>
  );
};
