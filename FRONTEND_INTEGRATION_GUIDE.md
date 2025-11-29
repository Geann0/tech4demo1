# 🎨 FRONTEND INTEGRATION GUIDE - CONECTAR APIs AO FRONTEND

**Objetivo**: Conectar os 5 APIs que criamos aos componentes do frontend.

---

## 📋 TABELA DE CONTEÚDO

1. [Checkout Page (Pagamentos)](#checkout-page)
2. [Email Verification Page](#email-verification)
3. [Partner Dashboard](#partner-dashboard)
4. [Integração no Register/Login](#integração-auth)
5. [Testes E2E](#testes)

---

## 💳 CHECKOUT PAGE

### Passo 1: Instalar Stripe React

```bash
npm install @stripe/stripe-js @stripe/react-stripe-js
```

### Passo 2: Criar Checkout Form Component

Crie: `src/components/checkout/CheckoutForm.tsx`

```tsx
"use client";

import { useState, useCallback } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { useRouter } from "next/navigation";

// Inicializar Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY!);

// Component interno (dentro do Elements provider)
function PaymentForm({
  orderId,
  amount,
  userEmail,
  userName,
}: {
  orderId: string;
  amount: number;
  userEmail: string;
  userName: string;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!stripe || !elements) {
        setError("Stripe not loaded");
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // Passo 1: Chamar nossa API para criar PaymentIntent
        console.log("Creating payment intent...");
        const intentResponse = await fetch("/api/payments/create-intent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderId,
            amount: Math.round(amount * 100), // Converter para centavos
            currency: "brl",
            userId: "current-user-id", // Substituir com userId real do seu auth
            email: userEmail,
          }),
        });

        if (!intentResponse.ok) {
          const data = await intentResponse.json();
          throw new Error(data.error || "Failed to create payment intent");
        }

        const intentData = await intentResponse.json();
        const clientSecret = intentData.clientSecret;

        // Passo 2: Confirmar pagamento com Stripe
        console.log("Confirming payment with Stripe...");
        const result = await stripe.confirmCardPayment(clientSecret, {
          payment_method: {
            card: elements.getElement(CardElement)!,
            billing_details: {
              name: userName,
              email: userEmail,
            },
          },
        });

        if (result.error) {
          // Erro no pagamento
          setError(result.error.message || "Payment failed");
          console.error("Payment error:", result.error);
        } else if (result.paymentIntent?.status === "succeeded") {
          // Sucesso!
          setSuccess(true);
          console.log("Payment successful:", result.paymentIntent.id);

          // Redirecionar para página de sucesso após 2 segundos
          setTimeout(() => {
            router.push(`/orders/${orderId}/confirmation`);
          }, 2000);
        }
      } catch (err: any) {
        setError(err.message || "An error occurred");
        console.error("Error:", err);
      } finally {
        setLoading(false);
      }
    },
    [stripe, elements, orderId, amount, userEmail, userName, router]
  );

  if (success) {
    return (
      <div className="bg-green-50 p-6 rounded-lg border border-green-200">
        <h3 className="text-lg font-bold text-green-800">
          ✓ Pagamento Realizado!
        </h3>
        <p className="text-green-700">Redirecionando...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Dados do Cartão
        </label>
        <CardElement
          options={{
            style: {
              base: {
                fontSize: "16px",
                color: "#424770",
                "::placeholder": {
                  color: "#aab7c4",
                },
              },
              invalid: {
                color: "#fa755a",
              },
            },
          }}
        />
      </div>

      {error && (
        <div className="bg-red-50 p-4 rounded-lg border border-red-200">
          <p className="text-red-800">❌ {error}</p>
        </div>
      )}

      <div className="bg-gray-50 p-4 rounded-lg">
        <p className="text-sm text-gray-600">
          Valor a pagar: <strong>R$ {amount.toFixed(2)}</strong>
        </p>
      </div>

      <button
        type="submit"
        disabled={loading || !stripe}
        className={`w-full py-3 rounded-lg font-semibold text-white transition ${
          loading || !stripe
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-blue-600 hover:bg-blue-700"
        }`}
      >
        {loading ? "⏳ Processando..." : `Pagar R$ ${amount.toFixed(2)}`}
      </button>

      <p className="text-xs text-gray-500 text-center">
        Seu pagamento é seguro. Processado por Stripe.
      </p>
    </form>
  );
}

// Component wrapper com provider do Stripe
export default function CheckoutPage({
  orderId,
  amount,
  userEmail,
  userName,
}: any) {
  return (
    <div className="max-w-md mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Finalizar Compra</h1>

      <Elements stripe={stripePromise}>
        <PaymentForm
          orderId={orderId}
          amount={amount}
          userEmail={userEmail}
          userName={userName}
        />
      </Elements>
    </div>
  );
}
```

### Passo 3: Usar Componente na Página

Crie: `src/app/checkout/page.tsx`

```tsx
"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import CheckoutPage from "@/components/checkout/CheckoutForm";
import { createClient } from "@/lib/supabase/client";

export default function CheckoutPageWrapper() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const [order, setOrder] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        // 1. Obter usuário logado
        const supabase = createClient();
        const {
          data: { user: authUser },
        } = await supabase.auth.getUser();
        setUser(authUser);

        // 2. Obter dados do pedido
        if (orderId) {
          const { data: orderData } = await supabase
            .from("orders")
            .select("*")
            .eq("id", orderId)
            .single();
          setOrder(orderData);
        }
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [orderId]);

  if (loading) return <div className="p-8 text-center">Carregando...</div>;
  if (!order || !user)
    return (
      <div className="p-8 text-center text-red-600">
        Pedido ou usuário não encontrado
      </div>
    );

  return (
    <CheckoutPage
      orderId={orderId}
      amount={order.total_amount}
      userEmail={user.email}
      userName={user.user_metadata?.full_name || "Cliente"}
    />
  );
}
```

---

## ✉️ EMAIL VERIFICATION PAGE

### Crie: `src/app/verify-email/page.tsx`

```tsx
"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Token não fornecido");
      return;
    }

    const verifyEmail = async () => {
      try {
        // Chamar nosso endpoint de verificação
        const response = await fetch(`/api/auth/verify-email?token=${token}`);
        const data = await response.json();

        if (data.success) {
          setStatus("success");
          setMessage("Email verificado com sucesso! Redirecionando...");

          // Redirecionar para login após 3 segundos
          setTimeout(() => {
            router.push("/login");
          }, 3000);
        } else {
          setStatus("error");
          setMessage(data.error || "Falha na verificação");
        }
      } catch (error: any) {
        setStatus("error");
        setMessage(error.message || "Erro ao verificar email");
      }
    };

    verifyEmail();
  }, [token, router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md text-center">
        {status === "loading" && (
          <>
            <div className="animate-spin h-12 w-12 border-4 border-blue-200 border-t-blue-600 rounded-full mx-auto mb-4"></div>
            <h2 className="text-lg font-semibold">Verificando seu email...</h2>
          </>
        )}

        {status === "success" && (
          <>
            <div className="text-4xl mb-4">✓</div>
            <h2 className="text-lg font-semibold text-green-600">Sucesso!</h2>
            <p className="text-gray-600 mt-2">{message}</p>
          </>
        )}

        {status === "error" && (
          <>
            <div className="text-4xl mb-4">✕</div>
            <h2 className="text-lg font-semibold text-red-600">
              Erro na Verificação
            </h2>
            <p className="text-gray-600 mt-2">{message}</p>
            <div className="mt-6">
              <a
                href="/register"
                className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Tentar novamente
              </a>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
```

---

## 👥 PARTNER DASHBOARD

### Crie: `src/components/partner/Dashboard.tsx`

```tsx
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function PartnerDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [partnerId, setPartnerId] = useState<string | null>(null);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        // 1. Obter partnerId do usuário logado
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) throw new Error("Usuário não autenticado");

        // 2. Buscar partnerId
        const { data: partnerData } = await supabase
          .from("partners")
          .select("id")
          .eq("user_id", user.id)
          .single();

        if (!partnerData) throw new Error("Parceiro não encontrado");
        setPartnerId(partnerData.id);

        // 3. Chamar API de dashboard
        const response = await fetch(
          `/api/partners/dashboard?partnerId=${partnerData.id}`
        );

        if (!response.ok) throw new Error("Erro ao carregar dashboard");

        const dashboardData = await response.json();
        setData(dashboardData);
      } catch (err: any) {
        setError(err.message);
        console.error("Error:", err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  if (loading) return <div className="p-8 text-center">Carregando...</div>;
  if (error) return <div className="p-8 text-red-600">Erro: {error}</div>;
  if (!data) return <div className="p-8">Nenhum dado disponível</div>;

  const metrics = data.metrics || {};
  const sales = data.sales || [];
  const payouts = data.payouts || [];
  const topProducts = data.topProducts || [];

  return (
    <div className="space-y-8 p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Dashboard do Parceiro</h1>
        <p className="text-gray-600">Acompanhe suas vendas e ganhe comissões</p>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard
          title="Total de Vendas"
          value={`R$ ${(metrics.totalSales || 0).toFixed(2)}`}
          icon="💰"
        />
        <MetricCard
          title="Total em Comissões"
          value={`R$ ${(metrics.totalCommission || 0).toFixed(2)}`}
          icon="💸"
        />
        <MetricCard
          title="Comissões Pagas"
          value={`R$ ${(metrics.completedCommission || 0).toFixed(2)}`}
          icon="✓"
        />
        <MetricCard
          title="Pendentes"
          value={`R$ ${(metrics.pendingCommission || 0).toFixed(2)}`}
          icon="⏳"
        />
      </div>

      {/* Sales Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold">Últimas Vendas</h2>
        </div>
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                Pedido
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                Produto
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                Valor
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                Comissão
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {sales.map((sale) => (
              <tr key={sale.id} className="hover:bg-gray-50">
                <td className="px-6 py-3 text-sm text-gray-900">
                  {sale.orderId?.slice(0, 8)}
                </td>
                <td className="px-6 py-3 text-sm text-gray-900">
                  {sale.productName}
                </td>
                <td className="px-6 py-3 text-sm text-gray-900">
                  R$ {(sale.amount / 100).toFixed(2)}
                </td>
                <td className="px-6 py-3 text-sm text-green-600 font-semibold">
                  R$ {(sale.commission / 100).toFixed(2)}
                </td>
                <td className="px-6 py-3 text-sm">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      sale.status === "completed"
                        ? "bg-green-100 text-green-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {sale.status === "completed" ? "Pago" : "Pendente"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {sales.length === 0 && (
          <div className="p-6 text-center text-gray-500">
            Nenhuma venda registrada
          </div>
        )}
      </div>

      {/* Payout Button */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-bold mb-4">Solicitar Saque</h2>
        <p className="text-gray-600 mb-4">
          Comissões pendentes:{" "}
          <strong>R$ {(metrics.pendingCommission || 0).toFixed(2)}</strong>
        </p>
        <button
          onClick={() => handlePayoutRequest(partnerId)}
          className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 font-semibold"
          disabled={
            !metrics.pendingCommission || metrics.pendingCommission === 0
          }
        >
          Solicitar Saque
        </button>
      </div>

      {/* Payout History */}
      {payouts.length > 0 && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-6 border-b">
            <h2 className="text-xl font-bold">Histórico de Saques</h2>
          </div>
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold">
                  Data
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold">
                  Valor
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {payouts.map((payout) => (
                <tr key={payout.id} className="hover:bg-gray-50">
                  <td className="px-6 py-3 text-sm">
                    {new Date(payout.createdAt).toLocaleDateString("pt-BR")}
                  </td>
                  <td className="px-6 py-3 text-sm">
                    R$ {(payout.amount / 100).toFixed(2)}
                  </td>
                  <td className="px-6 py-3 text-sm">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        payout.status === "completed"
                          ? "bg-green-100 text-green-800"
                          : payout.status === "processing"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {payout.status === "completed"
                        ? "Pago"
                        : payout.status === "processing"
                          ? "Processando"
                          : "Pendente"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// Helper component for metric cards
function MetricCard({ title, value, icon }: any) {
  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm">{title}</p>
          <p className="text-2xl font-bold mt-2">{value}</p>
        </div>
        <div className="text-3xl">{icon}</div>
      </div>
    </div>
  );
}

// Helper function to request payout
async function handlePayoutRequest(partnerId: string | null) {
  if (!partnerId) return;

  const dateFrom = prompt("Data inicial (YYYY-MM-DD):");
  const dateTo = prompt("Data final (YYYY-MM-DD):");

  if (!dateFrom || !dateTo) return;

  try {
    const response = await fetch("/api/partners/dashboard", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        partnerId,
        dateFrom,
        dateTo,
      }),
    });

    if (!response.ok) throw new Error("Erro ao solicitar saque");

    const data = await response.json();
    alert(
      `✓ Saque solicitado com sucesso! Valor: R$ ${(data.payout.amount / 100).toFixed(2)}`
    );
    window.location.reload(); // Recarregar para ver novo saque
  } catch (error: any) {
    alert(`❌ Erro: ${error.message}`);
  }
}
```

---

## 🔐 INTEGRAÇÃO COM AUTH (Register/Login)

### Adicione ao seu signup:

```tsx
// src/app/register/page.tsx

async function handleSignup(email: string, password: string, name: string) {
  try {
    // 1. Criar usuário com Supabase Auth
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
        },
      },
    });

    if (error) throw error;

    // 2. Solicitar email de verificação
    const verifyResponse = await fetch("/api/auth/verify-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        userId: data.user?.id,
      }),
    });

    if (!verifyResponse.ok) throw new Error("Erro ao enviar email");

    // 3. Redirecionar
    window.location.href = "/verify-email-pending";
  } catch (error: any) {
    alert(`Erro: ${error.message}`);
  }
}
```

---

## 🧪 TESTES E2E

### Teste completo de pagamento:

```bash
# 1. Rodar aplicação
npm run dev

# 2. Rodar Stripe webhook listener
stripe listen --forward-to localhost:3000/api/payments/stripe-webhook

# 3. Ir para http://localhost:3000/register
# 4. Criar conta: email@example.com
# 5. Verificar email de confirmação
# 6. Clicar no link de verificação
# 7. Fazer login
# 8. Ir para /checkout?orderId=YOUR_ORDER_ID
# 9. Pagar com: 4242 4242 4242 4242
# 10. Verificar:
#    ✓ Mensagem de sucesso
#    ✓ Redirecionado para /orders/{id}/confirmation
#    ✓ Email de confirmação recebido
#    ✓ Dashboard de parceiro mostra nova venda
```

---

## ✅ CHECKLIST FINAL

- [ ] CheckoutForm.tsx criado e funcionando
- [ ] VerifyEmailPage.tsx criado e funcionando
- [ ] PartnerDashboard.tsx criado e funcionando
- [ ] Integração no signup criada
- [ ] Testes E2E passando
- [ ] Lighthouse score 85+
- [ ] Pronto para produção!

---

**Próximo**: Deploy to production! 🚀
