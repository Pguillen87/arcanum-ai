import { useState, useEffect, useCallback } from "react";

export type PortalPhase = "closed" | "opening" | "open" | "closing";

interface UsePortalAnimationProps {
  isOpen: boolean;
  openDuration?: number;
  closeDuration?: number;
  onOpenComplete?: () => void;
  onCloseComplete?: () => void;
}

export const usePortalAnimation = ({
  isOpen,
  openDuration = 400,
  closeDuration = 300,
  onOpenComplete,
  onCloseComplete,
}: UsePortalAnimationProps) => {
  const [phase, setPhase] = useState<PortalPhase>("closed");

  useEffect(() => {
    if (isOpen) {
      setPhase("opening");
      const timer = setTimeout(() => {
        setPhase("open");
        onOpenComplete?.();
      }, openDuration);
      return () => clearTimeout(timer);
    } else if (phase !== "closed") {
      setPhase("closing");
      const timer = setTimeout(() => {
        setPhase("closed");
        onCloseComplete?.();
      }, closeDuration);
      return () => clearTimeout(timer);
    }
  }, [isOpen, openDuration, closeDuration, onOpenComplete, onCloseComplete, phase]);

  const isFullyOpen = phase === "open";
  const isFullyClosed = phase === "closed";
  const isAnimating = phase === "opening" || phase === "closing";

  return {
    phase,
    isFullyOpen,
    isFullyClosed,
    isAnimating,
  };
};
