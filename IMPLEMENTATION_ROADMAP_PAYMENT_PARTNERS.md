# 🚀 ACTION PLAN: Pronto para Vendas em X dias

## ESCOLHA SUA ROTA

### OPÇÃO 1: MVP EM 4 DIAS (Lançamento rápido)

Use isso se: Quer testar mercado, quer receitas rápido, pode fazer ajustes depois

**O que vai ter:**

- ✅ Produtos & Carrinho (já funciona)
- ✅ Checkout básico
- ✅ Pagamento via MercadoPago
- ✅ Email de confirmação
- ⚠️ Sem rastreamento (aviso manual)
- ⚠️ Dashboard de parceiro mínimo

**O que NÃO vai ter:**

- ❌ Rastreamento automático
- ❌ Dashboard de parceiro completo
- ❌ Múltiplos meios de pagamento
- ❌ Sistema de comissão automatizado

---

### OPÇÃO 2: COMPLETO EM 11 DIAS (Profissional)

Use isso se: Quer lançar certo, quer tudo funcionando, pode esperar uma semana

**O que vai ter:**

- ✅ Tudo do MVP +
- ✅ Rastreamento automático
- ✅ Dashboard de parceiro completo
- ✅ Sistema de comissão automático
- ✅ Múltiplos meios de pagamento
- ✅ Emails automatizados

**Timeline:**

```
Dia 1-2: Pagamento
Dia 3-4: Emails
Dia 5-6: Rastreamento
Dia 7-8: Dashboard parceiro
Dia 9-10: Comissões & validações
Dia 11: Testes & Deploy
```

---

## IMPLEMENTAÇÃO DETALHADA: PAGAMENTO (CRÍTICO)

### Passo 1: Escolher Gateway (HOJE)

#### Option A: MercadoPago (Recomendado para Brasil)

**Vantagens:**

- ✅ Já tem package no seu projeto: "mercadopago": "^2.0.9"
- ✅ Suporta PIX (instantâneo)
- ✅ Suporta Boleto
- ✅ Suporta Cartão de crédito
- ✅ Taxa menor para Brasil (~2.49% + R$0.49)
- ✅ Documentação em Português

**Desvantagens:**

- ❌ Menos opções de customização
- ❌ Precisa aprovar conta

#### Option B: Stripe (Mais robusto)

**Vantagens:**

- ✅ Melhor documentação
- ✅ Mais seguro
- ✅ Suporte melhor
- ✅ Webhooks mais confiáveis

**Desvantagens:**

- ❌ Precisa instalar novo package
- ❌ Mais caro (~2.9% + $0.30)
- ❌ Menos fácil para começar

**RECOMENDAÇÃO: MercadoPago (você já tem, é mais fácil)**

---

### Passo 2: Setup MercadoPago (DIA 1)

```bash
# 1. Ir em https://www.mercadopago.com.br
# 2. Criar conta (Seller)
# 3. Obter Access Token
# 4. Adicionar no .env.local:

NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=XXX
MERCADOPAGO_ACCESS_TOKEN=XXX
MERCADOPAGO_WEBHOOK_URL=https://seu-site.com/api/webhooks/mercadopago
```

### Passo 3: Criar API de Pagamento (DIA 1)

```typescript
// src/app/api/pagamento/criar/route.ts
import { MercadoPagoConfig, Preference } from "mercadopago";

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
});

export async function POST(request: Request) {
  const { items, customer } = await request.json();

  const preference = new Preference(client);

  const result = await preference.create({
    body: {
      items: items.map((item: any) => ({
        id: item.product_id,
        title: item.product_name,
        description: item.description,
        picture_url: item.image_url,
        category_id: item.category_id,
        quantity: item.quantity,
        currency_id: "BRL",
        unit_price: item.price,
      })),
      payer: {
        name: customer.name,
        email: customer.email,
        phone: {
          number: customer.phone?.replace(/\D/g, ""),
        },
        address: {
          zip_code: customer.cep,
          street_name: customer.street,
          street_number: customer.number,
        },
      },
      back_urls: {
        success: `${process.env.NEXT_PUBLIC_SITE_URL}/compra-sucesso`,
        failure: `${process.env.NEXT_PUBLIC_SITE_URL}/compra-falha`,
        pending: `${process.env.NEXT_PUBLIC_SITE_URL}/compra-pendente`,
      },
      auto_return: "approved",
      notification_url: process.env.MERCADOPAGO_WEBHOOK_URL,
      external_reference: customer.order_id,
    },
  });

  return Response.json({
    init_point: result.init_point,
    preference_id: result.id,
  });
}
```

### Passo 4: Criar Webhook (DIA 1)

```typescript
// src/app/api/webhooks/mercadopago/route.ts
import { supabase } from "@/lib/supabase";

export async function POST(request: Request) {
  const { action, data } = await request.json();

  if (action === "payment.created" || action === "payment.updated") {
    const paymentId = data.id;

    // Buscar status do pagamento
    const payment = await mp.payment.findById(paymentId);

    // Atualizar order no Supabase
    const { data: order } = await supabase
      .from("orders")
      .select("id")
      .eq("payment_id", paymentId)
      .single();

    if (order && payment.status === "approved") {
      await supabase
        .from("orders")
        .update({
          payment_status: "approved",
          status: "processing",
        })
        .eq("id", order.id);

      // Enviar email de confirmação
      await sendOrderConfirmationEmail(order);
    }
  }

  return Response.json({ success: true });
}
```

### Passo 5: Integrar no Checkout (DIA 1-2)

```typescript
// src/app/checkout/actions.ts
export async function createCheckoutPayment(formData: CheckoutFormData) {
  // 1. Validar dados
  const validation = validateCheckoutForm(formData);
  if (!validation.isValid) {
    return { error: validation.errors };
  }

  // 2. Buscar items do carrinho
  const cartItems = getCartItems(); // localStorage

  // 3. Criar order no BD
  const { data: order } = await supabase
    .from("orders")
    .insert({
      customer_email: formData.email,
      customer_name: formData.name,
      status: "pending",
      payment_status: "pending",
      total_amount: calculateTotal(cartItems),
    })
    .select()
    .single();

  // 4. Chamar API de pagamento
  const response = await fetch("/api/pagamento/criar", {
    method: "POST",
    body: JSON.stringify({
      items: cartItems,
      customer: {
        ...formData,
        order_id: order.id,
      },
    }),
  });

  const { init_point } = await response.json();

  // 5. Redirecionar para MercadoPago
  redirect(init_point);
}
```

### Passo 6: Página de Sucesso (DIA 2)

```typescript
// src/app/compra-sucesso/page.tsx
export default async function SuccessPage() {
  const searchParams = useSearchParams();
  const preference_id = searchParams.get("preference_id");
  const payment_id = searchParams.get("payment_id");

  // Buscar order e verificar status
  const { data: order } = await supabase
    .from("orders")
    .select("*")
    .eq("payment_id", payment_id)
    .single();

  return (
    <div className="success-container">
      <h1>✅ Pagamento confirmado!</h1>
      <p>Seu pedido #{order.id} foi recebido.</p>
      <p>Enviamos um email de confirmação para {order.customer_email}</p>
      <button onClick={() => router.push("/conta")}>
        Ver meus pedidos
      </button>
    </div>
  );
}
```

---

## EMAIL: CONFIRMAÇÃO (DIA 2)

### Setup Resend

```bash
npm install resend
# Criar conta em https://resend.com
# Obter API key
# Adicionar no .env.local:
RESEND_API_KEY=xxx
```

### Função de Email

```typescript
// src/lib/email.ts
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendOrderConfirmationEmail(order: Order) {
  await resend.emails.send({
    from: "pedidos@tech4loop.com.br",
    to: order.customer_email,
    subject: `Pedido confirmado! ${order.id}`,
    html: `
      <h1>Obrigado pela sua compra!</h1>
      <p>Seu pedido #${order.id} foi confirmado.</p>
      <p>Valor: R$ ${order.total_amount.toFixed(2)}</p>
      <p>Você receberá um email com o rastreamento em breve.</p>
    `,
  });
}
```

---

## DASHBOARD DE PARCEIRO (DIA 3-4)

### Estrutura Básica

```typescript
// src/app/partner/dashboard/page.tsx
export default async function PartnerDashboard() {
  const user = await getAuthUser();

  // Buscar dados do parceiro
  const { data: sales } = await supabase
    .from("orders")
    .select("*")
    .eq("partner_id", user.id);

  const totalSales = sales.reduce((sum, sale) => sum + sale.total_amount, 0);
  const totalOrders = sales.length;
  const commission = totalSales * 0.1; // 10% comissão

  return (
    <div className="dashboard">
      <h1>Dashboard - {user.name}</h1>

      <div className="stats">
        <Card>
          <h3>Total de Vendas</h3>
          <p className="big">R$ {totalSales.toFixed(2)}</p>
        </Card>
        <Card>
          <h3>Pedidos</h3>
          <p className="big">{totalOrders}</p>
        </Card>
        <Card>
          <h3>Sua Comissão</h3>
          <p className="big">R$ {commission.toFixed(2)}</p>
        </Card>
      </div>

      <SalesTable orders={sales} />
    </div>
  );
}
```

---

## CHECKLIST: O QUE FAZER

### Hoje (Decisão):

```
[ ] Decidir: MVP em 4 dias vs Completo em 11 dias
[ ] Escolher gateway (MercadoPago recomendado)
[ ] Criar conta no MercadoPago/Stripe
[ ] Criar conta no Resend
```

### Dia 1 (Pagamento - Parte 1):

```
[ ] Setup ambiente (chaves API)
[ ] Criar /api/pagamento/criar
[ ] Criar webhook /api/webhooks/mercadopago
[ ] Testar integração
```

### Dia 2 (Pagamento - Parte 2 + Email):

```
[ ] Integrar pagamento no checkout
[ ] Criar página de sucesso
[ ] Setup Resend
[ ] Criar função de email
[ ] Enviar email de confirmação
```

### Dia 3 (Dashboard Parceiro - Parte 1):

```
[ ] Criar /app/partner/dashboard
[ ] Buscar dados de vendas
[ ] Mostrar estatísticas
[ ] Testar acesso
```

### Dia 4 (Finalizar MVP):

```
[ ] Criar tabela de pedidos
[ ] Adicionar filtros
[ ] Testar end-to-end
[ ] Deploy para staging
```

---

## ESTIMATIVA DE LINHAS DE CÓDIGO

```
Pagamento (API + Webhook):     ~300 linhas
Email:                         ~100 linhas
Dashboard Parceiro:            ~400 linhas
Testes:                        ~200 linhas
─────────────────────────────────
Total MVP:                    ~1000 linhas
```

**Tempo real (com você programando):**

- Pagamento: 4-6 horas
- Email: 1-2 horas
- Dashboard: 3-4 horas
- Testes: 2-3 horas
- **Total: 10-15 horas (1-2 dias de trabalho intenso)**

---

## DÚVIDAS FREQUENTES

**P: Posso usar outro meio de pagamento?**  
R: Sim! PIX (Pix Bank API), Boleto (Boleto Bancário), Cartão (processor próprio). Mas MercadoPago é mais fácil.

**P: E se o cliente não pagar?**  
R: Webhook ativa com `payment.rejected`. Você atualiza `payment_status = "rejected"` e envia email.

**P: Como faço refund?**  
R: `mercadopago.refund.create(payment_id)`. Atualiza `payment_status = "refunded"`.

**P: Preciso de SSL?**  
R: Sim! Webhooks precisam de HTTPS. Vercel já dá SSL grátis.

**P: Como testo antes de ir ao ar?**  
R: MercadoPago tem modo sandbox. Use `MERCADOPAGO_ACCESS_TOKEN_SANDBOX`.

---

## PRÓXIMA REUNIÃO

**Você precisa decidir:**

1. ✅ MVP em 4 dias ou Completo em 11?
2. ✅ MercadoPago ou outro gateway?
3. ✅ Quando quer lançar?
4. ✅ Quantos parceiros vai ter no dia 1?

**Com essas respostas posso criar:**

- Roadmap detalhado
- Arquivo de código para cada componente
- Testes automáticos
- Deploy checklist

---

**Status**: Pronto para começar assim que você decidir!  
**Próximo passo**: Responder as 4 perguntas acima
