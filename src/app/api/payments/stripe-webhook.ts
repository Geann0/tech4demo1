import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2023-10-16",
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

// Evento ao receber requisição POST
export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature") || "";

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET || ""
    );
  } catch (error) {
    console.error("Webhook signature verification failed:", error);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "payment_intent.succeeded":
        await handlePaymentIntentSucceeded(
          event.data.object as Stripe.PaymentIntent
        );
        break;

      case "payment_intent.payment_failed":
        await handlePaymentIntentFailed(
          event.data.object as Stripe.PaymentIntent
        );
        break;

      case "payment_intent.canceled":
        await handlePaymentIntentCanceled(
          event.data.object as Stripe.PaymentIntent
        );
        break;

      case "charge.refunded":
        await handleChargeRefunded(event.data.object as Stripe.Charge);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}

async function handlePaymentIntentSucceeded(
  paymentIntent: Stripe.PaymentIntent
) {
  const { orderId, userId } = paymentIntent.metadata;

  if (!orderId) return;

  // 1. Atualizar status do pedido para pago
  const { data: order, error: fetchError } = await supabase
    .from("orders")
    .select("id, user_id, email, items, total_amount")
    .eq("id", orderId)
    .single();

  if (fetchError || !order) {
    console.error("Order not found:", fetchError);
    return;
  }

  // 2. Atualizar payment_status e adicionar payment_id
  const { error: updateError } = await supabase
    .from("orders")
    .update({
      payment_status: "completed",
      status: "confirmed", // ou 'processing'
      payment_id: paymentIntent.id,
      paid_at: new Date().toISOString(),
    })
    .eq("id", orderId);

  if (updateError) {
    console.error("Error updating order payment status:", updateError);
    return;
  }

  // 3. Criar evento de auditoria (opcional)
  await supabase
    .from("audit_logs")
    .insert({
      action: "payment_completed",
      order_id: orderId,
      user_id: userId,
      details: {
        stripe_intent_id: paymentIntent.id,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
      },
    })
    .catch((err) => console.error("Audit log error:", err));

  // 4. Enviar email de confirmação (será integrado com Resend depois)
  // sendOrderConfirmationEmail(order.email, order);

  // 5. Se houver parceiros, registrar a venda para comissão
  await recordPartnerSales(orderId, order);

  console.log(`✅ Payment succeeded for order ${orderId}`);
}

async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  const { orderId } = paymentIntent.metadata;

  if (!orderId) return;

  const { error } = await supabase
    .from("orders")
    .update({
      payment_status: "failed",
      status: "payment_failed",
    })
    .eq("id", orderId);

  if (error) {
    console.error("Error updating failed payment:", error);
  }

  console.log(`❌ Payment failed for order ${orderId}`);
}

async function handlePaymentIntentCanceled(
  paymentIntent: Stripe.PaymentIntent
) {
  const { orderId } = paymentIntent.metadata;

  if (!orderId) return;

  const { error } = await supabase
    .from("orders")
    .update({
      payment_status: "canceled",
      status: "canceled",
    })
    .eq("id", orderId);

  if (error) {
    console.error("Error updating canceled payment:", error);
  }

  console.log(`⚠️ Payment canceled for order ${orderId}`);
}

async function handleChargeRefunded(charge: Stripe.Charge) {
  const { orderId } = charge.metadata;

  if (!orderId) return;

  const { error } = await supabase
    .from("orders")
    .update({
      payment_status: "refunded",
      status: "refunded",
      refunded_at: new Date().toISOString(),
    })
    .eq("id", orderId);

  if (error) {
    console.error("Error updating refunded order:", error);
  }

  console.log(`🔄 Payment refunded for order ${orderId}`);
}

async function recordPartnerSales(orderId: string, order: any) {
  try {
    // Buscar produtos do pedido e identificar parceiros
    const { data: items } = await supabase
      .from("order_items")
      .select("product_id, quantity, price")
      .eq("order_id", orderId);

    if (!items) return;

    for (const item of items) {
      const { data: product } = await supabase
        .from("products")
        .select("partner_id")
        .eq("id", item.product_id)
        .single();

      if (product?.partner_id) {
        // Registrar venda do parceiro (comissão = 10% por padrão)
        const commission = (item.price * item.quantity * 0.1) / 100; // 10%

        await supabase
          .from("partner_sales")
          .insert({
            partner_id: product.partner_id,
            order_id: orderId,
            product_id: item.product_id,
            amount: item.price * item.quantity,
            commission: commission,
            status: "pending_payout",
          })
          .catch((err) => console.error("Partner sales record error:", err));
      }
    }
  } catch (error) {
    console.error("Error recording partner sales:", error);
  }
}
