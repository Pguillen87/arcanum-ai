import { useState } from "react";
import { OrbNavigation } from "@/components/orb-navigation";
import { HeroSection } from "@/components/hero-section";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserMenu } from "@/components/auth/UserMenu";
import { FloatingRunes } from "@/components/animations/FloatingRunes";
import { PortalTransition } from "@/components/animations/PortalTransition";
import { EssenciaPortal } from "@/features/essencia/EssenciaPortal";
import { EnergiaPortal } from "@/features/energia/EnergiaPortal";
import { ProtecaoPortal } from "@/features/protecao/ProtecaoPortal";
import { CosmosPortal } from "@/features/cosmos/CosmosPortal";

const Index = () => {
  const [selectedOrb, setSelectedOrb] = useState<string | null>(null);

  const handleClosePortal = () => {
    setSelectedOrb(null);
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Floating mystical runes background */}
      <FloatingRunes count={25} />

      {/* Cosmic background effects */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0" style={{ background: "var(--gradient-aurora)" }} />
        <div
          className="absolute top-20 left-20 w-96 h-96 rounded-full blur-3xl opacity-30 animate-cosmic-pulse"
          style={{ background: "var(--gradient-orb)" }}
        />
        <div
          className="absolute bottom-20 right-20 w-96 h-96 rounded-full blur-3xl opacity-30 animate-cosmic-pulse"
          style={{ background: "var(--gradient-orb)", animationDelay: "1.5s" }}
        />
      </div>

      {/* User Menu & Theme Toggle */}
      <div className="fixed top-6 right-6 z-50 flex items-center gap-4">
        <UserMenu />
        <ThemeToggle />
      </div>

      {/* Hero Section */}
      <HeroSection />

      {/* Orb Navigation */}
      {!selectedOrb && (
        <section className="container mx-auto px-4 py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-cosmic bg-clip-text text-transparent">
              Escolha sua Dimensão
            </h2>
            <p className="text-muted-foreground text-lg">
              Navegue pelos portais de transmutação criativa
            </p>
          </div>

          <OrbNavigation selectedOrb={selectedOrb} onSelectOrb={setSelectedOrb} />
        </section>
      )}

      {/* Portal transitions */}
      <PortalTransition isOpen={!!selectedOrb}>
        {selectedOrb === "essencia" && <EssenciaPortal onClose={handleClosePortal} />}
        {selectedOrb === "energia" && <EnergiaPortal onClose={handleClosePortal} />}
        {selectedOrb === "protecao" && <ProtecaoPortal onClose={handleClosePortal} />}
        {selectedOrb === "cosmos" && <CosmosPortal onClose={handleClosePortal} />}
      </PortalTransition>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-12 text-center border-t border-border/30">
        <p className="text-muted-foreground">
          Arcanum.AI © 2025 - Portal de Transmutação Criativa
        </p>
      </footer>
    </div>
  );
};

export default Index;
