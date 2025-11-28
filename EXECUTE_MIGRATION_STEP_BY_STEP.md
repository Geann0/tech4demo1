# 🚀 COMO EXECUTAR A MIGRAÇÃO SEGURA - PASSO A PASSO

## ⏱️ Tempo Total: 5-10 minutos

## PASSO 1: Preparação (1 minuto)

### 1.1 Abra o Arquivo de Migração

```
Arquivo: database_migrations/add_performance_indexes.sql
```

### 1.2 Verifique o Conteúdo

O arquivo começa com:

```sql
-- PHASE 3 PART 2: Performance Optimization - Database Indexes
-- Migration: Ensure all columns exist, then create indexes
-- Strategy: Add missing columns first, then create 40+ performance indexes

-- STEP 1: ENSURE ALL REQUIRED COLUMNS EXIST

-- Profile table columns
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'customer';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS cpf TEXT;
```

## PASSO 2: Acesso ao Supabase (1 minuto)

### 2.1 Abra o Supabase Dashboard

```
URL: https://app.supabase.com
```

### 2.2 Selecione seu Projeto

```
Projeto: Tech4Loop (ou seu projeto)
```

### 2.3 Vá para SQL Editor

```
Menu → SQL Editor → New Query
```

Ou clique em:

```
https://app.supabase.com/project/<seu-projeto>/sql/new
```

## PASSO 3: Copiar Código (1 minuto)

### 3.1 Selecione TUDO no arquivo SQL

```
No VS Code:
- Abra: database_migrations/add_performance_indexes.sql
- Pressione: Ctrl+A (seleciona tudo)
- Pressione: Ctrl+C (copia)
```

### 3.2 Cole no Supabase

```
No Supabase SQL Editor:
- Clique na caixa branca de edição
- Pressione: Ctrl+V (cola)
```

Você verá:

```
-- PHASE 3 PART 2: Performance Optimization - Database Indexes
-- [Muitas linhas de SQL...]
-- Total index count: ~45+ verified indexes
```

## PASSO 4: Executar (5-10 minutos)

### 4.1 Clique no Botão "Run"

```
Supabase SQL Editor → Clique em "Run" (botão azul no canto superior direito)
```

### 4.2 Acompanhe a Execução

Você verá:

```
✅ Running SQL query...
```

O console mostrará:

```
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email TEXT;
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
[... mais 42 índices ...]
```

### 4.3 Aguarde Conclusão

**Tempo esperado:** 5-10 minutos

Durante esse tempo, o PostgreSQL está:

- Criando colunas (rápido)
- Buildando 45+ índices (mais lento)

Você verá no final:

```
✅ Query executed successfully
```

## PASSO 5: Verificação (2 minutos)

### 5.1 Verifique que 45+ Índices Foram Criados

No Supabase SQL Editor, execute:

```sql
SELECT COUNT(*) as total_indexes
FROM pg_indexes
WHERE indexname LIKE 'idx_%' AND schemaname = 'public';
```

Clique "Run"

**Resultado esperado:**

```
total_indexes
45
```

(Ou número próximo, dependendo de índices pré-existentes)

### 5.2 Verifique Colunas Específicas

```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'profiles'
ORDER BY column_name;
```

Você deve ver:

```
column_name    | data_type
---------------|----------
cpf            | text
email          | text
id             | uuid
role           | text
...
```

### 5.3 Verifique Índices da Profiles

```sql
SELECT indexname, tablename
FROM pg_indexes
WHERE tablename = 'profiles'
  AND indexname LIKE 'idx_%'
ORDER BY indexname;
```

Resultado esperado:

```
indexname              | tablename
-----------------------|----------
idx_profiles_cpf       | profiles
idx_profiles_email     | profiles
idx_profiles_role      | profiles
```

## PASSO 6: Testar Performance (Opcional)

### 6.1 Teste um Índice

```sql
EXPLAIN ANALYZE
SELECT * FROM profiles
WHERE email = 'test@example.com';
```

Você deve ver:

```
Index Scan using idx_profiles_email on profiles
```

(Prova que o índice está sendo usado!)

### 6.2 Teste Outro Índice

```sql
EXPLAIN ANALYZE
SELECT * FROM orders
WHERE status = 'pending'
ORDER BY created_at DESC;
```

Resultado:

```
Index Scan using idx_orders_status_created_at on orders
```

## Se Algo Der Errado

### Erro: "relation does not exist"

**Causa:** Tabela não existe
**Solução:** Confirme que as tabelas estão criadas no Supabase

```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

### Erro: "Permission denied"

**Causa:** Sem permissão no Supabase
**Solução:** Verifique se está usando a conta correta

### Erro: "Index already exists"

**Esperado!** O `IF NOT EXISTS` ignora índices que já existem
**Resultado:** Funciona perfeitamente!

### Rollback (Remover Tudo)

Se precisar desfazer:

```sql
-- Remover TODOS os índices adicionados
DO $$
DECLARE
  idx RECORD;
BEGIN
  FOR idx IN
    SELECT indexname FROM pg_indexes
    WHERE indexname LIKE 'idx_%' AND schemaname = 'public'
  LOOP
    EXECUTE 'DROP INDEX IF EXISTS ' || idx.indexname;
  END LOOP;
END $$;
```

Isso remove os índices, mas mantém as colunas (que é seguro).

## Checklist Final

- [ ] Arquivo `add_performance_indexes.sql` aberto
- [ ] Código copiado (Ctrl+A, Ctrl+C)
- [ ] Supabase SQL Editor aberto
- [ ] Código colado (Ctrl+V)
- [ ] Botão "Run" clicado
- [ ] Aguardado 5-10 minutos
- [ ] Visto "Query executed successfully"
- [ ] Verificação: 45+ índices criados
- [ ] Verificação: Colunas criadas
- [ ] Teste: EXPLAIN ANALYZE funcionando

## Próximos Passos

1. ✅ Migração executada
2. ✅ Índices criados
3. ⏳ Testar queries em desenvolvimento
4. ⏳ Deploy em produção (se tudo OK)
5. ⏳ Monitorar performance

## Suporte

Se tiver dúvidas, consulte:

- `SAFE_MIGRATION_STRATEGY.md` - Explicação completa
- `QUICK_START_MIGRATION.md` - Resumo rápido
- `add_performance_indexes.sql` - Código comentado

---

**PRONTO PARA EXECUTAR!**

A migração é segura, reversível e sem risco de perda de dados.

Boa sorte! 🚀
