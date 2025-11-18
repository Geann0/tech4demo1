"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface ProfileSidebarProps {
  profile: {
    id: string;
    email: string;
    partner_name?: string | null;
    role: string;
  };
}

export default function ProfileSidebar({ profile }: ProfileSidebarProps) {
  const pathname = usePathname();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const menuItems = [
    {
      icon: "◉",
      label: "Visão Geral",
      href: "/conta",
      description: "Resumo da sua conta",
    },
    {
      icon: "🛒",
      label: "Carrinho",
      href: "/carrinho",
      description: "Seus produtos",
    },
    {
      icon: "◈",
      label: "Dados Pessoais",
      href: "/conta/dados",
      description: "Nome, email, telefone",
    },
    {
      icon: "◈",
      label: "Endereços",
      href: "/conta/enderecos",
      description: "Endereços salvos",
    },
    {
      icon: "$",
      label: "Segurança",
      href: "/conta/seguranca",
      description: "Senha e autenticação",
    },
    {
      icon: "☐",
      label: "Compras",
      href: "/conta/compras",
      description: "Histórico de pedidos",
    },
    {
      icon: "♡",
      label: "Favoritos",
      href: "/conta/favoritos",
      description: "Produtos salvos",
    },
    {
      icon: "★",
      label: "Avaliações",
      href: "/conta/avaliacoes",
      description: "Suas opiniões",
    },
  ];

  const isActive = (href: string) => {
    if (href === "/conta") {
      return pathname === href;
    }
    return pathname?.startsWith(href);
  };

  return (
    <div className="space-y-4">
      {/* Card de Perfil */}
      <div className="bg-dark-card border border-gray-800 rounded-xl overflow-hidden">
        <div className="bg-gradient-to-r from-neon-blue to-electric-purple p-6">
          <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-3xl font-bold mb-3 mx-auto">
            {profile.partner_name?.charAt(0).toUpperCase() || "U"}
          </div>
          <h2 className="text-lg font-bold text-center text-white truncate">
            {profile.partner_name || "Usuário"}
          </h2>
          <p className="text-sm text-white/80 text-center truncate">
            {profile.email}
          </p>
        </div>
      </div>

      {/* Menu de Navegação */}
      <div className="bg-dark-card border border-gray-800 rounded-xl overflow-hidden">
        <nav className="p-2">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`block px-4 py-3 rounded-lg transition-all mb-1 ${
                isActive(item.href)
                  ? "bg-gradient-to-r from-neon-blue/20 to-electric-purple/20 border border-neon-blue/50 text-white"
                  : "hover:bg-gray-800/50 text-gray-300 hover:text-white"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">{item.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{item.label}</p>
                  <p className="text-xs text-gray-500 truncate">
                    {item.description}
                  </p>
                </div>
                {isActive(item.href) && (
                  <span className="text-neon-blue">→</span>
                )}
              </div>
            </Link>
          ))}
        </nav>

        {/* Botão Sair */}
        <div className="border-t border-gray-800 p-2">
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="w-full px-4 py-3 rounded-lg hover:bg-red-500/10 text-red-400 hover:text-red-300 transition-all flex items-center gap-3"
          >
            <span className="text-xl">⏻</span>
            <span className="font-medium">Sair da Conta</span>
          </button>
        </div>
      </div>

      {/* Modal de Confirmação de Logout */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-dark-card border border-gray-800 rounded-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Confirmar Saída</h3>
            <p className="text-gray-400 mb-6">
              Tem certeza que deseja sair da sua conta?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 px-4 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg font-medium transition-colors"
              >
                Cancelar
              </button>
              <form action="/api/auth/signout" method="POST" className="flex-1">
                <button
                  type="submit"
                  className="w-full px-4 py-3 bg-red-500 hover:bg-red-600 rounded-lg font-medium transition-colors"
                >
                  Sair
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
