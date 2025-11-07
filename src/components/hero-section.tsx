import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export const HeroSection = () => {
  return (
    <section className="container mx-auto px-4 pt-20 pb-16 text-center relative">
      <div className="absolute inset-0 flex items-center justify-center -z-10">
        <div className="w-[500px] h-[500px] rounded-full blur-3xl opacity-20 animate-glow-pulse"
             style={{ background: "var(--gradient-orb)" }} />
      </div>
      
      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-cosmic mb-6 animate-fade-in">
        <Sparkles className="w-4 h-4 text-primary" />
        <span className="text-sm">Portal de Transmutação Criativa</span>
      </div>

      <h1 className="text-5xl md:text-7xl font-bold mb-6 animate-fade-in">
        <span className="bg-gradient-cosmic bg-clip-text text-transparent">
          Arcanum.AI
        </span>
      </h1>

      <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto animate-fade-in">
        Transforme sua criatividade em realidade dimensional através da alquimia da inteligência artificial
      </p>

      <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in">
        <Button size="lg" className="gradient-cosmic text-white border-0 hover:opacity-90 text-lg px-8">
          Iniciar Jornada
        </Button>
        <Button size="lg" variant="outline" className="glass-cosmic text-lg px-8">
          Explorar Portal
        </Button>
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
