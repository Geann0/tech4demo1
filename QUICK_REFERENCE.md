# 📋 QUICK REFERENCE - O QUE FOI CRIADO

**Use este arquivo como cheat sheet enquanto implementa**

---

## 🔗 ARQUIVOS CRIADOS (Localizações)

```
PROJECT ROOT/
│
├─ src/app/api/
│  ├─ payments/
│  │  ├─ create-intent.ts       ✅ NOVO - Stripe PaymentIntent
│  │  └─ stripe-webhook.ts      ✅ NOVO - Webhook handler
│  │
│  ├─ emails/
│  │  └─ send.ts                ✅ NOVO - Email system
│  │
│  ├─ auth/
│  │  └─ verify-email.ts        ✅ NOVO - Email verification
│  │
│  └─ partners/
│     └─ dashboard.ts           ✅ NOVO - Partner APIs
│
├─ database_migrations/
│  └─ 001_payment_partner_system.sql  ✅ NOVO - DB schema
│
├─ .env.local.example           ✅ NOVO - Setup template
│
├─ DOCUMENTATION FILES (5 novos guias):
│  ├─ IMPLEMENTATION_GUIDE_COMPLETE.md
│  ├─ SETUP_STRIPE_RESEND_QUICK.md
│  ├─ FRONTEND_INTEGRATION_GUIDE.md
│  ├─ ACTION_CARD_IMPLEMENTATION_READY.md
│  ├─ SYSTEM_ARCHITECTURE_COMPLETE.md
│  └─ IMPLEMENTATION_COMPLETE_SUMMARY.md
```

---

## 🔀 FLUXOS CRÍTICOS

### 1️⃣ PAGAMENTO (Customer)

```
GET /checkout?orderId=X
    ↓
POST /api/payments/create-intent {orderId, amount, email}
    ↓
Stripe.confirmCardPayment(clientSecret)
    ↓
Stripe webhook: POST /api/payments/stripe-webhook
    ↓
Email: POST /api/emails/send {type: 'order', ...}
    ↓
Database: orders.payment_status = 'completed'
Database: partner_sales created (10% commission)
```

### 2️⃣ VERIFICAÇÃO (Customer)

```
GET /register
    ↓
POST /api/auth/verify-email {email, userId}
    ↓
Email: POST /api/emails/send {type: 'confirmation', ...}
    ↓
Database: email_verification_tokens created (24h)
    ↓
GET /verify-email?token=X
    ↓
Database: profiles.email_verified = true
Database: token deleted
```

### 3️⃣ DASHBOARD (Partner)

```
GET /dashboard-parceiro
    ↓
GET /api/partners/dashboard?partnerId=X
    ↓
Database: SELECT SUM(commission) FROM partner_sales
    ↓
Display: metrics, sales, payouts
    ↓
POST /api/partners/dashboard {dateFrom, dateTo}
    ↓
Database: partner_payouts created (status: pending)
Email: notify partner
```

---

## 🔑 VARIÁVEIS OBRIGATÓRIAS (.env.local)

```env
# STRIPE (obrigatório para pagamentos)
NEXT_PUBLIC_STRIPE_PUBLIC_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# RESEND (obrigatório para emails)
RESEND_API_KEY=re_...

# APP
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

---

## 🧪 TESTES RÁPIDOS

### Teste 1: Payment Flow (5 min)

```bash
# Terminal 1:
npm run dev

# Terminal 2:
stripe listen --forward-to localhost:3000/api/payments/stripe-webhook

# Terminal 3 (browser):
# http://localhost:3000/checkout?orderId=test
# Card: 4242 4242 4242 4242, CVC: 123, Date: 12/25
# ✓ Success message?
# ✓ Email received?
# ✓ order.payment_status = 'completed'?
```

### Teste 2: Email Verification (3 min)

```bash
# Browser:
# http://localhost:3000/register
# Email: test@example.com, Password: anything
# ✓ Email recebido?
# ✓ Link funciona?
# ✓ profiles.email_verified = true?
```

### Teste 3: Partner Dashboard (2 min)

```bash
# Browser:
# http://localhost:3000/dashboard-parceiro
# ✓ Carrega dados?
# ✓ Mostra comissões?
# ✓ Pode solicitar saque?
```

### Teste 4: Unit Tests (1 min)

```bash
npm test
# ✓ Todos 84 testes passando?
```

---

## 📞 API ENDPOINTS

### Payment APIs

```
POST /api/payments/create-intent
  Body: {orderId, amount, currency, userId, email}
  Response: {clientSecret, intentId}

POST /api/payments/stripe-webhook
  (Called by Stripe, not by you)
```

### Email API

```
POST /api/emails/send
  Body: {type, email, data}
  Types: confirmation, order, tracking, shipment, partner_sale
  Response: {messageId, status}
```

### Auth APIs

```
POST /api/auth/verify-email
  Body: {email, userId}
  Response: {token, tokenId, expiresAt}

GET /api/auth/verify-email?token=abc123
  Response: {success, verified}
```

### Partner APIs

```
GET /api/partners/dashboard?partnerId=xyz
  Response: {metrics, sales, payouts, topProducts}

POST /api/partners/dashboard
  Body: {partnerId, dateFrom, dateTo}
  Response: {payoutId, amount, status}
```

---

## 📊 DATABASE TABLES (NEW)

### partner_sales

```sql
CREATE TABLE partner_sales (
  id UUID PRIMARY KEY,
  partner_id UUID,
  order_id UUID,
  product_id UUID,
  amount INTEGER,        -- em centavos
  commission INTEGER,    -- 10% of amount
  status TEXT,
  created_at TIMESTAMP
);
-- Indexes: partner_id, order_id, status
```

### partner_payouts

```sql
CREATE TABLE partner_payouts (
  id UUID PRIMARY KEY,
  partner_id UUID,
  amount INTEGER,
  status TEXT,          -- pending, processing, completed
  date_from DATE,
  date_to DATE,
  created_at TIMESTAMP
);
-- Indexes: partner_id, status
```

### email_verification_tokens

```sql
CREATE TABLE email_verification_tokens (
  id UUID PRIMARY KEY,
  email TEXT,
  token TEXT UNIQUE,
  expires_at TIMESTAMP, -- 24 hours
  created_at TIMESTAMP
);
-- Indexes: token, email
```

### email_logs

```sql
CREATE TABLE email_logs (
  id UUID PRIMARY KEY,
  type TEXT,
  recipient TEXT,
  status TEXT,
  message_id TEXT,
  created_at TIMESTAMP
);
-- Indexes: recipient, type, created_at
```

### audit_logs

```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY,
  action TEXT,
  order_id UUID,
  user_id UUID,
  details JSONB,
  created_at TIMESTAMP
);
-- Indexes: order_id, action, created_at
```

---

## 🛠️ SETUP STEPS (Ordem)

### Step 1: Environment (15 min)

```bash
1. cp .env.local.example .env.local
2. Follow SETUP_STRIPE_RESEND_QUICK.md
3. Add Stripe keys
4. Add Resend key
5. Verify npm run dev works
```

### Step 2: Database (10 min)

```bash
1. Open Supabase SQL Editor
2. Copy database_migrations/001_payment_partner_system.sql
3. Execute
4. Verify 5 tables created
5. Verify 13 indexes created
```

### Step 3: Test APIs (15 min)

```bash
1. npm run dev (Terminal 1)
2. stripe listen ... (Terminal 2)
3. Test payment with 4242... card
4. Test email verification
5. Test partner dashboard
```

### Step 4: Frontend (2 hours - Next)

```bash
1. Create src/components/checkout/CheckoutForm.tsx
2. Create src/app/checkout/page.tsx
3. Create src/app/verify-email/page.tsx
4. Create src/components/partner/Dashboard.tsx
5. Integrate with auth signup
```

### Step 5: Full Testing (1 hour - Next)

```bash
1. E2E test: signup → verify → checkout → dashboard
2. npm test (should be 100%)
3. Lighthouse (should be 85+)
4. Security check (webhook, CORS, auth)
```

---

## ⚠️ COMMON MISTAKES

### ❌ WRONG - Missing webhook secret

```bash
# Terminal doesn't run stripe listen?
# Result: Webhook calls fail, orders stay "pending"
# Fix: stripe login && stripe listen --forward-to localhost:3000/api/...
```

### ❌ WRONG - .env.local not created

```bash
# API says "STRIPE_SECRET_KEY not found"
# Result: Payment fails
# Fix: cp .env.local.example .env.local (then add real keys)
```

### ❌ WRONG - Database migrations not executed

```bash
# POST /api/payments/create-intent returns 500 error
# Result: Tables don't exist
# Fix: Execute SQL in Supabase SQL Editor
```

### ❌ WRONG - Stripe webhook URL wrong

```bash
# Webhook events not received (order stays "pending")
# Result: Payment completes in Stripe but DB not updated
# Fix: Register webhook in Stripe Dashboard with correct URL
```

### ✅ RIGHT - Check everything before testing

```bash
1. .env.local exists? (cat .env.local)
2. Database tables exist? (Supabase SQL: SELECT * FROM partner_sales)
3. Webhook listening? (stripe listen running?)
4. API responding? (curl http://localhost:3000/api/payments/create-intent)
5. Ready to test!
```

---

## 📈 PROGRESS TRACKING

Use this to track your progress:

```
DAY 1 - TODAY
├─ [ ] Setup .env.local (15 min)
├─ [ ] Create Stripe account (10 min)
├─ [ ] Create Resend account (10 min)
├─ [ ] Add Stripe/Resend keys (10 min)
├─ [ ] Execute database migration (10 min)
├─ [ ] Test payment API (10 min)
└─ [ ] Test email API (10 min)
   Time: 1.5 hours | Status: ✅ Backend Ready

DAY 2 - TOMORROW
├─ [ ] Create CheckoutForm component (30 min)
├─ [ ] Create VerifyEmail component (20 min)
├─ [ ] Create Partner Dashboard component (30 min)
├─ [ ] Integrate with auth (20 min)
├─ [ ] E2E testing (30 min)
├─ [ ] npm test (10 min)
├─ [ ] Lighthouse audit (10 min)
└─ [ ] Fix any issues (30 min)
   Time: 3 hours | Status: ✅ Frontend + Tests Ready

DAY 3 - BEFORE LAUNCH
├─ [ ] Switch Stripe to LIVE (15 min)
├─ [ ] Update .env with LIVE keys (10 min)
├─ [ ] Final security check (15 min)
├─ [ ] Deploy to production (15 min)
└─ [ ] Verify in production (15 min)
   Time: 1 hour | Status: ✅ LIVE & SELLING!
```

---

## 🎯 SUCCESS CRITERIA

✅ You're done when:

```
PAYMENT SYSTEM
├─ [ ] Stripe PaymentIntent created ✓
├─ [ ] Webhook signature verified ✓
├─ [ ] Order status updated to "completed" ✓
├─ [ ] Partner sales recorded ✓
└─ [ ] Confirmation email sent ✓

EMAIL SYSTEM
├─ [ ] Confirmation email sent ✓
├─ [ ] Order email sent ✓
├─ [ ] Tracking email template ready ✓
├─ [ ] Emails logged in database ✓
└─ [ ] No emails in spam ✓

VERIFICATION
├─ [ ] Token generated (24h expiry) ✓
├─ [ ] Email sent with link ✓
├─ [ ] Token validated ✓
├─ [ ] Profile marked verified ✓
└─ [ ] Token deleted after use ✓

PARTNER SYSTEM
├─ [ ] Dashboard loads metrics ✓
├─ [ ] Commission calculated (10%) ✓
├─ [ ] Sales list shows orders ✓
├─ [ ] Payout requests work ✓
└─ [ ] Partner gets notification ✓

TESTING
├─ [ ] All 84 tests passing ✓
├─ [ ] Lighthouse score 85+ ✓
├─ [ ] E2E flow works end-to-end ✓
├─ [ ] No console errors ✓
└─ [ ] Webhook receiving events ✓
```

---

## 📚 DOCUMENTAÇÃO RÁPIDA

| Precisa de...             | Vá para...                                   |
| ------------------------- | -------------------------------------------- |
| Setup Stripe + Resend     | SETUP_STRIPE_RESEND_QUICK.md                 |
| Como implementar frontend | FRONTEND_INTEGRATION_GUIDE.md                |
| Próximos passos           | ACTION_CARD_IMPLEMENTATION_READY.md          |
| Entender arquitetura      | SYSTEM_ARCHITECTURE_COMPLETE.md              |
| Guia completo             | IMPLEMENTATION_GUIDE_COMPLETE.md             |
| Troubleshooting           | SETUP_STRIPE_RESEND_QUICK.md (final section) |

---

## 🚀 FINAL COMMAND

Quando pronto para começar:

```bash
# Copy this to your terminal:
cp .env.local.example .env.local && \
cat SETUP_STRIPE_RESEND_QUICK.md && \
npm run dev

# Then in another terminal:
stripe login
stripe listen --forward-to localhost:3000/api/payments/stripe-webhook

# You're ready! 🎉
```

---

**Boa sorte! Você vai conseguir! 💪**
