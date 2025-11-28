// ================================================================
// API: GERAR DOCUMENTOS DE ENVIO (Etiquetas e Romaneio)
// ================================================================
// Endpoint: GET /api/orders/[orderId]/documents?type=label|slip|all

import { NextRequest, NextResponse } from "next/server";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import {
  generateShippingLabel,
  generatePackingSlip,
  generateInsideLabel,
  generateAllOrderDocuments,
} from "@/lib/label-generator";

export async function GET(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    const supabase = createServerComponentClient({ cookies });
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "all";

    // Verificar autenticação
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Buscar pedido com todos os dados necessários
    const { data: order, error } = await supabase
      .from("orders")
      .select(
        `
        *,
        order_items (
          quantity,
          price_at_purchase,
          products (
            name,
            sku
          )
        ),
        profiles!customer_id (
          full_name,
          phone
        )
      `
      )
      .eq("id", params.orderId)
      .single();

    if (error || !order) {
      return NextResponse.json(
        { error: "Pedido não encontrado" },
        { status: 404 }
      );
    }

    // Verificar se usuário é o parceiro do pedido ou admin
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const isAdmin = profile?.role === "admin";
    const isPartner = profile?.role === "partner";

    // Buscar se o usuário é parceiro deste pedido
    if (!isAdmin && isPartner) {
      const { data: orderItems } = await supabase
        .from("order_items")
        .select("partner_id")
        .eq("order_id", order.id);

      const partnerIds = orderItems?.map((item) => item.partner_id) || [];

      if (!partnerIds.includes(user.id)) {
        return NextResponse.json(
          { error: "Você não tem permissão para acessar este pedido" },
          { status: 403 }
        );
      }
    } else if (!isAdmin && !isPartner) {
      return NextResponse.json(
        { error: "Apenas parceiros e administradores podem gerar documentos" },
        { status: 403 }
      );
    }

    // Buscar dados do parceiro (remetente)
    const partnerIds =
      order.order_items?.map((item: any) => item.partner_id) || [];
    const { data: partnerData } = await supabase
      .from("profiles")
      .select("full_name, phone")
      .in("id", partnerIds)
      .single();

    const { data: partnerLegalData } = await supabase
      .from("partner_legal_data")
      .select(
        "company_street, company_number, company_city, company_state, company_zip"
      )
      .in("partner_id", partnerIds)
      .single();

    // Preparar dados para geração
    const documentData = {
      orderId: order.id,
      orderCode: order.order_code || `ORD-${order.id.slice(0, 8)}`,
      trackingCode: order.tracking_code || "PENDENTE",
      orderDate: new Date(order.created_at),
      shippingDate: order.shipped_at ? new Date(order.shipped_at) : new Date(),

      // Remetente (Vendedor)
      senderName: partnerData?.full_name || "Vendedor Tech4Loop",
      senderAddress: `${partnerLegalData?.company_street || "Rua Exemplo"}, ${partnerLegalData?.company_number || "S/N"}`,
      senderCity: partnerLegalData?.company_city || "Cidade",
      senderState: partnerLegalData?.company_state || "UF",
      senderZip: partnerLegalData?.company_zip || "00000-000",
      senderPhone: partnerData?.phone,

      // Destinatário (Cliente)
      recipientName: order.customer_name,
      recipientAddress: order.customer_address,
      recipientCity: order.customer_city,
      recipientState: order.customer_state,
      recipientZip: order.customer_zip,
      recipientPhone: order.profiles?.phone,

      // Transportadora
      carrierName: order.carrier_name || "Correios",
      carrierService: "PAC",

      // Itens
      items:
        order.order_items?.map((item: any) => ({
          name: item.products?.name || "Produto",
          sku: item.products?.sku,
          quantity: item.quantity,
          price: item.price_at_purchase,
        })) || [],

      totalAmount: order.total_amount,
      paymentMethod: order.payment_method || "Não informado",
    };

    // Gerar documentos conforme tipo solicitado
    let responseBuffer: Buffer;
    let filename: string;
    let contentType = "application/pdf";

    switch (type) {
      case "label": {
        responseBuffer = await generateShippingLabel(documentData);
        filename = `etiqueta-${order.order_code}.pdf`;
        break;
      }

      case "slip": {
        responseBuffer = await generatePackingSlip(documentData);
        filename = `romaneio-${order.order_code}.pdf`;
        break;
      }

      case "inside": {
        responseBuffer = await generateInsideLabel(
          documentData.orderCode,
          documentData.recipientName,
          `https://tech4loop.com/rastreamento/${order.id}`
        );
        filename = `etiqueta-interna-${order.order_code}.pdf`;
        break;
      }

      case "all": {
        // Retornar JSON com URLs para cada documento
        return NextResponse.json({
          success: true,
          documents: {
            shippingLabel: `/api/orders/${order.id}/documents?type=label`,
            packingSlip: `/api/orders/${order.id}/documents?type=slip`,
            insideLabel: `/api/orders/${order.id}/documents?type=inside`,
          },
        });
      }

      default:
        return NextResponse.json(
          {
            error:
              "Tipo de documento inválido. Use: label, slip, inside, ou all",
          },
          { status: 400 }
        );
    }

    // Retornar PDF
    return new Response(new Uint8Array(responseBuffer), {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": responseBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error("Erro ao gerar documentos:", error);

    return NextResponse.json(
      {
        error: "Erro ao gerar documentos",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 }
    );
  }
}
