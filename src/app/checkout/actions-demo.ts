"use server";

import { simulateAPIDelay } from "@/lib/mockData";

interface CheckoutState {
  error?: string | null;
  success?: boolean;
  paymentUrl?: string;
  outOfCoverage?: boolean;
  userLocation?: { city: string; state: string };
  productId?: string;
  paymentMethod?: string;
  orderId?: string;
}

export async function processCheckout(
  prevState: CheckoutState,
  formData: FormData
): Promise<CheckoutState> {
  // VERSÃO DEMO: Simulação de checkout sem APIs de pagamento

  // Product Info
  const productId = String(formData.get("productId"));
  const productName = String(formData.get("productName"));
  const productPrice = Number(formData.get("productPrice"));
  const productSlug = String(formData.get("slug"));

  // Customer Info
  const name = String(formData.get("name"));
  const email = String(formData.get("email"));
  const phone = String(formData.get("phone"));
  const cep = String(formData.get("cep"));
  const address = String(formData.get("address"));
  const city = String(formData.get("city"));
  const userState = String(formData.get("state")).toUpperCase();
  const paymentMethod = String(formData.get("paymentMethod")) || "credit_card";

  // Validações básicas
  if (!name || !email || !phone || !address || !city || !cep || !userState) {
    return { error: "Por favor, preencha todos os campos obrigatórios." };
  }

  if (!cep || cep.replace(/\D/g, "").length !== 8) {
    return { error: "Por favor, informe um CEP válido." };
  }

  // Simular delay de API
  await simulateAPIDelay(800);

  // Gerar ID simulado para pedido
  const mockOrderId = `DEMO-${Date.now()}`;
  const orderCode = `T4L-DEMO-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;

  console.log("🎭 DEMO MODE: Pedido simulado criado", {
    orderId: mockOrderId,
    orderCode,
    product: productName,
    customer: name,
    paymentMethod
  });

  // Simular sucesso do checkout
  return {
    success: true,
    orderId: mockOrderId,
    paymentMethod,
    // Em demo, redirecionamos direto para página de sucesso
    paymentUrl: `/compra-sucesso?demo=true&order=${orderCode}&product=${encodeURIComponent(productName)}&amount=${productPrice}`
  };
}
