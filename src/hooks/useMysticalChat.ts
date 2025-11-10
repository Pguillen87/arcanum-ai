import { useState, useCallback, useMemo } from 'react';
import { MysticalModule, mysticalModules } from '@/data/mysticalModules';

interface UseMysticalChatReturn {
  openChat: (moduleId: string | null) => void;
  isChatOpen: boolean;
  currentAgent: MysticalModule | null;
  closeChat: () => void;
}

export function useMysticalChat(): UseMysticalChatReturn {
  const [currentModuleId, setCurrentModuleId] = useState<string | null>(null);

  const openChat = useCallback((moduleId: string | null) => {
    setCurrentModuleId(moduleId);
  }, []);

  const closeChat = useCallback(() => {
    setCurrentModuleId(null);
  }, []);

  const currentAgent = useMemo(() => {
    if (!currentModuleId) return null;
    const module = mysticalModules.find((module) => module.id === currentModuleId);
    if (!module) {
      if (import.meta.env.DEV) {
        console.warn(`Module ${currentModuleId} not found`);
      }
      return null;
    }
    return module;
  }, [currentModuleId]);

  return {
    openChat,
    isChatOpen: !!currentModuleId,
    currentAgent,
    closeChat,
  };
}

