"use server";

import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

/**
 * Cliente confirma recebimento do pedido
 * Regra CDC: Cliente tem 7 dias corridos para reclamar após recebimento
 */
export async function confirmDelivery(orderId: string) {
  const supabase = createServerComponentClient({ cookies });

  // Verificar autenticação
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Você precisa estar logado" };
  }

  // Buscar pedido e verificar se pertence ao usuário
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("*, profiles!inner(email)")
    .eq("id", orderId)
    .single();

  if (orderError || !order) {
    return { error: "Pedido não encontrado" };
  }

  // Verificar se o pedido pertence ao usuário logado
  const { data: profile } = await supabase
    .from("profiles")
    .select("email")
    .eq("id", user.id)
    .single();

  if (!profile || profile.email !== order.customer_email) {
    return { error: "Este pedido não pertence a você" };
  }

  // Verificar se o status permite confirmação (deve estar enviado)
  if (order.status !== "shipped") {
    return {
      error: "Apenas pedidos enviados podem ser confirmados como entregues",
    };
  }

  // ⚠️ VERIFICAR SE A TRANSPORTADORA JÁ CONFIRMOU A ENTREGA
  if (!order.carrier_delivered_at) {
    return {
      error:
        "⚠️ A transportadora ainda não confirmou a entrega deste pedido. " +
        "Você poderá confirmar o recebimento após a transportadora atualizar o status de entrega.",
    };
  }

  // Atualizar para delivered
  const { error: updateError } = await supabase
    .from("orders")
    .update({
      status: "delivered",
      delivered_at: new Date().toISOString(),
    })
    .eq("id", orderId);

  if (updateError) {
    console.error("Error confirming delivery:", updateError);
    return { error: "Erro ao confirmar entrega. Tente novamente." };
  }

  // Log de auditoria
  await supabase.from("audit_log").insert({
    user_id: user.id,
    action: "CONFIRM_DELIVERY",
    table_name: "orders",
    record_id: orderId,
    new_values: { status: "delivered", delivered_at: new Date().toISOString() },
    ip_address: null,
  });

  revalidatePath("/conta/compras");
  return {
    success: true,
    message: "✅ Entrega confirmada! Obrigado pela confirmação.",
  };
}

/**
 * Sistema auto-confirma entrega após 7 dias DA TRANSPORTADORA CONFIRMAR (CDC)
 * Esta função deve ser chamada por um cron job diário
 *
 * REGRA: Cliente tem 7 dias APÓS A ENTREGA FÍSICA para reclamar
 * Se não reclamar, o recebimento é confirmado automaticamente
 */
export async function autoConfirmDeliveries() {
  const supabase = createServerComponentClient({ cookies });

  // Buscar pedidos onde transportadora confirmou entrega há mais de 7 dias
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const { data: ordersToConfirm, error } = await supabase
    .from("orders")
    .select("id, carrier_delivered_at, carrier_name")
    .eq("status", "shipped")
    .not("carrier_delivered_at", "is", null)
    .is("delivered_at", null) // Cliente ainda não confirmou
    .lt("carrier_delivered_at", sevenDaysAgo.toISOString());

  if (error) {
    console.error("Error fetching orders for auto-confirm:", error);
    return { error: error.message };
  }

  if (!ordersToConfirm || ordersToConfirm.length === 0) {
    return { message: "Nenhum pedido para auto-confirmar", count: 0 };
  }

  // Atualizar todos os pedidos
  const orderIds = ordersToConfirm.map((o) => o.id);

  const { error: updateError } = await supabase
    .from("orders")
    .update({
      status: "delivered",
      delivered_at: new Date().toISOString(),
      auto_confirmed: true,
    })
    .in("id", orderIds);

  if (updateError) {
    console.error("Error auto-confirming deliveries:", updateError);
    return { error: updateError.message };
  }

  // Log de auditoria em lote
  const auditLogs = orderIds.map((id) => ({
    user_id: null, // Sistema
    action: "AUTO_CONFIRM_DELIVERY",
    table_name: "orders",
    record_id: id,
    new_values: {
      status: "delivered",
      delivered_at: new Date().toISOString(),
      auto_confirmed: true,
      reason:
        "Auto-confirmado após 7 dias da transportadora confirmar entrega (CDC Art. 49)",
    },
    ip_address: null,
  }));

  await supabase.from("audit_log").insert(auditLogs);

  return {
    success: true,
    message: `✅ ${orderIds.length} pedido(s) auto-confirmado(s)`,
    count: orderIds.length,
  };
}
