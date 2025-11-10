# UI/Theme — Tokens, Gradientes e Animações

Este documento resume os tokens e utilitários visuais do Arcanum.AI.

## Tokens (CSS Variables)
- `--background`, `--foreground`
- `--primary`, `--secondary`, `--accent`, `--muted`, `--destructive`
- `--border`, `--input`, `--ring`
- `--gradient-cosmic`, `--gradient-aurora`, `--gradient-orb`
- `--glow-violet`, `--glow-gold`

Os tokens são definidos em `src/index.css` (HSL). Em `tailwind.config.ts`, as cores referenciam `hsl(var(--...))`.

## Utilitários de Gradiente e Efeitos
- `.gradient-cosmic` → `background: var(--gradient-cosmic)`
- `.gradient-aurora` → `background: var(--gradient-aurora)`
- `.gradient-orb` → `background: var(--gradient-orb)`
- `.glass-cosmic` → efeito translúcido com blur e borda suave
- `.cosmic-glow` → sombra mística (violeta e dourado)

Evite gradientes inline em JSX; use utilitários acima.

## Animações (classes)
- `.animate-cosmic-pulse`, `.animate-glow-pulse`, `.animate-fade-in`
- `.animate-rune-pulse`, `.animate-rune-shatter`, `.animate-rune-reform`

Em `prefers-reduced-motion: reduce` ou quando `html` tem classe `reduced-motion`, animações são desativadas.

## Tema
- Alternância via classe `html.dark` / `html.light` (ver `ThemeToggle`)
- Inicialização em `main.tsx` (usa `localStorage('theme')`)

## Padrões
- Apenas HSL em tokens e cores.
- CSP-friendly: sem `style` inline para gradientes; preferir classes utilitárias.