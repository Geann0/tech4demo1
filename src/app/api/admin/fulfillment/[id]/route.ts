import { NextRequest, NextResponse } from "next/server";

// DEMO VERSION - Order status update disabled
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { status } = await request.json();

  try {
    // Mock successful status update
    return NextResponse.json({
      success: true,
      message: "Demo mode: Order status update is disabled",
    });
  } catch (error) {
    console.error("Erro ao atualizar status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
