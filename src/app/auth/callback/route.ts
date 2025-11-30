// DEMO VERSION - Auth Callback Desabilitado
import { type NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  console.log("🔄 [DEMO] Simulando auth callback (sem autenticação real)");
  return NextResponse.redirect(new URL("/", request.url));
}
