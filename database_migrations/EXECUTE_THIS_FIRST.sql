-- ================================================================
-- MIGRATION COMPLETA: Tech4Loop E-commerce
-- Data: 2025-11-19
-- Descrição: Script consolidado com todas as migrations necessárias
-- ================================================================
-- 
-- EXECUTAR NO SUPABASE SQL EDITOR
-- 
-- Este script inclui:
-- 1. Payment Status (campo que estava faltando)
-- 2. Sistema de Confirmação de Entrega (CDC)
-- 3. Sistema de Automação e Códigos Profissionais
-- ================================================================

-- ================================================================
-- MIGRATION 1: PAYMENT STATUS (CRÍTICO - NECESSÁRIO PARA CHECKOUT)
-- ================================================================

-- Adicionar coluna payment_status à tabela orders
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS payment_status VARCHAR(20) DEFAULT 'pending';

-- Comentário
COMMENT ON COLUMN orders.payment_status IS 'Status do pagamento: pending, approved, rejected, cancelled, refunded';

-- Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);

-- Atualizar registros existentes baseado no status do pedido
UPDATE orders
SET payment_status = 
  CASE 
    WHEN status = 'delivered' OR status = 'shipped' OR status = 'processing' THEN 'approved'
    WHEN status = 'cancelled' THEN 'cancelled'
    ELSE 'pending'
  END
WHERE payment_status IS NULL OR payment_status = 'pending';

-- Adicionar constraint para valores válidos
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'check_payment_status'
  ) THEN
    ALTER TABLE orders
    ADD CONSTRAINT check_payment_status 
    CHECK (payment_status IN ('pending', 'approved', 'rejected', 'cancelled', 'refunded', 'in_process'));
  END IF;
END $$;

-- ================================================================
-- MIGRATION 2: SISTEMA DE CONFIRMAÇÃO DE ENTREGA (CDC COMPLIANCE)
-- ================================================================

-- 2.1. Adicionar campos de controle de entrega
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS shipped_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS carrier_delivered_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS auto_confirmed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS carrier_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS carrier_status VARCHAR(50);

-- 2.2. Comentários explicativos
COMMENT ON COLUMN orders.shipped_at IS 'Data/hora em que o pedido foi marcado como enviado pelo parceiro/admin';
COMMENT ON COLUMN orders.carrier_delivered_at IS 'Data/hora em que a TRANSPORTADORA confirmou a entrega (via API/webhook)';
COMMENT ON COLUMN orders.delivered_at IS 'Data/hora em que o CLIENTE confirmou o recebimento (ou auto-confirmado)';
COMMENT ON COLUMN orders.auto_confirmed IS 'TRUE se a entrega foi confirmada automaticamente após 7 dias';
COMMENT ON COLUMN orders.carrier_name IS 'Nome da transportadora (Correios, FedEx, Loggi, etc)';
COMMENT ON COLUMN orders.carrier_status IS 'Status do rastreamento (POSTADO, EM_TRANSITO, SAIU_PARA_ENTREGA, ENTREGUE, etc)';

-- 2.3. Atualizar dados existentes: definir shipped_at para pedidos já enviados
UPDATE orders
SET shipped_at = created_at
WHERE status = 'shipped' AND shipped_at IS NULL;

-- 2.4. Atualizar dados existentes: definir delivered_at para pedidos já entregues
UPDATE orders
SET delivered_at = created_at
WHERE status = 'delivered' AND delivered_at IS NULL;

-- 2.5. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_orders_shipped_at ON orders(shipped_at) WHERE status = 'shipped';
CREATE INDEX IF NOT EXISTS idx_orders_carrier_delivered ON orders(carrier_delivered_at) WHERE carrier_delivered_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_orders_auto_confirm ON orders(status, carrier_delivered_at) WHERE status = 'shipped' AND carrier_delivered_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_orders_carrier_status ON orders(carrier_status) WHERE carrier_status IS NOT NULL;

-- 2.6. Criar função para auto-confirmação de entregas (após 7 dias DA TRANSPORTADORA CONFIRMAR)
CREATE OR REPLACE FUNCTION auto_confirm_deliveries()
RETURNS TABLE(
  order_id UUID,
  carrier_delivered_date TIMESTAMP WITH TIME ZONE,
  days_since_carrier_delivery INTEGER
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  affected_count INTEGER := 0;
BEGIN
  -- Confirmar entregas onde transportadora confirmou há mais de 7 dias
  UPDATE orders o
  SET 
    status = 'delivered',
    delivered_at = NOW(),
    auto_confirmed = TRUE
  WHERE 
    o.status = 'shipped'
    AND o.carrier_delivered_at IS NOT NULL
    AND o.delivered_at IS NULL
    AND o.carrier_delivered_at < NOW() - INTERVAL '7 days';
  
  GET DIAGNOSTICS affected_count = ROW_COUNT;
  
  RAISE NOTICE '✅ Auto-confirmadas % entregas após 7 dias da confirmação da transportadora', affected_count;
  
  -- Retornar lista de pedidos confirmados
  RETURN QUERY
  SELECT 
    o.id,
    o.carrier_delivered_at,
    EXTRACT(DAY FROM NOW() - o.carrier_delivered_at)::INTEGER
  FROM orders o
  WHERE 
    o.status = 'delivered'
    AND o.auto_confirmed = TRUE
    AND o.delivered_at >= NOW() - INTERVAL '1 hour';
END;
$$;

-- ================================================================
-- MIGRATION 3: SISTEMA DE AUTOMAÇÃO E CÓDIGOS PROFISSIONAIS
-- ================================================================

-- 3.1. Códigos de Produtos (SKU, EAN-13, QR Code) + Availability
ALTER TABLE products
ADD COLUMN IF NOT EXISTS sku VARCHAR(50),
ADD COLUMN IF NOT EXISTS ean13 VARCHAR(13),
ADD COLUMN IF NOT EXISTS barcode VARCHAR(50),
ADD COLUMN IF NOT EXISTS qr_code_data TEXT,
ADD COLUMN IF NOT EXISTS internal_code VARCHAR(20),
ADD COLUMN IF NOT EXISTS availability VARCHAR(20) DEFAULT 'in_stock';

-- Adicionar constraints UNIQUE apenas se não existirem
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'products_sku_key'
  ) THEN
    ALTER TABLE products ADD CONSTRAINT products_sku_key UNIQUE(sku);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'products_internal_code_key'
  ) THEN
    ALTER TABLE products ADD CONSTRAINT products_internal_code_key UNIQUE(internal_code);
  END IF;
END $$;

-- Comentários
COMMENT ON COLUMN products.sku IS 'Stock Keeping Unit - Código único do produto (ex: TECH-MOUSE-001)';
COMMENT ON COLUMN products.ean13 IS 'Código de barras EAN-13 (13 dígitos) para leitura por scanners';
COMMENT ON COLUMN products.barcode IS 'Código de barras alternativo (Code 128, etc)';
COMMENT ON COLUMN products.qr_code_data IS 'Dados do QR Code (URL ou JSON)';
COMMENT ON COLUMN products.internal_code IS 'Código interno curto para uso na empresa (ex: PRD001)';
COMMENT ON COLUMN products.availability IS 'Disponibilidade do produto: in_stock, out_of_stock, pre_order, discontinued';

-- Adicionar constraint para valores válidos de availability
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'check_product_availability'
  ) THEN
    ALTER TABLE products
    ADD CONSTRAINT check_product_availability 
    CHECK (availability IN ('in_stock', 'out_of_stock', 'pre_order', 'discontinued'));
  END IF;
END $$;

-- 3.2. Índices para performance
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_ean13 ON products(ean13);
CREATE INDEX IF NOT EXISTS idx_products_internal_code ON products(internal_code);
CREATE INDEX IF NOT EXISTS idx_products_availability ON products(availability);

-- 3.3. Códigos de Pedidos e Rastreio
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS order_code VARCHAR(20),
ADD COLUMN IF NOT EXISTS order_barcode VARCHAR(50),
ADD COLUMN IF NOT EXISTS order_qr_code TEXT,
ADD COLUMN IF NOT EXISTS shipping_label_url TEXT,
ADD COLUMN IF NOT EXISTS auto_approved BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS auto_processed_at TIMESTAMP WITH TIME ZONE;

-- Adicionar constraint UNIQUE para order_code
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'orders_order_code_key'
  ) THEN
    ALTER TABLE orders ADD CONSTRAINT orders_order_code_key UNIQUE(order_code);
  END IF;
END $$;

-- Comentários
COMMENT ON COLUMN orders.order_code IS 'Código único do pedido (ex: ORD-2025-00001)';
COMMENT ON COLUMN orders.order_barcode IS 'Código de barras do pedido para conferência';
COMMENT ON COLUMN orders.order_qr_code IS 'QR Code do pedido (URL de rastreamento)';
COMMENT ON COLUMN orders.shipping_label_url IS 'URL da etiqueta de envio gerada';
COMMENT ON COLUMN orders.auto_approved IS 'TRUE se foi aprovado automaticamente';
COMMENT ON COLUMN orders.auto_processed_at IS 'Data/hora do processamento automático';

-- 3.4. Criar sequência para códigos de pedido
CREATE SEQUENCE IF NOT EXISTS order_code_seq START 1;

-- 3.5. Função para gerar código de pedido
CREATE OR REPLACE FUNCTION generate_order_code()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  year_code TEXT;
  seq_number TEXT;
  order_code TEXT;
BEGIN
  year_code := TO_CHAR(NOW(), 'YYYY');
  seq_number := LPAD(nextval('order_code_seq')::TEXT, 5, '0');
  order_code := 'ORD-' || year_code || '-' || seq_number;
  
  RETURN order_code;
END;
$$;

-- 3.6. Gerar códigos para pedidos existentes que não têm
UPDATE orders
SET order_code = generate_order_code()
WHERE order_code IS NULL OR order_code = '';

-- 3.7. Tornar order_code obrigatório agora que todos têm
ALTER TABLE orders
ALTER COLUMN order_code SET NOT NULL,
ALTER COLUMN order_code SET DEFAULT '';

-- 3.8. Criar view para monitorar confirmações pendentes (APÓS order_code existir)
CREATE OR REPLACE VIEW pending_delivery_confirmations AS
SELECT 
  o.id AS order_id,
  o.order_code,
  o.customer_name,
  o.customer_email,
  o.shipped_at,
  o.carrier_delivered_at,
  o.carrier_name,
  o.carrier_status,
  EXTRACT(DAY FROM NOW() - o.carrier_delivered_at)::INTEGER AS days_since_carrier_delivery,
  (7 - EXTRACT(DAY FROM NOW() - o.carrier_delivered_at))::INTEGER AS days_until_auto_confirm,
  o.total_amount
FROM orders o
WHERE 
  o.status = 'shipped'
  AND o.carrier_delivered_at IS NOT NULL
  AND o.delivered_at IS NULL
ORDER BY o.carrier_delivered_at ASC;

COMMENT ON VIEW pending_delivery_confirmations IS 'Pedidos aguardando confirmação de recebimento pelo cliente (contagem regressiva de 7 dias APÓS transportadora confirmar)';

-- ================================================================
-- VERIFICAÇÃO FINAL
-- ================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ MIGRATION COMPLETA EXECUTADA COM SUCESSO!';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Resumo das alterações:';
  RAISE NOTICE '   ✅ payment_status adicionado (CRÍTICO)';
  RAISE NOTICE '   ✅ Sistema de confirmação de entrega (CDC)';
  RAISE NOTICE '   ✅ Campos de rastreamento de transportadora';
  RAISE NOTICE '   ✅ Sistema de códigos profissionais (SKU, order_code)';
  RAISE NOTICE '   ✅ Funções de automação criadas';
  RAISE NOTICE '   ✅ Índices de performance criados';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 Próximos passos:';
  RAISE NOTICE '   1. Testar checkout (payment_status agora funciona)';
  RAISE NOTICE '   2. Configurar cron jobs para automações';
  RAISE NOTICE '   3. Testar sistema de etiquetas';
END $$;
