// ================================================================
// DEMO VERSION - Auth Signout Desabilitado
// ================================================================
import { NextResponse } from "next/server";

export async function POST() {
  console.log(" [DEMO] Simulando logout (sem autenticação real)");
  return NextResponse.redirect(new URL("/", process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"));
}
