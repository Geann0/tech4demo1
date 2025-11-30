import { NextRequest, NextResponse } from "next/server";

// DEMO VERSION - Tracking disabled
export async function GET(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    return NextResponse.json({
      order_id: params.orderId,
      status: "processing",
      tracking_code: null,
      customer_name: "Demo Customer",
      total_amount: "0.00",
      created_at: new Date().toISOString(),
      estimated_delivery: null,
      events: [],
      message: "Demo mode: Order tracking is disabled",
    });
  } catch (error) {
    console.error("Erro ao buscar rastreamento:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
