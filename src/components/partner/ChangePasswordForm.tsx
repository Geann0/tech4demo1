"use client";

import { useFormState, useFormStatus } from "react-dom";
import { changePassword } from "@/app/partner/change-password/actions";
import { useState } from "react";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full bg-neon-blue text-black font-bold py-3 px-6 rounded-lg hover:shadow-glow transition-all disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {pending ? "Alterando..." : "Alterar Senha"}
    </button>
  );
}

export default function ChangePasswordForm() {
  const [state, formAction] = useFormState(changePassword, {});
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form action={formAction} className="space-y-6">
      {/* Mensagem de erro */}
      {state?.error && (
        <div className="p-4 bg-red-900/30 border border-red-600 rounded-lg text-red-400">
          ⚠️ {state.error}
        </div>
      )}

      {/* Mensagem de sucesso */}
      {state?.success && (
        <div className="p-4 bg-green-900/30 border border-green-600 rounded-lg text-green-400">
          ✅ {state.message}
        </div>
      )}

      {/* Nova Senha */}
      <div>
        <label
          htmlFor="newPassword"
          className="block text-sm font-medium text-gray-300 mb-2"
        >
          Nova Senha <span className="text-red-500">*</span>
        </label>
        <input
          type={showPassword ? "text" : "password"}
          id="newPassword"
          name="newPassword"
          required
          minLength={6}
          className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-neon-blue focus:border-transparent"
          placeholder="Mínimo 6 caracteres"
        />
      </div>

      {/* Confirmar Senha */}
      <div>
        <label
          htmlFor="confirmPassword"
          className="block text-sm font-medium text-gray-300 mb-2"
        >
          Confirmar Nova Senha <span className="text-red-500">*</span>
        </label>
        <input
          type={showPassword ? "text" : "password"}
          id="confirmPassword"
          name="confirmPassword"
          required
          minLength={6}
          className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-neon-blue focus:border-transparent"
          placeholder="Repita a nova senha"
        />
      </div>

      {/* Mostrar/Ocultar Senha */}
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="showPassword"
          checked={showPassword}
          onChange={(e) => setShowPassword(e.target.checked)}
          className="w-4 h-4 rounded border-gray-700 bg-gray-800 text-neon-blue focus:ring-2 focus:ring-neon-blue"
        />
        <label htmlFor="showPassword" className="text-sm text-gray-300">
          Mostrar senhas
        </label>
      </div>

      {/* Dicas de Segurança */}
      <div className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
        <h4 className="font-bold text-sm text-gray-300 mb-2">
          💡 Dicas para uma senha forte:
        </h4>
        <ul className="text-sm text-gray-400 space-y-1 list-disc list-inside">
          <li>Use pelo menos 6 caracteres (recomendado: 8+)</li>
          <li>Combine letras maiúsculas e minúsculas</li>
          <li>Adicione números e caracteres especiais</li>
          <li>Evite senhas óbvias (123456, senha123, etc.)</li>
        </ul>
      </div>

      {/* Botão Submit */}
      <SubmitButton />
    </form>
  );
}
