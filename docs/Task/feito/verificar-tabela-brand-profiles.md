# Guia de Verificação e Criação da Tabela brand_profiles

Este guia explica como verificar se a tabela `brand_profiles` (e tabelas relacionadas) existe no banco de dados e como aplicá-la caso necessário.

## Visão Geral

O módulo Brand Voice requer três tabelas principais:
- `brand_profiles` - Perfis de voz da marca
- `brand_samples` - Amostras de texto para treinamento
- `brand_embeddings` - Embeddings vetoriais para busca por similaridade

## Métodos de Verificação

### Método 1: Script NPM Automatizado (Recomendado)

O projeto inclui scripts automatizados para verificação e aplicação de migrations.

#### Verificar se as tabelas existem

```bash
npm run verify:brand-voice
```

Este comando:
- Verifica se todas as 3 tabelas necessárias existem
- Mostra o status de cada tabela
- Indica se a migration é necessária

**Saída esperada:**
```
🔍 Verificando tabelas do Brand Voice...

📊 Status das tabelas:
  ✅ brand_profiles: existe
  ✅ brand_samples: existe
  ✅ brand_embeddings: existe

✅ Todas as tabelas necessárias existem!
```

#### Aplicar migration automaticamente

```bash
npm run migrate:brand-voice
```

Este comando:
- Verifica o estado atual das tabelas
- Aplica a migration se necessário
- Verifica novamente após aplicação
- Fornece instruções para próximos passos

**Requisitos:**
- Supabase CLI instalado (`npm install -g supabase` ou via npm)
- Projeto linkado (`supabase link --project-ref <project-ref>`)
- OU variáveis de ambiente: `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY`

### Método 2: Script SQL Manual

Para verificação manual via SQL Editor do Supabase:

1. Acesse o [Supabase Dashboard](https://app.supabase.com)
2. Vá em **SQL Editor**
3. Abra o arquivo `supabase/scripts/check-brand-voice-tables.sql`
4. Execute o script completo ou seções específicas

O script fornece verificações detalhadas:
- Existência das tabelas
- Estrutura (colunas, tipos)
- Índices
- RLS Policies
- Extensão pgvector
- Constraints e Foreign Keys
- Triggers
- Resumo completo

### Método 3: Utilitário TypeScript (Frontend)

O código frontend inclui utilitários para verificação:

```typescript
import { 
  checkBrandVoiceSchema, 
  checkBrandVoiceSchemaDetailed,
  clearSchemaCache 
} from '@/utils/checkBrandVoiceSchema';

// Verificação simples
const status = await checkBrandVoiceSchema();
// Retorna: 'ready' | 'migration_required' | 'error'

// Verificação detalhada
const detailed = await checkBrandVoiceSchemaDetailed();
// Retorna: {
//   status: 'ready' | 'migration_required' | 'error',
//   tables: [{ name: string, exists: boolean }],
//   allTablesExist: boolean
// }

// Limpar cache (útil após aplicar migration)
clearSchemaCache();
```

## Aplicação de Migration

### Via Script NPM (Automático)

```bash
npm run migrate:brand-voice
```

### Via Supabase CLI

```bash
# Aplicar todas as migrations pendentes
supabase db push

# OU aplicar migration específica
supabase migration up
```

### Via Dashboard (Manual)

1. Acesse o [Supabase Dashboard](https://app.supabase.com)
2. Vá em **SQL Editor**
3. Abra `supabase/migrations/20250115000001_create_brand_voice_tables.sql`
4. Copie todo o conteúdo
5. Cole no SQL Editor
6. Execute (Ctrl+Enter / Cmd+Enter)

## Regeneração de Tipos TypeScript

Após aplicar a migration, é importante regenerar os tipos TypeScript:

```bash
npm run types:generate
```

Este comando:
- Gera tipos atualizados do Supabase
- Inclui `brand_profiles` e tabelas relacionadas
- Atualiza `src/integrations/supabase/types.ts`

**Nota:** Requer autenticação com Supabase CLI:
```bash
supabase login
supabase link --project-ref giozhrukzcqoopssegby
```

## Verificação Pós-Migration

Após aplicar a migration, verifique:

### 1. Tabelas Criadas

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('brand_profiles', 'brand_samples', 'brand_embeddings');
```

Deve retornar 3 linhas.

### 2. RLS Policies Ativas

```sql
SELECT tablename, policyname
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('brand_profiles', 'brand_samples', 'brand_embeddings');
```

Deve retornar:
- `brand_profiles`: 4 policies
- `brand_samples`: 4 policies  
- `brand_embeddings`: 3 policies

### 3. Teste no Frontend

1. Recarregue a aplicação
2. Acesse o portal "Essência - DNA Criativo"
3. O aviso de migration pendente deve desaparecer
4. Você deve conseguir treinar uma nova voz da marca

## Troubleshooting

### Erro: "Supabase CLI não encontrado"

**Solução:**
```bash
# Instalar globalmente
npm install -g supabase

# OU usar via npx (já incluído no projeto)
npx supabase --version
```

### Erro: "Projeto não linkado"

**Solução:**
```bash
# Linkar projeto
supabase link --project-ref giozhrukzcqoopssegby

# OU usar variáveis de ambiente
export SUPABASE_URL=https://giozhrukzcqoopssegby.supabase.co
export SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key
```

### Erro: "permission denied for schema public"

**Causa:** Sem permissões para criar tabelas.

**Solução:**
- Verifique se está usando a conta correta no Supabase
- Entre em contato com o administrador do projeto
- Use o método via Dashboard (requer permissões de owner)

### Erro: "extension 'vector' does not exist"

**Causa:** pgvector não disponível no plano.

**Solução:**
- Isso é esperado em planos gratuitos
- A migration continua funcionando usando JSONB como fallback
- Para usar pgvector, considere fazer upgrade do plano

### Migration aplicada mas aviso ainda aparece

**Causa:** Cache do navegador ou verificação ainda não executada.

**Solução:**
1. Limpe o cache do utilitário: `clearSchemaCache()` no console do navegador
2. Recarregue a página com `Ctrl+Shift+R` (ou `Cmd+Shift+R` no Mac)
3. Verifique se a tabela realmente existe no banco usando o script SQL

### Tipos TypeScript não atualizados

**Solução:**
1. Execute `npm run types:generate`
2. Verifique se `brand_profiles` aparece em `src/integrations/supabase/types.ts`
3. Se não aparecer, verifique se a migration foi aplicada corretamente
4. Reinicie o servidor de desenvolvimento

### Script npm não funciona

**Verificações:**
1. `tsx` está instalado? (`npm install` deve instalar automaticamente)
2. Scripts estão no `package.json`? (verifique seção `scripts`)
3. Você está na raiz do projeto?

**Solução alternativa:**
```bash
# Executar diretamente com tsx
npx tsx scripts/verify-and-apply-brand-voice-migration.ts verify
npx tsx scripts/verify-and-apply-brand-voice-migration.ts migrate
```

## Estrutura de Arquivos

```
arcanum-ai/
├── scripts/
│   └── verify-and-apply-brand-voice-migration.ts  # Script de verificação/aplicação
├── supabase/
│   ├── migrations/
│   │   └── 20250115000001_create_brand_voice_tables.sql  # Migration principal
│   └── scripts/
│       └── check-brand-voice-tables.sql  # Script SQL de verificação manual
├── src/
│   └── utils/
│       └── checkBrandVoiceSchema.ts  # Utilitário frontend
└── package.json  # Scripts npm
```

## Próximos Passos

Após verificar e aplicar a migration com sucesso:

1. ✅ Execute `npm run types:generate` para atualizar tipos TypeScript
2. ✅ Teste a funcionalidade Brand Voice no frontend
3. ✅ Verifique que não há erros no console do navegador
4. ✅ Confirme que o aviso de migration desapareceu

## Referências

- [Guia de Aplicação de Migrations](./aplicar-migrations-brand-voice.md)
- [Documentação Supabase CLI](https://supabase.com/docs/reference/cli)
- [Script SQL de Verificação](../supabase/scripts/check-brand-voice-tables.sql)

---

**Última atualização:** Janeiro 2025  
**Versão da Migration:** `20250115000001_create_brand_voice_tables.sql`

