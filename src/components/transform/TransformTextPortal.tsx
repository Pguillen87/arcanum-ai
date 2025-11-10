// Componente principal de transformação de texto
import { useState, useEffect, useRef, useMemo } from "react";
import { CosmicCard } from "@/components/cosmic/CosmicCard";
import { CosmicButton } from "@/components/cosmic/CosmicButton";
import { TextInput } from "@/components/transform/TextInput";
import { RuneIcon } from "@/components/cosmic/RuneIcon";
import { Zap, Sparkles } from "lucide-react";
import { useDracmas } from "@/hooks/useDracmas";
import { useCharacters } from "@/hooks/useCharacters";
import { LoadingSpinner } from "@/components/cosmic/LoadingSpinner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { Observability } from "@/lib/observability";
import { useTransformText } from "@/hooks/useTransformText";
import { CharacterSelector } from "@/components/transform/CharacterSelector";
import { TransformationSettings } from "@/components/transform/TransformationSettings";
import { TransformResultPanel } from "@/components/transform/TransformResultPanel";
import { TransformationOverlay } from "@/components/transform/TransformationOverlay";

export interface TransformTextPortalProps {
  initialUseCharacter?: boolean;
}

export const TransformTextPortal = ({ initialUseCharacter = false }: TransformTextPortalProps = {}) => {
  const [inputText, setInputText] = useState("");
  const [selectedType, setSelectedType] = useState<"post" | "resumo" | "newsletter" | "roteiro">("post");
  const [tone, setTone] = useState<string>("");
  const [length, setLength] = useState<"short" | "medium" | "long">("medium");
  const [selectedCharacterId, setSelectedCharacterId] = useState<string | undefined>(undefined);
  const [useCharacter, setUseCharacter] = useState(initialUseCharacter);
  const [refinementNotes, setRefinementNotes] = useState("");
  const [hasEditedRefinementNotes, setHasEditedRefinementNotes] = useState(false);
  const [isRefreshPending, setIsRefreshPending] = useState(false);
  const [isRefinementEditorOpen, setIsRefinementEditorOpen] = useState(false);

  const { balance, isLoading: isLoadingDracmas } = useDracmas();
  const { characters, transformWithCharacter } = useCharacters();

  const {
    isTransforming: isCharacterTransforming,
    transformedText,
    transform,
    refresh,
    reset,
    lastTraceId,
  } = useTransformText({
    characters,
    executeCharacterTransform: async ({ traceId, ...payload }) => {
      const result = await transformWithCharacter({
        ...payload,
        traceId,
        tone: payload.tone,
        length: payload.length,
      });
      return result;
    },
    trackEvent: Observability.trackEvent,
    onSuccess: () => {
      toast.success("Transformação concluída!", {
        description: "Texto transformado com sucesso",
      });
    },
    onError: (error) => {
      const message =
        error instanceof Error ? error.message : typeof error === "string" ? error : "Erro ao processar";
      toast.error("Erro ao transformar", {
        description: message,
      });
    },
  });

  const resultRef = useRef<HTMLDivElement | null>(null);
  const [highlightResult, setHighlightResult] = useState(false);

  const selectedCharacter = characters.find((char) => char.id === selectedCharacterId);
  const defaultRefinementRules = useMemo(() => {
    if (!selectedCharacter || !Array.isArray((selectedCharacter as any).refinement_rules)) {
      return [] as string[];
    }
    return (selectedCharacter as any).refinement_rules
      .filter((rule: unknown): rule is string => typeof rule === "string" && rule.trim().length > 0)
      .slice(0, 5);
  }, [selectedCharacter, selectedCharacter?.refinement_rules]);

  const defaultRefinementText = useMemo(() => defaultRefinementRules.join("\n"), [defaultRefinementRules]);
  const normalizedDefaultNotes = defaultRefinementText.trim();
  const normalizedCurrentNotes = refinementNotes.trim();
  const canApplyAdjustments =
    hasEditedRefinementNotes &&
    normalizedCurrentNotes.length > 0 &&
    (normalizedDefaultNotes.length === 0 || normalizedCurrentNotes !== normalizedDefaultNotes);

  useEffect(() => {
    if (!transformedText) {
      setHighlightResult(false);
      return;
    }
    if (typeof window !== "undefined" && resultRef.current) {
      resultRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    setHighlightResult(true);
    const timeout = window.setTimeout(() => setHighlightResult(false), 1500);
    return () => window.clearTimeout(timeout);
  }, [transformedText]);

  useEffect(() => {
    if (!selectedCharacterId && Array.isArray(characters) && characters.length) {
      const fallback = characters.find((c: any) => c?.is_default) || characters[0];
      if (fallback?.id) {
        setSelectedCharacterId(String(fallback.id));
      }
    }
  }, [characters, selectedCharacterId]);

  useEffect(() => {
    if (!hasEditedRefinementNotes) {
      setRefinementNotes(defaultRefinementText);
    }
  }, [defaultRefinementText, hasEditedRefinementNotes, selectedCharacterId]);

  const balanceValue = balance?.balance ?? 0;
  const isProcessing = isCharacterTransforming;
  const canTransform = inputText.trim().length > 0 && (balance?.isUnlimited || balanceValue >= 1) && !isProcessing;

  if (isLoadingDracmas) {
    return (
      <div className="space-y-6">
        <CosmicCard title="Transmutação de Texto" description="GPT + Sua Essência">
          <LoadingSpinner message="Carregando dados..." size="md" />
        </CosmicCard>
      </div>
    );
  }

  const handleTransform = async () => {
    if (!inputText.trim() || inputText.length < 10) {
      toast.error("Texto muito curto", {
        description: "Digite pelo menos 10 caracteres",
      });
      return;
    }

    if (!balance?.isUnlimited && (!balance || balanceValue < 1)) {
      toast.error("Saldo insuficiente", {
        description: "Compre Dracmas para continuar",
      });
      return;
    }

    if (useCharacter) {
      setHasEditedRefinementNotes(false);
      setRefinementNotes("");
      setIsRefinementEditorOpen(false);
      try {
        await transform({
          characterId: selectedCharacterId,
          inputText,
          transformationType: selectedType,
          tone: tone || undefined,
          length,
        });
      } catch (error) {
        console.error("Erro ao transformar com personagem:", error);
      }
      return;
    }

    try {
      const { useCreateTransformation } = await import("@/hooks/useTransformation");
      toast.info("Usando sistema de transformação padrão", {
        description: "Para usar personagens, ative a opção acima",
      });
    } catch (error) {
      console.error("Erro ao criar transformação:", error);
      toast.error("Erro ao processar", {
        description: "Tente novamente",
      });
    }
  };

  const handleRefresh = async () => {
    if (!useCharacter) {
      toast.info("Ative um personagem para aplicar ajustes.");
      return;
    }

    if (!transformedText) {
      toast.info("Transmute um texto antes de aplicar ajustes.");
      return;
    }

    if (!isRefinementEditorOpen) {
      setIsRefinementEditorOpen(true);
      setHasEditedRefinementNotes(false);
      setRefinementNotes("");
      return;
    }

    if (!canApplyAdjustments) {
      toast.info("Escreva uma instrução de ajuste antes de aplicar.");
      return;
    }

    const manualHints = refinementNotes
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .slice(0, 5)
      .map((line) => line.slice(0, 240));

    const combinedHints = Array.from(new Set([...(defaultRefinementRules || []), ...manualHints])).slice(0, 5);

    setIsRefreshPending(true);

    try {
      await refresh({
        refinementHints: combinedHints,
        currentOutput: transformedText,
      });
      toast.success("Ajuste aplicado!", {
        description: "As instruções de refinamento foram enviadas.",
      });
    } catch (error: any) {
      toast.error("Erro ao aplicar ajuste", {
        description: error?.message || "Não foi possível aplicar o ajuste",
      });
    } finally {
      setIsRefreshPending(false);
    }
  };

  const handleClearForm = () => {
    setInputText("");
    setSelectedType("post");
    setTone("");
    setLength("medium");
    setSelectedCharacterId(undefined);
    setUseCharacter(initialUseCharacter);
    setHasEditedRefinementNotes(false);
    setRefinementNotes(defaultRefinementText);
    setIsRefinementEditorOpen(false);
    reset();
  };

  return (
    <div className="space-y-6">
      <CosmicCard title="Transmutação de Texto" description="GPT + Sua Essência">
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <RuneIcon icon={Zap} size="sm" />
            <p className="text-sm text-muted-foreground">
              Transforme ideias em conteúdo alinhado com sua voz criativa
            </p>
          </div>

          <div className="space-y-4">
            <CharacterSelector
              characters={characters}
              selectedCharacterId={selectedCharacterId}
              useCharacter={useCharacter}
              isTransforming={isProcessing}
              onToggleUseCharacter={setUseCharacter}
              onSelectCharacter={(value) => setSelectedCharacterId(value || undefined)}
            />

            <TransformationSettings
              selectedType={selectedType}
              onChangeType={setSelectedType}
              transformationLength={length}
              onChangeLength={setLength}
              tone={tone}
              onChangeTone={(value) => setTone(value ?? "")}
              isTransforming={isProcessing}
            />

            <TextInput
              value={inputText}
              onChange={setInputText}
              placeholder="Digite sua ideia ou prompt..."
              disabled={isProcessing}
            />

            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Saldo: {balance?.isUnlimited ? (
                  <span className="font-semibold text-primary flex items-center gap-1">
                    <span>Ƶ</span>
                    <span className="text-xs bg-primary/20 px-2 py-0.5 rounded-full">Ilimitado (Dev)</span>
                  </span>
                ) : (
                  <span className="font-semibold">{balanceValue}</span>
                )} Dracmas
              </span>
              <span className="text-muted-foreground">
                Custo: <span className="font-semibold">{balance?.isUnlimited ? "0" : "1"}</span> Dracma
              </span>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <CosmicButton
                mystical
                className="w-full"
                onClick={handleTransform}
                disabled={!canTransform || (useCharacter && !selectedCharacterId)}
                aria-busy={isProcessing}
              >
                <Zap className="w-4 h-4 mr-2" />
                {isProcessing ? "Transmutando..." : "Transmutar Texto"}
              </CosmicButton>

              <CosmicButton
                variant="outline"
                className="w-full sm:w-auto"
                onClick={handleClearForm}
                disabled={isProcessing}
              >
                Limpar campos
              </CosmicButton>
            </div>

            {!balance?.isUnlimited && balanceValue < 1 && (
              <p className="text-sm text-destructive text-center">
                Saldo insuficiente. Compre Dracmas para continuar.
              </p>
            )}

            {useCharacter && !selectedCharacterId && (
              <Alert>
                <Sparkles className="w-4 h-4" />
                <AlertDescription className="text-xs">
                  Selecione um personagem para usar na transformação.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </div>
      </CosmicCard>

      <TransformResultPanel
        ref={resultRef}
        transformedText={transformedText}
        highlight={highlightResult}
        guidanceRules={defaultRefinementRules}
        refinementNotes={refinementNotes}
        onChangeRefinementNotes={(value) => {
          setHasEditedRefinementNotes(true);
          setRefinementNotes(value);
        }}
        onRefresh={useCharacter ? handleRefresh : undefined}
        isRefreshing={isRefreshPending}
        disableRefresh={isRefinementEditorOpen ? (!useCharacter || isProcessing || !transformedText || !canApplyAdjustments) : (!useCharacter || isProcessing || !transformedText)}
        showRefinementEditor={isRefinementEditorOpen}
        refreshLabel={isRefinementEditorOpen ? "Aplicar ajuste" : "Invocar pergaminho"}
        onCopy={(text) => {
          navigator.clipboard.writeText(text);
          toast.success("Texto copiado!");
        }}
        onClear={() => {
          reset();
          setHighlightResult(false);
          setHasEditedRefinementNotes(false);
          setIsRefinementEditorOpen(false);
          setRefinementNotes(defaultRefinementText);
        }}
      />
      <TransformationOverlay
        isVisible={isCharacterTransforming || isRefreshPending}
        character={selectedCharacter}
        traceId={lastTraceId}
      />
    </div>
  );
};
