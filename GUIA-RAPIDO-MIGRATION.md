# 🚨 GUIA RÁPIDO: Aplicar Migration brand_profiles

## Problema
A tabela `brand_profiles` não existe no banco de dados, causando erros 404 no frontend.

## Solução Rápida (Escolha uma opção)

### Opção 1: Via Supabase Dashboard (MAIS RÁPIDO - 2 minutos)

1. **Acesse:** https://app.supabase.com/project/giozhrukzcqoopssegby
2. **Vá em:** SQL Editor (menu lateral)
3. **Clique em:** New Query
4. **Abra o arquivo:** `supabase/migrations/20250115000001_create_brand_voice_tables.sql`
5. **Copie TODO o conteúdo** do arquivo
6. **Cole no SQL Editor**
7. **Execute:** Clique em "Run" ou pressione `Ctrl+Enter` (Windows) / `Cmd+Enter` (Mac)
8. **Aguarde:** Mensagem de sucesso
9. **Recarregue a página** do frontend (F5 ou Ctrl+R)

### Opção 2: Via Supabase CLI (Requer CLI instalado)

```bash
# 1. Verificar se CLI está instalado
supabase --version

# 2. Se não estiver, instalar:
npm install -g supabase

# 3. Linkar projeto (se ainda não linkou)
supabase login
supabase link --project-ref giozhrukzcqoopssegby

# 4. Aplicar migration
supabase db push

# 5. Verificar se aplicou
npm run verify:brand-voice
```

### Opção 3: Via Script NPM (Requer CLI configurado)

```bash
# Aplicar migration automaticamente
npm run migrate:brand-voice

# Depois regenerar tipos TypeScript
npm run types:generate
```

## Verificação Pós-Migration

Após aplicar a migration, verifique:

```bash
# Via script
npm run verify:brand-voice

# Ou via SQL no Dashboard
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('brand_profiles', 'brand_samples', 'brand_embeddings');
```

Deve retornar 3 tabelas.

## Se ainda não funcionar

1. **Limpe o cache do navegador:** `Ctrl+Shift+R` (ou `Cmd+Shift+R` no Mac)
2. **Verifique se a migration foi aplicada:** Execute o SQL de verificação acima
3. **Regenere os tipos:** `npm run types:generate`
4. **Reinicie o servidor de desenvolvimento:** Pare e inicie novamente

## Arquivo de Migration

Localização: `supabase/migrations/20250115000001_create_brand_voice_tables.sql`

Este arquivo cria:
- ✅ Tabela `brand_profiles`
- ✅ Tabela `brand_samples`
- ✅ Tabela `brand_embeddings`
- ✅ RLS Policies (segurança)
- ✅ Índices (performance)
- ✅ Triggers (updated_at automático)

---

**Tempo estimado:** 2-5 minutos  
**Dificuldade:** Fácil  
**Impacto:** Resolve todos os erros 404 relacionados a brand_profiles

