import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

// GET: Dados do dashboard do parceiro
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const partnerId = searchParams.get("partnerId");
    const period = searchParams.get("period") || "30"; // dias

    if (!partnerId) {
      return NextResponse.json({ error: "Missing partnerId" }, { status: 400 });
    }

    // Verificar se o parceiro existe e está ativo
    const { data: partner, error: partnerError } = await supabase
      .from("partners")
      .select("id, name, email, commission_rate, status")
      .eq("id", partnerId)
      .single();

    if (partnerError || !partner) {
      return NextResponse.json({ error: "Partner not found" }, { status: 404 });
    }

    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(period));

    // 1. Buscar vendas do período
    const { data: sales, error: salesError } = await supabase
      .from("partner_sales")
      .select(
        `
        id,
        amount,
        commission,
        status,
        created_at,
        order_id,
        product_id,
        products!inner(name),
        orders!inner(status)
      `
      )
      .eq("partner_id", partnerId)
      .gte("created_at", daysAgo.toISOString())
      .order("created_at", { ascending: false });

    if (salesError) {
      console.error("Sales fetch error:", salesError);
      return NextResponse.json(
        { error: "Failed to fetch sales" },
        { status: 500 }
      );
    }

    // 2. Calcular métricas
    const totalSales = sales?.reduce((sum, s) => sum + s.amount, 0) || 0;
    const totalCommission =
      sales?.reduce((sum, s) => sum + s.commission, 0) || 0;
    const completedCommission =
      sales
        ?.filter((s) => s.status === "completed")
        .reduce((sum, s) => sum + s.commission, 0) || 0;
    const pendingCommission =
      sales
        ?.filter((s) => s.status === "pending_payout")
        .reduce((sum, s) => sum + s.commission, 0) || 0;

    // 3. Buscar histórico de pagamentos
    const { data: payouts, error: payoutsError } = await supabase
      .from("partner_payouts")
      .select("id, amount, status, created_at, date_from, date_to")
      .eq("partner_id", partnerId)
      .order("created_at", { ascending: false })
      .limit(10);

    // 4. Produtos mais vendidos
    const { data: topProducts } = await supabase
      .from("partner_sales")
      .select("product_id, products!inner(name), amount, count")
      .eq("partner_id", partnerId)
      .gte("created_at", daysAgo.toISOString())
      .order("amount", { ascending: false })
      .limit(5);

    return NextResponse.json({
      partner,
      metrics: {
        totalSales: totalSales / 100,
        totalCommission: totalCommission / 100,
        completedCommission: completedCommission / 100,
        pendingCommission: pendingCommission / 100,
        salesCount: sales?.length || 0,
      },
      sales:
        sales?.map((s: any) => ({
          id: s.id,
          orderId: s.order_id,
          productName: (s.products as any)?.name,
          amount: s.amount / 100,
          commission: s.commission / 100,
          status: s.status,
          orderStatus: (s.orders as any)?.status,
          date: s.created_at,
        })) || [],
      payouts:
        payouts?.map((p) => ({
          id: p.id,
          amount: p.amount / 100,
          status: p.status,
          dateFrom: p.date_from,
          dateTo: p.date_to,
          createdAt: p.created_at,
        })) || [],
      topProducts:
        topProducts?.map((p: any) => ({
          name: (p.products as any)?.name,
          amount: p.amount / 100,
        })) || [],
    });
  } catch (error) {
    console.error("Dashboard fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST: Solicitar payout (extrato de vendas)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { partnerId, startDate, endDate } = body;

    if (!partnerId || !startDate || !endDate) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Buscar comissões do período
    const { data: sales, error: salesError } = await supabase
      .from("partner_sales")
      .select("commission, status")
      .eq("partner_id", partnerId)
      .eq("status", "completed")
      .gte("created_at", startDate)
      .lte("created_at", endDate);

    if (salesError) {
      return NextResponse.json(
        { error: "Failed to fetch commissions" },
        { status: 500 }
      );
    }

    const totalCommission =
      sales?.reduce((sum, s) => sum + s.commission, 0) || 0;

    // Criar solicitação de payout
    const { data: payout, error: payoutError } = await supabase
      .from("partner_payouts")
      .insert({
        partner_id: partnerId,
        amount: totalCommission,
        status: "pending",
        date_from: startDate,
        date_to: endDate,
        notes: `Payout for ${startDate} to ${endDate}`,
      })
      .select()
      .single();

    if (payoutError) {
      return NextResponse.json(
        { error: "Failed to create payout request" },
        { status: 500 }
      );
    }

    // Notificar parceiro
    const { data: partner } = await supabase
      .from("partners")
      .select("email")
      .eq("id", partnerId)
      .single();

    if (partner?.email) {
      // Enviar email
      await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/emails/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "partner_payout_request",
          email: partner.email,
          data: {
            payoutId: payout.id,
            amount: totalCommission / 100,
            dateFrom: startDate,
            dateTo: endDate,
          },
        }),
      }).catch((err) => console.error("Email send error:", err));
    }

    return NextResponse.json({
      success: true,
      payout: {
        id: payout.id,
        amount: totalCommission / 100,
        status: payout.status,
      },
    });
  } catch (error) {
    console.error("Payout creation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
