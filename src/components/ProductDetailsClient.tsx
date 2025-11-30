"use client";

import { useState, useEffect } from "react";
import { Product, Profile } from "@/types";
import Image from "next/image";
import Link from "next/link";
import WhatsAppButton from "./WhatsAppButton";
import FavoriteButton from "./FavoriteButton";
import MandatoryLoginModal from "./auth/MandatoryLoginModal";
import { useCart } from "@/contexts/CartContext";
import { useRouter } from "next/navigation";
// DEMO VERSION - Supabase auth disabled
// import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { sanitizeHTML } from "@/lib/sanitize";

type ProductWithCategoryAndProfile = Product & {
  categories: { name: string } | null;
  profiles: Profile | null;
};

export default function ProductDetailsClient({
  product,
}: {
  product: ProductWithCategoryAndProfile;
}) {
  const [mainImage, setMainImage] = useState(
    product.image_urls[0] || "/images/placeholder.png"
  );
  const { addToCart, cart } = useCart();
  const router = useRouter();
  const [isAdding, setIsAdding] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showCartPreview, setShowCartPreview] = useState(false);
  const [imageError, setImageError] = useState(false);
  // DEMO VERSION - Auth disabled
  // const supabase = createClientComponentClient();

  // DEMO VERSION - Auth check disabled
  useEffect(() => {
    console.log("🔄 [DEMO] Auth desabilitada - usuário não autenticado");
    setIsAuthenticated(false);
  }, []);

  const handleAddToCart = () => {
    // 🔒 Exigir login
    console.log("🛒 handleAddToCart - isAuthenticated:", isAuthenticated);
    if (isAuthenticated === false) {
      console.log("🔐 Abrindo modal de login (add to cart)");
      setShowLoginModal(true);
      return;
    }

    if (isAuthenticated === null) {
      console.warn("⚠️ Ainda verificando autenticação...");
      return;
    }

    setIsAdding(true);
    addToCart({
      product_id: product.id,
      product_name: product.name,
      product_price: product.price,
      product_image: product.image_urls[0],
      product_slug: product.slug,
      partner_id: product.partner_id,
      partner_name: product.partner_name,
    });
    setTimeout(() => setIsAdding(false), 1000);
  };

  const handleBuyNow = () => {
    // 🔒 Exigir login
    console.log("💳 handleBuyNow - isAuthenticated:", isAuthenticated);
    if (isAuthenticated === false) {
      console.log("🔐 Abrindo modal de login (buy now)");
      setShowLoginModal(true);
      return;
    }

    // Se já tem itens no carrinho, mostrar preview primeiro
    if (cart.items.length > 0) {
      handleAddToCart();
      setShowCartPreview(true);
    } else {
      // Se carrinho vazio, adiciona e vai direto
      handleAddToCart();
      setTimeout(() => {
        router.push("/carrinho");
      }, 500);
    }
  };

  const goToCart = () => {
    setShowCartPreview(false);
    router.push("/carrinho");
  };

  return (
    <>
      <div className="text-white">
        <Link
          href="/produtos"
          className="text-neon-blue hover:underline mb-8 inline-block"
        >
          &larr; Voltar para todos os produtos
        </Link>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Galeria de Imagens */}
          <div>
            <div className="relative w-full h-96 rounded-lg mb-4 border border-gray-700 overflow-hidden bg-gray-800 flex items-center justify-center">
              {!imageError && mainImage && mainImage.length > 0 ? (
                <Image
                  src={mainImage}
                  alt={product.name}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  priority
                  className="object-contain"
                  onError={() => {
                    console.error(
                      "❌ Erro ao carregar imagem principal:",
                      mainImage
                    );
                    setImageError(true);
                  }}
                />
              ) : (
                <div className="text-center p-4 flex flex-col items-center justify-center">
                  <p className="text-yellow-400 mb-3 font-bold">
                    ⚠️ Imagem não disponível
                  </p>
                  <p className="text-gray-400 text-sm mb-4">
                    A imagem principal não pode ser carregada
                  </p>
                  {mainImage && (
                    <p className="text-xs text-gray-600 break-all font-mono bg-gray-700 p-2 rounded">
                      {mainImage.substring(0, 50)}...
                    </p>
                  )}
                </div>
              )}
            </div>
            <div className="grid grid-cols-5 gap-2">
              {product.image_urls.map((url, index) => (
                <div
                  key={index}
                  className={`relative w-full h-20 rounded-md cursor-pointer border-2 ${
                    mainImage === url
                      ? "border-neon-blue"
                      : "border-transparent"
                  }`}
                  onClick={() => {
                    setMainImage(url);
                    setImageError(false); // Reset error quando muda de imagem
                  }}
                >
                  <Image
                    src={url}
                    alt={`${product.name} thumbnail ${index + 1}`}
                    fill
                    sizes="(max-width: 768px) 20vw, 10vw"
                    className="object-contain bg-gray-800 rounded"
                    onError={() => {
                      console.warn("⚠️ Erro ao carregar thumbnail:", url);
                    }}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Informações do Produto */}
          <div className="space-y-6 min-w-0">
            <div className="flex items-start justify-between gap-4">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight break-words flex-1 leading-tight">
                {product.name}
              </h1>
              <FavoriteButton
                productId={product.id}
                size="lg"
                className="flex-shrink-0"
              />
            </div>

            {product.categories && (
              <p className="text-sm text-gray-400">{product.categories.name}</p>
            )}

            {/* Descrição Curta */}
            {product.short_description && (
              <div className="bg-gray-800/30 rounded-lg p-4 border border-gray-700">
                <p className="text-gray-300 leading-relaxed whitespace-pre-line">
                  {product.short_description}
                </p>
              </div>
            )}

            <p className="text-4xl font-bold text-neon-blue">
              {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(product.price)}
            </p>

            <p className="text-sm text-gray-400">
              Vendido por: {product.partner_name || "Tech4Loop"}
            </p>

            {/* Botões de Ação - Estilo Shopee */}
            <div className="mt-8 space-y-3">
              {/* Botão Conversar com Vendedor */}
              <WhatsAppButton
                productName={product.name}
                className="w-full"
                partnerName={product.partner_name}
                partnerWhatsapp={product.profiles?.whatsapp_number || null}
              />

              {/* Botões Adicionar ao Carrinho e Comprar Agora */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleAddToCart}
                  disabled={isAdding}
                  className="w-full bg-transparent border-2 border-neon-blue text-neon-blue font-bold py-3 px-6 rounded-lg hover:bg-neon-blue/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isAdding ? (
                    <>
                      <span className="animate-spin">◌</span>
                      <span>Adicionado!</span>
                    </>
                  ) : (
                    <>
                      <span>🛒</span>
                      <span>Adicionar</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleBuyNow}
                  className="w-full bg-gradient-to-r from-neon-blue to-electric-purple text-white font-bold py-3 px-6 rounded-lg hover:shadow-glow transition-all flex items-center justify-center gap-2"
                >
                  <span>💳</span>
                  <span>Comprar Agora</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Descrição e Detalhes */}
        <section
          className="mt-16 max-w-5xl mx-auto px-4"
          aria-labelledby="description-heading"
        >
          <div className="border-b-2 border-gray-700 mb-8">
            <h2 id="description-heading" className="text-3xl font-bold py-4">
              Descrição Completa
            </h2>
          </div>
          {product.description && (
            <div
              className="prose prose-invert prose-lg max-w-none text-gray-300 leading-relaxed space-y-4 
                         [&>p]:mb-6 [&>p]:leading-relaxed [&>p]:text-base
                         [&>h1]:text-2xl [&>h1]:font-bold [&>h1]:mt-8 [&>h1]:mb-4 [&>h1]:text-white
                         [&>h2]:text-xl [&>h2]:font-bold [&>h2]:mt-6 [&>h2]:mb-3 [&>h2]:text-white
                         [&>h3]:text-lg [&>h3]:font-semibold [&>h3]:mt-4 [&>h3]:mb-2 [&>h3]:text-gray-100
                         [&>ul]:list-disc [&>ul]:pl-6 [&>ul]:mb-4 [&>ul]:space-y-2
                         [&>ol]:list-decimal [&>ol]:pl-6 [&>ol]:mb-4 [&>ol]:space-y-2
                         [&>li]:leading-relaxed
                         [&>strong]:text-white [&>strong]:font-semibold
                         [&>em]:text-gray-400 [&>em]:italic
                         [&>blockquote]:border-l-4 [&>blockquote]:border-neon-blue [&>blockquote]:pl-4 [&>blockquote]:italic [&>blockquote]:my-4"
              dangerouslySetInnerHTML={{
                __html: sanitizeHTML(product.description),
              }}
            />
          )}
        </section>

        {/* Especificações Técnicas */}
        {product.technical_specs &&
          Object.keys(product.technical_specs).length > 0 && (
            <section
              className="mt-12 max-w-5xl mx-auto px-4"
              aria-labelledby="specs-heading"
            >
              <div className="border-b-2 border-gray-700 mb-8">
                <h2 id="specs-heading" className="text-3xl font-bold py-4">
                  Especificações Técnicas
                </h2>
              </div>
              <ul className="mt-6 space-y-3 text-gray-300 bg-gray-800/30 rounded-lg p-6">
                {Object.entries(product.technical_specs).map(([key, value]) => (
                  <li
                    key={key}
                    className="flex justify-between gap-4 border-b border-gray-700 py-3 last:border-0"
                  >
                    <span className="font-semibold text-gray-100">{key}:</span>
                    <span className="text-right">{String(value)}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

        {/* Conteúdo da Caixa */}
        {product.box_contents && product.box_contents.length > 0 && (
          <section
            className="mt-12 max-w-5xl mx-auto px-4"
            aria-labelledby="box-contents-heading"
          >
            <div className="border-b-2 border-gray-700 mb-8">
              <h2 id="box-contents-heading" className="text-3xl font-bold py-4">
                Conteúdo da Caixa
              </h2>
            </div>
            <ul className="mt-6 list-none space-y-3 text-gray-300 bg-gray-800/30 rounded-lg p-6">
              {product.box_contents.map((item: string, index: number) => (
                <li key={index} className="flex items-start gap-3 py-2">
                  <span className="text-neon-blue flex-shrink-0">✓</span>
                  <span className="leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      <MandatoryLoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        action="cart"
      />

      {/* Modal de Preview do Carrinho */}
      {showCartPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setShowCartPreview(false)}
          />
          <div className="relative bg-gray-900 border border-gray-700 rounded-xl p-6 max-w-md w-full max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">
                🛒 Seu Carrinho ({cart.itemCount})
              </h3>
              <button
                onClick={() => setShowCartPreview(false)}
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="Fechar"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 mb-6">
              {cart.items.slice(-3).map((item) => (
                <div
                  key={item.product_id}
                  className="flex gap-3 p-3 bg-gray-800/50 rounded-lg"
                >
                  <div className="relative w-16 h-16 flex-shrink-0">
                    <Image
                      src={item.product_image}
                      alt={item.product_name}
                      fill
                      style={{ objectFit: "contain" }}
                      className="rounded"
                    />
                  </div>
                  <div className="flex-grow min-w-0">
                    <p className="font-semibold text-sm truncate">
                      {item.product_name}
                    </p>
                    <p className="text-xs text-gray-400">
                      {item.quantity}x R$ {item.product_price.toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
              {cart.items.length > 3 && (
                <p className="text-sm text-gray-400 text-center">
                  + {cart.items.length - 3} outros itens
                </p>
              )}
            </div>

            <div className="border-t border-gray-700 pt-4 mb-4">
              <div className="flex justify-between text-lg font-bold mb-2">
                <span>Total:</span>
                <span className="text-neon-blue">
                  R$ {cart.total.toFixed(2)}
                </span>
              </div>
              <p className="text-xs text-gray-400">
                💡 No carrinho você pode selecionar quais produtos comprar
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowCartPreview(false)}
                className="flex-1 px-4 py-3 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-800 transition-all"
              >
                Continuar Comprando
              </button>
              <button
                onClick={goToCart}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-neon-blue to-electric-purple text-white font-bold rounded-lg hover:shadow-glow transition-all"
              >
                Ver Carrinho →
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
