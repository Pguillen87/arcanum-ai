# Plano de Validação – Transmutação com Personagens

## 🎯 Objetivo
Elevar a confiança no diagnóstico da falha 403 durante a transmutação com personagens para ≥ 90%, coletando evidências que confirmem (ou refutem) as hipóteses levantadas sem alterar a lógica existente.

## 🔍 Contexto Atual
- Frontend `TransformTextPortal` envia mutação `transformWithCharacter` quando `useCharacter` está ativo.
- Edge Function `brand_voice_transform` prioriza `characterId`, validando ownership direto na tabela `characters`.
- Erro observado: `403 | Personagem não encontrado ou acesso negado`, indicando que o ID não foi encontrado ou não pertence ao usuário autenticado.
- Warning adicional: `Select is changing from uncontrolled to controlled`, sugerindo possível perda de estado no componente que provê `characterId`.

## 🛠️ Estratégia Geral
Dividir a validação em quatro frentes complementares:
1. **Payload da requisição** – confirmar o que sai do frontend.
2. **Persistência no banco** – validar a integridade dos dados em `characters` e `brand_profiles`.
3. **Comportamento do componente** – investigar o warning do `Select` e garantir que o estado não é limpo antes do submit.
4. **Instrumentação temporária** – adicionar observabilidade no Edge Function apenas se as etapas anteriores não elevarem a confiança.

## ✅ Checklist de Evidências
| Etapa | Evidência Necessária | Resultado Esperado |
|-------|----------------------|--------------------|
| A | Request Payload mostra `characterId` preenchido (UUID válido) | Confirma uso do fluxo de personagens |
| B | Registro em `characters` com `id` = payload e `user_id` = usuário atual | Ownership consistente |
| C | Warning do `Select` identificado (momento e causa) | Determinar se afeta estado |
| D | (Opcional) Log estruturado na Edge Function exibindo `{ userId, characterId, branch }` | Provar branch executada |

## 📋 Passo a Passo Detalhado

### 1. Capturar Payload Real
1. Abrir a aba **Network** → selecionar a requisição `POST .../brand_voice_transform`.
2. Salvar o JSON completo de "Request Payload" (campos `characterId`, `brandProfileId`, `inputText`, etc.).
3. Verificar se `characterId` é UUID válido (formato 8-4-4-4-12). 
4. Caso esteja vazio ou ausente, repetir a operação observando se a seleção do personagem realmente persiste antes do clique.

> **Resultado esperado:** confirmar se o backend recebe o ID correto. Se não, focar na correção do estado no frontend.

### 2. Validar Persistência no Supabase
Utilizar o Supabase CLI com o `project_ref` do ambiente:
```bash
supabase db remote exec --project-ref <PROJECT_REF> --command "
select id, user_id, name, is_default, created_at
from characters
order by created_at desc
limit 5;
"
```
- Conferir se o `id` retornado corresponde ao payload capturado.
- Garantir que `user_id` coincide com `auth.uid()` do usuário logado.

Checar perfis legados para descartar confusão com fallback:
```bash
supabase db remote exec --project-ref <PROJECT_REF> --command "
select id, user_id, name, archived_at
from brand_profiles
order by created_at desc
limit 5;
"
```
- Se existirem brand profiles antigos, anotar seus IDs para confirmar que não coincidem com o enviado.

> **Resultado esperado:** confirmar que existe personagem válido vinculado ao usuário e que não há colisão de IDs.

### 3. Investigar Warning do `Select`
1. Acionar o fluxo no frontend com DevTools aberto em **Console**.
2. Registrar exatamente em que ação a mensagem “Select is changing from uncontrolled to controlled” aparece.
3. Revisar o estado local em `TransformTextPortal` (via React DevTools, se disponível) para verificar se `selectedCharacterId` volta para `undefined`.
4. Caso necessário, adicionar `console.debug` temporário no componente para logar `selectedCharacterId` antes de chamar `transformWithCharacter`.

> **Resultado esperado:** determinar se o warning impacta o valor enviado. Se sim, planejar ajuste no estado (futuro).

### 4. Instrumentação Temporária (Fallback)
Se as etapas 1–3 não elevarem a confiança a ≥ 90%, adicionar logs na Edge Function:
```typescript
console.log(JSON.stringify({
  event: 'debug_character_transform',
  userId: auth.userId,
  characterId: body.characterId ?? null,
  brandProfileId: body.brandProfileId ?? null,
  branch: isUsingCharacters ? 'characters' : 'brand_profile',
}));
```
- Implantar a função, reproduzir o erro e capturar os logs no painel do Supabase.
- Remover os logs após validação (seguir diretrizes de segurança: sem PII além do UUID).

> **Resultado esperado:** confirmar qual branch do código é executada e com quais valores.

## 🧭 Fluxo Resumido
```
[UI Seleciona Personagem]
          │
          ▼
[Request Payload]
          │            (Etapa 1)
          ▼
[Edge Function brand_voice_transform]
          │
          ├── valida ownership em `characters` → (Etapa 2)
          │
          └── fallback brand_profiles
```

## 📈 Critério de Sucesso
- Todas as evidências A, B e C coletadas com resultados conclusivos → confiança ≥ 90%.
- Se necessário, a evidência D (log) confirma definitivamente o branch seguido.

## ⚠️ Riscos & Mitigações
- **ID de projeto incorreto no CLI**: validar primeiro com `supabase projects list`.
- **Sessão expirada durante coleta**: repetir captura após reautenticação.
- **Logs não sanitizados**: aplicar scrubbing (`***-uuid-***`) caso replique em produção.

## 📌 Próximos Passos
1. Executar etapas 1 e 2 em ambiente atual e registrar resultados.
2. Avaliar warning (etapa 3) e documentar comportamento observado.
3. Se ainda houver dúvidas, instrumentar a Edge Function (etapa 4) e coletar logs.
4. Consolidar achados e atualizar a confiança.

## 🔐 Análise de Segurança e Recomendações
- **Cobertura de evidências**: o plano aborda payload, integridade no banco e comportamento do componente, mas sugiro registrar explicitamente a origem da requisição (`origin`/`referer`) ao coletar o payload para confirmar que não há chamada fora do domínio esperado.
- **Proteção de dados**: ao exportar logs via Supabase CLI ou DevTools, remova tokens/headers sensíveis antes de compartilhar com outros times. Se for necessário guardar evidências, utilize repositório interno com controle de acesso.
- **Validação adicional**: incluir verificação rápida de políticas RLS relacionadas (tabelas `characters` e `brand_profiles`). Podemos rodar `select * from pg_policies where tablename in ('characters','brand_profiles');` para garantir que as políticas atuais correspondem ao comportamento esperado.
- **Mitigação preventiva**: caso a etapa 4 (instrumentação) seja acionada, recomenda-se encapsular os logs em helper que aplica scrubbing (já existe função `scrubPII`, mas vale reforçar no plano). Também definir no plano a remoção obrigatória desses logs após a coleta.
- **Seguimento**: após obter confiança ≥ 90%, abrir tarefa separada para corrigir o warning do `Select` (mesmo que não seja a causa imediata) a fim de evitar regressões futuras na seleção de personagens.

> **Próximo passo sugerido**: executar `supabase db remote exec` para listar `characters`, validar RLS e confirmar o payload na aba Network. Em seguida, atualize este documento com as evidências coletadas antes de envolver outros agentes.

## 🧠 Análise Arquitetural e Melhorias Futuras
- **Consistência de estado no frontend**: o warning sobre `Select` indica que o componente inicia como não controlado. Recomendo documentar no plano que, assim que a falha for confirmada, deve-se estabilizar o estado (`selectedCharacterId`) usando `useEffect` para hidratar o valor inicial e evitar flicker.
- **Contratos de APIs**: sugerir captura dos headers `x-client-version` ou similar no payload, permitindo identificar rapidamente qual versão do frontend estava ativa durante o teste. Isso ajuda futuros diagnósticos quando coexistirem builds diferentes.
- **Fallback legacy**: o plano poderia incluir uma checagem rápida do `characterService` para garantir que o fallback `brandProfileId` não sobrepõe o valor de `characterId` (hoje está duplicado). Podemos planejar revisão do contrato após o diagnóstico para remover esse campo redundante e evitar ambiguidade.
- **Telemetria proativa**: após a validação, vale registrar no backlog a criação de métrica específica (`character_transform.success_rate`) com tag `has_character=true`. Isso permitirá monitorar regressões no futuro sem depender de logs ad hoc.
- **Sequência de execução**: acrescentar ao plano a recomendação de executar as verificações em ambiente de staging antes de produção, garantindo que qualquer instrumentação temporária seja validada em contexto seguro.

> **Sugestão adicional**: crie uma seção “Evidências coletadas” no documento para que cada agente registre payload, consultas SQL e prints associados. Isso facilita rastreabilidade e evita duplicidade de esforços.

## 🔭 Análise de Observabilidade e Performance
- **Instrumentação mínima**: antes de habilitar logs temporários, recomendo configurar um contador em `Observability.trackEvent` no frontend sempre que `transformWithCharacter` for disparado, com tags `has_character=true/false`. Isso permitirá correlacionar tentativas com falhas sem depender apenas do Supabase.
- **Correlações de erro**: ao coletar payloads, acrescente um campo `traceId` (por exemplo, `crypto.randomUUID()` no frontend) e envie tanto para o Edge Function quanto para o logger do app, facilitando cruzar eventos client/server durante a análise.
- **Alertas provisórios**: criar regra de alerta temporária no Supabase ou na stack de observabilidade existente para disparar quando houver ≥3 erros 403 em 5 minutos na função `brand_voice_transform`. Assim podemos saber rapidamente se a correção futura regrediu.
- **Performance**: ao verificar os chunks de similaridade (quando habilitados), registre o tempo gasto na busca `findSimilarChunks` e inclua nos logs coletados. Isso garante que eventuais ajustes futuros não degradem o tempo de resposta.
- **Follow-up**: após o diagnóstico, sugiro mapear quais métricas devem permanecer permanentes (ex.: taxa de sucesso, latência média, consumo de Dracmas) e documentar no backlog de observabilidade para implementação definitiva.

> **Próxima ação recomendada**: adicionar ao plano a criação do `traceId` e do evento de contagem antes de executar as etapas de coleta, garantindo que os dados sejam consistentes caso múltiplos agentes auxiliem na investigação.

## 🧾 Evidências coletadas
| Item | Status | Observações |
|------|--------|-------------|
| Payload `brand_voice_transform` com `traceId` e `characterId` | ✅ Coletado | `characterId: "87b7d0b3-fd48-4c41-9300-30d60f8988a0"`, `traceId: "779f79be-304c-4af1-bff0-e78b0555afc5"` enviados corretamente. |
| Métrica `metric.character_transform_success_rate` | Ativa | Eventos permanentes emitidos via `Observability.trackEvent` para sucesso/falha com `traceId`, `hasCharacter`, `length` e `transformationType`. |
| Consulta Supabase `characters`/`brand_profiles`