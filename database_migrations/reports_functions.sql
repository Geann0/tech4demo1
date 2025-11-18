-- ==========================================
-- FUNÇÃO: PRODUTOS MAIS VENDIDOS
-- ==========================================

CREATE OR REPLACE FUNCTION get_top_products(
  p_start_date TIMESTAMPTZ,
  p_end_date TIMESTAMPTZ,
  p_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
  product_id UUID,
  product_name TEXT,
  image_url TEXT,
  total_quantity BIGINT,
  total_revenue NUMERIC,
  orders_count BIGINT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id AS product_id,
    p.name AS product_name,
    p.image_url,
    SUM(oi.quantity) AS total_quantity,
    SUM(oi.quantity * oi.price) AS total_revenue,
    COUNT(DISTINCT oi.order_id) AS orders_count
  FROM products p
  INNER JOIN order_items oi ON oi.product_id = p.id
  INNER JOIN orders o ON o.id = oi.order_id
  WHERE o.created_at >= p_start_date
    AND o.created_at <= p_end_date
    AND o.status IN ('completed', 'shipped', 'delivered')
  GROUP BY p.id, p.name, p.image_url
  ORDER BY total_revenue DESC
  LIMIT p_limit;
END;
$$;
