"use server";

// DEMO VERSION - MercadoPago and Supabase disabled
// All checkout functionality is disabled in this demo version

interface CheckoutState {
  error?: string | null;
  success?: boolean;
  paymentUrl?: string;
  outOfCoverage?: boolean;
  userLocation?: { city: string; state: string };
  productId?: string;
  paymentMethod?: string;
}

export async function processCheckout(
  prevState: CheckoutState,
  formData: FormData
): Promise<CheckoutState> {
  console.log(" [DEMO] Tentativa de checkout bloqueada - Demo mode ativo");
  
  return {
    error: " Modo Demo: O checkout está desabilitado nesta versão de demonstração. Esta é uma aplicação de portfólio sem funcionalidade de pagamento real.",
    success: false,
  };
}
