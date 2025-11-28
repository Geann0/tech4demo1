// ================================================================
// INTEGRAÇÃO COM APIs DE RASTREAMENTO
// ================================================================
// Correios, FedEx, Loggi, e outras transportadoras
// Atualiza automaticamente carrier_delivered_at quando status = ENTREGUE

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// ================================================================
// TIPOS
// ================================================================

export type CarrierStatus =
  | "POSTADO" // Pacote postado/coletado
  | "EM_TRANSITO" // Em trânsito
  | "SAIU_PARA_ENTREGA" // Saiu para entrega
  | "ENTREGUE" // Entregue ao destinatário
  | "TENTATIVA_FALHA" // Tentativa de entrega falhou
  | "AGUARDANDO_RETIRADA" // Aguardando retirada na agência
  | "DEVOLVIDO" // Devolvido ao remetente
  | "EXTRAVIADO"; // Extraviado

export interface TrackingEvent {
  date: string;
  location: string;
  status: CarrierStatus;
  description: string;
}

export interface TrackingResponse {
  trackingCode: string;
  carrierName: string;
  currentStatus: CarrierStatus;
  deliveredAt?: string; // Data de entrega (se ENTREGUE)
  recipient?: string; // Nome de quem recebeu
  events: TrackingEvent[];
  lastUpdate: string;
}

// ================================================================
// CORREIOS (Brasil)
// ================================================================

/**
 * Rastreia pedido via API dos Correios
 * Documentação: https://rastreamento.correios.com.br
 */
export async function trackCorreios(
  trackingCode: string
): Promise<TrackingResponse | null> {
  try {
    // API dos Correios (requer token)
    const token = process.env.CORREIOS_API_TOKEN;

    if (!token) {
      console.warn("⚠️ CORREIOS_API_TOKEN não configurado");
      return null;
    }

    const response = await fetch(
      `https://api.correios.com.br/srorastro/v1/objetos/${trackingCode}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      console.error(`❌ Correios API erro: ${response.status}`);
      return null;
    }

    const data = await response.json();

    // Mapear status dos Correios para nosso enum
    const statusMap: Record<string, CarrierStatus> = {
      PO: "POSTADO",
      DO: "EM_TRANSITO",
      OEC: "SAIU_PARA_ENTREGA",
      BDE: "ENTREGUE",
      PMT: "AGUARDANDO_RETIRADA",
      RO: "DEVOLVIDO",
    };

    const lastEvent = data.eventos?.[0];
    const currentStatus = statusMap[lastEvent?.codigo] || "EM_TRANSITO";

    const events: TrackingEvent[] =
      data.eventos?.map((ev: any) => ({
        date: ev.dtHrCriado,
        location: `${ev.unidade.endereco.cidade}/${ev.unidade.endereco.uf}`,
        status: statusMap[ev.codigo] || "EM_TRANSITO",
        description: ev.descricao,
      })) || [];

    return {
      trackingCode,
      carrierName: "Correios",
      currentStatus,
      deliveredAt:
        currentStatus === "ENTREGUE" ? lastEvent.dtHrCriado : undefined,
      recipient: lastEvent?.destino?.[0]?.nome,
      events,
      lastUpdate: new Date().toISOString(),
    };
  } catch (error) {
    console.error("❌ Erro ao rastrear Correios:", error);
    return null;
  }
}

// ================================================================
// FEDEX (Internacional/Nacional)
// ================================================================

/**
 * Rastreia pedido via API do FedEx
 * Documentação: https://developer.fedex.com
 */
export async function trackFedEx(
  trackingCode: string
): Promise<TrackingResponse | null> {
  try {
    const apiKey = process.env.FEDEX_API_KEY;
    const apiSecret = process.env.FEDEX_API_SECRET;

    if (!apiKey || !apiSecret) {
      console.warn("⚠️ FedEx API credentials não configuradas");
      return null;
    }

    // 1. Obter token OAuth
    const authResponse = await fetch("https://apis.fedex.com/oauth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: apiKey,
        client_secret: apiSecret,
      }),
    });

    const { access_token } = await authResponse.json();

    // 2. Rastrear pacote
    const trackResponse = await fetch(
      "https://apis.fedex.com/track/v1/trackingnumbers",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${access_token}`,
          "Content-Type": "application/json",
          "X-locale": "pt_BR",
        },
        body: JSON.stringify({
          trackingInfo: [
            { trackingNumberInfo: { trackingNumber: trackingCode } },
          ],
          includeDetailedScans: true,
        }),
      }
    );

    const data = await trackResponse.json();
    const shipment = data.output?.completeTrackResults?.[0]?.trackResults?.[0];

    if (!shipment) return null;

    // Mapear status do FedEx
    const statusMap: Record<string, CarrierStatus> = {
      PU: "POSTADO",
      IT: "EM_TRANSITO",
      OD: "SAIU_PARA_ENTREGA",
      DL: "ENTREGUE",
      DE: "TENTATIVA_FALHA",
      HL: "AGUARDANDO_RETIRADA",
    };

    const latestStatus = shipment.latestStatusDetail?.code;
    const currentStatus = statusMap[latestStatus] || "EM_TRANSITO";

    const events: TrackingEvent[] =
      shipment.scanEvents?.map((scan: any) => ({
        date: scan.date,
        location: `${scan.scanLocation?.city}, ${scan.scanLocation?.stateOrProvinceCode}`,
        status: statusMap[scan.eventType] || "EM_TRANSITO",
        description: scan.eventDescription,
      })) || [];

    return {
      trackingCode,
      carrierName: "FedEx",
      currentStatus,
      deliveredAt:
        currentStatus === "ENTREGUE"
          ? shipment.deliveryDetails?.actualDeliveryTimestamp
          : undefined,
      recipient: shipment.deliveryDetails?.receivedByName,
      events,
      lastUpdate: new Date().toISOString(),
    };
  } catch (error) {
    console.error("❌ Erro ao rastrear FedEx:", error);
    return null;
  }
}

// ================================================================
// LOGGI (Brasil - Entregas Expressas)
// ================================================================

/**
 * Rastreia pedido via API da Loggi
 * Documentação: https://docs.loggi.com
 */
export async function trackLoggi(
  trackingCode: string
): Promise<TrackingResponse | null> {
  try {
    const apiKey = process.env.LOGGI_API_KEY;

    if (!apiKey) {
      console.warn("⚠️ LOGGI_API_KEY não configurada");
      return null;
    }

    const response = await fetch(
      `https://api.loggi.com/v2/packages/${trackingCode}`,
      {
        headers: {
          Authorization: `ApiKey ${apiKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) return null;

    const data = await response.json();

    const statusMap: Record<string, CarrierStatus> = {
      created: "POSTADO",
      allocated: "EM_TRANSITO",
      in_delivery: "SAIU_PARA_ENTREGA",
      delivered: "ENTREGUE",
      failed: "TENTATIVA_FALHA",
    };

    const currentStatus = statusMap[data.status] || "EM_TRANSITO";

    const events: TrackingEvent[] =
      data.history?.map((h: any) => ({
        date: h.timestamp,
        location: data.destination?.address?.city || "Em trânsito",
        status: statusMap[h.status] || "EM_TRANSITO",
        description: h.message,
      })) || [];

    return {
      trackingCode,
      carrierName: "Loggi",
      currentStatus,
      deliveredAt: currentStatus === "ENTREGUE" ? data.delivered_at : undefined,
      recipient: data.recipient_name,
      events,
      lastUpdate: new Date().toISOString(),
    };
  } catch (error) {
    console.error("❌ Erro ao rastrear Loggi:", error);
    return null;
  }
}

// ================================================================
// DETECTOR AUTOMÁTICO DE TRANSPORTADORA
// ================================================================

/**
 * Detecta a transportadora pelo formato do código de rastreio
 * e chama a API apropriada
 */
export async function trackPackage(
  trackingCode: string
): Promise<TrackingResponse | null> {
  // Correios: 13 caracteres, termina com BR
  if (/^[A-Z]{2}\d{9}BR$/i.test(trackingCode)) {
    return trackCorreios(trackingCode);
  }

  // FedEx: 12 ou 15 dígitos
  if (/^\d{12}$|^\d{15}$/.test(trackingCode)) {
    return trackFedEx(trackingCode);
  }

  // Loggi: UUID format
  if (
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      trackingCode
    )
  ) {
    return trackLoggi(trackingCode);
  }

  console.warn(`⚠️ Formato de tracking code não reconhecido: ${trackingCode}`);
  return null;
}

// ================================================================
// ATUALIZAR STATUS NO BANCO DE DADOS
// ================================================================

/**
 * Atualiza o status de rastreamento no banco
 * Se status = ENTREGUE, define carrier_delivered_at
 */
export async function updateOrderTracking(
  orderId: string,
  trackingData: TrackingResponse
): Promise<void> {
  try {
    const updateData: any = {
      carrier_name: trackingData.carrierName,
      carrier_status: trackingData.currentStatus,
      updated_at: new Date().toISOString(),
    };

    // Se entregue pela transportadora, marcar carrier_delivered_at
    if (trackingData.currentStatus === "ENTREGUE" && trackingData.deliveredAt) {
      updateData.carrier_delivered_at = trackingData.deliveredAt;
    }

    const { error } = await supabase
      .from("orders")
      .update(updateData)
      .eq("id", orderId);

    if (error) {
      console.error("❌ Erro ao atualizar tracking no banco:", error);
      return;
    }

    console.log(
      `✅ Tracking atualizado: ${orderId} → ${trackingData.currentStatus}`
    );

    // Se entregue, notificar cliente para confirmar recebimento
    if (trackingData.currentStatus === "ENTREGUE") {
      await notifyClientDeliveryConfirmation(orderId);
    }
  } catch (error) {
    console.error("❌ Erro ao atualizar ordem:", error);
  }
}

/**
 * Notifica cliente que transportadora confirmou entrega
 * Cliente tem 7 dias para confirmar ou reclamar
 */
async function notifyClientDeliveryConfirmation(
  orderId: string
): Promise<void> {
  try {
    // Buscar dados do pedido
    const { data: order } = await supabase
      .from("orders")
      .select("customer_email, customer_name, order_code")
      .eq("id", orderId)
      .single();

    if (!order) return;

    // TODO: Enviar email para cliente
    console.log(
      `📧 Enviar email para ${order.customer_email}: Pedido ${order.order_code} entregue pela transportadora`
    );

    // Implementar envio de email via Resend
    // await sendDeliveryConfirmationEmail(order);
  } catch (error) {
    console.error("❌ Erro ao notificar cliente:", error);
  }
}

// ================================================================
// CRON JOB: ATUALIZAR TODOS OS RASTREAMENTOS
// ================================================================

/**
 * Função para ser executada por cron job
 * Atualiza status de todos os pedidos em trânsito
 */
export async function updateAllShipments(): Promise<void> {
  try {
    console.log("🔄 Iniciando atualização de rastreamentos...");

    // Buscar pedidos enviados que ainda não foram entregues
    const { data: orders, error } = await supabase
      .from("orders")
      .select("id, tracking_code, carrier_name")
      .eq("status", "shipped")
      .not("tracking_code", "is", null);

    if (error || !orders) {
      console.error("❌ Erro ao buscar pedidos:", error);
      return;
    }

    console.log(`📦 ${orders.length} pedidos para atualizar`);

    // Atualizar cada pedido (com delay para evitar rate limiting)
    for (const order of orders) {
      if (!order.tracking_code) continue;

      const trackingData = await trackPackage(order.tracking_code);

      if (trackingData) {
        await updateOrderTracking(order.id, trackingData);
      }

      // Delay de 1 segundo entre requisições
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    console.log("✅ Atualização de rastreamentos concluída");
  } catch (error) {
    console.error("❌ Erro no cron job de rastreamento:", error);
  }
}

// ================================================================
// WEBHOOK RECEIVER (Para transportadoras que enviam notificações)
// ================================================================

/**
 * Recebe webhooks de transportadoras quando status muda
 * Deve ser exposto via API route: /api/webhooks/carrier
 */
export async function handleCarrierWebhook(
  carrier: string,
  payload: any
): Promise<void> {
  try {
    let trackingCode: string | null = null;
    let status: CarrierStatus | null = null;

    // Parsear webhook de cada transportadora
    switch (carrier.toLowerCase()) {
      case "correios":
        trackingCode = payload.objeto;
        status = payload.status === "BDE" ? "ENTREGUE" : "EM_TRANSITO";
        break;

      case "fedex":
        trackingCode = payload.trackingNumber;
        status =
          payload.scanEvent?.eventType === "DL" ? "ENTREGUE" : "EM_TRANSITO";
        break;

      case "loggi":
        trackingCode = payload.package_id;
        status = payload.status === "delivered" ? "ENTREGUE" : "EM_TRANSITO";
        break;

      default:
        console.warn(`⚠️ Transportadora desconhecida: ${carrier}`);
        return;
    }

    if (!trackingCode || !status) return;

    // Buscar pedido pelo tracking code
    const { data: order } = await supabase
      .from("orders")
      .select("id")
      .eq("tracking_code", trackingCode)
      .single();

    if (!order) {
      console.warn(`⚠️ Pedido não encontrado: ${trackingCode}`);
      return;
    }

    // Atualizar status
    const trackingData: TrackingResponse = {
      trackingCode,
      carrierName: carrier,
      currentStatus: status,
      deliveredAt: status === "ENTREGUE" ? new Date().toISOString() : undefined,
      events: [],
      lastUpdate: new Date().toISOString(),
    };

    await updateOrderTracking(order.id, trackingData);

    console.log(
      `✅ Webhook processado: ${carrier} → ${trackingCode} → ${status}`
    );
  } catch (error) {
    console.error("❌ Erro ao processar webhook:", error);
  }
}
