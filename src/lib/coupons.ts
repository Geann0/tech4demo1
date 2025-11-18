/**
 * 🎟️ SISTEMA DE CUPONS DE DESCONTO
 */

export interface Coupon {
  id: string;
  code: string;
  description: string;
  type: "percentage" | "fixed";
  value: number;
  minPurchaseAmount: number;
  maxDiscountAmount: number | null;
  usageLimit: number | null;
  usagePerCustomer: number;
  validFrom: string;
  validUntil: string;
  active: boolean;
  firstPurchaseOnly: boolean;
}

export interface CouponValidation {
  valid: boolean;
  error?: string;
  coupon_id?: string;
  code?: string;
  type?: "percentage" | "fixed";
  value?: number;
  discount_amount?: number;
  description?: string;
}

/**
 * Validar cupom de desconto
 */
export async function validateCoupon(
  code: string,
  userId: string,
  cartTotal: number
): Promise<CouponValidation> {
  const { createClient } = await import("@/lib/supabaseServer");
  const supabase = await createClient();

  try {
    // Chamar função PostgreSQL
    const { data, error } = await supabase.rpc("validate_coupon", {
      p_coupon_code: code.toUpperCase(),
      p_user_id: userId,
      p_cart_total: cartTotal,
    });

    if (error) {
      console.error("❌ Erro ao validar cupom:", error);
      return {
        valid: false,
        error: "Erro ao validar cupom",
      };
    }

    return data as CouponValidation;
  } catch (error) {
    console.error("❌ Exceção ao validar cupom:", error);
    return {
      valid: false,
      error: "Erro ao processar cupom",
    };
  }
}

/**
 * Aplicar cupom no checkout
 */
export async function applyCoupon(
  couponId: string,
  userId: string,
  orderId: string,
  discountAmount: number
): Promise<boolean> {
  const { createClient } = await import("@/lib/supabaseServer");
  const supabase = await createClient();

  try {
    // Registrar uso do cupom
    const { error } = await supabase.from("coupon_usage").insert({
      coupon_id: couponId,
      user_id: userId,
      order_id: orderId,
      discount_amount: discountAmount,
    });

    if (error) {
      console.error("❌ Erro ao aplicar cupom:", error);
      return false;
    }

    // Atualizar pedido com desconto
    await supabase
      .from("orders")
      .update({
        discount_amount: discountAmount,
        coupon_code: couponId,
      })
      .eq("id", orderId);

    return true;
  } catch (error) {
    console.error("❌ Exceção ao aplicar cupom:", error);
    return false;
  }
}

/**
 * Listar cupons ativos
 */
export async function getActiveCoupons(): Promise<Coupon[]> {
  const { createClient } = await import("@/lib/supabaseServer");
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("coupons")
    .select("*")
    .eq("active", true)
    .gte("valid_until", new Date().toISOString())
    .order("created_at", { ascending: false });

  if (error) {
    console.error("❌ Erro ao buscar cupons:", error);
    return [];
  }

  return (data || []).map((c) => ({
    id: c.id,
    code: c.code,
    description: c.description,
    type: c.type,
    value: c.value,
    minPurchaseAmount: c.min_purchase_amount,
    maxDiscountAmount: c.max_discount_amount,
    usageLimit: c.usage_limit,
    usagePerCustomer: c.usage_per_customer,
    validFrom: c.valid_from,
    validUntil: c.valid_until,
    active: c.active,
    firstPurchaseOnly: c.first_purchase_only,
  }));
}
