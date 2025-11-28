"use server";

import { createClient } from "@/lib/supabaseClient";
import { revalidatePath } from "next/cache";

/**
 * Salvar ou atualizar dados legais do parceiro
 */
export async function savePartnerLegalData(prevState: any, formData: FormData) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Não autenticado", success: false };
  }

  try {
    // Extrair dados do formulário
    const legalData = {
      partner_id: user.id,
      company_name: String(formData.get("company_name") || ""),
      legal_name: String(formData.get("legal_name") || ""),
      cpf: String(formData.get("cpf") || "").replace(/\D/g, ""),
      cnpj: String(formData.get("cnpj") || "").replace(/\D/g, ""),
      state_registration: String(formData.get("state_registration") || ""),
      municipal_registration: String(
        formData.get("municipal_registration") || ""
      ),
      company_street: String(formData.get("company_street") || ""),
      company_number: String(formData.get("company_number") || ""),
      company_complement: String(formData.get("company_complement") || ""),
      company_neighborhood: String(formData.get("company_neighborhood") || ""),
      company_city: String(formData.get("company_city") || ""),
      company_state: String(formData.get("company_state") || "").toUpperCase(),
      company_postal_code: String(formData.get("company_postal_code") || "")
        .replace(/\D/g, "")
        .slice(0, 8),
      legal_phone: String(formData.get("legal_phone") || "").replace(/\D/g, ""),
      legal_email: String(formData.get("legal_email") || ""),
      bank_name: String(formData.get("bank_name") || ""),
      bank_code: String(formData.get("bank_code") || ""),
      agency: String(formData.get("agency") || ""),
      account_number: String(formData.get("account_number") || ""),
      account_type: String(formData.get("account_type") || "corrente"),
      pix_key: String(formData.get("pix_key") || ""),
      pix_key_type: String(formData.get("pix_key_type") || ""),
      profile_completed: true,
      completed_at: new Date().toISOString(),
    };

    // Validações básicas
    if (!legalData.company_name || legalData.company_name.length < 3) {
      return {
        error: "Nome da empresa deve ter pelo menos 3 caracteres",
        success: false,
      };
    }

    if (!legalData.cpf && !legalData.cnpj) {
      return { error: "Informe CPF ou CNPJ", success: false };
    }

    if (legalData.cpf && legalData.cpf.length !== 11) {
      return { error: "CPF inválido (11 dígitos)", success: false };
    }

    if (legalData.cnpj && legalData.cnpj.length !== 14) {
      return { error: "CNPJ inválido (14 dígitos)", success: false };
    }

    if (
      !legalData.company_street ||
      !legalData.company_number ||
      !legalData.company_city ||
      !legalData.company_state
    ) {
      return {
        error: "Endereço completo é obrigatório para emissão de NF-e",
        success: false,
      };
    }

    if (legalData.company_state.length !== 2) {
      return { error: "Estado deve ter 2 letras (UF)", success: false };
    }

    if (!legalData.legal_phone || legalData.legal_phone.length < 10) {
      return {
        error: "Telefone inválido (mínimo 10 dígitos)",
        success: false,
      };
    }

    if (!legalData.legal_email || !legalData.legal_email.includes("@")) {
      return { error: "Email inválido", success: false };
    }

    // Verificar se já existe registro
    const { data: existing } = await supabase
      .from("partner_legal_data")
      .select("id")
      .eq("partner_id", user.id)
      .single();

    if (existing) {
      // Atualizar
      const { error: updateError } = await supabase
        .from("partner_legal_data")
        .update(legalData)
        .eq("partner_id", user.id);

      if (updateError) {
        console.error("Erro ao atualizar dados legais:", updateError);
        return {
          error: `Erro ao atualizar: ${updateError.message}`,
          success: false,
        };
      }
    } else {
      // Inserir
      const { error: insertError } = await supabase
        .from("partner_legal_data")
        .insert(legalData);

      if (insertError) {
        console.error("Erro ao salvar dados legais:", insertError);
        return {
          error: `Erro ao salvar: ${insertError.message}`,
          success: false,
        };
      }
    }

    revalidatePath("/partner/complete-profile");
    revalidatePath("/partner/dashboard");

    return {
      success: true,
      message: "Dados legais salvos com sucesso!",
    };
  } catch (error) {
    console.error("Erro ao processar dados legais:", error);
    return {
      error: error instanceof Error ? error.message : "Erro ao processar dados",
      success: false,
    };
  }
}

/**
 * Obter dados legais do parceiro
 */
export async function getPartnerLegalData() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { data: null, error: "Não autenticado" };
  }

  try {
    const { data, error } = await supabase
      .from("partner_legal_data")
      .select("*")
      .eq("partner_id", user.id)
      .single();

    if (error && error.code !== "PGRST116") {
      // PGRST116 = não encontrado (normal na primeira vez)
      console.error("Erro ao buscar dados legais:", error);
      return { data: null, error: error.message };
    }

    return { data, error: null };
  } catch (error) {
    console.error("Erro ao buscar dados legais:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Erro desconhecido",
    };
  }
}
