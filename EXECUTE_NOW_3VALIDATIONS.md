# 🚀 EXECUTE AGORA - 3 VALIDAÇÕES (2-3 horas)

**Tempo**: HOJE (próximas 2-3 horas)  
**Objetivo**: Validar que 3 sistemas críticos funcionam  
**Resultado esperado**: ✅ Pronto para frontend

---

## ✅ VALIDAÇÃO 1: PAYMENT SYSTEM (30 minutos)

### Passo 1.1: Preparar Stripe Keys

```bash
# 1. Vá para: https://dashboard.stripe.com/apikeys
# 2. CERTIFIQUE-SE: Está em TEST MODE (não Live)
# 3. COPIE:
#    - Publishable key (pk_test_...)
#    - Secret key (sk_test_...)
```

### Passo 1.2: Setup .env.local

```bash
# Abra seu editor favorito
code .env.local

# Adicione (copie/cole seus valores Stripe):
STRIPE_PUBLIC_KEY=pk_test_YOUR_VALUE_HERE
STRIPE_SECRET_KEY=sk_test_YOUR_VALUE_HERE

# Se não tem .env.local ainda:
cp .env.local.example .env.local
```

### Passo 1.3: Rodar aplicação

```bash
# Terminal 1:
npm run dev

# Esperado:
# ✓ Servidor rodando em http://localhost:3000
# ✓ Sem erros no console
```

### Passo 1.4: Testar Payment API

```bash
# Terminal 2 (NOVO):
# Teste criar payment intent

curl -X POST http://localhost:3000/api/payments/create-intent \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "test-order-123",
    "amount": 10000,
    "currency": "brl",
    "userId": "test-user-123",
    "email": "test@example.com"
  }'

# Esperado output:
# {
#   "clientSecret": "pi_test_1234567890...",
#   "intentId": "pi_test_1234567890..."
# }

# ❌ Se deu erro:
# [ ] Stripe keys corretas em .env.local?
# [ ] npm run dev está rodando?
# [ ] Supabase configurado?
```

### Passo 1.5: Verificar Database

```bash
# Abrir: https://supabase.com/dashboard
# Seu projeto → Database → tables
# Procure: orders table

# Verifique se ordem foi criada:
# [ ] Tem coluna: stripe_intent_id?
# [ ] Tem coluna: payment_status?
# [ ] Tem coluna: paid_at?
```

### ✅ Validação 1 Passou Se:

- [ ] curl retornou clientSecret?
- [ ] Nenhum erro no console?
- [ ] Order apareceu no Supabase?

---

## ✅ VALIDAÇÃO 2: AUTHENTICATION FLOW (30 minutos)

### Passo 2.1: Testar Signup

```bash
# Terminal: Acesse navegador
# URL: http://localhost:3000/register

# Ou, se não tem interface, criar programaticamente:
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "validation@test.com",
    "password": "TestPass123!@#",
    "name": "Validation Test"
  }'

# Esperado:
# ✓ Usuário criado
# ✓ Email de verificação ENVIADO (cheque seu inbox)
# ✓ Email contém link com token
```

### Passo 2.2: Testar Email Verification

```bash
# 1. Vá até seu email
# 2. Procure por: "Verifique seu email - Tech4Loop"
# 3. COPIE o link (deve ter: /verify-email?token=...)

# 4. Cole no navegador:
# http://localhost:3000/verify-email?token=XXXXXX

# Esperado:
# ✓ Página mostra "✓ Email verificado!"
# ✓ No Supabase: profiles.email_verified = true
```

### Passo 2.3: Testar Login

```bash
# URL: http://localhost:3000/login
# Email: validation@test.com
# Password: TestPass123!@#

# Ou via curl:
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "validation@test.com",
    "password": "TestPass123!@#"
  }'

# Esperado:
# ✓ Login bem-sucedido
# ✓ Token retornado (no localStorage ou cookie)
# ✓ Redirecionado para dashboard
```

### Passo 2.4: Testar Sessão Persist

```bash
# 1. Faça login com sucesso
# 2. Recarregue página (F5)
# 3. Ainda está logado?

# Esperado:
# ✓ SIM, ainda logado (cookie/localStorage persistiu)
# ✓ Pode acessar páginas protegidas
```

### Passo 2.5: Verificar RLS Policies

```bash
# Abra: https://supabase.com/dashboard
# Seu projeto → Authentication → Policies

# Verifique:
# [ ] profiles tem RLS ativo?
# [ ] orders tem RLS (user_id)?
# [ ] partner_sales tem RLS (partner_id)?

# Teste no console (Supabase):
SELECT * FROM profiles WHERE user_id = auth.uid();
-- Deve retornar: seu perfil APENAS
-- Não deve retornar: profiles de outros
```

### ✅ Validação 2 Passou Se:

- [ ] Signup criou usuário?
- [ ] Email de verificação recebido?
- [ ] Login funcionou?
- [ ] Sessão persistiu após reload?
- [ ] RLS policies protegendo dados?

---

## ✅ VALIDAÇÃO 3: DATABASE PERFORMANCE (20 minutos)

### Passo 3.1: Verificar Índices

```bash
# Abra: https://supabase.com/dashboard
# Seu projeto → SQL Editor (nova query)

# Copie/execute:
SELECT
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename;

# Esperado:
# ✓ 78+ índices listados
# ✓ Índices para: user_id, created_at, status, etc
```

### Passo 3.2: Testar Query com Índice

```sql
-- Execute esta query:
EXPLAIN ANALYZE
SELECT * FROM orders
WHERE user_id = 'test-user-123'
ORDER BY created_at DESC
LIMIT 10;

-- Procure por: "Index Scan" (BOM!)
-- Não deve aparecer: "Seq Scan" (RUIM)
-- Tempo deve ser: < 100ms
```

### Passo 3.3: Testar Busca de Produtos

```sql
-- Execute:
EXPLAIN ANALYZE
SELECT * FROM products
WHERE category = 'eletrônicos'
AND price > 1000
AND active = true
LIMIT 20;

-- Esperado:
-- "Index Scan using idx_products_category_price"
-- Tempo < 50ms
```

### Passo 3.4: Verificar Conexão

```sql
-- Execute:
SELECT
  version() as "PostgreSQL Version",
  current_database() as "Database",
  NOW() as "Current Time",
  COUNT(*) as "Total Orders"
FROM orders;

-- Esperado:
-- ✓ Retorna versão do PostgreSQL
-- ✓ Retorna nome do database
-- ✓ Retorna timestamp
-- ✓ Retorna contagem de orders
```

### ✅ Validação 3 Passou Se:

- [ ] 78+ índices presentes?
- [ ] Queries usam Index Scan (não Seq Scan)?
- [ ] Performance < 100ms?
- [ ] Conexão OK (sem timeouts)?

---

## 🎉 TODAS AS 3 VALIDAÇÕES PASSARAM?

Se SIM para todos os checkboxes acima:

```
✅ PAYMENT SYSTEM: OK
✅ AUTHENTICATION: OK
✅ DATABASE: OK

→ VOCÊ ESTÁ PRONTO PARA PROSSEGUIR!
```

---

## ❌ ALGO DEU ERRADO?

### Problema: "Stripe key not found"

```bash
# Solução:
# 1. cat .env.local | grep STRIPE
# 2. Deve mostrar suas chaves (não vazias)
# 3. Se vazio: copie de https://dashboard.stripe.com/apikeys
# 4. Restart npm run dev
```

### Problema: "Cannot POST /api/payments/create-intent"

```bash
# Solução:
# 1. npm run dev está rodando?
# 2. Arquivo create-intent.ts existe em src/app/api/payments/?
# 3. Sem erros de sintaxe TypeScript?
# 4. Tente: npm run build (verá erros)
```

### Problema: "Supabase connection failed"

```bash
# Solução:
# 1. NEXT_PUBLIC_SUPABASE_URL correto?
# 2. SUPABASE_SERVICE_ROLE_KEY correto?
# 3. Projeto Supabase online?
# 4. Tente acessar: https://your-url.supabase.co
#    Deve retornar JSON (não erro 404)
```

### Problema: "Email verification not working"

```bash
# Solução:
# 1. Resend API key configurado?
# 2. Precisa estar em .env.local: RESEND_API_KEY=re_...
# 3. Verificar spam folder
# 4. Checar logs: Supabase → email_logs table
```

### Problema: "RLS Policy preventing access"

```bash
# Solução:
# 1. User_id correto?
# 2. RLS policy allows leitura do próprio user_id?
# 3. Supabase console → RLS → Check policies
# 4. Editar policy se necessário
```

---

## 🔧 PRÓXIMOS PASSOS (SE TUDO PASSOU)

### Próxima Ação:

```bash
# 1. Commitar progresso
git add .
git commit -m "feat: validação de 3 sistemas críticos - OK"
git push

# 2. Ler guia de frontend
cat FRONTEND_INTEGRATION_GUIDE.md

# 3. Criar componentes React
# Seguir: ROADMAP_LAUNCH_2-3DAYS.md (DIA 2)
```

---

## ⏱️ CHECKLIST FINAL

- [ ] Validação 1: Payment OK?
- [ ] Validação 2: Auth OK?
- [ ] Validação 3: Database OK?
- [ ] Sem erros no console?
- [ ] npm run dev rodando?
- [ ] Supabase acessível?
- [ ] Stripe keys corretas?

**Se todas as caixas estão marcadas ✅:**

### Parabéns! Você está 90% do caminho! 🎉

Próximo: **Criar componentes React** (amanhã, 3-4 horas)

---

**Tempo esperado**: 2-3 horas  
**Resultado**: Sistema 100% validado  
**Status**: ✅ Ready for Frontend Development

**Agora é com você!** 💪
