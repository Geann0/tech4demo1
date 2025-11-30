import { Product, Category } from "@/types";
import ProductGrid from "@/components/ProductGrid";
import ProductFilters from "@/components/ProductFilters";
import { mockProducts } from "@/lib/mockData";

export const dynamic = "force-dynamic";

export default async function ProdutosPage({
  searchParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  // VERSÃO DEMO: Usar dados mock
  const category = searchParams?.category as string;
  const search = searchParams?.search as string;
  const priceMin = searchParams?.priceMin as string;
  const priceMax = searchParams?.priceMax as string;
  const sortBy = searchParams?.sort as string;

  let products = [...mockProducts];

  // Filtro de busca
  if (search) {
    products = products.filter(p => 
      p.name.toLowerCase().includes(search.toLowerCase())
    );
  }

  // Filtros de preço
  if (priceMin) {
    products = products.filter(p => p.price >= parseFloat(priceMin));
  }
  if (priceMax) {
    products = products.filter(p => p.price <= parseFloat(priceMax));
  }

  // Ordenação
  if (sortBy) {
    switch (sortBy) {
      case "price_asc":
        products.sort((a, b) => a.price - b.price);
        break;
      case "price_desc":
        products.sort((a, b) => b.price - a.price);
        break;
      case "name_asc":
        products.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "name_desc":
        products.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case "newest":
        products.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
    }
  }

  const categoriesData: Category[] = []; // Demo: sem categorias por enquanto
  const filteredProducts = products || [];
  const allCategories = categoriesData ?? [];

  // Calcular faixa de preço para os filtros
  const prices = products.map(p => p.price);
  const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
  const maxPrice = prices.length > 0 ? Math.max(...prices) : 10000;

  return (
    <div className="bg-background min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Demo Banner */}
        <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
          <p className="text-sm text-yellow-400 text-center">
            🎭 <strong>VERSÃO DEMO</strong> - Produtos fictícios para demonstração
          </p>
        </div>

        {/* Título da Página */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-neon-blue to-electric-purple mb-2">
            Todos os Produtos
          </h1>
          <p className="text-gray-400">
            Encontre os melhores produtos de tecnologia
          </p>
        </div>

        {/* Filtros */}
        <ProductFilters
          categories={allCategories}
          minPrice={minPrice}
          maxPrice={maxPrice}
        />

        {/* Contador de Resultados */}
        <div className="mb-6">
          <p className="text-gray-400">
            {filteredProducts.length === 0 ? (
              <span className="text-yellow-500">
                Nenhum produto encontrado com os filtros aplicados.
              </span>
            ) : (
              <>
                Mostrando{" "}
                <span className="text-white font-bold">
                  {filteredProducts.length}
                </span>{" "}
                {filteredProducts.length === 1 ? "produto" : "produtos"}
              </>
            )}
          </p>
        </div>

        <ProductGrid
          products={filteredProducts as any[]}
          allCategories={allCategories}
          currentCategory={category}
          searchQuery={search}
        />
      </div>
    </div>
  );
}
