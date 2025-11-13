import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { MysticalModule } from "@/data/mysticalModules";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { MysticalCloseButton } from "@/components/cosmic/MysticalCloseButton";

interface MysticalChatModalProps {
  agent: MysticalModule | null;
  isOpen: boolean;
  onClose: () => void;
}

export const MysticalChatModal = ({ agent, isOpen, onClose }: MysticalChatModalProps) => {
  const [showGreeting, setShowGreeting] = useState(false);
  const prefersReducedMotion = typeof window !== 'undefined' 
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches 
    : false;

  useEffect(() => {
    if (isOpen && agent) {
      // Anima entrada do greeting após modal abrir
      const timer = setTimeout(() => setShowGreeting(true), 300);
      return () => clearTimeout(timer);
    } else {
      setShowGreeting(false);
    }
  }, [isOpen, agent]);

  if (!agent) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent 
        className={cn(
          "glass-cosmic border-2 max-w-2xl max-h-[80vh] p-0 overflow-hidden",
          "focus:outline-none"
        )}
        hideDefaultClose
        style={{
          borderColor: `${agent.colors.primary}60`,
          boxShadow: `0 0 40px ${agent.colors.primary}40, 0 0 80px ${agent.colors.primary}20`,
        }}
        aria-describedby="chat-greeting"
      >
        {/* Header com cores do agente */}
        <DialogHeader 
          className={cn(
            "p-6 border-b border-border/30",
            "bg-gradient-to-r from-transparent via-transparent to-transparent"
          )}
          style={{
            background: `linear-gradient(135deg, ${agent.colors.primary}15 0%, ${agent.colors.secondary}10 100%)`,
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <DialogTitle 
                className="text-2xl font-bold mb-2"
                style={{ color: agent.colors.primary }}
              >
                {agent.title}
              </DialogTitle>
              <DialogDescription className="text-muted-foreground">
                {agent.subtitle}
              </DialogDescription>
            </div>
            <MysticalCloseButton
              onClick={onClose}
              size="sm"
              variant="modal"
              ariaLabel="Fechar chat"
            />
          </div>
        </DialogHeader>

        {/* Área de mensagens */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 min-h-[300px] max-h-[400px]">
          <AnimatePresence>
            {showGreeting && (
              <motion.div
                initial={prefersReducedMotion ? {} : { opacity: 0, y: 20 }}
                animate={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
                exit={prefersReducedMotion ? {} : { opacity: 0 }}
                transition={{ duration: 0.3 }}
                className={cn(
                  "p-4 rounded-lg glass-cosmic",
                  "border border-border/30"
                )}
                style={{
                  borderColor: `${agent.colors.primary}30`,
                  background: `linear-gradient(135deg, ${agent.colors.primary}10 0%, ${agent.colors.secondary}05 100%)`,
                }}
                id="chat-greeting"
                role="article"
                aria-label="Mensagem de boas-vindas do agente"
              >
                <p className="text-foreground leading-relaxed whitespace-pre-wrap">
                  {agent.chatGreeting}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Placeholder para mensagens futuras */}
          <div className="text-center text-muted-foreground text-sm py-8">
            <p>Em breve você poderá conversar com {agent.title.split(' ')[1] || 'o agente'}...</p>
          </div>
        </div>

        {/* Input de mensagem (placeholder) */}
        <div className="p-4 border-t border-border/30">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Digite sua mensagem..."
              disabled
              className={cn(
                "flex-1 px-4 py-2 rounded-lg glass-cosmic",
                "border border-border/30",
                "focus:outline-none focus:ring-2 focus:ring-offset-2",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
              aria-label="Campo de mensagem"
            />
            <Button
              disabled
              className="rounded-lg"
              style={{
                backgroundColor: agent.colors.primary,
                opacity: 0.5,
              }}
              aria-label="Enviar mensagem"
            >
              Enviar
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Funcionalidade em desenvolvimento
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

