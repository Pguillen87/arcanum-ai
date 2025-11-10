<!-- 302efa48-e4f7-42b1-ad65-511e5d87a20c 41f03e2e-0cb7-4a9f-a00f-9a7fbaf3bcaf -->
# Plano: Ajustes de Hints e Setup de Personagens

## Objetivo

1. Garantir que tooltips (“grimórios”) nunca saiam da tela, reposicionando automaticamente conforme o espaço disponível.
2. Exibir um tooltip introdutório ao abrir o modal “Criar Novo Personagem”, ligado ao título, que feche ao interagir.
3. Orientar como aplicar as migrations de Supabase para liberar a tabela `characters`.

## Etapas

### Ajuste de Tooltips Dinâmicos

- Atualizar `GrimoireHint.tsx` para habilitar cálculo de posicionamento automático (`avoidCollisions`, `collisionPadding`) e fallback de lado (`side`, `align`).
- Garantir largura e quebras de linha adequadas sem cortar conteúdo.

### Tooltip Inicial do Modal

- Adicionar ícone de grimório ao lado do título em `CharacterCreator.tsx`.
- Tooltip abre por padrão ao montar o modal e fecha ao passar o mouse/toque.
- Conteúdo explica a tela e possibilidades de cada personagem.

### Documentação de Migrations

- Criar seção na documentação (ou arquivo README específico já existente) com comandos Supabase CLI para aplicar migrations pendentes (`supabase db push` ou `supabase migration up`).

## Arquivos Principais

- `src/components/ui/mystical/GrimoireHint.tsx`
- `src/components/characters/CharacterCreator.tsx`
- `docs/` (arquivo a definir conforme estrutura existente)

## Considerações de Teste

- Testar tooltips com viewport estreito e modal rolado para baixo.
- Confirmar que tooltip inicial fecha ao interagir.
- Validar que instruções de migration são claras e acionáveis.￼￼￼

### To-dos

- [ ] Ajustar GrimoireHint para reposicionamento automático e evitar overflow
- [ ] Adicionar tooltip introdutório no título do modal e impedir abertura automática dos demais
- [ ] Documentar passos para aplicar migrations do Supabase e criar tabela de personagens