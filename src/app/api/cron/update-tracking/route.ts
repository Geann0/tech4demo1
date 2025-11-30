// ================================================================
// DEMO VERSION - Cron Job de Rastreamento Desabilitado
// ================================================================
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const expectedToken = process.env.CRON_SECRET_TOKEN;

    if (!expectedToken) {
      console.error(" CRON_SECRET_TOKEN não configurado");
      return NextResponse.json(
        { error: "Configuração inválida" },
        { status: 500 }
      );
    }

    if (authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    console.log(" [DEMO] Simulando atualização de rastreamentos via cron...");

    return NextResponse.json({
      success: true,
      message: "Demo mode: Rastreamento simulado",
      timestamp: new Date().toISOString(),
      updated: 0,
    });
  } catch (error) {
    console.error(" Erro no cron de rastreamento:", error);
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
