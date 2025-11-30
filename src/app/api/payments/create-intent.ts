import { NextRequest, NextResponse } from "next/server";

// DEMO VERSION - Stripe payment intent disabled
export async function POST(request: NextRequest) {
  try {
    return NextResponse.json({ 
      success: false,
      error: "Demo mode: Stripe payment is disabled",
      message: "Payment processing is disabled in demo version"
    }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
