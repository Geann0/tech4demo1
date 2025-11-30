// ================================================================
// DEMO VERSION - Orders API Desabilitado
// ================================================================
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  console.log(" [DEMO] Simulando busca de pedidos (sem banco de dados real)");
  
  return NextResponse.json({
    success: true,
    message: "Demo mode: Banco de dados desabilitado",
    orders: [],
  });
}
