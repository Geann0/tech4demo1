import { NextRequest, NextResponse } from "next/server";

// DEMO VERSION - Carrier webhook disabled
export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const carrier = searchParams.get("carrier");

    console.log("Demo: Carrier webhook received", { carrier });

    return NextResponse.json({
      success: true,
      message: "Demo mode: Carrier webhook is disabled"
    });
  } catch (error) {
    console.error("Erro ao processar webhook:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
