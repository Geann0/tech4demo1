import { NextRequest, NextResponse } from "next/server";

// DEMO VERSION - Shipping label generation disabled
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Mock shipping label response
    return NextResponse.json({
      success: true,
      trackingCode: `DEMO-${params.id.substring(0, 8).toUpperCase()}`,
      labelUrl: "https://example.com/demo-label.pdf",
      message: "Demo mode: Shipping label generation is disabled",
    });
  } catch (error) {
    console.error("Erro ao gerar etiqueta:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
