"use server";

// DEMO VERSION - MercadoPago and Supabase disabled
// All cart checkout functionality is disabled in this demo version

interface CheckoutState {
  error?: string | null;
  success?: boolean;
  paymentUrl?: string;
}

export async function processCartCheckout(
  prevState: CheckoutState,
  formData: FormData
): Promise<CheckoutState> {
  console.log(" [DEMO] Tentativa de cart checkout bloqueada - Demo mode ativo");
  
  return {
    error: " Modo Demo: O checkout do carrinho está desabilitado nesta versão de demonstração. Esta é uma aplicação de portfólio sem funcionalidade de pagamento real.",
    success: false,
  };
}
