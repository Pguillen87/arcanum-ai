# Análise de Performance de Queries — Arcanum AI

**Data:** 2025-01-08  
**Objetivo:** Identificar e otimizar queries críticas para garantir SLOs do PRD

---

## Queries Críticas Identificadas

### 1. Dashboard do Usuário

**Query:** Listar projetos, transformações e transcrições recentes

**Queries Atuais:**
```sql
-- Projetos recentes
SELECT * FROM projects 
WHERE user_id = $1 
ORDER BY created_at DESC 
LIMIT 10;

-- Transformações recentes
SELECT * FROM transformations 
WHERE user_id = $1 
ORDER BY created_at DESC 
LIMIT 20;

-- Transcrições recentes
SELECT * FROM transcriptions 
WHERE user_id = $1 
ORDER BY created_at DESC 
LIMIT 20;
```

**Índices Existentes:**
- ✅ `projects_user_id_idx` (user_id)
- ✅ `transformations_user_id_idx` (user_id)
- ✅ `transcriptions_user_id_idx` (user_id)

**Recomendação:**
- ✅ Índices já existem e são adequados
- ⚠️ Considerar índice composto `(user_id, created_at DESC)` para melhor performance

---

### 2. Notificações Não Lidas

**Query:** Contar notificações não lidas

```sql
SELECT COUNT(*) FROM notifications 
WHERE user_id = $1 AND read_at IS NULL;
```

**Índice Existente:**
- ✅ `notifications_user_unread_idx` - `(user_id, read_at)` WHERE `read_at IS NULL`

**Status:** ✅ Otimizado

---

### 3. Histórico de Créditos

**Query:** Listar transações de créditos

```sql
SELECT * FROM credit_transactions 
WHERE user_id = $1 
ORDER BY created_at DESC 
LIMIT 50;
```

**Índice Existente:**
- ✅ `credit_transactions_user_id_created_at_idx` - `(user_id, created_at DESC)`

**Status:** ✅ Otimizado

---

### 4. Busca de Username

**Query:** Verificar disponibilidade de username

```sql
SELECT 1 FROM profiles 
WHERE lower(username) = lower($1);
```

**Índice Existente:**
- ✅ `profiles_username_lower_idx` - Índice funcional em `lower(username)`

**Status:** ✅ Otimizado

---

### 5. Transformações por Status

**Query:** Listar transformações por status (para monitoramento)

```sql
SELECT * FROM transformations 
WHERE user_id = $1 AND status = $2 
ORDER BY created_at DESC;
```

**Índices Existentes:**
- ✅ `transformations_user_id_idx`
- ✅ `transformations_status_idx`

**Recomendação:**
- ⚠️ Considerar índice composto `(user_id, status, created_at DESC)` se consulta for frequente

---

## Análise de EXPLAIN ANALYZE

### Queries Recomendadas para Análise:

1. **Dashboard completo:**
```sql
EXPLAIN ANALYZE
SELECT p.*, 
       COUNT(DISTINCT t.id) as transformations_count,
       COUNT(DISTINCT tr.id) as transcriptions_count
FROM projects p
LEFT JOIN transformations t ON t.project_id = p.id
LEFT JOIN transcriptions tr ON tr.asset_id IN (
  SELECT id FROM assets WHERE project_id = p.id
)
WHERE p.user_id = 'user-uuid'
GROUP BY p.id
ORDER BY p.created_at DESC;
```

2. **Notificações não lidas:**
```sql
EXPLAIN ANALYZE
SELECT COUNT(*) FROM notifications 
WHERE user_id = 'user-uuid' AND read_at IS NULL;
```

3. **Histórico de créditos:**
```sql
EXPLAIN ANALYZE
SELECT * FROM credit_transactions 
WHERE user_id = 'user-uuid' 
ORDER BY created_at DESC 
LIMIT 50;
```

---

## Índices Compostos Recomendados

### 1. Transformações por Usuário e Status

```sql
CREATE INDEX IF NOT EXISTS transformations_user_status_created_idx 
ON public.transformations(user_id, status, created_at DESC);
```

**Benefício:** Otimiza consultas de dashboard filtradas por status

---

### 2. Transcrições por Usuário e Status

```sql
CREATE INDEX IF NOT EXISTS transcriptions_user_status_created_idx 
ON public.transcriptions(user_id, status, created_at DESC);
```

**Benefício:** Otimiza consultas de jobs por status

---

### 3. Assets por Projeto e Tipo

```sql
CREATE INDEX IF NOT EXISTS assets_project_type_idx 
ON public.assets(project_id, type);
```

**Benefício:** Otimiza listagem de assets por tipo em um projeto

---

## Queries com Potencial de Problema

### 1. JOINs Complexos (Dashboard)

**Problema:** JOINs múltiplos podem ser lentos com muitos dados

**Solução:**
- Usar agregações no banco (COUNT, SUM)
- Considerar materialized views para dashboards complexos
- Limitar resultados com LIMIT

---

### 2. Busca Full-Text (Futuro)

**Problema:** Busca em textos de transcrições/transformações pode ser lenta

**Solução Futura:**
- Implementar índices GIN para full-text search
- Usar PostgreSQL `tsvector` e `tsquery`

---

## SLOs do PRD

### Latências Esperadas:

- **Texto → Post:** < 10-15s ✅ (Edge Function, não query)
- **Transcrição (30 min):** < 5-7 min ✅ (Edge Function, não query)
- **Preview vídeo longo:** < 10 min ✅ (Edge Function, não query)
- **Consultas de dashboard:** < 100ms ⚠️ (precisa validação)

---

## Recomendações de Otimização

### Imediatas:

1. ✅ Criar índices compostos recomendados acima
2. ✅ Validar queries com EXPLAIN ANALYZE em ambiente de teste
3. ✅ Monitorar queries lentas (>100ms) em produção

### Futuras:

1. Considerar particionamento de tabelas grandes (`credit_transactions`, `notifications`)
2. Implementar cache para queries frequentes (Redis)
3. Otimizar queries de dashboard com materialized views

---

## Checklist de Validação

- [ ] Executar EXPLAIN ANALYZE em queries críticas
- [ ] Validar que índices compostos melhoram performance
- [ ] Confirmar que queries críticas estão < 100ms
- [ ] Documentar queries que precisam de otimização adicional

---

**Última Atualização:** 2025-01-08

