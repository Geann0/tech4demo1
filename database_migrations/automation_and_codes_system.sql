-- ================================================================
-- MIGRATION: Sistema de Automação e Códigos Profissionais
-- Data: 2025-11-19
-- Descrição: Implementa códigos SKU, EAN-13, QR Codes e automações
-- ================================================================

-- ================================================================
-- PARTE 1: CÓDIGOS DE PRODUTOS (SKU, EAN-13, QR CODE)
-- ================================================================

-- 1.1. Adicionar campos de códigos aos produtos
ALTER TABLE products
ADD COLUMN IF NOT EXISTS sku VARCHAR(50) UNIQUE,
ADD COLUMN IF NOT EXISTS ean13 VARCHAR(13),
ADD COLUMN IF NOT EXISTS barcode VARCHAR(50),
ADD COLUMN IF NOT EXISTS qr_code_data TEXT,
ADD COLUMN IF NOT EXISTS internal_code VARCHAR(20) UNIQUE;

-- Comentários
COMMENT ON COLUMN products.sku IS 'Stock Keeping Unit - Código único do produto (ex: TECH-MOUSE-001)';
COMMENT ON COLUMN products.ean13 IS 'Código de barras EAN-13 (13 dígitos) para leitura por scanners';
COMMENT ON COLUMN products.barcode IS 'Código de barras alternativo (Code 128, etc)';
COMMENT ON COLUMN products.qr_code_data IS 'Dados do QR Code (URL ou JSON)';
COMMENT ON COLUMN products.internal_code IS 'Código interno curto para uso na empresa (ex: PRD001)';

-- 1.2. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_ean13 ON products(ean13);
CREATE INDEX IF NOT EXISTS idx_products_internal_code ON products(internal_code);

-- ================================================================
-- PARTE 2: CÓDIGOS DE PEDIDOS E RASTREIO
-- ================================================================

-- 2.1. Adicionar campos aos pedidos
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS order_code VARCHAR(20) UNIQUE NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS order_barcode VARCHAR(50),
ADD COLUMN IF NOT EXISTS order_qr_code TEXT,
ADD COLUMN IF NOT EXISTS shipping_label_url TEXT,
ADD COLUMN IF NOT EXISTS auto_approved BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS auto_processed_at TIMESTAMP WITH TIME ZONE;

-- Comentários
COMMENT ON COLUMN orders.order_code IS 'Código único do pedido (ex: ORD-2025-00001)';
COMMENT ON COLUMN orders.order_barcode IS 'Código de barras do pedido para conferência';
COMMENT ON COLUMN orders.order_qr_code IS 'QR Code do pedido (URL de rastreamento)';
COMMENT ON COLUMN orders.shipping_label_url IS 'URL da etiqueta de envio gerada';
COMMENT ON COLUMN orders.auto_approved IS 'TRUE se foi aprovado automaticamente';
COMMENT ON COLUMN orders.auto_processed_at IS 'Data/hora do processamento automático';

-- 2.2. Criar sequência para códigos de pedido
CREATE SEQUENCE IF NOT EXISTS order_code_seq START 1;

-- 2.3. Criar função para gerar código de pedido
CREATE OR REPLACE FUNCTION generate_order_code()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  year_code TEXT;
  seq_number TEXT;
  order_code TEXT;
BEGIN
  -- Formato: ORD-YYYY-NNNNN (ex: ORD-2025-00001)
  year_code := TO_CHAR(NOW(), 'YYYY');
  seq_number := LPAD(nextval('order_code_seq')::TEXT, 5, '0');
  order_code := 'ORD-' || year_code || '-' || seq_number;
  
  RETURN order_code;
END;
$$;

-- 2.4. Criar função para gerar SKU de produto
CREATE OR REPLACE FUNCTION generate_product_sku(
  category_prefix TEXT,
  product_name TEXT
)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  name_part TEXT;
  random_part TEXT;
  sku TEXT;
BEGIN
  -- Extrair primeiras 4 letras do nome (sem espaços/acentos)
  name_part := UPPER(REGEXP_REPLACE(
    SUBSTRING(
      TRANSLATE(product_name, 'áàâãéèêíìîóòôõúùûçÁÀÂÃÉÈÊÍÌÎÓÒÔÕÚÙÛÇ', 
                               'aaaaeeeiiiooooouuucAAAAEEEIIIOOOOUUUC'),
      1, 4
    ),
    '[^A-Z0-9]', '', 'g'
  ));
  
  -- Adicionar número aleatório
  random_part := LPAD(FLOOR(RANDOM() * 1000)::TEXT, 3, '0');
  
  -- Formato: CAT-NAME-NNN (ex: TECH-MOUS-042)
  sku := UPPER(category_prefix) || '-' || name_part || '-' || random_part;
  
  RETURN sku;
END;
$$;

-- 2.5. Criar função para gerar código de rastreio (formato Correios)
CREATE OR REPLACE FUNCTION generate_tracking_code()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  prefix TEXT := 'TC'; -- Tech4Loop Tracking Code
  numbers TEXT;
  suffix TEXT := 'BR';
  tracking TEXT;
BEGIN
  -- Formato similar aos Correios: TC123456789BR
  numbers := LPAD(FLOOR(RANDOM() * 1000000000)::TEXT, 9, '0');
  tracking := prefix || numbers || suffix;
  
  RETURN tracking;
END;
$$;

-- 2.6. Criar trigger para gerar order_code automaticamente
CREATE OR REPLACE FUNCTION set_order_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.order_code IS NULL OR NEW.order_code = '' THEN
    NEW.order_code := generate_order_code();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_order_code
  BEFORE INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION set_order_code();

-- ================================================================
-- PARTE 3: AUTOMAÇÃO DE PROCESSOS
-- ================================================================

-- 3.1. Função para auto-aprovar pedidos com pagamento aprovado
CREATE OR REPLACE FUNCTION auto_approve_paid_orders()
RETURNS TABLE(
  order_id UUID,
  order_code TEXT,
  approved_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  orders_approved INTEGER;
BEGIN
  -- Buscar pedidos com pagamento aprovado mas ainda pendentes
  WITH orders_to_approve AS (
    SELECT 
      id,
      order_code,
      NOW() as approval_time
    FROM orders
    WHERE status = 'pending'
      AND payment_status = 'approved'
      AND (auto_approved IS NULL OR auto_approved = FALSE)
  )
  -- Atualizar para processing
  UPDATE orders o
  SET 
    status = 'processing',
    auto_approved = TRUE,
    auto_processed_at = NOW(),
    updated_at = NOW()
  FROM orders_to_approve ota
  WHERE o.id = ota.id
  RETURNING o.id, ota.order_code, ota.approval_time;
  
  GET DIAGNOSTICS orders_approved = ROW_COUNT;
  
  RAISE NOTICE 'Auto-aprovados: % pedido(s)', orders_approved;
END;
$$;

COMMENT ON FUNCTION auto_approve_paid_orders() IS 'Auto-aprova pedidos com pagamento confirmado. Executar via cron job a cada 5 minutos.';

-- 3.2. Função para gerar códigos de rastreio para pedidos enviados sem código
CREATE OR REPLACE FUNCTION auto_generate_tracking_codes()
RETURNS TABLE(
  order_id UUID,
  new_tracking_code TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH orders_needing_tracking AS (
    SELECT id
    FROM orders
    WHERE status = 'shipped'
      AND (tracking_code IS NULL OR tracking_code = '')
  )
  UPDATE orders o
  SET 
    tracking_code = generate_tracking_code(),
    updated_at = NOW()
  FROM orders_needing_tracking ont
  WHERE o.id = ont.id
  RETURNING o.id, o.tracking_code;
END;
$$;

COMMENT ON FUNCTION auto_generate_tracking_codes() IS 'Gera códigos de rastreio para pedidos enviados sem código';

-- 3.3. Função para gerar SKU para produtos sem SKU
CREATE OR REPLACE FUNCTION auto_generate_product_skus()
RETURNS TABLE(
  product_id UUID,
  generated_sku TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH products_needing_sku AS (
    SELECT 
      p.id,
      COALESCE(c.name, 'PROD') as category_prefix,
      p.name as product_name
    FROM products p
    LEFT JOIN categories c ON c.id = p.category_id
    WHERE p.sku IS NULL OR p.sku = ''
  )
  UPDATE products p
  SET 
    sku = generate_product_sku(pns.category_prefix, pns.product_name),
    updated_at = NOW()
  FROM products_needing_sku pns
  WHERE p.id = pns.id
  RETURNING p.id, p.sku;
END;
$$;

-- ================================================================
-- PARTE 4: VIEWS DE MONITORAMENTO
-- ================================================================

-- 4.1. View de pedidos aguardando processamento automático
CREATE OR REPLACE VIEW orders_pending_auto_approval AS
SELECT 
  o.id,
  o.order_code,
  o.customer_name,
  o.customer_email,
  o.total_amount,
  o.payment_status,
  o.status,
  o.created_at,
  EXTRACT(EPOCH FROM (NOW() - o.created_at))/60 as minutes_waiting,
  COUNT(oi.id) as item_count
FROM orders o
LEFT JOIN order_items oi ON oi.order_id = o.id
WHERE o.status = 'pending'
  AND o.payment_status = 'approved'
  AND (o.auto_approved IS NULL OR o.auto_approved = FALSE)
GROUP BY o.id, o.order_code, o.customer_name, o.customer_email, o.total_amount, o.payment_status, o.status, o.created_at
ORDER BY o.created_at ASC;

COMMENT ON VIEW orders_pending_auto_approval IS 'Pedidos pagos aguardando aprovação automática';

-- 4.2. View de produtos sem códigos
CREATE OR REPLACE VIEW products_without_codes AS
SELECT 
  p.id,
  p.name,
  p.partner_id,
  pr.partner_name,
  p.category_id,
  c.name as category_name,
  p.sku,
  p.ean13,
  p.internal_code,
  p.created_at
FROM products p
LEFT JOIN profiles pr ON pr.id = p.partner_id
LEFT JOIN categories c ON c.id = p.category_id
WHERE p.sku IS NULL 
   OR p.sku = ''
   OR p.internal_code IS NULL
ORDER BY p.created_at DESC;

COMMENT ON VIEW products_without_codes IS 'Produtos sem SKU ou código interno';

-- 4.3. View de estatísticas de automação
CREATE OR REPLACE VIEW automation_statistics AS
SELECT 
  'Auto-aprovações hoje' as metric,
  COUNT(*) as count,
  TO_CHAR(NOW(), 'YYYY-MM-DD') as date
FROM orders
WHERE auto_approved = TRUE
  AND auto_processed_at::DATE = CURRENT_DATE
UNION ALL
SELECT 
  'Pedidos aguardando auto-aprovação' as metric,
  COUNT(*) as count,
  TO_CHAR(NOW(), 'YYYY-MM-DD') as date
FROM orders
WHERE status = 'pending'
  AND payment_status = 'approved'
  AND (auto_approved IS NULL OR auto_approved = FALSE)
UNION ALL
SELECT 
  'Produtos sem SKU' as metric,
  COUNT(*) as count,
  TO_CHAR(NOW(), 'YYYY-MM-DD') as date
FROM products
WHERE sku IS NULL OR sku = ''
UNION ALL
SELECT 
  'Pedidos enviados sem tracking' as metric,
  COUNT(*) as count,
  TO_CHAR(NOW(), 'YYYY-MM-DD') as date
FROM orders
WHERE status = 'shipped'
  AND (tracking_code IS NULL OR tracking_code = '');

-- ================================================================
-- PARTE 5: CONFIGURAÇÃO DE CRON JOBS
-- ================================================================
-- Execute estas queries manualmente via Supabase Dashboard

-- 1. Auto-aprovar pedidos pagos (a cada 5 minutos)
-- SELECT cron.schedule(
--   'auto-approve-paid-orders',
--   '0,5,10,15,20,25,30,35,40,45,50,55 * * * *',
--   'SELECT * FROM auto_approve_paid_orders();'
-- );

-- 2. Gerar códigos de rastreio faltantes (todo dia às 4h)
-- SELECT cron.schedule(
--   'auto-generate-tracking',
--   '0 4 * * *',
--   'SELECT * FROM auto_generate_tracking_codes();'
-- );

-- 3. Gerar SKUs faltantes (todo dia às 5h)
-- SELECT cron.schedule(
--   'auto-generate-skus',
--   '0 5 * * *',
--   'SELECT * FROM auto_generate_product_skus();'
-- );

-- ================================================================
-- PARTE 6: ATUALIZAR DADOS EXISTENTES
-- ================================================================

-- 6.1. Gerar order_code para pedidos existentes
DO $$
DECLARE
  order_record RECORD;
  new_code TEXT;
BEGIN
  FOR order_record IN 
    SELECT id FROM orders WHERE order_code IS NULL OR order_code = ''
  LOOP
    new_code := generate_order_code();
    UPDATE orders SET order_code = new_code WHERE id = order_record.id;
  END LOOP;
END $$;

-- 6.2. Gerar SKUs para produtos existentes (executar manualmente se necessário)
-- SELECT * FROM auto_generate_product_skus();

-- ================================================================
-- PARTE 7: TESTES E VALIDAÇÕES
-- ================================================================

-- Verificar estrutura de produtos
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'products'
  AND column_name IN ('sku', 'ean13', 'barcode', 'qr_code_data', 'internal_code');

-- Verificar estrutura de orders
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'orders'
  AND column_name IN ('order_code', 'order_barcode', 'order_qr_code', 'shipping_label_url', 'auto_approved');

-- Ver pedidos aguardando auto-aprovação
SELECT * FROM orders_pending_auto_approval;

-- Ver produtos sem códigos
SELECT * FROM products_without_codes LIMIT 10;

-- Ver estatísticas
SELECT * FROM automation_statistics;

-- Testar geração de códigos
SELECT 
  generate_order_code() as order_code,
  generate_tracking_code() as tracking_code,
  generate_product_sku('TECH', 'Mouse Gamer RGB') as product_sku;

-- ================================================================
-- DOCUMENTAÇÃO DE FORMATOS
-- ================================================================

/*
📋 FORMATOS DE CÓDIGOS:

1. ORDER_CODE (Código do Pedido)
   Formato: ORD-YYYY-NNNNN
   Exemplo: ORD-2025-00001
   Uso: Identificação única do pedido

2. TRACKING_CODE (Código de Rastreio)
   Formato: TCNNNNNNNNNBR
   Exemplo: TC123456789BR
   Uso: Rastreamento de envio (similar aos Correios)

3. SKU (Stock Keeping Unit)
   Formato: CAT-NAME-NNN
   Exemplo: TECH-MOUS-042
   Uso: Controle de estoque interno

4. EAN-13 (Código de Barras)
   Formato: 13 dígitos
   Exemplo: 7891234567890
   Uso: Leitura por scanners de código de barras

5. INTERNAL_CODE (Código Interno Curto)
   Formato: PRD + número sequencial
   Exemplo: PRD001
   Uso: Referência rápida interna
*/

-- ================================================================
-- ROLLBACK (SE NECESSÁRIO)
-- ================================================================
-- Descomente estas queries se precisar desfazer a migração

-- Remover cron jobs
-- SELECT cron.unschedule('auto-approve-paid-orders');
-- SELECT cron.unschedule('auto-generate-tracking');
-- SELECT cron.unschedule('auto-generate-skus');

-- Remover views
-- DROP VIEW IF EXISTS automation_statistics;
-- DROP VIEW IF EXISTS products_without_codes;
-- DROP VIEW IF EXISTS orders_pending_auto_approval;

-- Remover funções
-- DROP FUNCTION IF EXISTS auto_generate_product_skus();
-- DROP FUNCTION IF EXISTS auto_generate_tracking_codes();
-- DROP FUNCTION IF EXISTS auto_approve_paid_orders();
-- DROP FUNCTION IF EXISTS set_order_code();
-- DROP FUNCTION IF EXISTS generate_tracking_code();
-- DROP FUNCTION IF EXISTS generate_product_sku(TEXT, TEXT);
-- DROP FUNCTION IF EXISTS generate_order_code();

-- Remover trigger
-- DROP TRIGGER IF EXISTS trigger_set_order_code ON orders;

-- Remover sequência
-- DROP SEQUENCE IF EXISTS order_code_seq;

-- Remover colunas (CUIDADO: perda de dados!)
-- ALTER TABLE orders
-- DROP COLUMN IF EXISTS order_code,
-- DROP COLUMN IF EXISTS order_barcode,
-- DROP COLUMN IF EXISTS order_qr_code,
-- DROP COLUMN IF EXISTS shipping_label_url,
-- DROP COLUMN IF EXISTS auto_approved,
-- DROP COLUMN IF EXISTS auto_processed_at;

-- ALTER TABLE products
-- DROP COLUMN IF EXISTS sku,
-- DROP COLUMN IF EXISTS ean13,
-- DROP COLUMN IF EXISTS barcode,
-- DROP COLUMN IF EXISTS qr_code_data,
-- DROP COLUMN IF EXISTS internal_code;
