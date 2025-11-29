"use client";

import { useFormState, useFormStatus } from "react-dom";
import { useState, useEffect } from "react";
import { savePartnerLegalData } from "@/app/partner/complete-profile/actions";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 px-6 rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
    >
      {pending ? "Salvando..." : "💾 Salvar Dados Legais"}
    </button>
  );
}

interface CompleteProfileFormProps {
  initialData?: any;
}

export default function CompleteProfileForm({
  initialData,
}: CompleteProfileFormProps) {
  const initialState: any = { error: "", success: false };
  const [state, formAction] = useFormState(savePartnerLegalData, initialState);

  const [personType, setPersonType] = useState<"pf" | "pj">(
    initialData?.cnpj ? "pj" : "pf"
  );
  const [accountType, setAccountType] = useState(
    initialData?.account_type || "corrente"
  );
  const [pixKeyType, setPixKeyType] = useState(initialData?.pix_key_type || "");

  // Máscaras
  const [cpf, setCpf] = useState(initialData?.cpf || "");
  const [cnpj, setCnpj] = useState(initialData?.cnpj || "");
  const [cep, setCep] = useState(initialData?.company_postal_code || "");
  const [phone, setPhone] = useState(initialData?.legal_phone || "");

  const formatCPF = (value: string) => {
    const cleaned = value.replace(/\D/g, "").slice(0, 11);
    return cleaned
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  };

  const formatCNPJ = (value: string) => {
    const cleaned = value.replace(/\D/g, "").slice(0, 14);
    return cleaned
      .replace(/(\d{2})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1/$2")
      .replace(/(\d{4})(\d{1,2})$/, "$1-$2");
  };

  const formatCEP = (value: string) => {
    const cleaned = value.replace(/\D/g, "").slice(0, 8);
    return cleaned.replace(/(\d{5})(\d{1,3})$/, "$1-$2");
  };

  const formatPhone = (value: string) => {
    const cleaned = value.replace(/\D/g, "").slice(0, 11);
    if (cleaned.length <= 10) {
      return cleaned
        .replace(/(\d{2})(\d)/, "($1) $2")
        .replace(/(\d{4})(\d{1,4})$/, "$1-$2");
    }
    return cleaned
      .replace(/(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{5})(\d{1,4})$/, "$1-$2");
  };

  return (
    <div className="bg-white shadow-xl rounded-2xl p-8">
      {state.error && (
        <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4">
          <div className="flex">
            <span className="text-red-500 text-2xl mr-3">❌</span>
            <p className="text-red-700">{state.error}</p>
          </div>
        </div>
      )}

      {state.success && (
        <div className="mb-6 bg-green-50 border-l-4 border-green-500 p-4">
          <div className="flex">
            <span className="text-green-500 text-2xl mr-3">✅</span>
            <p className="text-green-700">
              {state.message || "Dados salvos com sucesso!"}
            </p>
          </div>
        </div>
      )}

      <form action={formAction} className="space-y-8">
        {/* Seção 1: Tipo de Pessoa */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span>👤</span>
            <span>Tipo de Cadastro</span>
          </h2>

          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setPersonType("pf")}
              className={`p-4 rounded-lg border-2 transition-all ${
                personType === "pf"
                  ? "border-blue-600 bg-blue-50"
                  : "border-gray-300 hover:border-blue-300"
              }`}
            >
              <div className="text-3xl mb-2">🧑</div>
              <div className="font-semibold">Pessoa Física</div>
              <div className="text-sm text-gray-600">CPF</div>
            </button>

            <button
              type="button"
              onClick={() => setPersonType("pj")}
              className={`p-4 rounded-lg border-2 transition-all ${
                personType === "pj"
                  ? "border-blue-600 bg-blue-50"
                  : "border-gray-300 hover:border-blue-300"
              }`}
            >
              <div className="text-3xl mb-2">🏢</div>
              <div className="font-semibold">Pessoa Jurídica</div>
              <div className="text-sm text-gray-600">CNPJ</div>
            </button>
          </div>
        </section>

        {/* Seção 2: Dados da Empresa/Pessoa */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span>🏪</span>
            <span>Dados {personType === "pj" ? "da Empresa" : "Pessoais"}</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {personType === "pj" ? "Nome Fantasia *" : "Nome Completo *"}
              </label>
              <input
                type="text"
                name="company_name"
                required
                defaultValue={initialData?.company_name}
                placeholder={
                  personType === "pj" ? "Ex: Loja Tech" : "Ex: João Silva"
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              />
            </div>

            {personType === "pj" && (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Razão Social
                </label>
                <input
                  type="text"
                  name="legal_name"
                  defaultValue={initialData?.legal_name}
                  placeholder="Ex: Tech Comércio de Eletrônicos LTDA"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {personType === "pj" ? "CNPJ *" : "CPF *"}
              </label>
              {personType === "pf" ? (
                <input
                  type="text"
                  name="cpf"
                  required
                  value={cpf}
                  onChange={(e) => setCpf(formatCPF(e.target.value))}
                  placeholder="000.000.000-00"
                  maxLength={14}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                />
              ) : (
                <input
                  type="text"
                  name="cnpj"
                  required
                  value={cnpj}
                  onChange={(e) => setCnpj(formatCNPJ(e.target.value))}
                  placeholder="00.000.000/0000-00"
                  maxLength={18}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                />
              )}
            </div>

            {personType === "pj" && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Inscrição Estadual
                  </label>
                  <input
                    type="text"
                    name="state_registration"
                    defaultValue={initialData?.state_registration}
                    placeholder="Opcional"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Inscrição Municipal
                  </label>
                  <input
                    type="text"
                    name="municipal_registration"
                    defaultValue={initialData?.municipal_registration}
                    placeholder="Opcional"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  />
                </div>
              </>
            )}
          </div>
        </section>

        {/* Seção 3: Endereço */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span>📍</span>
            <span>Endereço</span>
            <span className="text-sm font-normal text-gray-600">
              (para emissão de NF-e)
            </span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                CEP *
              </label>
              <input
                type="text"
                name="company_postal_code"
                required
                value={cep}
                onChange={(e) => setCep(formatCEP(e.target.value))}
                placeholder="00000-000"
                maxLength={9}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rua/Avenida *
              </label>
              <input
                type="text"
                name="company_street"
                required
                defaultValue={initialData?.company_street}
                placeholder="Ex: Rua das Flores"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Número *
              </label>
              <input
                type="text"
                name="company_number"
                required
                defaultValue={initialData?.company_number}
                placeholder="123"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Complemento
              </label>
              <input
                type="text"
                name="company_complement"
                defaultValue={initialData?.company_complement}
                placeholder="Sala, Apto, etc"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bairro *
              </label>
              <input
                type="text"
                name="company_neighborhood"
                required
                defaultValue={initialData?.company_neighborhood}
                placeholder="Ex: Centro"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cidade *
              </label>
              <input
                type="text"
                name="company_city"
                required
                defaultValue={initialData?.company_city}
                placeholder="Ex: Porto Velho"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estado (UF) *
              </label>
              <input
                type="text"
                name="company_state"
                required
                defaultValue={initialData?.company_state}
                placeholder="RO"
                maxLength={2}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase"
              />
            </div>
          </div>
        </section>

        {/* Seção 4: Contato */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span>📞</span>
            <span>Contato</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Telefone *
              </label>
              <input
                type="text"
                name="legal_phone"
                required
                value={phone}
                onChange={(e) => setPhone(formatPhone(e.target.value))}
                placeholder="(00) 00000-0000"
                maxLength={15}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Fiscal *
              </label>
              <input
                type="email"
                name="legal_email"
                required
                defaultValue={initialData?.legal_email}
                placeholder="contato@empresa.com.br"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              />
            </div>
          </div>
        </section>

        {/* Seção 5: Dados Bancários */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span>💰</span>
            <span>Dados Bancários</span>
            <span className="text-sm font-normal text-gray-600">
              (para receber seus pagamentos)
            </span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Banco
              </label>
              <input
                type="text"
                name="bank_name"
                defaultValue={initialData?.bank_name}
                placeholder="Ex: Banco do Brasil"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Código do Banco
              </label>
              <input
                type="text"
                name="bank_code"
                defaultValue={initialData?.bank_code}
                placeholder="Ex: 001"
                maxLength={5}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Agência
              </label>
              <input
                type="text"
                name="agency"
                defaultValue={initialData?.agency}
                placeholder="0000"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Número da Conta
              </label>
              <input
                type="text"
                name="account_number"
                defaultValue={initialData?.account_number}
                placeholder="00000-0"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Conta
              </label>
              <select
                name="account_type"
                value={accountType}
                onChange={(e) => setAccountType(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              >
                <option value="corrente">Conta Corrente</option>
                <option value="poupanca">Conta Poupança</option>
              </select>
            </div>
          </div>

          {/* Chave PIX */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-3">
              ⚡ Chave PIX (Recomendado - Recebimento Mais Rápido)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Chave
                </label>
                <select
                  name="pix_key_type"
                  value={pixKeyType}
                  onChange={(e) => setPixKeyType(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                >
                  <option value="">Selecione...</option>
                  <option value="cpf">CPF</option>
                  <option value="cnpj">CNPJ</option>
                  <option value="email">Email</option>
                  <option value="phone">Telefone</option>
                  <option value="random">Aleatória</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Chave PIX
                </label>
                <input
                  type="text"
                  name="pix_key"
                  defaultValue={initialData?.pix_key}
                  placeholder={
                    pixKeyType === "cpf"
                      ? "000.000.000-00"
                      : pixKeyType === "cnpj"
                        ? "00.000.000/0000-00"
                        : pixKeyType === "email"
                          ? "email@exemplo.com"
                          : pixKeyType === "phone"
                            ? "(00) 00000-0000"
                            : "Digite sua chave PIX"
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Botão Salvar */}
        <div className="pt-6 border-t">
          <SubmitButton />
          <p className="text-center text-sm text-gray-600 mt-4">
            🔒 Seus dados estão protegidos e criptografados. Apenas você pode
            visualizá-los.
          </p>
        </div>
      </form>
    </div>
  );
}

