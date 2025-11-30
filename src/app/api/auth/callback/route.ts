// ================================================================
// DEMO VERSION - Auth Callback Desabilitado
// ================================================================
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  console.log(" [DEMO] Simulando auth callback (sem autenticação real)");
  return NextResponse.redirect(requestUrl.origin);
}
