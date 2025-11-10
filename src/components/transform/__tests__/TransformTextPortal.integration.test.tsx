import React from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from "vitest";

let TransformTextPortal: typeof import("../TransformTextPortal").TransformTextPortal;

vi.mock("@/hooks/useProjects", () => ({
  useProjects: () => ({
    projects: [],
    createProject: vi.fn(async () => ({ id: "project-auto", name: "Projeto" })),
    isCreating: false,
    isLoading: false,
  }),
}));

vi.mock("@/hooks/useDracmas", () => ({
  useDracmas: () => ({
    balance: { balance: 10, isUnlimited: false },
    isLoading: false,
  }),
}));

vi.mock("@/hooks/useCharacters", () => ({
  useCharacters: () => ({
    characters: [
      {
        id: "char-1",
        user_id: "user-1",
        name: "Guardião da Luz",
        description: "Magia cósmica",
        is_default: true,
        personality_core: { traits: [], robotic_human: 50, clown_serious: 50 },
        communication_tone: {
          formality: "neutral",
          enthusiasm: "medium",
          style: [],
          use_emojis: false,
          use_slang: false,
          use_metaphors: false,
        },
        motivation_focus: { focus: "help", seeks: "harmony" },
        social_attitude: { type: "reactive", curiosity: "medium", reserved_expansive: 50 },
        cognitive_speed: { speed: "medium", depth: "medium" },
        vocabulary_style: { style: "neutral", complexity: "medium", use_figures: false },
        emotional_state: null,
        values_tendencies: ["neutral"],
        model_provider: "openai",
        model_name: "gpt-4o",
        metadata: null,
        created_at: "",
        updated_at: "",
      },
    ],
    defaultCharacter: null,
    transformWithCharacter: vi.fn(),
    isTransforming: false,
  }),
}));

vi.mock("@/hooks/useTransformText", () => ({
  useTransformText: ({ onSuccess }: any) => {
    const [isTransforming, setIsTransforming] = React.useState(false);
    const [transformedText, setTransformedText] = React.useState<string | null>(null);
    const [lastTraceId, setLastTraceId] = React.useState<string | null>(null);

    const transform = async () => {
      setIsTransforming(true);
      setLastTraceId("trace-123");
      await Promise.resolve();
      setTransformedText("Texto transformado!");
      setIsTransforming(false);
      onSuccess?.({ transformedText: "Texto transformado!", traceId: "trace-123" });
      return { transformedText: "Texto transformado!", traceId: "trace-123", metadata: { requestDurationMs: 0 } };
    };

    return {
      isTransforming,
      transformedText,
      lastTraceId,
      transform,
    };
  },
}));

vi.mock("@/lib/observability", () => ({
  Observability: {
    trackEvent: vi.fn(),
    trackError: vi.fn(),
  },
}));

const originalClipboard = navigator.clipboard;
const originalMatchMedia = typeof window.matchMedia === "function" ? window.matchMedia : null;

beforeAll(async () => {
  TransformTextPortal = (await import("../TransformTextPortal")).TransformTextPortal;
});

beforeEach(() => {
  Object.defineProperty(navigator, "clipboard", {
    value: {
      writeText: vi.fn().mockResolvedValue(undefined),
    },
    configurable: true,
  });
  window.matchMedia = vi.fn().mockImplementation(() => ({
    matches: false,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })) as unknown as typeof window.matchMedia;
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  Object.defineProperty(navigator, "clipboard", {
    value: originalClipboard,
    configurable: true,
  });
  if (originalMatchMedia) {
    window.matchMedia = originalMatchMedia;
  } else {
    delete (window as any).matchMedia;
  }
});

describe("TransformTextPortal integration", () => {
  it.skip("exibe overlay, mostra resultado e remove destaque", async () => {
    const scrollSpy = vi.fn();
    Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
      configurable: true,
      value: scrollSpy,
    });

    render(<TransformTextPortal initialUseCharacter />);

    const input = screen.getByLabelText(/Texto de Entrada/i);
    fireEvent.change(input, { target: { value: "Texto para transmutar completo" } });

    const button = screen.getByRole("button", { name: /Transmutar Texto/i });
    await waitFor(() => expect((button as HTMLButtonElement).disabled).toBe(false));
    await act(async () => {
      fireEvent.click(button);
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(document.querySelector('[data-testid="transformation-overlay"]')).not.toBeNull();
    });

    await screen.findByText(/Texto transformado!/i);
    await waitFor(() => {
      expect(document.querySelector('[data-testid="transformation-overlay"]')).toBeNull();
    });

    expect(scrollSpy).toHaveBeenCalled();

    const resultContainer = screen.getByTestId("transform-result-panel");
    expect(resultContainer.className.includes("animate-pulse")).toBe(true);

    vi.advanceTimersByTime(1600);

    expect(resultContainer.className.includes("animate-pulse")).toBe(false);
  });
});
