// ================================================================
// API ROUTE: Atualizar Rastreamentos (Cron Job)
// ================================================================
// Endpoint: GET /api/cron/update-tracking
// Executa: A cada 1 hora
// Função: Consulta APIs de transportadoras e atualiza status

import { NextRequest, NextResponse } from "next/server";
import { updateAllShipments } from "@/lib/tracking-api";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    // Validar token de autenticação (para segurança)
    const authHeader = request.headers.get("authorization");
    const expectedToken = process.env.CRON_SECRET_TOKEN;

    if (!expectedToken) {
      console.error("❌ CRON_SECRET_TOKEN não configurado");
      return NextResponse.json(
        { error: "Configuração inválida" },
        { status: 500 }
      );
    }

    if (authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    console.log("🔄 Iniciando atualização de rastreamentos via cron...");

    // Executar atualização
    await updateAllShipments();

    return NextResponse.json({
      success: true,
      message: "Rastreamentos atualizados com sucesso",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Erro no cron de rastreamento:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Erro ao atualizar rastreamentos",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 }
    );
  }
}

// Bloquear outros métodos HTTP
export async function POST() {
  return NextResponse.json(
    { error: "Método não permitido. Use GET." },
    { status: 405 }
  );
}
