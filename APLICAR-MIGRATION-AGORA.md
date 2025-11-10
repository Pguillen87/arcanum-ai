# 🚀 INSTRUÇÕES RÁPIDAS: Aplicar Migration brand_profiles

## ⚡ Método Mais Rápido (2 minutos)

### Passo 1: Acessar Supabase Dashboard
1. Abra seu navegador
2. Acesse: **https://app.supabase.com/project/giozhrukzcqoopssegby**
3. Faça login se necessário

### Passo 2: Abrir SQL Editor
1. No menu lateral esquerdo, clique em **"SQL Editor"**
2. Clique no botão **"New Query"** (canto superior direito)

### Passo 3: Copiar e Colar Migration
1. Abra o arquivo: `supabase/migrations/20250115000001_create_brand_voice_tables.sql`
2. **Selecione TODO o conteúdo** (Ctrl+A / Cmd+A)
3. **Copie** (Ctrl+C / Cmd+C)
4. **Cole no SQL Editor** do Supabase (Ctrl+V / Cmd+V)

### Passo 4: Executar
1. Clique no botão **"Run"** (ou pressione `Ctrl+Enter` / `Cmd+Enter`)
2. Aguarde a mensagem de sucesso (deve aparecer em verde)

### Passo 5: Verificar
Execute esta query no SQL Editor para confirmar:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('brand_profiles', 'brand_samples', 'brand_embeddings');
```

**Resultado esperado:** 3 linhas (uma para cada tabela)

### Passo 6: Atualizar Frontend
1. Volte para a aplicação
2. Clique no botão **"Atualizar e Verificar Novamente"** no aviso de migration
3. Ou recarregue a página com `Ctrl+Shift+R` (Windows) / `Cmd+Shift+R` (Mac)

---

## ✅ Pronto!

Após esses passos, os erros 404 devem desaparecer e a funcionalidade Brand Voice estará disponível.

## 📝 Próximos Passos Após Migration

1. **Regenerar tipos TypeScript:**
   ```bash
   npm run types:generate
   ```
   (Requer Supabase CLI instalado e autenticado)

2. **Testar funcionalidade:**
   - Criar uma nova voz da marca
   - Verificar que aparece na biblioteca
   - Testar preview de texto

---

**Tempo total:** ~2-3 minutos  
**Dificuldade:** Fácil  
**Resultado:** Erros 404 resolvidos, Brand Voice funcional

