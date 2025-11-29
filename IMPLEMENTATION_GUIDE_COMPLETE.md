# 🚀 GUIA COMPLETO: IMPLEMENTAÇÃO DAS APIs DE PAGAMENTO, EMAIL E PARCEIROS

**Status**: Em Implementação  
**Última Atualização**: November 28, 2025  
**Objetivo**: Tornar o Tech4Loop pronto para vendas reais

---

## 📋 TABELA DE CONTEÚDO

1. [Setup Inicial](#setup-inicial)
2. [Stripe Integration](#stripe-integration)
3. [Email System (Resend)](#email-system)
4. [Email Verification](#email-verification)
5. [Partner Dashboard](#partner-dashboard)
6. [Database Migrations](#database-migrations)
7. [Testing & Validation](#testing--validation)
8. [Go Live Checklist](#go-live-checklist)

---

## 🔧 SETUP INICIAL

### Passo 1: Instalar Dependências

```bash
npm install stripe resend cpf-validator cep-promise
npm install --save-dev @types/stripe
```

### Passo 2: Configurar Variáveis de Ambiente

Adicione ao `.env.local`:

```env
# Stripe
STRIPE_PUBLIC_KEY=pk_test_YOUR_KEY_HERE
STRIPE_SECRET_KEY=sk_test_YOUR_KEY_HERE
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET

# Resend Email
RESEND_API_KEY=re_YOUR_KEY_HERE

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000  # ou sua URL de produção

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key

# Email
NEXT_PUBLIC_APP_EMAIL=noreply@tech4loop.com
NEXT_PUBLIC_SUPPORT_EMAIL=support@tech4loop.com
```

---

## 💳 STRIPE INTEGRATION

### Passo 1: Criar Conta Stripe (SE NÃO TIVER)

1. Acesse https://stripe.com
2. Criar conta (gratuita para testes)
3. Ir para Dashboard → API Keys
4. Copiar `Publishable key` e `Secret key`
5. Adicionar ao `.env.local`

### Passo 2: Entender o Fluxo de Pagamento

```
Cliente → Frontend → API /payments/create-intent
  ↓
Stripe cria Payment Intent
  ↓
Frontend recebe clientSecret
  ↓
Frontend usa Stripe.js para processar pagamento
  ↓
Stripe envia confirmação → Webhook /payments/stripe-webhook
  ↓
Backend atualiza status do pedido no Supabase
  ↓
Backend envia email de confirmação
```

### Passo 3: Criar Componente de Checkout (Frontend)

```tsx
// src/components/CheckoutForm.tsx
"use client";

import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { useState } from "react";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY!);

export function CheckoutForm({ orderId, amount, userEmail }: any) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    setError(null);

    try {
      // 1. Chamar backend para criar payment intent
      const response = await fetch("/api/payments/create-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          amount: amount * 100, // em centavos
          currency: "brl",
          userId: "current-user-id", // usar do seu auth
          email: userEmail,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error);
      }

      // 2. Confirmar pagamento com Stripe
      const result = await stripe.confirmCardPayment(data.clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement)!,
          billing_details: {
            email: userEmail,
          },
        },
      });

      if (result.error) {
        setError(result.error.message || "Payment failed");
      } else if (result.paymentIntent?.status === "succeeded") {
        alert("Pagamento realizado com sucesso!");
        // Redirecionar para página de sucesso
        window.location.href = `/pedidos/${orderId}/confirmacao`;
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <CardElement />
      {error && <div style={{ color: "red" }}>{error}</div>}
      <button type="submit" disabled={loading}>
        {loading ? "Processando..." : "Pagar"}
      </button>
    </form>
  );
}

// Wrapper com Stripe provider
export default function Checkout() {
  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm {...pageProps} />
    </Elements>
  );
}
```

### Passo 4: Setup do Webhook

**O que é webhook?** Um endpoint que o Stripe chama quando um pagamento é confirmado, falhado, etc.

```bash
# 1. Instalar Stripe CLI (para testar localmente)
# Windows: https://github.com/stripe/stripe-cli/releases
# Mac: brew install stripe/stripe-cli/stripe

# 2. Login
stripe login

# 3. Encaminhar eventos para sua aplicação
stripe listen --forward-to localhost:3000/api/payments/stripe-webhook

# 4. Copiar webhook secret (saída do comando acima)
# Adicionar ao .env.local como STRIPE_WEBHOOK_SECRET
```

### Passo 5: Testar Pagamento Localmente

```bash
# 1. Rodar a aplicação
npm run dev

# 2. Ter webhook rodando em outro terminal
stripe listen --forward-to localhost:3000/api/payments/stripe-webhook

# 3. Ir para http://localhost:3000/checkout
# 4. Usar cartão de teste: 4242 4242 4242 4242
#    Qualquer data futura (ex: 12/25)
#    Qualquer CVC (ex: 123)
# 5. Verificar no Supabase se order.payment_status mudou para 'completed'
```

---

## 📧 EMAIL SYSTEM (RESEND)

### Passo 1: Criar Conta Resend

1. Acesse https://resend.com
2. Criar conta (gratuita)
3. Ir para Dashboard → API Keys
4. Copiar a chave e adicionar ao `.env.local`

### Passo 2: Setup Domain (Opcional, mas recomendado)

Para enviar com seu domínio (ex: noreply@tech4loop.com), você precisa:

1. Verificar domínio no Resend
2. Adicionar registros DNS do domínio
3. Resend valida e libera

**Para testes**: Use domínio de teste `resend.dev` (já configurado)

### Passo 3: Chamar API de Email

**Exemplo: Enviar email de confirmação de pedido**

```javascript
// Após pagamento confirmado:
fetch("/api/emails/send", {
  method: "POST",
  body: JSON.stringify({
    type: "order",
    email: "cliente@example.com",
    data: {
      orderId: "ORD-123",
      userName: "João",
      items: [{ product_name: "Produto A", quantity: 2, price: 5000 }],
      totalAmount: 10000,
      orderDate: new Date().toISOString(),
    },
  }),
});
```

### Passo 4: Testar Envio de Email

```bash
# 1. Usar Postman ou curl para testar
curl -X POST http://localhost:3000/api/emails/send \
  -H "Content-Type: application/json" \
  -d '{
    "type": "confirmation",
    "email": "seu_email@example.com",
    "data": {
      "verificationToken": "abc123",
      "userName": "João"
    }
  }'

# 2. Verificar sua caixa de email (pode ir para spam)
```

---

## ✉️ EMAIL VERIFICATION

### Passo 1: Adicionar Fluxo no Signup

```tsx
// src/app/register/page.tsx
async function handleSignup(email: string, password: string) {
  // 1. Criar usuário via Supabase Auth
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) throw error;

  // 2. Solicitar email de verificação
  await fetch("/api/auth/verify-email", {
    method: "POST",
    body: JSON.stringify({
      email,
      userId: data.user?.id,
    }),
  });

  // 3. Redirecionar para página de verificação
  window.location.href = "/verify-email-pending";
}
```

### Passo 2: Página de Verificação Pendente

```tsx
// src/app/verify-email-pending/page.tsx
export default function VerifyEmailPending() {
  return (
    <div>
      <h1>Verifique seu Email</h1>
      <p>Enviamos um link de confirmação para seu email.</p>
      <p>Clique no link para ativar sua conta.</p>
      <p>⏰ O link expira em 24 horas</p>
    </div>
  );
}
```

### Passo 3: Página de Verificação

```tsx
// src/app/verify-email/page.tsx
"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );

  useEffect(() => {
    if (!token) return;

    fetch(`/api/auth/verify-email?token=${token}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setStatus("success");
          setTimeout(() => {
            window.location.href = "/login";
          }, 2000);
        } else {
          setStatus("error");
        }
      })
      .catch(() => setStatus("error"));
  }, [token]);

  if (status === "loading") return <p>Verificando...</p>;
  if (status === "success")
    return <p>✅ Email verificado! Redirecionando...</p>;
  return <p>❌ Falha na verificação. Token inválido ou expirado.</p>;
}
```

---

## 👥 PARTNER DASHBOARD

### Passo 1: Criar Páginas do Dashboard

```tsx
// src/app/dashboard-parceiro/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth"; // seu hook de auth

export default function PartnerDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/partners/dashboard?partnerId=${user?.partner_id}`)
      .then((res) => res.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [user]);

  if (loading) return <p>Carregando...</p>;

  return (
    <div>
      <h1>Dashboard do Parceiro</h1>

      {/* Métricas */}
      <div className="grid grid-cols-4">
        <Card>
          <h3>Total de Vendas</h3>
          <p>R$ {data.metrics.totalSales.toFixed(2)}</p>
        </Card>
        <Card>
          <h3>Comissões Ganhas</h3>
          <p>R$ {data.metrics.totalCommission.toFixed(2)}</p>
        </Card>
        <Card>
          <h3>Comissões Pagas</h3>
          <p>R$ {data.metrics.completedCommission.toFixed(2)}</p>
        </Card>
        <Card>
          <h3>Pendentes</h3>
          <p>R$ {data.metrics.pendingCommission.toFixed(2)}</p>
        </Card>
      </div>

      {/* Tabela de Vendas */}
      <h2>Últimas Vendas</h2>
      <table>
        <thead>
          <tr>
            <th>Pedido</th>
            <th>Produto</th>
            <th>Valor</th>
            <th>Comissão</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {data.sales.map((sale) => (
            <tr key={sale.id}>
              <td>{sale.orderId}</td>
              <td>{sale.productName}</td>
              <td>R$ {sale.amount.toFixed(2)}</td>
              <td>R$ {sale.commission.toFixed(2)}</td>
              <td>{sale.status}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Botão de Saque */}
      <button onClick={() => requestPayout(user?.partner_id)}>
        Solicitar Saque de Comissões
      </button>
    </div>
  );
}

async function requestPayout(partnerId: string) {
  const startDate = prompt("Data inicial (YYYY-MM-DD):");
  const endDate = prompt("Data final (YYYY-MM-DD):");

  if (!startDate || !endDate) return;

  const response = await fetch("/api/partners/dashboard", {
    method: "POST",
    body: JSON.stringify({
      partnerId,
      startDate,
      endDate,
    }),
  });

  const data = await response.json();
  if (data.success) {
    alert(`Saque de R$ ${data.payout.amount.toFixed(2)} solicitado!`);
  }
}
```

---

## 🗄️ DATABASE MIGRATIONS

### Passo 1: Criar Tabelas Necessárias

Execute este SQL no Supabase:

```sql
-- Tabela de sales de parceiros
CREATE TABLE IF NOT EXISTS partner_sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES partners(id),
  order_id UUID NOT NULL REFERENCES orders(id),
  product_id UUID NOT NULL REFERENCES products(id),
  amount INTEGER NOT NULL, -- em centavos
  commission INTEGER NOT NULL, -- em centavos
  status TEXT DEFAULT 'pending_payout', -- pending_payout, completed, payout_processed
  created_at TIMESTAMP DEFAULT now()
);

-- Tabela de payouts (saques) dos parceiros
CREATE TABLE IF NOT EXISTS partner_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES partners(id),
  amount INTEGER NOT NULL,
  status TEXT DEFAULT 'pending', -- pending, processing, completed, failed
  date_from DATE NOT NULL,
  date_to DATE NOT NULL,
  notes TEXT,
  bank_account_id UUID,
  created_at TIMESTAMP DEFAULT now(),
  paid_at TIMESTAMP
);

-- Tabela de tokens de verificação de email
CREATE TABLE IF NOT EXISTS email_verification_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT now()
);

-- Tabela de logs de email
CREATE TABLE IF NOT EXISTS email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  recipient TEXT NOT NULL,
  status TEXT,
  message_id TEXT,
  error TEXT,
  created_at TIMESTAMP DEFAULT now()
);

-- Tabela de logs de auditoria
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT NOT NULL,
  order_id UUID,
  user_id UUID,
  details JSONB,
  created_at TIMESTAMP DEFAULT now()
);

-- Adicionar colunas necessárias às tabelas existentes
ALTER TABLE orders ADD COLUMN IF NOT EXISTS stripe_intent_id TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_id TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP;

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP;

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_partner_sales_partner_id ON partner_sales(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_sales_order_id ON partner_sales(order_id);
CREATE INDEX IF NOT EXISTS idx_partner_payouts_partner_id ON partner_payouts(partner_id);
CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_token ON email_verification_tokens(token);
```

---

## 🧪 TESTING & VALIDATION

### Teste 1: Fluxo Completo de Pagamento

```bash
# 1. Setup
npm run dev

# Em outro terminal:
stripe listen --forward-to localhost:3000/api/payments/stripe-webhook

# 2. Ir para http://localhost:3000/checkout
# 3. Preencher formulário com dados de teste:
#    Email: seu_email@example.com
#    Cartão: 4242 4242 4242 4242
#    Data: 12/25
#    CVC: 123

# 4. Verificações:
# ✓ Recebeu email de confirmação?
# ✓ Order no Supabase tem payment_status = 'completed'?
# ✓ Partner_sales foi criada (se houver parceiro)?
```

### Teste 2: Email de Verificação

```bash
# 1. Ir para /register
# 2. Criar nova conta com email
# 3. Verificações:
# ✓ Email de confirmação recebido?
# ✓ Pode clicar no link para verificar?
# ✓ profiles.email_verified agora é true?
```

### Teste 3: Dashboard de Parceiro

```bash
# 1. Login como parceiro
# 2. Ir para /dashboard-parceiro
# 3. Verificações:
# ✓ Carrega dados corretos?
# ✓ Mostra vendas do período?
# ✓ Calcula comissões corretas?
# ✓ Botão "Solicitar Saque" funciona?
```

---

## ✅ GO LIVE CHECKLIST

Antes de levar para produção:

### Configurações

- [ ] STRIPE_PUBLIC_KEY configurada
- [ ] STRIPE_SECRET_KEY configurada
- [ ] STRIPE_WEBHOOK_SECRET configurada
- [ ] RESEND_API_KEY configurada
- [ ] NEXT_PUBLIC_APP_URL aponta para domínio real
- [ ] Supabase service key configurada

### Testes

- [ ] Pagamento funciona em staging
- [ ] Email chega corretamente
- [ ] Webhook recebe confirmação
- [ ] Dashboard de parceiro carrega dados
- [ ] Verificação de email funciona
- [ ] Lighthouse score 85+

### Produção

- [ ] Stripe está em modo live (não test)
- [ ] HTTPS ativo em domínio
- [ ] Backup de banco de dados agendado
- [ ] Monitoring de erros (Sentry, LogRocket)
- [ ] Rate limiting em endpoints sensíveis
- [ ] CORS configurado corretamente

### Parceiros

- [ ] Dashboard acessa dados corretos
- [ ] Comissões calculadas corretamente
- [ ] Email de nova venda funciona
- [ ] Sistema de payout testado

---

## 🆘 TROUBLESHOOTING

### "Webhook signature verification failed"

- Verificar STRIPE_WEBHOOK_SECRET está correto
- Stripe CLI precisa estar rodando: `stripe listen --forward-to localhost:3000/...`

### "Payment intent creation failed"

- Verificar STRIPE_SECRET_KEY
- Verificar se order existe no Supabase
- Verificar se amount está em centavos (multiplicar por 100)

### "Email not sending"

- Verificar RESEND_API_KEY
- Verificar se email está na whitelist (primeiros 50 na trial)
- Checardatos do email_logs

### "Email verification link expired"

- Token expira em 24 horas
- Usuário pode solicitar novo token
- Implementar botão "Reenviar email"

---

## 🚀 PRÓXIMOS PASSOS

1. ✅ Payment System (implementado)
2. ✅ Email System (implementado)
3. ✅ Email Verification (implementado)
4. ✅ Partner Dashboard (implementado)
5. ⏳ Rastreamento (próximo)
6. ⏳ CPF/CNPJ Validation (próximo)
7. ⏳ Admin Products Management (próximo)

---

**Pronto para começar?** Execute os passos acima na ordem. Qualquer dúvida, revise a seção correspondente!
