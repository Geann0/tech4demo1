import { NextRequest, NextResponse } from "next/server";

// DEMO VERSION - Payment feedback disabled
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const status = searchParams.get("status");
  const externalReference = searchParams.get("external_reference");

  if (!externalReference) {
    return NextResponse.redirect(
      new URL("/compra-falha?reason=no_ref", request.url)
    );
  }

  // Redireciona o cliente para a página de sucesso ou falha
  if (status === "approved") {
    return NextResponse.redirect(new URL("/compra-sucesso", request.url));
  } else {
    return NextResponse.redirect(
      new URL(`/compra-falha?reason=${status}`, request.url)
    );
  }
}
