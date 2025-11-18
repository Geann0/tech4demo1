-- ==========================================
-- ÍNDICES DE PERFORMANCE
-- ==========================================

-- PRODUTOS
-- Busca textual otimizada (português)
CREATE INDEX IF NOT EXISTS idx_products_name_search 
  ON products USING gin(to_tsvector('portuguese', name));

CREATE INDEX IF NOT EXISTS idx_products_description_search 
  ON products USING gin(to_tsvector('portuguese', description));

-- Filtros comuns
CREATE INDEX IF NOT EXISTS idx_products_category 
  ON products(category_id) WHERE active = TRUE;

CREATE INDEX IF NOT EXISTS idx_products_partner 
  ON products(partner_id) WHERE active = TRUE;

CREATE INDEX IF NOT EXISTS idx_products_price 
  ON products(price) WHERE active = TRUE;

CREATE INDEX IF NOT EXISTS idx_products_stock 
  ON products(stock_quantity) WHERE active = TRUE;

-- PEDIDOS
-- Status (queries mais frequentes)
CREATE INDEX IF NOT EXISTS idx_orders_status 
  ON orders(status);

CREATE INDEX IF NOT EXISTS idx_orders_customer 
  ON orders(customer_id);

CREATE INDEX IF NOT EXISTS idx_orders_partner 
  ON orders(partner_id);

-- Data de criação (relatórios)
CREATE INDEX IF NOT EXISTS idx_orders_created_at 
  ON orders(created_at DESC);

-- Payment ID (webhook)
CREATE INDEX IF NOT EXISTS idx_orders_payment_id 
  ON orders(payment_id);

-- ORDER_ITEMS
-- Índice composto para joins
CREATE INDEX IF NOT EXISTS idx_order_items_order_product 
  ON order_items(order_id, product_id);

-- PROFILES
-- Email (login)
CREATE INDEX IF NOT EXISTS idx_profiles_email 
  ON profiles(email);

-- Role (autorização)
CREATE INDEX IF NOT EXISTS idx_profiles_role 
  ON profiles(role);

-- LGPD
CREATE INDEX IF NOT EXISTS idx_profiles_lgpd_consent 
  ON profiles(lgpd_consent) WHERE lgpd_consent = FALSE;

-- ENDEREÇOS
CREATE INDEX IF NOT EXISTS idx_addresses_user 
  ON addresses(user_id);

CREATE INDEX IF NOT EXISTS idx_addresses_cep 
  ON addresses(postal_code);

-- FAVORITOS
CREATE INDEX IF NOT EXISTS idx_favorites_user 
  ON favorites(user_id);

CREATE INDEX IF NOT EXISTS idx_favorites_product 
  ON favorites(product_id);

-- Índice composto para evitar duplicatas
CREATE UNIQUE INDEX IF NOT EXISTS idx_favorites_unique 
  ON favorites(user_id, product_id);

-- AVALIAÇÕES
CREATE INDEX IF NOT EXISTS idx_reviews_product 
  ON reviews(product_id) WHERE approved = TRUE;

CREATE INDEX IF NOT EXISTS idx_reviews_user 
  ON reviews(user_id);

-- CUPONS
CREATE INDEX IF NOT EXISTS idx_coupons_code 
  ON coupons(UPPER(code));

CREATE INDEX IF NOT EXISTS idx_coupons_active_dates 
  ON coupons(active, valid_from, valid_until);

-- USO DE CUPONS
CREATE INDEX IF NOT EXISTS idx_coupon_usage_coupon 
  ON coupon_usage(coupon_id);

CREATE INDEX IF NOT EXISTS idx_coupon_usage_user 
  ON coupon_usage(user_id);

-- ==========================================
-- ESTATÍSTICAS PARA OTIMIZADOR
-- ==========================================

-- Atualizar estatísticas das tabelas
ANALYZE products;
ANALYZE orders;
ANALYZE order_items;
ANALYZE profiles;
ANALYZE categories;
ANALYZE favorites;
ANALYZE reviews;
ANALYZE coupons;
ANALYZE coupon_usage;

-- ==========================================
-- VIEWS MATERIALIZADAS (CACHE)
-- ==========================================

-- View: Produtos mais vendidos (atualizar a cada hora)
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_top_products AS
SELECT 
  p.id,
  p.name,
  p.image_url,
  p.price,
  COUNT(oi.id) AS total_sales,
  SUM(oi.quantity) AS total_quantity,
  SUM(oi.price * oi.quantity) AS total_revenue
FROM products p
LEFT JOIN order_items oi ON oi.product_id = p.id
LEFT JOIN orders o ON o.id = oi.order_id AND o.status = 'completed'
WHERE p.active = TRUE
GROUP BY p.id
ORDER BY total_sales DESC
LIMIT 20;

-- Índice na view materializada
CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_top_products_id 
  ON mv_top_products(id);

-- View: Estatísticas de vendas por dia
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_daily_sales AS
SELECT 
  DATE(created_at) AS sale_date,
  COUNT(*) AS total_orders,
  SUM(total_amount) AS total_revenue,
  AVG(total_amount) AS avg_order_value,
  COUNT(DISTINCT customer_id) AS unique_customers
FROM orders
WHERE status IN ('completed', 'shipped', 'delivered')
GROUP BY DATE(created_at)
ORDER BY sale_date DESC;

-- Índice
CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_daily_sales_date 
  ON mv_daily_sales(sale_date);

-- ==========================================
-- FUNÇÕES DE ATUALIZAÇÃO
-- ==========================================

-- Refresh views materializadas (executar via cron job)
CREATE OR REPLACE FUNCTION refresh_materialized_views()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_top_products;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_daily_sales;
END;
$$;

-- ==========================================
-- COMENTÁRIOS
-- ==========================================

COMMENT ON INDEX idx_products_name_search IS 'Busca textual full-text em português';
COMMENT ON INDEX idx_orders_status IS 'Otimiza queries de status de pedidos';
COMMENT ON MATERIALIZED VIEW mv_top_products IS 'Cache dos 20 produtos mais vendidos';
COMMENT ON MATERIALIZED VIEW mv_daily_sales IS 'Estatísticas diárias de vendas';
