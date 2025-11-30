import { NextRequest, NextResponse } from "next/server";

// DEMO VERSION - Email verification disabled
export async function GET(request: NextRequest) {
  try {
    return NextResponse.redirect(
      new URL("/login?message=Demo mode: Email verification is disabled", request.url)
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
