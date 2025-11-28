"use server";

import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

export async function changePassword(
  _prevState: any,
  formData: FormData
): Promise<{ success?: boolean; error?: string; message?: string }> {
  const newPassword = formData.get("newPassword") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  // Validações
  if (!newPassword || !confirmPassword) {
    return { error: "Todos os campos são obrigatórios" };
  }

  if (newPassword.length < 6) {
    return { error: "A senha deve ter pelo menos 6 caracteres" };
  }

  if (newPassword !== confirmPassword) {
    return { error: "As senhas não coincidem" };
  }

  const supabase = createServerComponentClient({ cookies });

  // Verificar autenticação
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return { error: "Você precisa estar logado" };
  }

  // Atualizar senha
  const { error: updateError } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (updateError) {
    console.error("Error updating password:", updateError);
    return { error: "Erro ao atualizar senha. Tente novamente." };
  }

  revalidatePath("/partner/dashboard");
  return {
    success: true,
    message: "Senha alterada com sucesso! ✅",
  };
}
