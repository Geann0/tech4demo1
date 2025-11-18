"use server";

import { createClient } from "@/lib/supabaseServer";
import { redirect } from "next/navigation";

/**
 * 📥 EXPORTAR DADOS PESSOAIS (LGPD Art. 18)
 * 
 * Direito do titular: obter cópia de todos os dados pessoais
 */
export async function exportPersonalData() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Não autenticado" };
  }

  try {
    // 1. Dados do perfil
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    // 2. Endereços
    const { data: addresses } = await supabase
      .from("addresses")
      .select("*")
      .eq("user_id", user.id);

    // 3. Pedidos
    const { data: orders } = await supabase
      .from("orders")
      .select("*, order_items(*)")
      .eq("customer_id", user.id);

    // 4. Favoritos
    const { data: favorites } = await supabase
      .from("favorites")
      .select("*, product:products(*)")
      .eq("user_id", user.id);

    // 5. Avaliações
    const { data: reviews } = await supabase
      .from("reviews")
      .select("*")
      .eq("user_id", user.id);

    // Compilar todos os dados
    const personalData = {
      exportDate: new Date().toISOString(),
      user: {
        id: user.id,
        email: user.email,
        createdAt: user.created_at,
      },
      profile,
      addresses: addresses || [],
      orders: orders || [],
      favorites: favorites || [],
      reviews: reviews || [],
      lgpdConsent: {
        consented: profile?.lgpd_consent || false,
        consentDate: profile?.lgpd_consent_date || null,
      },
    };

    // Retornar como JSON para download
    return {
      success: true,
      data: JSON.stringify(personalData, null, 2),
      filename: `tech4loop-dados-${user.id}-${Date.now()}.json`,
    };
  } catch (error) {
    console.error("❌ Erro ao exportar dados:", error);
    return { error: "Erro ao exportar dados" };
  }
}

/**
 * 🗑️ EXCLUIR CONTA (LGPD Art. 18)
 * 
 * Direito do titular: solicitar eliminação dos dados pessoais
 * 
 * IMPORTANTE: Esta ação é irreversível!
 */
export async function deleteAccount(password: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Não autenticado" };
  }

  try {
    // Verificar senha antes de deletar
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email!,
      password,
    });

    if (signInError) {
      return { error: "Senha incorreta" };
    }

    // 1. Anonimizar pedidos (manter histórico para contabilidade)
    await supabase
      .from("orders")
      .update({
        customer_email: "usuario-excluido@tech4loop.com",
        customer_phone: null,
      })
      .eq("customer_id", user.id);

    // 2. Deletar endereços
    await supabase.from("addresses").delete().eq("user_id", user.id);

    // 3. Deletar favoritos
    await supabase.from("favorites").delete().eq("user_id", user.id);

    // 4. Anonimizar avaliações (manter para estatísticas)
    await supabase
      .from("reviews")
      .update({ user_name: "Usuário Anônimo" })
      .eq("user_id", user.id);

    // 5. Deletar perfil
    await supabase.from("profiles").delete().eq("id", user.id);

    // 6. Deletar conta de autenticação
    const { error: deleteError } = await supabase.auth.admin.deleteUser(
      user.id
    );

    if (deleteError) {
      console.error("❌ Erro ao deletar usuário:", deleteError);
      return { error: "Erro ao deletar conta" };
    }

    // Logout
    await supabase.auth.signOut();

    return { success: true };
  } catch (error) {
    console.error("❌ Erro ao deletar conta:", error);
    return { error: "Erro ao processar exclusão" };
  }
}

/**
 * 📜 HISTÓRICO DE CONSENTIMENTOS
 */
export async function getConsentHistory() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("lgpd_consent, lgpd_consent_date, created_at")
    .eq("id", user.id)
    .single();

  return {
    consents: [
      {
        type: "Termos de Uso e Política de Privacidade",
        granted: profile?.lgpd_consent || false,
        date: profile?.lgpd_consent_date || profile?.created_at,
      },
    ],
  };
}

/**
 * 🔄 REVOGAR CONSENTIMENTO
 */
export async function revokeConsent() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Não autenticado" };
  }

  // Revogar consentimento = deletar conta (não pode usar sistema sem aceitar termos)
  await supabase
    .from("profiles")
    .update({ lgpd_consent: false })
    .eq("id", user.id);

  return {
    success: true,
    message:
      "Consentimento revogado. Sua conta será desativada em 30 dias conforme LGPD.",
  };
}
