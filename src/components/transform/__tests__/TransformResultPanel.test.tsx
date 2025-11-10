import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { TransformResultPanel } from "../TransformResultPanel";

describe("TransformResultPanel", () => {
  it("não renderiza sem texto transformado", () => {
    const { container } = render(<TransformResultPanel transformedText={null} />);
    expect(container.firstChild).toBeNull();
  });

  it("executa ações de copiar e limpar", async () => {
    const onCopy = vi.fn();
    const onClear = vi.fn();
    render(
      <TransformResultPanel
        transformedText="Texto mágico"
        onCopy={onCopy}
        onClear={onClear}
      />
    );

    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: /Copiar/i }));
    expect(onCopy).toHaveBeenCalledWith("Texto mágico");

    await user.click(screen.getByRole("button", { name: /Limpar/i }));
    expect(onClear).toHaveBeenCalled();
  });

  it("aplica destaque quando highlight está ativo", () => {
    const { container } = render(
      <TransformResultPanel transformedText="Energia" highlight />
    );

    const root = container.firstElementChild as HTMLElement | null;
    expect(root).not.toBeNull();
    expect(Boolean(root?.className.includes("animate-pulse"))).toBe(true);
  });
});
