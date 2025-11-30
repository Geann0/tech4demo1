import { NextRequest, NextResponse } from "next/server";

// DEMO VERSION - Stripe webhook disabled
export async function POST(request: NextRequest) {
  try {
    return NextResponse.json({ 
      success: true,
      message: "Demo mode: Stripe webhook is disabled"
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
