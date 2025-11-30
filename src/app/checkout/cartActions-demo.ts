"use server";

import { simulateAPIDelay } from "@/lib/mockData";
import type { CartItem } from "@/types";

interface CheckoutState {
  error?: string | null;
  success?: boolean;
  paymentUrl?: string;
}

export async function processCartCheckout(
  prevState: CheckoutState,
  formData: FormData
): Promise<CheckoutState> {
  // VERSÃO DEMO: Checkout simulado sem APIs reais

  try {
    // Dados do cliente
    const name = String(formData.get("name"));
    const email = String(formData.get("email"));
    const phone = String(formData.get("phone"));
    const cep = String(formData.get("cep"));
    const address = String(formData.get("address"));
    const city = String(formData.get("city"));
    const userState = String(formData.get("state")).toUpperCase();
    const paymentMethod = String(formData.get("paymentMethod")) || "credit_card";

    // Dados do carrinho
    const cartDataRaw = formData.get("cartData");
    if (!cartDataRaw) {
      return { error: "Carrinho vazio" };
    }

    const cart = JSON.parse(String(cartDataRaw)) as {
      items: CartItem[];
      total: number;
    };

    if (!cart.items || cart.items.length === 0) {
      return { error: "Carrinho vazio" };
    }

    // Validações básicas
    if (!name || !email || !phone || !address || !city || !cep || !userState) {
      return { error: "Por favor, preencha todos os campos obrigatórios." };
    }

    if (!cep || cep.replace(/\D/g, "").length !== 8) {
      return { error: "Por favor, informe um CEP válido." };
    }

    // Simular delay de processamento
    await simulateAPIDelay(1000);

    // Gerar código de pedido fictício
    const orderCode = `T4L-DEMO-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;

    console.log("🎭 DEMO MODE: Pedido de carrinho simulado", {
      orderCode,
      itemCount: cart.items.length,
      total: cart.total,
      customer: name,
      paymentMethod
    });

    // Criar resumo dos produtos
    const productSummary = cart.items.map(item => item.product_name).join(', ');

    // Simular sucesso do checkout
    return {
      success: true,
      // Redirecionar para página de sucesso com dados simulados
      paymentUrl: `/compra-sucesso?demo=true&order=${orderCode}&products=${encodeURIComponent(productSummary)}&amount=${cart.total}`
    };

  } catch (error: any) {
    console.error("❌ Erro no checkout demo:", error);
    return {
      error: `Erro ao processar pedido: ${error.message || "Erro desconhecido"}`,
    };
  }
}
