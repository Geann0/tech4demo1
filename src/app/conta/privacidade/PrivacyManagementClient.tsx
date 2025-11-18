"use client";

import { useState } from "react";
import {
  exportPersonalData,
  deleteAccount,
  getConsentHistory,
  revokeConsent,
} from "./actions";
import { Download, Trash2, FileText, Shield } from "lucide-react";

export default function PrivacyManagementClient() {
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [password, setPassword] = useState("");

  const handleExportData = async () => {
    setLoading(true);
    const result = await exportPersonalData();

    if (result.success && result.data) {
      // Download JSON
      const blob = new Blob([result.data], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = result.filename || "meus-dados.json";
      a.click();
      URL.revokeObjectURL(url);

      alert("✅ Seus dados foram exportados com sucesso!");
    } else {
      alert("❌ Erro ao exportar dados: " + result.error);
    }

    setLoading(false);
  };

  const handleDeleteAccount = async () => {
    if (!password) {
      alert("Digite sua senha para confirmar");
      return;
    }

    if (
      !confirm(
        "⚠️ ATENÇÃO: Esta ação é IRREVERSÍVEL! Todos os seus dados serão permanentemente excluídos. Tem certeza?"
      )
    ) {
      return;
    }

    setLoading(true);
    const result = await deleteAccount(password);

    if (result.success) {
      alert("✅ Sua conta foi excluída com sucesso. Você será redirecionado.");
      window.location.href = "/";
    } else {
      alert("❌ Erro: " + result.error);
    }

    setLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">
          Privacidade e Proteção de Dados
        </h1>
        <p className="text-gray-600">
          Gerencie seus dados pessoais conforme a Lei Geral de Proteção de
          Dados (LGPD)
        </p>
      </div>

      {/* EXPORTAR DADOS */}
      <div className="bg-white border rounded-lg p-6 mb-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-blue-100 rounded-lg">
            <Download className="w-6 h-6 text-blue-600" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-semibold mb-2">
              Exportar Meus Dados Pessoais
            </h2>
            <p className="text-gray-600 mb-4">
              Baixe uma cópia de todos os seus dados armazenados em nosso
              sistema (perfil, pedidos, endereços, favoritos, avaliações).
            </p>
            <p className="text-sm text-gray-500 mb-4">
              <strong>Direito LGPD:</strong> Art. 18, inciso II - Direito de
              acesso aos dados
            </p>
            <button
              onClick={handleExportData}
              disabled={loading}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              {loading ? "Exportando..." : "Baixar Meus Dados (JSON)"}
            </button>
          </div>
        </div>
      </div>

      {/* HISTÓRICO DE CONSENTIMENTOS */}
      <div className="bg-white border rounded-lg p-6 mb-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-green-100 rounded-lg">
            <FileText className="w-6 h-6 text-green-600" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-semibold mb-2">
              Histórico de Consentimentos
            </h2>
            <p className="text-gray-600 mb-4">
              Visualize quando você aceitou nossos Termos de Uso e Política de
              Privacidade.
            </p>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center gap-3 mb-2">
                <Shield className="w-5 h-5 text-green-600" />
                <strong>Termos de Uso e Política de Privacidade</strong>
              </div>
              <p className="text-sm text-gray-600">
                Consentimento concedido no cadastro
              </p>
              <p className="text-xs text-gray-500 mt-2">
                Você pode revogar este consentimento a qualquer momento, mas
                isso resultará na desativação da sua conta.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* EXCLUIR CONTA */}
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-red-100 rounded-lg">
            <Trash2 className="w-6 h-6 text-red-600" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-semibold mb-2 text-red-900">
              Excluir Minha Conta Permanentemente
            </h2>
            <p className="text-red-700 mb-4">
              ⚠️ <strong>ATENÇÃO:</strong> Esta ação é IRREVERSÍVEL e eliminará
              todos os seus dados pessoais.
            </p>

            <div className="bg-white p-4 rounded-lg mb-4">
              <h3 className="font-semibold mb-2">O que será excluído:</h3>
              <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                <li>Dados de perfil (nome, email, telefone)</li>
                <li>Todos os endereços cadastrados</li>
                <li>Lista de favoritos</li>
                <li>Histórico de pedidos (anonimizado para contabilidade)</li>
                <li>Avaliações de produtos (anonimizadas)</li>
                <li>Conta de acesso</li>
              </ul>
            </div>

            <p className="text-sm text-gray-600 mb-4">
              <strong>Direito LGPD:</strong> Art. 18, inciso VI - Direito à
              eliminação dos dados pessoais
            </p>

            {!showDeleteConfirm ? (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Excluir Minha Conta
              </button>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Digite sua senha para confirmar:
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Sua senha"
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleDeleteAccount}
                    disabled={loading || !password}
                    className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50"
                  >
                    {loading
                      ? "Excluindo..."
                      : "Confirmar Exclusão Permanente"}
                  </button>
                  <button
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      setPassword("");
                    }}
                    className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* INFORMAÇÕES LGPD */}
      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-semibold mb-2 flex items-center gap-2">
          <Shield className="w-5 h-5 text-blue-600" />
          Seus Direitos (LGPD - Lei 13.709/2018)
        </h3>
        <ul className="text-sm text-gray-700 space-y-1">
          <li>
            ✅ <strong>Art. 18, II:</strong> Acesso aos seus dados pessoais
          </li>
          <li>
            ✅ <strong>Art. 18, III:</strong> Correção de dados incompletos
          </li>
          <li>
            ✅ <strong>Art. 18, VI:</strong> Eliminação dos dados pessoais
          </li>
          <li>
            ✅ <strong>Art. 18, VII:</strong> Portabilidade dos dados (formato
            JSON)
          </li>
        </ul>
        <p className="text-xs text-gray-600 mt-3">
          Em caso de dúvidas sobre privacidade, entre em contato:{" "}
          <a
            href="mailto:privacidade@tech4loop.com.br"
            className="text-blue-600 hover:underline"
          >
            privacidade@tech4loop.com.br
          </a>
        </p>
      </div>
    </div>
  );
}
