# Pull Request Template

## Descrição

<!-- Descreva brevemente o que esta PR faz e por que é necessária -->

## Tipo de Mudança

<!-- Marque com [x] as opções aplicáveis -->

- [ ] 🐛 Bug fix (mudança que corrige um problema)
- [ ] ✨ Nova funcionalidade (mudança que adiciona funcionalidade sem quebrar existente)
- [ ] 💥 Breaking change (mudança que quebra funcionalidade existente)
- [ ] 📝 Documentação (mudança apenas em documentação)
- [ ] 🔧 Refatoração (mudança que não corrige bug nem adiciona funcionalidade)
- [ ] ⚡ Performance (mudança que melhora performance)
- [ ] ✅ Testes (adição ou correção de testes)
- [ ] 🎨 Estilo (formatação, ponto e vírgula faltando, etc; sem mudança de lógica)

## Checklist

### Código
- [ ] Meu código segue os padrões de estilo do projeto
- [ ] Realizei uma auto-revisão do meu código
- [ ] Comentei código complexo onde necessário
- [ ] Minhas mudanças não geram novos warnings
- [ ] Adicionei testes que provam que minha correção é efetiva ou que minha funcionalidade funciona
- [ ] Testes unitários novos e existentes passam localmente com minhas mudanças
- [ ] Testes de integração novos e existentes passam localmente com minhas mudanças

### Testes
- [ ] ✅ Testes unitários adicionados/atualizados
- [ ] ✅ Testes de integração adicionados/atualizados (se aplicável)
- [ ] ✅ Testes E2E adicionados/atualizados (se aplicável)
- [ ] ✅ Cobertura de código mantida ou aumentada (>80% para código crítico)

### Documentação
- [ ] ✅ Documentação atualizada (README, ADRs, OpenAPI, etc.)
- [ ] ✅ Comentários adicionados em código complexo
- [ ] ✅ CHANGELOG atualizado (se aplicável)

### Segurança
- [ ] ✅ RLS policies verificadas (se mudanças em DB)
- [ ] ✅ PII scrubbing verificado (se mudanças em logs/APIs)
- [ ] ✅ Validação de inputs implementada
- [ ] ✅ Rate limiting verificado (se mudanças em Edge Functions)

### Performance
- [ ] ✅ Queries otimizadas (se mudanças em DB)
- [ ] ✅ Índices criados/atualizados se necessário
- [ ] ✅ Bundle size verificado (se mudanças no frontend)

### Migrações
- [ ] ✅ Migrações SQL testadas localmente
- [ ] ✅ Rollback testado (se migração destrutiva)
- [ ] ✅ Migração documentada

### Edge Functions
- [ ] ✅ Rate limiting implementado
- [ ] ✅ PII scrubbing implementado
- [ ] ✅ CORS configurado
- [ ] ✅ Error handling adequado
- [ ] ✅ Idempotência implementada (se aplicável)

## Como Testar

<!-- Descreva os passos para testar suas mudanças -->

1. Passo 1
2. Passo 2
3. Passo 3

## Screenshots (se aplicável)

<!-- Adicione screenshots se sua mudança afeta a UI -->

## Checklist de Revisão

### Revisor: Por favor, verifique:

- [ ] Código segue padrões do projeto
- [ ] Testes adequados e passando
- [ ] Documentação atualizada
- [ ] Segurança verificada
- [ ] Performance adequada
- [ ] Sem breaking changes não documentados

## Notas Adicionais

<!-- Adicione qualquer informação adicional que possa ser útil para revisores -->

## Relacionado

<!-- Link para issues relacionadas -->
Closes #

