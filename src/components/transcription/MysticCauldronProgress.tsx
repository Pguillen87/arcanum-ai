import { cn } from "@/lib/utils";
import { Loader2, AlertTriangle } from "lucide-react";

interface MysticCauldronProgressProps {
  progress: number;
  label: string;
  stalled?: boolean;
}

export function MysticCauldronProgress({ progress, label, stalled = false }: MysticCauldronProgressProps) {
  const normalized = Math.max(0, Math.min(progress, 100));
  const isComplete = normalized >= 100 && !stalled;

  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <div className="relative flex h-20 w-20 items-center justify-center">
        <div
          className={cn(
            "h-20 w-20 rounded-full border-4 border-mystic-400/60 bg-mystic-600/30",
            "shadow-[0_0_20px_rgba(124,58,237,0.45)] transition-colors",
            stalled ? "border-destructive/70" : undefined,
          )}
        >
          <div
            className="absolute inset-0 rounded-full border-4 border-mystic-200/40"
            style={{
              clipPath: `polygon(0% 100%, 0% ${100 - normalized}%, 100% ${100 - normalized}%, 100% 100%)`,
            }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            {stalled ? (
              <AlertTriangle className="h-8 w-8 text-destructive" />
            ) : !isComplete ? (
              <Loader2 className="h-8 w-8 animate-spin text-mystic-200" />
            ) : (
              <span className="text-xl font-semibold text-mystic-100">✨</span>
            )}
          </div>
        </div>
      </div>
      <div className="space-y-1">
        <div className="text-sm font-medium text-foreground">{label}</div>
        {!stalled && !isComplete && (
          <div className="text-xs text-muted-foreground">{Math.round(normalized)}%</div>
        )}
      </div>
    </div>
  );
}

