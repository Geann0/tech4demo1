// ================================================================
// WEBHOOK: Recebe notificações de transportadoras
// ================================================================
// Endpoint: POST /api/webhooks/carrier
// Suporta: Correios, FedEx, Loggi

import { NextRequest, NextResponse } from "next/server";
import { handleCarrierWebhook } from "@/lib/tracking-api";

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const carrier = searchParams.get("carrier");

    if (!carrier) {
      return NextResponse.json(
        { error: "Carrier não especificado" },
        { status: 400 }
      );
    }

    const payload = await request.json();

    // Validar assinatura do webhook (dependendo da transportadora)
    if (!validateWebhookSignature(carrier, request, payload)) {
      return NextResponse.json(
        { error: "Assinatura inválida" },
        { status: 401 }
      );
    }

    // Processar webhook
    await handleCarrierWebhook(carrier, payload);

    return NextResponse.json({
      success: true,
      message: "Webhook processado com sucesso",
    });
  } catch (error) {
    console.error("❌ Erro ao processar webhook de transportadora:", error);

    return NextResponse.json(
      { error: "Erro ao processar webhook" },
      { status: 500 }
    );
  }
}

/**
 * Valida assinatura do webhook para garantir autenticidade
 */
function validateWebhookSignature(
  carrier: string,
  request: NextRequest,
  payload: any
): boolean {
  try {
    switch (carrier.toLowerCase()) {
      case "correios": {
        // Correios usa token no header
        const token = request.headers.get("x-correios-token");
        const expectedToken = process.env.CORREIOS_WEBHOOK_TOKEN;
        return token === expectedToken;
      }

      case "fedex": {
        // FedEx usa HMAC SHA256
        const signature = request.headers.get("x-fedex-signature");
        const secret = process.env.FEDEX_WEBHOOK_SECRET;

        if (!signature || !secret) return false;

        const crypto = require("crypto");
        const expectedSignature = crypto
          .createHmac("sha256", secret)
          .update(JSON.stringify(payload))
          .digest("hex");

        return signature === expectedSignature;
      }

      case "loggi": {
        // Loggi usa API key no header
        const apiKey = request.headers.get("x-loggi-api-key");
        const expectedKey = process.env.LOGGI_WEBHOOK_KEY;
        return apiKey === expectedKey;
      }

      default:
        console.warn(`⚠️ Validação não implementada para: ${carrier}`);
        return false;
    }
  } catch (error) {
    console.error("❌ Erro ao validar assinatura:", error);
    return false;
  }
}

// Permitir POST apenas
export async function GET() {
  return NextResponse.json(
    { error: "Método não permitido. Use POST." },
    { status: 405 }
  );
}
