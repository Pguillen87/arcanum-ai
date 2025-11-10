import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { TransformationSettings } from "../TransformationSettings";

const projects = [
  { id: "project-1", name: "Cofre Arcano" },
  { id: "project-2", name: "Expedição Estelar" },
];

describe("TransformationSettings", () => {
  it("desabilita controles durante processamento", () => {
    render(
      <TransformationSettings
        selectedType="post"
        onChangeType={vi.fn()}
        transformationLength="medium"
        onChangeLength={vi.fn()}
        tone="profissional"
        onChangeTone={vi.fn()}
        selectedProjectId="project-1"
        onChangeProject={vi.fn()}
        projects={projects}
        isTransforming
      />
    );

    const comboboxes = screen.getAllByRole("combobox");
    comboboxes.forEach((combobox) => {
      expect((combobox as HTMLButtonElement).disabled).toBe(true);
    });
  });

  it("não renderiza seletor de tom quando valor não é fornecido", () => {
    render(
      <TransformationSettings
        selectedType="post"
        onChangeType={vi.fn()}
        transformationLength="medium"
        onChangeLength={vi.fn()}
        tone=""
        selectedProjectId={undefined}
        onChangeProject={vi.fn()}
        projects={projects}
      />
    );

    expect(screen.queryByLabelText(/Tom/)).toBeNull();
  });
});
