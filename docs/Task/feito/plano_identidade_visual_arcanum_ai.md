# Plano de Melhoria da Identidade Visual — Arcanum AI

titulo: plano_identidade_visual_arcanum_ai
autor: agente/ArcanumAI
responsavel: admin
data_criacao: 2025-11-07
status: draft
dependencias: [docs/excencial/desing.md, src/index.css, tailwind.config.ts, src/pages/Auth.tsx, src/pages/Index.tsx, src/pages/Profile.tsx]
criterios_aceitacao:
  - Consistência visual mística (violeta/dourado, runas, portais) em superfícies-chave
  - Acessibilidade básica: foco visível, aria-labels, lang correto, prefers-reduced-motion
  - PWA manifest e offline fallback coerentes
  - Componente “Guia Mago” funcional e testável (FSM, overlay acessível)
  - Estratégia de testes implementada (unit, integração, e2e)

objetivo:
- Elevar a identidade visual para uma experiência intimista guiada por um “mago”, alinhando todas as superfícies ao documento `desing.md` e garantindo testabilidade e acessibilidade.

escopo:
- Correções rápidas (lang, meta, gradientes utilitários), consolidação de Design System, criação do componente Guia Mago (ArcanoMentor), refino de navegação (Sidebar/Nav/Orb), acessibilidade e localização, PWA/assets, edge cases e performance.

---

## Etapas Incrementais (Checklist)

### Etapa 1 — Correções rápidas e fundamentos (VIS-02, VIS-01)
- [x] Definir `lang="pt-BR"` em `index.html` e revisar meta tags
- [x] Padronizar textos/labels com glossário místico (ex.: Login → Abrir o Portal)
- [x] Substituir gradientes inline por classes utilitárias (`gradient-cosmic`, `gradient-orb`, `cosmic-glow`) em Auth/Index/Profile

Teste (unit):
- [x] Verificar presença e uso de CSS variables (tokens) nas superfícies

Teste (integração):
- [x] Render de Auth/Index com classes utilitárias aplicadas; checar foco/aria

Teste (e2e):
- [x] Checar `lang`, PWA manifest e navegação básica; foco via teclado

---

### Etapa 2 — Design System e lint visual (VIS-03)
- [x] Documentar tokens, gradientes, animações em README (ui/theme)
- [x] Implementar utilitário de glossário místico com fallback
- [x] Adicionar regras de lint visual (evitar cores inline fora de HSL; preferir CSS vars)

Detalhamento de lint visual:
- [x] Adicionar stylelint com regra custom proibindo cores hardcoded (hex/rgb) e `linear-gradient` inline em JSX
- [x] Criar script estático (Node) que busca por `style={{` com gradientes/cores fora de HSL e falha no CI

Teste (unit):
- [x] Glossário: mapeamentos e fallback
- [x] Utilitários de animação e classes geradas

Teste (integração):
- [x] Alternância dark/light; `prefers-reduced-motion`

---

### Etapa 3 — Componente Guia Mago (ArcanoMentor) (VIS-04, TEST-01)
- [x] Projetar FSM de passos (boas-vindas → explorar → ação → conclusão)
- [x] Implementar overlay acessível (role=dialog, foco gerenciado)
- [x] Persistir preferências do usuário (opt-in/out) via localStorage
- [x] Conteúdo contextual por seção (Dashboard, Essência, Energia)
- [x] Microinterações: runas, portais, faíscas douradas

Personalidades e intensidade:
- [x] Parametrizar “personalidade” do ArcanoMentor (Mago da Lumen, Bruxa das Brumas, Alquimista de Códigos, Elementais)
- [x] Nível de intensidade (suave | padrão | profundo) com persistência de preferência

Som Arcano (diretrizes):
- [x] Adicionar toggle global de áudio (Som Arcano)
- [x] Sem autoplay; habilitar som apenas após gesto do usuário (compatível com mobile)
- [x] Volumes discretos e opcionais; fallback visual quando som estiver desativado

Teste (unit):
- [x] Transições da FSM e render condicional
 - [x] Troca de personalidade e intensidade

Teste (integração):
- [x] Componente acoplado às páginas; persistência de step
 - [x] Persistência de preferência de personalidade/intensidade; toggle de som

Teste (e2e):
- [x] Fluxo completo do wizard com validação de textos e animações
 - [x] Habilitação de som via gesto; comportamento em mobile (autoplay bloqueado)

---

### Etapa 4 — Refino de Sidebar/Nav/Orb (VIS-05)
- [x] Adicionar ícones de runas e transições de portal nos itens de navegação
- [x] Aplicar linguagem arquetípica consistente em labels e tooltips
- [x] Garantir foco visível e contraste adequado em dark/light

Badges temáticos (placeholders no Dashboard):
- [x] Incluir cards/badges não-interativos para módulos temáticos (Tarot AI, Numerologia Criativa, Magia Elemental, etc.)
- [x] Ícones/símbolos coerentes com desing.md; responsivos e leves

Teste (unit):
- [x] Render de itens com ícones/labels

Teste (integração):
- [x] Navegação por teclado, hover/focus, leitura por screen reader

---

### Etapa 5 — Acessibilidade e Localização (VIS-06)
- [x] Adicionar `aria-labels` e `role` em botões/componentes críticos
- [x] Implementar i18n básico (pt-BR, fallback en) incluindo o glossário
- [x] Respeitar `prefers-reduced-motion` (classe para reduzir animações)

Alto contraste e linguagem neutra:
- [x] Criar tokens específicos para modo `alto_contraste` (violeta/dourado com luminância/contraste ampliados)
- [x] Classe global para ativar `alto_contraste` e validação de legibilidade
- [x] Preferência de linguagem neutra: permitir fallback para termos padrão (desativar glossário místico por usuário)

Teste (unit):
- [x] Util de i18n; toggles de reduced-motion

Teste (integração):
- [x] Leitura de tela e navegação por teclado

---

### Etapa 6 — PWA e assets (VIS-07)
- [x] Revisar manifest (tema dinâmico, ícones); adicionar splash/gradient coerentes
- [x] Implementar offline fallback estilizado com narrativa mística

Teste (e2e):
- [x] Simular offline; checar fallback e ícones; consistência visual

---

### Etapa 7 — Edge cases e performance (VIS-08)
- [x] Degradar animações em dispositivos modestos (FPS/reduced-motion)
- [x] Preferir CSS keyframes; usar framer-motion apenas onde essencial
- [x] Validar alto contraste e legibilidade

Monitor de performance e modo suave:
- [x] Overlay dev-only medindo FPS e tempo de montagem de componentes animados
- [x] Ativar “modo suave” abaixo de limiar (reduzir blur/pulses; desabilitar animações pesadas)
- [x] Integrar com `prefers-reduced-motion` para consistência

Teste (integração/e2e):
- [x] Medir tempo de montagem com/sem animações; cenários mobile/lentos; alternância de temas

---

## Estratégia de Testes Global (TEST-01)
- [x] Configurar Jest + React Testing Library (unit/integração)
- [x] Configurar Playwright para e2e (navegação, PWA, offline)
- [x] Mocks de tema e ambiente (dark/light, reduced-motion)
- [x] Cobertura mínima: componentes críticos (ArcanoMentor, Sidebar/Nav/Orb), utilitários (glossário, animação), páginas (Auth/Index/Profile)

---

## Segurança de UI/PWA e Privacidade (SEC-01)

### Política de Conteúdo (CSP) e higiene da UI
- [x] Definir Content Security Policy (CSP) restritiva (headers ou meta):
  - `default-src 'self'`
  - `script-src 'self'` (preferir nonce)
  - `style-src 'self' 'unsafe-inline'` (dev); remover inline gradientes/cores e reduzir estilos inline
  - `img-src 'self' data: blob:`
  - `font-src 'self'`
  - `connect-src 'self' https://giozhrukzcqoopssegby.supabase.co`
  - `frame-ancestors 'none'`
  - `upgrade-insecure-requests`
- [x] Evitar `unsafe-inline` (migrar estilos inline para utilitários — já coberto em Etapa 1)

Teste (integração/e2e):
- [x] Validar funcionamento sob CSP restritiva nas páginas principais (Auth/Index/Profile)
- [x] Bloqueio de iframes não autorizados (frame-ancestors)

### Lint de segurança e sanitização
- [x] ESLint rule: proibir `dangerouslySetInnerHTML` sem sanitização explícita
- [x] Scanner: detectar `<a target="_blank">` sem `rel="noopener noreferrer"`
- [x] Proibir `eval`/`new Function` (regra lint)
- [x] Introduzir utilitário de sanitização com DOMPurify para qualquer HTML dinâmico (IA/usuário)
  - [x] Bloquear `script/iframe/style/on* handlers`

Teste (unit):
- [x] Sanitização contra payloads maliciosos (XSS, iframes, eventos)

Teste (integração):
- [x] Componentes que exibem HTML dinâmico devem chamar o utilitário; snapshot garantindo remoção de tags perigosas

### Permissões de mídia e Som Arcano (privacidade)
- [x] Solicitar microfone/câmera apenas após gesto explícito
- [x] Revogar streams ao fechar overlay (stopTracks)
- [x] Toggle “Som Arcano” sem autoplay; volumes discretos; sem gravação por padrão
- [x] Logs/métricas: nunca registrar PII (nome/e-mail/conteúdo sensível); mascarar por padrão

Teste (integração/e2e):
- [x] Simular permissão negada/concedida; assert de revogação de media tracks
- [x] Verificar que sem gesto não há som; payloads de erro/metric não contêm PII

### PWA e Service Worker (cache seguro)
- [x] Estratégia de cache: CacheFirst apenas para assets estáticos; NetworkOnly para rotas de auth/dados; no-cache para conteúdo logado/dinâmico
- [x] Logout deve limpar caches e storage relevantes (localStorage/IndexedDB) de artefatos sensíveis
- [x] Scope do service worker limitado; evitar interceptar chamadas de auth quando não necessário

Teste (e2e):
- [x] Offline: conteúdo sensível não é servido; fallback offline seguro (sem PII)
- [x] Logout: confirma limpeza de caches/storage

### Observabilidade e privacidade
- [x] Configurar Sentry/LogRocket com scrubbing de PII (e-mail, nomes, tokens) — placeholder Observability com scrub
- [x] Desabilitar gravação de campos sensíveis (senha/credenciais); limitar sampling em prod
- [x] Proibir logs com chaves/envs; mascarar headers de auth nos network logs (evitar logar Authorization)

Teste (integração):
- [x] Simular exceções e inspecionar payloads enviados (sem PII)

### Links externos e navegação segura
- [x] Para links externos: sempre `rel="noopener noreferrer"`; aviso sutil “Você está indo para um portal externo” em ações críticas

Teste (unit):
- [x] Util para composição de links externos com atributos corretos

### Armazenamento e tokens (auth)
- [x] Nunca logar tokens; usar storage somente para sessão
- [x] Em logout: remover sessão e limpar artefatos locais associados ao usuário

Teste (integração):
- [x] signOut limpa sessão e storage; fluxos não imprimem tokens/IDs

---

## Riscos e Mitigações
- Animações pesadas em dispositivos modestos → reduzir/otimizar; habilitar reduced-motion
- Inconsistência de linguagem mística → utilitário glossário aplicado nos componentes
- Acessibilidade insuficiente → validação com screen reader e testes de foco

---

## Progresso
- Para marcar o que foi feito, altere `[ ]` para `[x]` e atualize `status` para `in_review` ou `completed`.
- Registre `data_atualizacao` e `responsavel` a cada alteração relevante.
