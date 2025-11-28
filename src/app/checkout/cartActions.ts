"use server";

import { MercadoPagoConfig, Preference } from "mercadopago";
import { createClient } from "@supabase/supabase-js";
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
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );

  try {
    // Dados do cliente
    const name = String(formData.get("name"));
    const email = String(formData.get("email"));
    const phone = String(formData.get("phone"));
    const cep = String(formData.get("cep"));
    const address = String(formData.get("address"));
    const city = String(formData.get("city"));
    const userState = String(formData.get("state")).toUpperCase();
    const paymentMethod =
      String(formData.get("paymentMethod")) || "credit_card";

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

    // 🔒 VALIDAÇÃO CRÍTICA: Verificar se o total recebido bate com os itens
    const calculatedTotal = cart.items.reduce(
      (sum, item) => sum + item.product_price * item.quantity,
      0
    );

    // Tolerância de 1 centavo para arredondamento
    if (Math.abs(calculatedTotal - cart.total) > 0.01) {
      console.error("❌ ALERTA DE SEGURANÇA: Total não bate!");
      console.error("Total recebido:", cart.total);
      console.error("Total calculado:", calculatedTotal);
      console.error("Itens:", cart.items);
      return {
        error: "Erro de validação. Por favor, tente novamente.",
      };
    }

    console.log("✅ Validação de total OK:", {
      itemCount: cart.items.length,
      total: cart.total,
      calculated: calculatedTotal,
    });

    // Validações básicas
    if (!name || !email || !phone || !address || !city || !cep || !userState) {
      return { error: "Por favor, preencha todos os campos obrigatórios." };
    }

    // Verificar estoque de todos os produtos
    console.log(`🔍 Verificando estoque de ${cart.items.length} produto(s)...`);

    for (const item of cart.items) {
      const { data: product, error: productError } = await supabase
        .from("products")
        .select("stock, name, price")
        .eq("id", item.product_id)
        .single();

      if (productError || !product) {
        console.error(`❌ Produto ${item.product_id} não encontrado`);
        return { error: `Produto "${item.product_name}" não encontrado.` };
      }

      // 🔒 VALIDAÇÃO CRÍTICA: Verificar se o preço não foi alterado
      if (Math.abs(product.price - item.product_price) > 0.01) {
        console.error("❌ ALERTA: Preço foi alterado!");
        console.error("Preço no banco:", product.price);
        console.error("Preço recebido:", item.product_price);
        return {
          error: `O preço de "${product.name}" foi alterado. Por favor, atualize seu carrinho.`,
        };
      }

      if (
        product.stock !== null &&
        product.stock !== undefined &&
        product.stock < item.quantity
      ) {
        console.error(`❌ Estoque insuficiente: ${product.name}`);
        console.error(
          `Solicitado: ${item.quantity}, Disponível: ${product.stock}`
        );
        return {
          error: `Desculpe, "${product.name}" tem apenas ${product.stock} unidade(s) disponível(is).`,
        };
      }

      console.log(
        `✅ ${product.name}: Estoque OK (${item.quantity}/${product.stock || "∞"})`
      );
    }

    // Criar pedido principal
    console.log("📦 Criando pedido...");
    console.log("Total do pedido:", cart.total);
    console.log("Quantidade de itens:", cart.items.length);

    const { data: orderData, error: orderError } = await supabase
      .from("orders")
      .insert({
        partner_id: cart.items[0].partner_id || null,
        customer_name: name,
        customer_email: email,
        customer_phone: phone,
        customer_cep: cep,
        customer_address: address,
        customer_city: city,
        customer_state: userState,
        total_amount: cart.total,
        status: "pending",
        payment_status: "pending",
      })
      .select()
      .single();

    if (orderError) {
      console.error("❌ Order creation error:", orderError);
      return {
        error: `Não foi possível criar seu pedido: ${orderError.message || "Erro desconhecido"}`,
      };
    }

    console.log("✅ Order created:", orderData.id);
    console.log("Detalhes do pedido:", {
      id: orderData.id,
      total: orderData.total_amount,
      customer: orderData.customer_name,
    });

    // Criar itens do pedido
    console.log(`📝 Criando ${cart.items.length} item(s) do pedido...`);

    // ✅ CALCULAR TAXA DA PLATAFORMA: 7.5% para Tech4Loop, 92.5% para parceiro
    const platformFeeRate = 7.5;

    const orderItems = cart.items.map((item) => {
      const itemTotal = item.product_price * item.quantity;
      const partnerAmount =
        Math.round(((itemTotal * (100 - platformFeeRate)) / 100) * 100) / 100; // 92.5%
      const platformFee =
        Math.round(((itemTotal * platformFeeRate) / 100) * 100) / 100; // 7.5%

      return {
        order_id: orderData.id,
        product_id: item.product_id,
        quantity: item.quantity,
        price_at_purchase: item.product_price,
        partner_amount: partnerAmount,
        platform_fee: platformFee,
        platform_fee_rate: platformFeeRate,
      };
    });

    // Log detalhado de cada item
    orderItems.forEach((item, index) => {
      const itemTotal = item.price_at_purchase * item.quantity;
      console.log(`Item ${index + 1}:`, {
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.price_at_purchase,
        subtotal: itemTotal,
        partner_amount: item.partner_amount,
        platform_fee: item.platform_fee,
      });
    });

    const { error: orderItemsError } = await supabase
      .from("order_items")
      .insert(orderItems);

    if (orderItemsError) {
      console.error("❌ Order items creation error:", orderItemsError);
      return {
        error: `Erro ao adicionar produtos ao pedido: ${orderItemsError.message}`,
      };
    }

    console.log(
      `✅ Created ${cart.items.length} order items successfully with fee calculation`
    );

    // Criar preferência Mercado Pago
    const client = new MercadoPagoConfig({
      accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN!,
    });
    const preference = new Preference(client);

    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL?.trim() || "http://localhost:3002";
    const isLocalhost =
      siteUrl.includes("localhost") || siteUrl.includes("127.0.0.1");

    // Configurar métodos de pagamento
    const paymentMethods: any = {
      installments: 12,
    };

    switch (paymentMethod) {
      case "pix":
        paymentMethods.excluded_payment_types = [
          { id: "ticket" },
          { id: "credit_card" },
          { id: "debit_card" },
        ];
        break;
      case "boleto":
        paymentMethods.excluded_payment_types = [
          { id: "credit_card" },
          { id: "debit_card" },
        ];
        paymentMethods.excluded_payment_methods = [{ id: "pix" }];
        break;
      case "wallet":
        paymentMethods.excluded_payment_types = [
          { id: "ticket" },
          { id: "credit_card" },
          { id: "debit_card" },
        ];
        break;
      case "credit_card":
      default:
        paymentMethods.excluded_payment_types = [{ id: "ticket" }];
        paymentMethods.excluded_payment_methods = [{ id: "pix" }];
        break;
    }

    // Preparar itens para o Mercado Pago
    console.log("💳 Preparando itens para Mercado Pago...");

    const mpItems = cart.items.map((item) => ({
      id: item.product_id,
      title: item.product_name,
      quantity: item.quantity,
      unit_price: item.product_price,
      picture_url: item.product_image,
    }));

    // 🔒 VALIDAÇÃO CRÍTICA: Verificar total do Mercado Pago
    const mpTotal = mpItems.reduce(
      (sum, item) => sum + item.unit_price * item.quantity,
      0
    );

    if (Math.abs(mpTotal - cart.total) > 0.01) {
      console.error("❌ ERRO CRÍTICO: Total do MP não bate!");
      console.error("Total carrinho:", cart.total);
      console.error("Total MP:", mpTotal);
      console.error("Itens MP:", mpItems);
      return {
        error: "Erro ao processar pagamento. Contate o suporte.",
      };
    }

    console.log("✅ Itens Mercado Pago:", {
      count: mpItems.length,
      total: mpTotal,
      items: mpItems.map(
        (i) =>
          `${i.quantity}x ${i.title} = R$${(i.unit_price * i.quantity).toFixed(2)}`
      ),
    });

    const preferenceBody: any = {
      items: mpItems,
      payer: {
        name,
        email,
        phone: { number: phone },
        address: {
          zip_code: cep,
          street_name: address,
          city_name: city,
          state_name: userState,
        },
      },
      payment_methods: paymentMethods,
      back_urls: {
        success: `${siteUrl}/compra-sucesso`,
        failure: `${siteUrl}/compra-falha`,
        pending: `${siteUrl}/conta/compras`,
      },
      external_reference: orderData.id,
      notification_url: `${siteUrl}/api/webhooks/mercadopago`,
      statement_descriptor: "TECH4LOOP",
    };

    if (!isLocalhost) {
      preferenceBody.auto_return = "approved";
    }

    const result = await preference.create({
      body: preferenceBody,
    });

    console.log("✅ Mercado Pago preference created:", result.id);

    return {
      success: true,
      paymentUrl: result.init_point,
    };
  } catch (error: any) {
    console.error("❌ Checkout error:", error);
    return {
      error: `Falha ao processar checkout: ${error.message || "Erro desconhecido"}`,
    };
  }
}
