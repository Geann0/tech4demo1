-- =====================================================
-- PHASE 3 PART 2: MIGRATION VERIFICATION QUERIES
-- =====================================================
-- Run these queries to verify the migration succeeded
-- All results should show ✅ SUCCESS

-- =====================================================
-- 1. VERIFY ALL TABLES EXIST (11 tables expected)
-- =====================================================
SELECT 
  COUNT(*) as total_tables,
  STRING_AGG(tablename, ', ' ORDER BY tablename) as table_names
FROM pg_tables
WHERE schemaname = 'public' 
  AND tablename IN (
    'profiles', 'orders', 'products', 'cart_items', 'product_reviews',
    'payments', 'order_items', 'user_addresses', 'favorites', 'categories',
    'deletion_requests'
  );

-- Expected: 11 tables

-- =====================================================
-- 2. VERIFY CRITICAL COLUMNS EXIST
-- =====================================================
SELECT 
  tablename,
  COUNT(*) as column_count,
  STRING_AGG(attname, ', ' ORDER BY attname) as columns
FROM pg_attribute
JOIN pg_class ON pg_class.oid = attrelid
JOIN pg_tables ON pg_tables.tablename = pg_class.relname
WHERE schemaname = 'public'
  AND tablename IN (
    'profiles', 'orders', 'products', 'cart_items', 'product_reviews',
    'payments', 'order_items', 'user_addresses', 'favorites', 'categories',
    'deletion_requests'
  )
  AND attnum > 0
GROUP BY tablename
ORDER BY tablename;

-- Expected: Each table should have at least 5+ columns

-- =====================================================
-- 3. VERIFY TIMESTAMP COLUMNS (created_at, updated_at)
-- =====================================================
SELECT 
  tablename,
  COUNT(CASE WHEN attname = 'created_at' THEN 1 END) as has_created_at,
  COUNT(CASE WHEN attname = 'updated_at' THEN 1 END) as has_updated_at
FROM pg_attribute
JOIN pg_class ON pg_class.oid = attrelid
JOIN pg_tables ON pg_tables.tablename = pg_class.relname
WHERE schemaname = 'public'
  AND tablename IN (
    'profiles', 'orders', 'products', 'cart_items', 'product_reviews',
    'payments', 'order_items', 'user_addresses', 'favorites', 'categories',
    'deletion_requests'
  )
  AND attnum > 0
GROUP BY tablename
ORDER BY tablename;

-- Expected: All 11 tables should have both created_at and updated_at

-- =====================================================
-- 4. VERIFY ALL INDEXES CREATED (78 indexes expected)
-- =====================================================
SELECT 
  COUNT(*) as total_indexes,
  COUNT(DISTINCT tablename) as tables_with_indexes
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname LIKE 'idx_%';

-- Expected: 78+ indexes

-- =====================================================
-- 5. LIST ALL INDEXES BY TABLE
-- =====================================================
SELECT 
  tablename,
  COUNT(*) as index_count,
  STRING_AGG(indexname, ', ' ORDER BY indexname) as indexes
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname LIKE 'idx_%'
GROUP BY tablename
ORDER BY index_count DESC;

-- Shows distribution of indexes across tables

-- =====================================================
-- 6. VERIFY CRITICAL INDEXES EXIST
-- =====================================================
SELECT 
  CASE 
    WHEN COUNT(*) >= 3 THEN '✅ PASS'
    ELSE '❌ FAIL'
  END as profiles_status,
  (SELECT COUNT(*) FROM pg_indexes WHERE tablename = 'profiles' AND schemaname = 'public') as profiles_indexes,
  
  CASE 
    WHEN (SELECT COUNT(*) FROM pg_indexes WHERE tablename = 'orders' AND schemaname = 'public') >= 7 THEN '✅ PASS'
    ELSE '❌ FAIL'
  END as orders_status,
  (SELECT COUNT(*) FROM pg_indexes WHERE tablename = 'orders' AND schemaname = 'public') as orders_indexes,
  
  CASE 
    WHEN (SELECT COUNT(*) FROM pg_indexes WHERE tablename = 'products' AND schemaname = 'public') >= 9 THEN '✅ PASS'
    ELSE '❌ FAIL'
  END as products_status,
  (SELECT COUNT(*) FROM pg_indexes WHERE tablename = 'products' AND schemaname = 'public') as products_indexes
FROM pg_indexes
GROUP BY 1;

-- =====================================================
-- 7. TEST QUERY PERFORMANCE (before/after)
-- =====================================================
-- These queries should use indexes (Index Scan, not Seq Scan)

-- Test 1: Order status lookup (should use idx_orders_status)
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM orders WHERE status = 'pending' LIMIT 10;

-- Test 2: Product category filter (should use idx_products_category_id)
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM products WHERE category_id IS NOT NULL LIMIT 10;

-- Test 3: User address lookup (should use idx_user_addresses_user_id)
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM user_addresses WHERE user_id IS NOT NULL LIMIT 10;

-- =====================================================
-- 8. CHECK INDEX SIZE AND USAGE
-- =====================================================
SELECT 
  schemaname,
  tablename,
  indexname,
  pg_size_pretty(pg_relation_size(indexrelid)) as index_size,
  idx_scan as times_used,
  idx_tup_read as tuples_read,
  idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY pg_relation_size(indexrelid) DESC
LIMIT 20;

-- Shows which indexes are being used

-- =====================================================
-- SUMMARY REPORT
-- =====================================================
-- If all queries above show:
-- ✅ 11 tables with 5+ columns each
-- ✅ All tables have created_at and updated_at
-- ✅ 78+ indexes created
-- ✅ EXPLAIN ANALYZE shows Index Scans (not Seq Scans)
-- ✅ Index sizes reasonable (< 10GB total)
-- 
-- Then: MIGRATION SUCCESSFUL! 🎉
-- 
-- Next steps:
-- 1. Run performance tests
-- 2. Monitor slow query logs
-- 3. Update deployment guide with results
-- 4. Proceed to code deployment

-- =====================================================
