import { useState, useEffect, lazy, Suspense } from "react";
import { OrbNavigation } from "@/components/orb-navigation";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserMenu } from "@/components/auth/UserMenu";
import { FloatingRunes } from "@/components/animations/FloatingRunes";
import { PortalTransition } from "@/components/animations/PortalTransition";
import { EssenciaPortal } from "@/features/essencia/EssenciaPortal";
import { EnergiaPortal } from "@/features/energia/EnergiaPortal";
import { ProtecaoPortal } from "@/features/protecao/ProtecaoPortal";
import { CosmosPortal } from "@/features/cosmos/CosmosPortal";
import { MysticalModuleCard } from "@/components/cosmic/MysticalModuleCard";
import { mysticalModules } from "@/data/mysticalModules";
import { useMysticalChat } from "@/hooks/useMysticalChat";
import { CosmicLogo } from "@/components/cosmic/CosmicLogo";
import { LoadingSpinner } from "@/components/cosmic/LoadingSpinner";
import { LanguageToggle } from "@/components/cosmic/LanguageToggle";
import { HighContrastToggle } from "@/components/cosmic/HighContrastToggle";
import { PerfOverlay } from "@/components/cosmic/PerfOverlay";
import { useI18n } from "@/contexts/I18nContext";
import { t } from "@/lib/i18n";

// Lazy load do modal de chat (não renderizar até necessário)
const MysticalChatModal = lazy(() => 
  import("@/components/mystical/MysticalChatModal")
    .then(module => ({ 
      default: module.MysticalChatModal 
    }))
    .catch((error) => {
      console.error("Erro ao carregar MysticalChatModal:", error);
      // Retornar componente de fallback simples
      return { 
        default: ({ onClose }: { onClose: () => void }) => (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <div className="glass-cosmic p-6 rounded-lg max-w-md">
              <h2 className="text-xl font-bold mb-4">Erro ao carregar chat</h2>
              <p className="text-muted-foreground mb-4">
                Não foi possível carregar o modal de chat. Por favor, recarregue a página.
              </p>
              <button 
                onClick={onClose}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg"
              >
                Fechar
              </button>
            </div>
          </div>
        )
      };
    })
);

const Index = () => {
  const [selectedOrb, setSelectedOrb] = useState<string | null>(null);
  const { locale } = useI18n();
  const { openChat, isChatOpen, currentAgent, closeChat } = useMysticalChat();
  const [isLoadingChat, setIsLoadingChat] = useState(false);

  const handleClosePortal = () => {
    setSelectedOrb(null);
  };

  const handleNavigateToOrb = (orbId: string) => {
    setSelectedOrb(orbId);
  };

  // Loading state durante abertura de chat
  useEffect(() => {
    if (isChatOpen && currentAgent) {
      setIsLoadingChat(true);
      // Simula pequeno delay para transição suave
      const timer = setTimeout(() => {
        setIsLoadingChat(false);
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setIsLoadingChat(false);
    }
  }, [isChatOpen, currentAgent]);

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Fallback visual - garante que sempre há background mesmo se CSS falhar */}
      <style>{`
        body { background-color: hsl(var(--background)); }
        #root { min-height: 100vh; background-color: hsl(var(--background)); }
      `}</style>
      
      {/* Floating mystical runes background */}
      <FloatingRunes count={25} />

      {/* Cosmic background effects */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 gradient-aurora" />
        <div
          className="absolute top-20 left-20 w-96 h-96 rounded-full blur-3xl opacity-30 animate-cosmic-pulse gradient-orb"
        />
        <div
          className="absolute bottom-20 right-20 w-96 h-96 rounded-full blur-3xl opacity-30 animate-cosmic-pulse animate-delay-1-5s gradient-orb"
        />
      </div>

      {/* User Menu & Theme Toggle */}
      <div className="fixed top-6 right-6 z-50 flex items-center gap-4">
        <UserMenu />
        <ThemeToggle />
        <LanguageToggle />
        <HighContrastToggle />
      </div>
      <PerfOverlay />

      {/* Orb Navigation */}
      {!selectedOrb && (
        <section className="container mx-auto px-4 py-12">
          {/* Logo grande */}
          <div className="text-center mb-6">
            <CosmicLogo size="lg" className="mb-4" />
          </div>

          <div className="text-center mb-8">
            <h2 
              className="text-3xl md:text-4xl lg:text-5xl font-bold mb-3 gradient-cosmic bg-clip-text text-transparent font-['Cinzel','Playfair_Display','serif']" 
              style={{
                fontFamily: '"Cinzel", "Playfair Display", serif',
                fontWeight: 700,
                letterSpacing: '0.02em',
                textShadow: '0 2px 8px hsl(270 70% 60% / 0.3)',
              }}
              aria-label={t('nav.choose', locale)}
            >
              {t('nav.choose', locale)}
            </h2>
            <p 
              className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto leading-relaxed" 
              style={{
                fontFamily: '"Cinzel", "Playfair Display", serif',
                fontWeight: 400,
                letterSpacing: '0.01em',
              }}
              aria-label={t('nav.navigate', locale)}
            >
              {t('nav.navigate', locale)}
            </p>
          </div>

          <OrbNavigation selectedOrb={selectedOrb} onSelectOrb={setSelectedOrb} />

          {/* Cards de módulos místicos */}
          <div className="mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {mysticalModules.map((module) => (
              <MysticalModuleCard
                key={module.id}
                title={module.title}
                subtitle={module.subtitle}
                icon={module.icon}
                colors={module.colors}
                onClick={() => openChat(module.id)}
                description={module.description}
              />
            ))}
          </div>
        </section>
      )}

      {/* Portal transitions */}
      <PortalTransition isOpen={!!selectedOrb}>
        {selectedOrb === "essencia" && (
          <EssenciaPortal 
            onClose={handleClosePortal} 
            onNavigateToOrb={handleNavigateToOrb}
          />
        )}
        {selectedOrb === "energia" && (
          <EnergiaPortal 
            onClose={handleClosePortal} 
            onNavigateToOrb={handleNavigateToOrb}
          />
        )}
        {selectedOrb === "protecao" && (
          <ProtecaoPortal 
            onClose={handleClosePortal} 
            onNavigateToOrb={handleNavigateToOrb}
          />
        )}
        {selectedOrb === "cosmos" && (
          <CosmosPortal 
            onClose={handleClosePortal} 
            onNavigateToOrb={handleNavigateToOrb}
          />
        )}
      </PortalTransition>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-12 text-center border-t border-border/30">
        <div className="space-y-2">
          <p className="text-muted-foreground/80 text-sm md:text-base">
            <span className="font-['Cinzel','Playfair_Display','serif']" style={{ fontFamily: '"Cinzel", "Playfair Display", serif' }}>
              ✦ Portal de Transmutação Criativa Arcanum.AI ✦
            </span>
          </p>
          <p className="text-muted-foreground/60 text-xs md:text-sm">
            <span className="font-['Cinzel','Playfair_Display','serif']" style={{ fontFamily: '"Cinzel", "Playfair Display", serif' }}>
              Propriedade do Círculo Arcano de Guillen IA • © 2025
            </span>
          </p>
          <p className="text-muted-foreground/50 text-xs mt-3">
            <span className="font-['Cinzel','Playfair_Display','serif']" style={{ fontFamily: '"Cinzel", "Playfair Display", serif' }}>
              "Cada transmutação é um ritual sagrado de criação"
            </span>
          </p>
        </div>
      </footer>

      {/* Modal de Chat Místico */}
      {isLoadingChat && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm"
          role="status"
          aria-live="polite"
          aria-label="Carregando chat místico"
        >
          <LoadingSpinner 
            message="Abrindo portal místico..." 
            size="lg"
          />
        </div>
      )}
      {isChatOpen && !isLoadingChat && (
        <Suspense fallback={<LoadingSpinner message="Carregando portal..." size="md" />}>
          <MysticalChatModal
            agent={currentAgent}
            isOpen={isChatOpen && !isLoadingChat}
            onClose={closeChat}
          />
        </Suspense>
      )}
    </div>
  );
};

export default Index;
