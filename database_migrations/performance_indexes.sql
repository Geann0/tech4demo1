-- ============================================
-- PERFORMANCE INDEXES
-- Otimização de queries frequentes
-- ============================================

-- Índice para busca por nome de produto (full-text search em português)
CREATE INDEX IF NOT EXISTS idx_products_name_tsvector 
ON products USING gin(to_tsvector('portuguese', name));

-- Índice para busca por descrição
CREATE INDEX IF NOT EXISTS idx_products_description_tsvector 
ON products USING gin(to_tsvector('portuguese', description));

-- Índice para filtros comuns em produtos
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_partner_id ON products(partner_id);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_stock ON products(stock);
CREATE INDEX IF NOT EXISTS idx_products_price ON products(price);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at DESC);

-- Índice composto para listagem de produtos ativos por categoria
CREATE INDEX IF NOT EXISTS idx_products_active_category 
ON products(category_id, status) 
WHERE status = 'active';

-- Índices para orders (queries mais frequentes)
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_partner_id ON orders(partner_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer_email ON orders(customer_email);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_payment_id ON orders(payment_id);

-- Índice composto para dashboard de admin/parceiro
CREATE INDEX IF NOT EXISTS idx_orders_partner_status 
ON orders(partner_id, status, created_at DESC);

-- Índice para buscar pedidos aprovados pendentes de fulfillment
CREATE INDEX IF NOT EXISTS idx_orders_processing 
ON orders(status, payment_status, created_at) 
WHERE payment_status = 'approved';

-- Índices para order_items
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);

-- Índice composto para relatórios de vendas por produto
CREATE INDEX IF NOT EXISTS idx_order_items_product_order 
ON order_items(product_id, order_id);

-- Índices para reviews
CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at DESC);

-- Índice para buscar reviews aprovados de um produto
CREATE INDEX IF NOT EXISTS idx_reviews_product_approved 
ON reviews(product_id, status, created_at DESC) 
WHERE status = 'approved';

-- Índices para favorites
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_product_id ON favorites(product_id);

-- Índice composto para verificar se produto está nos favoritos
CREATE INDEX IF NOT EXISTS idx_favorites_user_product 
ON favorites(user_id, product_id);

-- Índices para categories
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories(parent_id);

-- Índices para profiles
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_cpf ON profiles(cpf);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- ============================================
-- STATISTICS UPDATE
-- ============================================

-- Atualizar estatísticas para melhor planejamento de queries
ANALYZE products;
ANALYZE orders;
ANALYZE order_items;
ANALYZE reviews;
ANALYZE favorites;
ANALYZE categories;
ANALYZE profiles;

-- ============================================
-- VACUUM PARA OTIMIZAÇÃO
-- ============================================

-- Recomendação: executar VACUUM periodicamente em produção
-- VACUUM ANALYZE products;
-- VACUUM ANALYZE orders;
-- VACUUM ANALYZE order_items;

-- ============================================
-- COMENTÁRIOS
-- ============================================

COMMENT ON INDEX idx_products_name_tsvector IS 'Full-text search em nome de produtos (português)';
COMMENT ON INDEX idx_products_active_category IS 'Produtos ativos por categoria (listagem rápida)';
COMMENT ON INDEX idx_orders_partner_status IS 'Dashboard de pedidos por parceiro e status';
COMMENT ON INDEX idx_orders_processing IS 'Pedidos aguardando fulfillment';
COMMENT ON INDEX idx_reviews_product_approved IS 'Reviews aprovados de produtos (página de produto)';
COMMENT ON INDEX idx_favorites_user_product IS 'Verificação rápida de favoritos';
