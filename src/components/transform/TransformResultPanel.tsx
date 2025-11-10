import { forwardRef } from "react";
import { CosmicCard } from "@/components/cosmic/CosmicCard";
import { CosmicButton } from "@/components/cosmic/CosmicButton";
import { RuneBorder } from "@/components/ui/mystical";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { RefreshCw } from "lucide-react";

export interface TransformResultPanelProps {
  transformedText?: string | null;
  onCopy?: (text: string) => void;
  onClear?: () => void;
  highlight?: boolean;
  guidanceRules?: string[];
  refinementNotes?: string;
  onChangeRefinementNotes?: (value: string) => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  disableRefresh?: boolean;
  showRefinementEditor?: boolean;
  refreshLabel?: string;
}

export const TransformResultPanel = forwardRef<HTMLDivElement, TransformResultPanelProps>(
  (
    {
      transformedText,
      onCopy,
      onClear,
      highlight,
      guidanceRules = [],
      refinementNotes = "",
      onChangeRefinementNotes,
      onRefresh,
      isRefreshing = false,
      disableRefresh = false,
      showRefinementEditor = false,
      refreshLabel,
    },
    ref
  ) => {
    if (!transformedText) {
      return null;
    }

    const handleCopy = () => {
      if (onCopy) {
        onCopy(transformedText);
      } else {
        navigator.clipboard.writeText(transformedText);
      }
    };

    const rulesToShow = Array.isArray(guidanceRules)
      ? guidanceRules.filter((rule) => typeof rule === "string" && rule.trim().length > 0).slice(0, 5)
      : [];

    const currentRefreshLabel = refreshLabel ?? (showRefinementEditor ? "Aplicar ajuste" : "Invocar ajuste");

    return (
      <RuneBorder
        variant="cosmic"
        animated
        className={cn(highlight && "shadow-lg shadow-mystical-cosmic/40 animate-pulse")}
        ref={ref}
        data-testid="transform-result-panel"
      >
        <CosmicCard title="Texto Transformado" description="Resultado da transmutação">
          <div className="space-y-4">
            {rulesToShow.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-mystical-gold">
                  Regras do personagem
                </p>
                <ul className="text-xs text-muted-foreground list-disc list-inside space-y-1">
                  {rulesToShow.map((rule, index) => (
                    <li key={`${rule}-${index}`}>{rule}</li>
                  ))}
                </ul>
              </div>
            )}

            {showRefinementEditor && onChangeRefinementNotes && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Pergaminho de Refinamento Arcano</label>
                <Textarea
                  value={refinementNotes}
                  onChange={(event) => onChangeRefinementNotes(event.target.value)}
                  placeholder="Descreva o ajuste desejado (ex.: 'Não se apresente ao leitor', 'Use um tom mais direto')."
                  rows={3}
                  maxLength={720}
                  disabled={isRefreshing}
                />
                <p className="text-xs text-muted-foreground">
                  Digite ao menos uma instrução personalizada para habilitar o botão de ajuste. Limite de 5 regras e 240 caracteres por linha.
                </p>
              </div>
            )}

            <div className="p-4 bg-mystical-deep-light/50 rounded-lg border border-mystical-cosmic/20">
              <p className="text-sm whitespace-pre-wrap">{transformedText}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <CosmicButton variant="outline" onClick={handleCopy}>
                Copiar
              </CosmicButton>
              {onRefresh && (
                <CosmicButton
                  variant="outline"
                  mystical
                  onClick={onRefresh}
                  disabled={disableRefresh}
                  aria-busy={isRefreshing}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  {isRefreshing ? "Aplicando..." : currentRefreshLabel}
                </CosmicButton>
              )}
              <CosmicButton variant="outline" onClick={onClear}>
                Limpar
              </CosmicButton>
            </div>
          </div>
        </CosmicCard>
      </RuneBorder>
    );
  }
);

TransformResultPanel.displayName = "TransformResultPanel";
