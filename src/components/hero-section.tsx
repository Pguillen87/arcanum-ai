import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/contexts/I18nContext";
import { t } from "@/lib/i18n";
import { CosmicButton } from "@/components/cosmic/CosmicButton";

export const HeroSection = () => {
  const { locale } = useI18n();
  return (
    <section className="container mx-auto px-4 pt-20 pb-16 text-center relative">
      <div className="absolute inset-0 flex items-center justify-center -z-10">
        <div className="w-[500px] h-[500px] rounded-full blur-cosmic opacity-20 animate-glow-pulse gradient-orb" />
      </div>
      
      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-cosmic mb-6 animate-fade-in">
        <Sparkles className="w-4 h-4 text-primary" />
        <span className="text-sm" aria-label={t('hero.portal', locale)}>{t('hero.portal', locale)}</span>
      </div>

      <h1 className="text-5xl md:text-7xl font-bold mb-6 animate-fade-in">
        <span className="bg-gradient-cosmic bg-clip-text text-transparent" aria-label={t('app.title', locale)}>
          {t('app.title', locale)}
        </span>
      </h1>

      <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto animate-fade-in" aria-label={t('hero.portal', locale)}>
        {t('hero.portal', locale)}
      </p>

      <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in">
        <CosmicButton mystical size="lg" className="text-lg px-8 rounded-full" aria-label={t('hero.start', locale)}>
          {t('hero.start', locale)}
        </CosmicButton>
        <CosmicButton size="lg" className="glass-cosmic text-lg px-8 rounded-full" aria-label={t('hero.explore', locale)}>
          {t('hero.explore', locale)}
        </CosmicButton>
      </div>

      {/* Floating runes/symbols */}
      <div className="absolute top-1/4 left-10 text-primary/20 text-6xl animate-float">
        ✦
      </div>
      <div className="absolute top-1/3 right-10 text-secondary/20 text-6xl animate-float" style={{ animationDelay: "2s" }}>
        ◆
      </div>
      <div className="absolute bottom-1/4 left-1/4 text-primary/20 text-4xl animate-float" style={{ animationDelay: "1s" }}>
        ★
      </div>
    </section>
  );
};
