"use client";

import { useState, useEffect } from "react";
import {
  exportUserData,
  requestAccountDeletion,
  updateConsent,
  getConsentHistory,
} from "@/app/conta/privacidade/actions";
import { Download, Trash2, Shield, Clock, Check, X } from "lucide-react";

interface PrivacyManagementProps {
  userId: string;
  userEmail: string;
}

export default function PrivacyManagement({
  userId,
  userEmail,
}: PrivacyManagementProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const [consent, setConsent] = useState({
    marketing: false,
    analytics: false,
    personalization: false,
  });

  const [consentHistory, setConsentHistory] = useState<
    Array<{ date: string; action: string; details: string }>
  >([]);

  // Carregar histórico de consentimentos
  useEffect(() => {
    async function loadHistory() {
      const result = await getConsentHistory();
      if (result.success) {
        setConsentHistory(result.history);
      }
    }
    loadHistory();
  }, []);

  async function handleExportData() {
    setIsExporting(true);
    setMessage(null);

    try {
      const result = await exportUserData();

      if (result.success && result.data) {
        // Criar link de download
        const blob = new Blob([Buffer.from(result.data, "base64").toString()], {
          type: "application/json",
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = result.filename!;
        link.click();
        URL.revokeObjectURL(url);

        setMessage({
          type: "success",
          text: "Seus dados foram exportados com sucesso!",
        });
      } else {
        setMessage({
          type: "error",
          text: result.error || "Erro ao exportar dados",
        });
      }
    } catch (error) {
      setMessage({
        type: "error",
        text: "Erro ao processar exportação",
      });
    } finally {
      setIsExporting(false);
    }
  }

  async function handleDeleteAccount() {
    setIsDeleting(true);
    setMessage(null);

    try {
      const result = await requestAccountDeletion();

      if (result.success) {
        setMessage({
          type: "success",
          text: result.message!,
        });
        setShowDeleteConfirm(false);
        // Redirecionar após 3 segundos
        setTimeout(() => {
          window.location.href = "/";
        }, 3000);
      } else {
        setMessage({
          type: "error",
          text: result.error || "Erro ao solicitar exclusão",
        });
      }
    } catch (error) {
      setMessage({
        type: "error",
        text: "Erro ao processar solicitação",
      });
    } finally {
      setIsDeleting(false);
    }
  }

  async function handleUpdateConsent() {
    setMessage(null);

    try {
      const result = await updateConsent(consent);

      if (result.success) {
        setMessage({
          type: "success",
          text: result.message!,
        });
      } else {
        setMessage({
          type: "error",
          text: result.error || "Erro ao atualizar preferências",
        });
      }
    } catch (error) {
      setMessage({
        type: "error",
        text: "Erro ao processar atualização",
      });
    }
  }

  return (
    <div className="space-y-8">
      {/* Mensagem de feedback */}
      {message && (
        <div
          className={`p-4 rounded-lg ${
            message.type === "success"
              ? "bg-green-50 text-green-800 border border-green-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          {message.type === "success" ? (
            <Check className="inline w-5 h-5 mr-2" />
          ) : (
            <X className="inline w-5 h-5 mr-2" />
          )}
          {message.text}
        </div>
      )}

      {/* Seção 1: Seus Direitos LGPD */}
      <div className="border-b pb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
          <Shield className="w-6 h-6 mr-2 text-orange-500" />
          Seus Direitos pela LGPD
        </h2>
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-4">
          <p className="text-sm text-blue-800">
            A Lei Geral de Proteção de Dados (LGPD) garante que você tenha
            controle total sobre seus dados pessoais. Você tem o direito de
            acessar, corrigir, excluir e portar suas informações a qualquer
            momento.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {/* Exportar dados */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition">
            <Download className="w-8 h-8 text-blue-500 mb-3" />
            <h3 className="font-semibold text-lg mb-2">Baixar Meus Dados</h3>
            <p className="text-sm text-gray-600 mb-4">
              Baixe uma cópia completa de todos os seus dados armazenados em
              formato JSON.
            </p>
            <button
              onClick={handleExportData}
              disabled={isExporting}
              className="w-full bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {isExporting ? "Exportando..." : "Baixar Dados (JSON)"}
            </button>
          </div>

          {/* Excluir conta */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition">
            <Trash2 className="w-8 h-8 text-red-500 mb-3" />
            <h3 className="font-semibold text-lg mb-2">Excluir Minha Conta</h3>
            <p className="text-sm text-gray-600 mb-4">
              Solicite a exclusão permanente da sua conta e anonimização dos
              seus dados.
            </p>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition"
            >
              Solicitar Exclusão
            </button>
          </div>
        </div>
      </div>

      {/* Seção 2: Preferências de Consentimento */}
      <div className="border-b pb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          ⚙️ Preferências de Consentimento
        </h2>
        <p className="text-sm text-gray-600 mb-4">
          Controle como seus dados são utilizados pela plataforma:
        </p>

        <div className="space-y-4">
          <label className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
            <div>
              <p className="font-medium">Marketing e Promoções</p>
              <p className="text-sm text-gray-500">
                Receber e-mails com ofertas, novidades e cupons de desconto
              </p>
            </div>
            <input
              type="checkbox"
              checked={consent.marketing}
              onChange={(e) =>
                setConsent({ ...consent, marketing: e.target.checked })
              }
              className="w-5 h-5 text-orange-500 rounded focus:ring-orange-500"
            />
          </label>

          <label className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
            <div>
              <p className="font-medium">Analytics e Estatísticas</p>
              <p className="text-sm text-gray-500">
                Permitir coleta de dados anônimos para melhorar a experiência
              </p>
            </div>
            <input
              type="checkbox"
              checked={consent.analytics}
              onChange={(e) =>
                setConsent({ ...consent, analytics: e.target.checked })
              }
              className="w-5 h-5 text-orange-500 rounded focus:ring-orange-500"
            />
          </label>

          <label className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
            <div>
              <p className="font-medium">Personalização</p>
              <p className="text-sm text-gray-500">
                Receber recomendações de produtos baseadas no seu histórico
              </p>
            </div>
            <input
              type="checkbox"
              checked={consent.personalization}
              onChange={(e) =>
                setConsent({ ...consent, personalization: e.target.checked })
              }
              className="w-5 h-5 text-orange-500 rounded focus:ring-orange-500"
            />
          </label>
        </div>

        <button
          onClick={handleUpdateConsent}
          className="mt-4 w-full bg-orange-500 text-white px-6 py-3 rounded-lg hover:bg-orange-600 transition"
        >
          Salvar Preferências
        </button>
      </div>

      {/* Seção 3: Histórico de Consentimentos */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
          <Clock className="w-6 h-6 mr-2 text-gray-500" />
          Histórico de Consentimentos
        </h2>
        <div className="space-y-3">
          {consentHistory.length === 0 ? (
            <p className="text-gray-500 text-sm">Nenhum histórico disponível</p>
          ) : (
            consentHistory.map((item, index) => (
              <div
                key={index}
                className="flex items-start border-l-4 border-orange-500 pl-4 py-2"
              >
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{item.action}</p>
                  <p className="text-sm text-gray-600">{item.details}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(item.date).toLocaleString("pt-BR")}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal de Confirmação de Exclusão */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-8">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <Trash2 className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Excluir Conta?
              </h3>
              <p className="text-gray-600 mb-6">
                Esta ação é <strong>irreversível</strong>. Seus dados serão
                anonimizados e você não poderá mais acessar sua conta.
              </p>
              <div className="space-y-3">
                <button
                  onClick={handleDeleteAccount}
                  disabled={isDeleting}
                  className="w-full bg-red-500 text-white px-6 py-3 rounded-lg hover:bg-red-600 disabled:opacity-50 transition"
                >
                  {isDeleting ? "Processando..." : "Sim, Excluir Minha Conta"}
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="w-full bg-gray-200 text-gray-800 px-6 py-3 rounded-lg hover:bg-gray-300 transition"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
