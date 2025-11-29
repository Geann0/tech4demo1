import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2025-11-17.clover",
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

interface PaymentRequest {
  orderId: string;
  amount: number;
  currency: string;
  userId: string;
  email: string;
  metadata?: Record<string, string>;
}

export async function POST(request: NextRequest) {
  try {
    const body: PaymentRequest = await request.json();

    const { orderId, amount, currency, userId, email, metadata } = body;

    // Validações
    if (!orderId || !amount || !userId || !email) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Verificar se o pedido existe e pertence ao usuário
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id, user_id, total_amount, status")
      .eq("id", orderId)
      .eq("user_id", userId)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Verificar se o valor está correto (comparar com o pedido)
    if (amount !== Math.round(order.total_amount * 100)) {
      return NextResponse.json({ error: "Amount mismatch" }, { status: 400 });
    }

    // Criar intent de pagamento no Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount, // em centavos
      currency: currency.toLowerCase(),
      customer: undefined, // opcional - pode criar customer se quiser
      receipt_email: email,
      metadata: {
        orderId,
        userId,
        ...metadata,
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    // Atualizar pedido com Stripe intent ID
    const { error: updateError } = await supabase
      .from("orders")
      .update({
        stripe_intent_id: paymentIntent.id,
        payment_status: "pending",
      })
      .eq("id", orderId);

    if (updateError) {
      console.error("Error updating order:", updateError);
      return NextResponse.json(
        { error: "Failed to create payment intent" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      status: paymentIntent.status,
    });
  } catch (error) {
    console.error("Payment intent error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
