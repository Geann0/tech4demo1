// ================================================================
// DEMO VERSION - Documents API Desabilitado
// ================================================================
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  console.log(
    "🔄 [DEMO] Simulando geração de documentos para pedido:",
    params.orderId
  );

  return NextResponse.json(
    {
      success: false,
      error: "Demo mode: Geração de documentos desabilitada",
      message: "Esta funcionalidade requer autenticação e banco de dados reais",
    },
    { status: 400 }
  );
}
