-- PHASE 3 PART 2: Performance Optimization - Database Indexes
-- Migration: Add critical indexes for query optimization
-- Impact: 10-100x faster queries on common filters

-- =====================================================
-- 1. USER & PROFILE INDEXES
-- =====================================================

-- Profile lookups by auth_id (user identification)
CREATE INDEX IF NOT EXISTS idx_profiles_auth_id ON profiles(auth_id);

-- Profile lookups by email (login/recovery)
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- Profile status filtering
CREATE INDEX IF NOT EXISTS idx_profiles_status ON profiles(status);

-- =====================================================
-- 2. ORDER INDEXES (Critical for order management)
-- =====================================================

-- User orders retrieval (most common query)
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);

-- Order status filtering (dashboard, reports)
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);

-- Order date range queries (sorting, filtering)
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);

-- Composite index: user + status (for user-specific status filtering)
CREATE INDEX IF NOT EXISTS idx_orders_user_status ON orders(user_id, status);

-- Composite index: user + date (for user order history with date range)
CREATE INDEX IF NOT EXISTS idx_orders_user_created_at ON orders(user_id, created_at DESC);

-- Order payment status (payment dashboard, reporting)
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);

-- =====================================================
-- 3. PRODUCT INDEXES (e-commerce essentials)
-- =====================================================

-- Category filtering (navigation, catalog)
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);

-- Product status (published/draft filtering)
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);

-- Product creation date (sorting, new products)
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at DESC);

-- Composite index: category + status (most common filter combo)
CREATE INDEX IF NOT EXISTS idx_products_category_status ON products(category_id, status);

-- Composite index: status + created_at (for featured/recent products)
CREATE INDEX IF NOT EXISTS idx_products_status_created_at ON products(status, created_at DESC);

-- Product price range queries (if applicable)
CREATE INDEX IF NOT EXISTS idx_products_price ON products(price);

-- =====================================================
-- 4. CART & CHECKOUT INDEXES
-- =====================================================

-- User cart items
CREATE INDEX IF NOT EXISTS idx_cart_items_user_id ON cart_items(user_id);

-- Active carts
CREATE INDEX IF NOT EXISTS idx_cart_items_active ON cart_items(user_id) 
  WHERE deleted_at IS NULL;

-- Checkout orders by user
CREATE INDEX IF NOT EXISTS idx_checkout_user_id ON checkout_orders(user_id);

-- =====================================================
-- 5. REVIEW & RATING INDEXES
-- =====================================================

-- Product reviews
CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON reviews(product_id);

-- User reviews (review history)
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);

-- Review ratings (filtering by star rating)
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating);

-- =====================================================
-- 6. PAYMENT & TRANSACTION INDEXES
-- =====================================================

-- Payment lookup by user
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);

-- Payment status tracking
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

-- Payment order reference
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id);

-- =====================================================
-- 7. SEARCH & TEXT INDEXES
-- =====================================================

-- Full-text search on products (Portuguese language)
CREATE INDEX IF NOT EXISTS idx_products_search ON products 
  USING GIN (to_tsvector('portuguese', name || ' ' || description));

-- Full-text search on categories
CREATE INDEX IF NOT EXISTS idx_categories_search ON categories 
  USING GIN (to_tsvector('portuguese', name || ' ' || description));

-- =====================================================
-- 8. TEMPORAL INDEXES (for time-range queries)
-- =====================================================

-- Recently modified records (for sync, updates)
CREATE INDEX IF NOT EXISTS idx_orders_updated_at ON orders(updated_at DESC);

-- Recently created products (for feeds, new arrivals)
CREATE INDEX IF NOT EXISTS idx_products_updated_at ON products(updated_at DESC);

-- =====================================================
-- 9. FOREIGN KEY OPTIMIZATION
-- =====================================================

-- Optimize foreign key lookups
CREATE INDEX IF NOT EXISTS idx_products_vendor_id ON products(vendor_id);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);

-- =====================================================
-- 10. BUSINESS LOGIC INDEXES
-- =====================================================

-- Filter products by multiple criteria (vendor + category + status)
CREATE INDEX IF NOT EXISTS idx_products_vendor_category_status 
  ON products(vendor_id, category_id, status);

-- Recent orders by status (for dashboards)
CREATE INDEX IF NOT EXISTS idx_orders_status_created_at 
  ON orders(status, created_at DESC);

-- =====================================================
-- PERFORMANCE TESTING QUERIES
-- =====================================================

-- After running migrations, test index effectiveness:
-- 
-- EXPLAIN ANALYZE SELECT * FROM orders WHERE user_id = 'user-123';
-- EXPLAIN ANALYZE SELECT * FROM products WHERE category_id = 'cat-456';
-- EXPLAIN ANALYZE SELECT * FROM orders WHERE status = 'completed' ORDER BY created_at DESC;
-- EXPLAIN ANALYZE SELECT * FROM products WHERE status = 'published' AND category_id = 'cat-123';

-- =====================================================
-- INDEX MAINTENANCE RECOMMENDATIONS
-- =====================================================

-- Monthly: VACUUM ANALYZE (reindex and refresh statistics)
-- VACUUM ANALYZE;

-- Monitor slow queries:
-- SELECT query, calls, total_time, mean_time 
-- FROM pg_stat_statements 
-- ORDER BY mean_time DESC 
-- LIMIT 10;

-- Check index usage:
-- SELECT schemaname, tablename, indexname, idx_scan 
-- FROM pg_stat_user_indexes 
-- ORDER BY idx_scan DESC;

-- Find unused indexes:
-- SELECT schemaname, tablename, indexname, idx_scan 
-- FROM pg_stat_user_indexes 
-- WHERE idx_scan = 0 
-- ORDER BY pg_relation_size(indexrelid) DESC;
