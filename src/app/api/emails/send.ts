import { NextRequest, NextResponse } from "next/server";

// DEMO VERSION - Email sending disabled
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log("Demo: Email send request", body);
    
    return NextResponse.json({ 
      success: true,
      message: "Demo mode: Email sending is disabled"
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
