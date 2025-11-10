# Guia de Aplicação de Migrations – Characters

Este passo a passo explica como aplicar as migrations que criam as tabelas de personagens (`characters`, `character_samples`, `character_embeddings`, `transcription_history`, `teleprompter_sessions`) e evitam o erro **“Could not find the table 'public.characters' in the schema cache”** ao salvar novos personagens.

---

## ✅ Pré-requisitos

- Projeto Supabase configurado (mesmo projeto usado em produção/dev);
- Supabase CLI instalada e autenticada (`supabase login`);
- Acesso ao diretório do projeto (`C:\app\arcanum-ai` ou equivalente);
- Opcional: acesso ao Dashboard Supabase para verificar resultados.

---

## Método recomendado: Supabase CLI

1. **Entrar na raiz do projeto**
   ```bash
   cd C:\app\arcanum-ai
   ```

2. **(Uma vez por máquina/projeto) Vincular o projeto Supabase**
   ```bash
   supabase link --project-ref <seu-project-ref>
   ```
   - O `project-ref` é o identificador que aparece na URL do Supabase (ex.: `giozhrukzcqoopssegby`).
   - Se o link já foi feito anteriormente, pule este passo.

3. **Aplicar todas as migrations pendentes**
   ```bash
   supabase db push
   ```
   - Este comando garante que todas as migrations localizadas em `supabase/migrations/` sejam aplicadas na ordem correta.
   - Caso prefira executar migrations uma a uma, utilize `supabase migration up`.

4. **Verificar o status**
   ```bash
   supabase migration list
   ```
   - Confirme que os arquivos `20250116000001_create_characters_tables.sql`, `20250116000002_create_transcription_history.sql`, `20250116000003_create_teleprompter_sessions.sql` e `20250116000004_migrate_brand_profiles_to_characters.sql` aparecem como “applied”.

---

## Alternativa: Supabase Dashboard (SQL Editor)

Se a CLI não estiver disponível:

1. Acesse [https://app.supabase.com](https://app.supabase.com) e escolha o projeto correto;
2. Abra **SQL Editor** > **New Query**;
3. Para cada arquivo SQL listado acima:
   - Abra o arquivo correspondente em `supabase/migrations/`;
   - Copie todo o conteúdo;
   - Cole no SQL Editor e execute (**Run** / `Ctrl+Enter`);
4. Repita até aplicar todos os arquivos.

---

## Checks de sucesso

- Executar a consulta abaixo deve retornar as tabelas recém-criadas:
  ```sql
  SELECT table_name
  FROM information_schema.tables
  WHERE table_schema = 'public'
    AND table_name IN (
      'characters',
      'character_samples',
      'character_embeddings',
      'transcription_history',
      'teleprompter_sessions'
    );
  ```
- Após aplicar as migrations, recarregue a aplicação (`Ctrl+Shift+R`) e tente criar um personagem. O erro de tabela inexistente deve desaparecer.

---

## Dicas rápidas

- Se o erro persistir, confirme se está conectado ao projeto Supabase correto (principalmente em ambientes com múltiplos refs);
- Em caso de conflito (“relation already exists”), execute `supabase db status` para checar o drift e alinhar o schema;
- Documente a aplicação das migrations no changelog do time para evitar reexecuções desnecessárias.


