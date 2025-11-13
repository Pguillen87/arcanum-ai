import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import type { Character } from "@/schemas/character";
import { CharacterSelector } from "../CharacterSelector";

const baseCharacters: Character[] = [
  {
    id: "char-1",
    user_id: "user-1",
    name: "Mago Totó",
    description: "Guardião padrão",
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
  },
];

describe("CharacterSelector", () => {
  it("não renderiza quando não há personagens", () => {
    const { container } = render(
      <CharacterSelector
        characters={[]}
        selectedCharacterId={undefined}
        useCharacter={false}
        onToggleUseCharacter={vi.fn()}
        onSelectCharacter={vi.fn()}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it("alterna o uso de personagem ao clicar no checkbox", async () => {
    const toggleSpy = vi.fn();
    render(
      <CharacterSelector
        characters={baseCharacters}
        selectedCharacterId={undefined}
        useCharacter={false}
        onToggleUseCharacter={toggleSpy}
        onSelectCharacter={vi.fn()}
      />
    );

    const user = userEvent.setup();
    await user.click(screen.getByLabelText(/Usar Personagem/i));

    expect(toggleSpy).toHaveBeenCalledWith(true);
  });

  it("aplica borda cósmica quando personagem está ativo e desabilita seletor durante processamento", () => {
    const { container } = render(
      <CharacterSelector
        characters={baseCharacters}
        selectedCharacterId="char-1"
        useCharacter
        isTransforming
        onToggleUseCharacter={vi.fn()}
        onSelectCharacter={vi.fn()}
      />
    );

    const border = container.firstElementChild as HTMLElement | null;
    expect(border).not.toBeNull();
    expect(border?.className.includes("border-primary/60")).toBe(true);

    const combobox = screen.getByRole("combobox");
    expect((combobox as HTMLButtonElement).disabled).toBe(true);
  });
});
