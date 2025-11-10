# Guia de Aplicação de Migrations - Brand Voice

Este guia explica como aplicar as migrations necessárias para o módulo Brand Voice do Arcanum AI.

## Pré-requisitos

- Acesso ao projeto Supabase (Dashboard ou CLI)
- Permissões para executar SQL no banco de dados
- Arquivo de migration: `supabase/migrations/20250115000001_create_brand_voice_tables.sql`

## Método 1: Via Supabase Dashboard (Recomendado para iniciantes)

### Passo 1: Acessar o SQL Editor

1. Acesse o [Supabase Dashboard](https://app.supabase.com)
2. Selecione seu projeto
3. No menu lateral, clique em **SQL Editor**

### Passo 2: Executar a Migration

1. Clique em **New Query** para criar uma nova query
2. Abra o arquivo `supabase/migrations/20250115000001_create_brand_voice_tables.sql` no seu editor de código
3. Copie **todo o conteúdo** do arquivo SQL
4. Cole o conteúdo no SQL Editor do Supabase
5. Clique em **Run** (ou pressione `Ctrl+Enter` / `Cmd+Enter`)

### Passo 3: Verificar Sucesso

Após executar a migration, você deve ver uma mensagem de sucesso. Para verificar se as tabelas foram criadas:

```sql
-- Verificar se a tabela brand_profiles existe
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('brand_profiles', 'brand_samples', 'brand_embeddings');
```

Você deve ver 3 tabelas listadas:
- `brand_profiles`
- `brand_samples`
- `brand_embeddings`

## Método 2: Via Supabase CLI (Recomendado para desenvolvedores)

### Passo 1: Instalar Supabase CLI

Se ainda não tiver instalado:

```bash
# macOS
brew install supabase/tap/supabase

# Windows (via Scoop)
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase

# Linux
npm install -g supabase
```

### Passo 2: Conectar ao Projeto

```bash
# Navegue até a raiz do projeto
cd /caminho/para/arcanum-ai

# Conecte ao seu projeto Supabase
supabase link --project-ref seu-project-ref
```

**Nota:** O `project-ref` pode ser encontrado na URL do seu projeto no Dashboard Supabase:
- URL: `https://app.supabase.com/project/giozhrukzcqoopssegby`
- Project Ref: `giozhrukzcqoopssegby`

### Passo 3: Aplicar Migrations

```bash
# Aplicar todas as migrations pendentes
supabase db push

# OU aplicar migration específica
supabase migration up
```

### Passo 4: Verificar Status

```bash
# Ver migrations aplicadas
supabase migration list

# Verificar status do banco
supabase db diff
```

## Verificação de Sucesso

Após aplicar a migration, você pode verificar se tudo está funcionando:

### 1. Verificar Tabelas Criadas

```sql
SELECT 
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('brand_profiles', 'brand_samples', 'brand_embeddings')
ORDER BY table_name, ordinal_position;
```

### 2. Verificar Extensão pgvector

```sql
SELECT * FROM pg_extension WHERE extname = 'vector';
```

Se a extensão não estiver disponível (comum em projetos gratuitos), a migration continuará funcionando usando JSONB como fallback.

### 3. Verificar RLS Policies

```sql
SELECT 
  schemaname,
  tablename,
  policyname
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('brand_profiles', 'brand_samples', 'brand_embeddings');
```

Você deve ver políticas RLS para cada tabela garantindo que usuários só acessem seus próprios dados.

### 4. Testar no Frontend

1. Recarregue a aplicação
2. Acesse o portal "Essência - DNA Criativo"
3. O aviso de migration pendente deve desaparecer
4. Você deve conseguir treinar uma nova voz da marca

## Troubleshooting

### Erro: "permission denied for schema public"

**Causa:** Você não tem permissões para criar tabelas no schema público.

**Solução:** 
- Verifique se está usando a conta correta no Supabase
- Entre em contato com o administrador do projeto

### Erro: "extension 'vector' does not exist"

**Causa:** A extensão pgvector não está disponível no seu plano do Supabase.

**Solução:** 
- Isso é esperado em planos gratuitos
- A migration continuará funcionando usando JSONB como fallback
- Para usar pgvector, considere fazer upgrade do plano

### Erro: "relation already exists"

**Causa:** As tabelas já foram criadas anteriormente.

**Solução:**
- Verifique se as tabelas existem: `SELECT * FROM brand_profiles LIMIT 1;`
- Se existirem, a migration já foi aplicada
- Se houver problemas, você pode dropar e recriar (cuidado: isso apagará dados!)

```sql
-- CUIDADO: Isso apagará todos os dados!
DROP TABLE IF EXISTS brand_embeddings CASCADE;
DROP TABLE IF EXISTS brand_samples CASCADE;
DROP TABLE IF EXISTS brand_profiles CASCADE;
```

Depois, execute a migration novamente.

### Migration aplicada mas aviso ainda aparece

**Causa:** Cache do navegador ou verificação ainda não executada.

**Solução:**
1. Recarregue a página com `Ctrl+Shift+R` (ou `Cmd+Shift+R` no Mac)
2. Limpe o cache do navegador
3. Verifique se a tabela realmente existe no banco

## Próximos Passos

Após aplicar a migration com sucesso:

1. ✅ O módulo Brand Voice estará totalmente funcional
2. ✅ Você poderá treinar múltiplas vozes de marca
3. ✅ Você poderá usar preview e transformação de textos
4. ✅ O sistema de créditos será integrado automaticamente

## Suporte

Se encontrar problemas ao aplicar a migration:

1. Verifique os logs do Supabase Dashboard
2. Consulte a documentação do Supabase: https://supabase.com/docs
3. Verifique se todas as dependências estão instaladas
4. Entre em contato com a equipe de desenvolvimento

---

**Última atualização:** Janeiro 2025  
**Versão da Migration:** `20250115000001_create_brand_voice_tables.sql`

