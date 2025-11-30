import { notFound } from "next/navigation";
import { Metadata } from "next";
import ProductDetailsClient from "@/components/ProductDetailsClient";
import { Product } from "@/types";
import { mockProducts } from "@/lib/mockData";

export const dynamic = "force-dynamic";

type ProductPageProps = {
  params: {
    slug: string;
  };
};

// Função para gerar metadados dinâmicos (SEO)
export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  // VERSÃO DEMO: Buscar em dados mock
  const product = mockProducts.find(p => p.slug === params.slug);

  if (!product) {
    return {
      title: "Produto não encontrado",
    };
  }

  return {
    title: product.name,
    description: product.description,
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  // VERSÃO DEMO: Buscar produto em dados mock
  const product = mockProducts.find(p => p.slug === params.slug);

  if (!product) {
    notFound();
  }

  // Adicionar categories para compatibilidade com ProductDetailsClient
  const productWithCategories = {
    ...product,
    categories: null
  };

  return (
    <div className="bg-background text-white">
      <ProductDetailsClient product={productWithCategories as any} />
    </div>
  );
}
