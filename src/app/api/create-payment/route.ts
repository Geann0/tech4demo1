import { NextRequest, NextResponse } from "next/server";

// DEMO VERSION - Payment creation disabled
export async function POST(req: NextRequest) {
  try {
    return NextResponse.json(
      {
        success: false,
        error:
          "Demo mode: Payment creation is disabled. This is a portfolio demo.",
        message: "Real payment processing is disabled in demo version",
      },
      { status: 400 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
