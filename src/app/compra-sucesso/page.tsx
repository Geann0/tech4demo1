"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

export default function CompraSucessoPage() {
  const searchParams = useSearchParams();
  const [paymentData, setPaymentData] = useState({
    paymentId: "",
    status: "",
    externalReference: "",
  });

  useEffect(() => {
    const paymentId = searchParams.get("payment_id") || "";
    const status = searchParams.get("status") || "";
    const externalReference = searchParams.get("external_reference") || "";

    setPaymentData({
      paymentId,
      status,
      externalReference,
    });

    console.log("✅ Pagamento aprovado:", {
      paymentId,
      status,
      externalReference,
    });
  }, [searchParams]);

  return (
    <div className="container mx-auto px-4 py-16 text-center flex flex-col items-center justify-center min-h-[60vh]">
      {/* Ícone de sucesso */}
      <div className="mb-6">
        <div className="mx-auto w-20 h-20 bg-green-500 rounded-full flex items-center justify-center">
          <svg
            className="w-10 h-10 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={3}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
      </div>

      <h1 className="text-4xl font-bold text-neon-blue mb-4">
        🎉 Pagamento Aprovado!
      </h1>
      <p className="text-lg text-gray-300 mb-8 max-w-xl">
        Obrigado por sua compra! Seu pedido foi recebido e em breve você
        receberá mais informações.
      </p>

      {/* Detalhes do pagamento */}
      {paymentData.paymentId && (
        <div className="bg-gray-800 rounded-lg p-6 mb-8 max-w-md w-full">
          <h2 className="text-lg font-semibold text-white mb-4">
            Detalhes do Pagamento
          </h2>
          <div className="space-y-2 text-gray-300 text-left">
            <p>
              <span className="font-medium">ID:</span> {paymentData.paymentId}
            </p>
            <p>
              <span className="font-medium">Status:</span>{" "}
              <span className="text-green-400 uppercase">
                {paymentData.status}
              </span>
            </p>
            {paymentData.externalReference && (
              <p>
                <span className="font-medium">Pedido:</span>{" "}
                {paymentData.externalReference}
              </p>
            )}
          </div>
        </div>
      )}

      <div className="flex gap-4">
        <Link
          href="/conta/compras"
          className="bg-neon-blue text-white font-bold py-3 px-8 rounded-lg hover:shadow-glow transition-shadow"
        >
          Meus Pedidos
        </Link>
        <Link
          href="/produtos"
          className="bg-electric-purple text-white font-bold py-3 px-8 rounded-lg hover:shadow-glow transition-shadow"
        >
          Continuar Comprando
        </Link>
      </div>
    </div>
  );
}
