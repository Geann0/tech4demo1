import { NextRequest, NextResponse } from "next/server";

// DEMO VERSION - Reconciliation disabled
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const start = searchParams.get("start");
  const end = searchParams.get("end");

  if (!start || !end) {
    return NextResponse.json({ error: "Missing date range" }, { status: 400 });
  }

  try {
    // Mock reconciliation data
    return NextResponse.json({ 
      items: [],
      message: "Demo mode: Reconciliation is disabled"
    });
  } catch (error) {
    console.error("Erro na reconciliação:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
