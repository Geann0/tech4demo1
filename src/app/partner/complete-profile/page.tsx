import { Metadata } from "next";
import { redirect } from "next/navigation";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import CompleteProfileForm from "@/components/partner/CompleteProfileForm";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Completar Cadastro Legal | Tech4Loop",
  description: "Complete seus dados legais para receber pagamentos",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function CompleteProfilePage() {
  const supabase = createServerComponentClient({ cookies });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/login");
  }

  const user = session.user;

  // Verificar se é parceiro
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "partner") {
    redirect("/");
  }

  // Buscar dados legais existentes (se houver)
  const { data: legalData } = await supabase
    .from("partner_legal_data")
    .select("*")
    .eq("partner_id", user.id)
    .single();

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Botão Voltar */}
        <div className="mb-6">
          <Link
            href="/partner/dashboard"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium transition-colors"
          >
            <span>←</span>
            <span>Voltar ao Dashboard</span>
          </Link>
        </div>

        {/* Header */}
        <div className="bg-white shadow-xl rounded-2xl overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-6">
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <span>📋</span>
              <span>Complete Seu Cadastro Legal</span>
            </h1>
            <p className="text-blue-100 mt-2">
              Dados necessários para receber pagamentos e emitir NF-e
            </p>
          </div>

          {/* Avisos Importantes */}
          <div className="p-6 space-y-4">
            <div className="bg-green-50 border-l-4 border-green-500 p-4">
              <div className="flex">
                <span className="text-2xl mr-3">🔒</span>
                <div>
                  <h3 className="text-green-800 font-semibold">
                    Seus Dados Estão Protegidos
                  </h3>
                  <p className="text-green-700 text-sm mt-1">
                    Apenas VOCÊ tem acesso a estes dados. Administradores{" "}
                    <strong>NÃO</strong> podem visualizar CPF, CNPJ, dados
                    bancários ou outras informações sensíveis.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border-l-4 border-blue-500 p-4">
              <div className="flex">
                <span className="text-2xl mr-3">📝</span>
                <div>
                  <h3 className="text-blue-800 font-semibold">
                    Por Que Precisamos Destes Dados?
                  </h3>
                  <ul className="text-blue-700 text-sm mt-2 space-y-1 list-disc list-inside">
                    <li>
                      <strong>CPF/CNPJ:</strong> Obrigatório para emissão de
                      NF-e (Nota Fiscal Eletrônica)
                    </li>
                    <li>
                      <strong>Endereço completo:</strong> Consta na NF-e
                      conforme legislação
                    </li>
                    <li>
                      <strong>Dados bancários:</strong> Para transferir seus
                      pagamentos (92.5% das vendas)
                    </li>
                    <li>
                      <strong>Chave PIX:</strong> Forma mais rápida de receber
                      (opcional)
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {legalData?.profile_completed && (
              <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4">
                <div className="flex">
                  <span className="text-2xl mr-3">✏️</span>
                  <div>
                    <h3 className="text-yellow-800 font-semibold">
                      Editando Cadastro
                    </h3>
                    <p className="text-yellow-700 text-sm mt-1">
                      Você já completou seu cadastro. Aqui você pode atualizar
                      suas informações.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Formulário */}
        <CompleteProfileForm initialData={legalData} />
      </div>
    </div>
  );
}
