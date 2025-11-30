// ================================================================
// DEMO VERSION - Debug Session Desabilitado
// ================================================================
import { NextResponse } from "next/server";

export async function GET() {
  console.log(" [DEMO] Simulando debug session (sem autenticação real)");
  return NextResponse.json({
    hasSession: false,
    hasUser: false,
    userId: null,
    userEmail: null,
    message: "Demo mode: Autenticação desabilitada",
    cookies: [],
  });
}
