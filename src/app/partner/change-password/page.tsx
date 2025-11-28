import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import ChangePasswordForm from "@/components/partner/ChangePasswordForm";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function ChangePasswordPage() {
  const supabase = createServerComponentClient({ cookies });
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/login");
  }

  // Verificar se é parceiro
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", session.user.id)
    .single();

  if (!profile || profile.role !== "partner") {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <Link
            href="/partner/dashboard"
            className="text-neon-blue hover:underline flex items-center gap-2"
          >
            ← Voltar ao Dashboard
          </Link>
        </div>

        <div className="bg-gray-900/50 border border-gray-800 rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold mb-6">Alterar Senha</h1>

          <div className="mb-6 p-4 bg-blue-900/30 border border-blue-600 rounded-lg">
            <div className="flex items-start gap-3">
              <span className="text-2xl">🔐</span>
              <div>
                <h3 className="text-blue-400 font-bold mb-1">
                  Segurança da sua conta
                </h3>
                <p className="text-gray-300 text-sm">
                  Escolha uma senha forte com pelo menos 6 caracteres.
                </p>
              </div>
            </div>
          </div>

          <ChangePasswordForm />
        </div>
      </div>
    </div>
  );
}
