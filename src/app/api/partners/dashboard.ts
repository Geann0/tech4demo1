import { NextRequest, NextResponse } from "next/server";

// DEMO VERSION - Partners dashboard disabled
export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({ 
      stats: {
        totalRevenue: 0,
        totalOrders: 0,
        pendingOrders: 0
      },
      recentOrders: [],
      message: "Demo mode: Partners dashboard is disabled"
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
