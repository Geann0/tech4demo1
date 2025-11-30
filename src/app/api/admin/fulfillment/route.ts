import { NextRequest, NextResponse } from "next/server";

// DEMO VERSION - Fulfillment orders disabled
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");

  try {
    // Mock empty fulfillment orders
    return NextResponse.json({ 
      orders: [],
      message: "Demo mode: No fulfillment orders available"
    });
  } catch (error) {
    console.error("Erro ao buscar pedidos WMS:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
